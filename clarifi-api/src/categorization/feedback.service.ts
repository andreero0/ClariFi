import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { 
  UserFeedbackDto, 
  FeedbackHistoryDto, 
  FeedbackAnalyticsDto,
  BulkFeedbackDto,
  FeedbackStatsDto 
} from './dto/categorization.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private readonly cachePrefix = 'categorization:merchant:';
  private readonly userCorrectionTTL: number;
  private readonly aiSuggestedTTL: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.userCorrectionTTL = this.configService.get<number>('USER_CORRECTED_CATEGORY_TTL_SECONDS', 7776000); // 90 days
    this.aiSuggestedTTL = this.configService.get<number>('AI_SUGGESTED_CATEGORY_TTL_SECONDS', 604800); // 7 days
  }

  /**
   * Process user feedback for a transaction categorization
   */
  async processFeedback(feedbackDto: UserFeedbackDto): Promise<void> {
    this.logger.log(`Processing feedback for transaction ${feedbackDto.transactionId}`);

    try {
      // 1. Validate the transaction exists and belongs to the user
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          id: feedbackDto.transactionId,
          user_id: feedbackDto.userId,
        },
        include: {
          category: true,
          merchant: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found or access denied');
      }

      // 2. Validate the corrected category exists
      const correctedCategory = await this.prisma.categories.findUnique({
        where: { id: feedbackDto.correctedCategoryId },
      });

      if (!correctedCategory) {
        throw new BadRequestException('Invalid category ID');
      }

      // 3. Create feedback record
      const feedback = await this.prisma.transaction_feedback.create({
        data: {
          user_id: feedbackDto.userId,
          transaction_id: feedbackDto.transactionId,
          original_category_id: transaction.category_id,
          corrected_category_id: feedbackDto.correctedCategoryId,
          feedback_type: feedbackDto.feedbackType || 'category_correction',
          confidence_rating: feedbackDto.confidenceRating,
          feedback_notes: feedbackDto.notes,
          transaction_description: transaction.description,
          merchant_name: transaction.merchant?.normalized_name || this.normalizeMerchantName(transaction.description),
          source: feedbackDto.source || 'manual',
        },
      });

      // 4. Update the transaction with the corrected category
      await this.prisma.transactions.update({
        where: { id: feedbackDto.transactionId },
        data: {
          category_id: feedbackDto.correctedCategoryId,
          user_verified_category: true,
          updated_at: new Date(),
        },
      });

      // 5. Update cache immediately with user correction (longer TTL)
      const merchantName = feedback.merchant_name;
      if (merchantName) {
        await this.updateCacheWithCorrection(merchantName, correctedCategory.name, true);
      }

      // 6. Process learning patterns in background
      await this.processLearningPatterns(feedback);

      this.logger.log(`Feedback processed successfully for transaction ${feedbackDto.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing feedback: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process bulk feedback for multiple transactions
   */
  async processBulkFeedback(bulkFeedbackDto: BulkFeedbackDto): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const feedback of bulkFeedbackDto.feedbacks) {
      try {
        await this.processFeedback(feedback);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to process feedback for transaction ${feedback.transactionId}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Bulk feedback processing completed: ${processed} processed, ${failed} failed`);
    return { processed, failed };
  }

  /**
   * Get feedback history for a user
   */
  async getFeedbackHistory(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<FeedbackHistoryDto[]> {
    const feedbacks = await this.prisma.transaction_feedback.findMany({
      where: { user_id: userId },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            date: true,
          },
        },
        original_category: {
          select: { id: true, name: true },
        },
        corrected_category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return feedbacks.map(feedback => ({
      id: feedback.id,
      transactionId: feedback.transaction_id,
      transactionDescription: feedback.transaction.description,
      transactionAmount: Number(feedback.transaction.amount),
      transactionDate: feedback.transaction.date,
      originalCategory: feedback.original_category ? {
        id: feedback.original_category.id,
        name: feedback.original_category.name,
      } : undefined,
      correctedCategory: {
        id: feedback.corrected_category.id,
        name: feedback.corrected_category.name,
      },
      feedbackType: feedback.feedback_type,
      confidenceRating: feedback.confidence_rating ?? undefined,
      notes: feedback.feedback_notes ?? undefined,
      source: feedback.source,
      createdAt: feedback.created_at,
      isProcessed: feedback.is_processed,
    }));
  }

  /**
   * Get feedback analytics for a user or system-wide
   */
  async getFeedbackAnalytics(
    userId?: string, 
    period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<FeedbackAnalyticsDto> {
    const now = new Date();
    const startDate = this.getStartDateForPeriod(now, period);

    // Get feedback statistics
    const feedbackStats = await this.prisma.transaction_feedback.groupBy({
      by: ['feedback_type', 'source'],
      where: {
        user_id: userId || undefined,
        created_at: { gte: startDate },
      },
      _count: { id: true },
      _avg: { confidence_rating: true },
    });

    // Get most corrected categories
    const categoryCorrections = await this.prisma.transaction_feedback.groupBy({
      by: ['corrected_category_id'],
      where: {
        user_id: userId || undefined,
        created_at: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Get category names
    const categoryIds = categoryCorrections.map(c => c.corrected_category_id);
    const categories = await this.prisma.categories.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const totalCorrections = feedbackStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const avgConfidence = feedbackStats.reduce(
      (sum, stat) => sum + (stat._avg.confidence_rating || 0) * stat._count.id, 0
    ) / totalCorrections || 0;

    return {
      period,
      startDate,
      endDate: now,
      totalCorrections,
      averageConfidence: Number(avgConfidence.toFixed(2)),
      correctionsByType: feedbackStats.reduce((acc, stat) => {
        acc[stat.feedback_type] = (acc[stat.feedback_type] || 0) + stat._count.id;
        return acc;
      }, {}),
      correctionsBySource: feedbackStats.reduce((acc, stat) => {
        acc[stat.source] = (acc[stat.source] || 0) + stat._count.id;
        return acc;
      }, {}),
      topCorrectedCategories: categoryCorrections.map(correction => {
        const category = categories.find(c => c.id === correction.corrected_category_id);
        return {
          categoryId: correction.corrected_category_id,
          categoryName: category?.name || 'Unknown',
          correctionCount: correction._count.id,
        };
      }),
    };
  }

  /**
   * Get feedback statistics for monitoring
   */
  async getFeedbackStats(): Promise<FeedbackStatsDto> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalFeedback, last24h, last7days, avgConfidence, processingStats] = await Promise.all([
      this.prisma.transaction_feedback.count(),
      this.prisma.transaction_feedback.count({
        where: { created_at: { gte: dayAgo } },
      }),
      this.prisma.transaction_feedback.count({
        where: { created_at: { gte: weekAgo } },
      }),
      this.prisma.transaction_feedback.aggregate({
        _avg: { confidence_rating: true },
      }),
      this.prisma.transaction_feedback.groupBy({
        by: ['is_processed'],
        _count: { id: true },
      }),
    ]);

    return {
      totalFeedback,
      feedbackLast24h: last24h,
      feedbackLast7days: last7days,
      averageConfidence: Number(avgConfidence._avg.confidence_rating?.toFixed(2) || 0),
      processingStats: {
        processed: processingStats.find(s => s.is_processed)?._count.id || 0,
        pending: processingStats.find(s => !s.is_processed)?._count.id || 0,
      },
    };
  }

  /**
   * Update Redis cache with user correction
   */
  private async updateCacheWithCorrection(
    merchantName: string, 
    categoryName: string, 
    isUserCorrection: boolean
  ): Promise<void> {
    try {
      const cacheKey = `${this.cachePrefix}${this.hashMerchantName(merchantName)}`;
      const ttl = isUserCorrection ? this.userCorrectionTTL : this.aiSuggestedTTL;
      
      const redisClient = this.redis.getClient();
      await redisClient.setex(cacheKey, ttl, categoryName);
      
      this.logger.log(`Updated cache for merchant "${merchantName}" with category "${categoryName}" (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Failed to update cache: ${error.message}`);
    }
  }

  /**
   * Process learning patterns from feedback
   */
  private async processLearningPatterns(feedback: any): Promise<void> {
    try {
      // Process merchant-category pattern
      if (feedback.merchant_name) {
        await this.updateFeedbackPattern(
          'merchant_category',
          feedback.merchant_name,
          feedback.corrected_category_id
        );
      }

      // Process description keyword patterns
      const keywords = this.extractKeywords(feedback.transaction_description);
      for (const keyword of keywords) {
        await this.updateFeedbackPattern(
          'description_keyword',
          keyword,
          feedback.corrected_category_id
        );
      }

      // Mark feedback as processed
      await this.prisma.transaction_feedback.update({
        where: { id: feedback.id },
        data: { 
          is_processed: true,
          processed_at: new Date(),
        },
      });

      this.logger.log(`Learning patterns processed for feedback ${feedback.id}`);
    } catch (error) {
      this.logger.error(`Error processing learning patterns: ${error.message}`, error.stack);
    }
  }

  /**
   * Update or create feedback pattern
   */
  private async updateFeedbackPattern(
    patternType: string,
    patternKey: string,
    categoryId: string
  ): Promise<void> {
    try {
      const existingPattern = await this.prisma.feedback_patterns.findUnique({
        where: {
          pattern_type_pattern_key_category_id: {
            pattern_type: patternType,
            pattern_key: patternKey,
            category_id: categoryId,
          },
        },
      });

      if (existingPattern) {
        // Update existing pattern
        const newSuccessCount = existingPattern.success_count + 1;
        const newOccurrenceCount = existingPattern.occurrence_count + 1;
        const newConfidence = (newSuccessCount / newOccurrenceCount) * 100;

        await this.prisma.feedback_patterns.update({
          where: { id: existingPattern.id },
          data: {
            occurrence_count: newOccurrenceCount,
            success_count: newSuccessCount,
            confidence_score: newConfidence,
            last_seen_at: new Date(),
          },
        });
      } else {
        // Create new pattern
        await this.prisma.feedback_patterns.create({
          data: {
            pattern_type: patternType,
            pattern_key: patternKey,
            category_id: categoryId,
            confidence_score: 100.0, // Initial confidence for first occurrence
            occurrence_count: 1,
            success_count: 1,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error updating feedback pattern: ${error.message}`, error.stack);
    }
  }

  /**
   * Extract keywords from transaction description
   */
  private extractKeywords(description: string): string[] {
    if (!description) return [];

    // Normalize and split into words
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && word.length < 20);

    // Remove common stop words
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'with']);
    
    return words.filter(word => !stopWords.has(word));
  }

  /**
   * Normalize merchant name for pattern matching
   */
  private normalizeMerchantName(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Hash merchant name for cache key
   */
  private hashMerchantName(merchantName: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < merchantName.length; i++) {
      const char = merchantName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Get start date for analytics period
   */
  private getStartDateForPeriod(date: Date, period: 'weekly' | 'monthly' | 'quarterly'): Date {
    const startDate = new Date(date);
    
    switch (period) {
      case 'weekly':
        startDate.setDate(date.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(date.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(date.getMonth() - 3);
        break;
    }
    
    return startDate;
  }
} 