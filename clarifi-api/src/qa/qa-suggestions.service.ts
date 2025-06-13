import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { QACacheService } from './qa-cache.service';
import { 
  SuggestedQuestionDto, 
  SuggestionReason, 
  SuggestionMetricsDto,
  TrackSuggestionClickDto 
} from './dto/suggestion.dto';

interface SuggestionInteraction {
  id: string;
  question: string;
  category: string;
  reason: SuggestionReason;
  timestamp: number;
  userId?: string;
  clicked: boolean;
  successfulAnswer?: boolean;
  userRating?: number;
}

interface CategorySuggestions {
  [category: string]: string[];
}

@Injectable()
export class QASuggestionsService {
  private readonly logger = new Logger(QASuggestionsService.name);
  private readonly CACHE_PREFIX = 'qa_suggestions';
  private readonly METRICS_KEY = 'qa_suggestion_metrics';
  private readonly INTERACTIONS_KEY = 'qa_suggestion_interactions';

  // Base question pools by category
  private readonly categoryQuestions: CategorySuggestions = {
    'Credit Scores': [
      "How can I improve my credit score quickly in Canada?",
      "What factors affect my credit score the most?",
      "How often should I check my credit score for free?",
      "What's considered a good credit score in Canada?",
      "How do missed payments impact my credit score?",
      "Can I build credit without a credit card?",
      "How long do negative items stay on credit reports?",
      "What's the difference between Equifax and TransUnion?"
    ],
    'Budgeting': [
      "How much should I save for emergencies in Canada?",
      "What's the 50/30/20 budget rule for Canadians?",
      "How can I track my spending automatically?",
      "What are the best budgeting apps for Canadians?",
      "How do I create a realistic monthly budget?",
      "What expenses should I cut first to save money?",
      "How much should I spend on housing in Canada?",
      "How can I save on groceries and utilities?"
    ],
    'Banking in Canada': [
      "Which Canadian bank is best for newcomers?",
      "What's the difference between TFSA and RRSP?",
      "How do I avoid Canadian banking fees?",
      "What are the benefits of credit unions in Canada?",
      "How do Interac e-transfers work and are they safe?",
      "What's a high-interest savings account (HISA)?",
      "Should I use online banks or traditional banks?",
      "How do I open a bank account as a Canadian student?"
    ],
    'Using ClariFi': [
      "How accurate is ClariFi's AI transaction categorization?",
      "What bank statement formats can I upload to ClariFi?",
      "How does ClariFi protect my financial data and privacy?",
      "Can ClariFi work with all major Canadian banks?",
      "How do I set up credit utilization alerts in ClariFi?",
      "What spending insights can ClariFi provide?",
      "How often should I upload my bank statements?",
      "Can ClariFi help me identify fraudulent transactions?"
    ]
  };

  // Seasonal questions based on time of year
  private readonly seasonalQuestions = {
    tax_season: [
      "What tax documents do I need for 2024 in Canada?",
      "How can I maximize my RRSP contributions before the deadline?",
      "What Canadian expenses are tax deductible?",
      "When is the Canadian tax filing deadline?"
    ],
    back_to_school: [
      "How can Canadian students build credit responsibly?",
      "What's the best bank account for Canadian students?",
      "How do I budget for university expenses in Canada?",
      "Are there special credit cards for Canadian students?"
    ],
    holiday_spending: [
      "How do I budget for holiday expenses in Canada?",
      "What's the best way to avoid holiday debt?",
      "Should I use credit cards for holiday shopping?",
      "How can I save for next year's holiday expenses?"
    ]
  };

  constructor(
    private readonly redisService: RedisService,
    private readonly cacheService: QACacheService,
  ) {}

  /**
   * Generate contextual suggestions based on current conversation
   */
  async getSuggestions(
    currentCategory?: string,
    lastAnswer?: string,
    limit: number = 6,
    userId?: string
  ): Promise<SuggestedQuestionDto[]> {
    try {
      this.logger.debug(`Generating suggestions for category: ${currentCategory}, limit: ${limit}`);
      
      const suggestions: SuggestedQuestionDto[] = [];

      // 1. Get related questions from current context
      if (currentCategory && lastAnswer) {
        const related = await this.getRelatedQuestions(currentCategory, lastAnswer);
        suggestions.push(...related.slice(0, 2));
      }

      // 2. Get popular questions from analytics
      const popular = await this.getPopularQuestions(userId);
      suggestions.push(...popular.slice(0, 2));

      // 3. Get seasonal questions
      const seasonal = this.getSeasonalQuestions();
      suggestions.push(...seasonal.slice(0, 1));

      // 4. Fill with category-based questions
      const categoryBased = this.getCategoryBasedQuestions(currentCategory);
      suggestions.push(...categoryBased);

      // 5. Remove duplicates and prioritize
      const uniqueSuggestions = this.deduplicateAndPrioritize(suggestions);
      const finalSuggestions = uniqueSuggestions.slice(0, limit);

      // 6. Track that we showed these suggestions
      await this.trackSuggestionsShown(finalSuggestions, userId);

      this.logger.debug(`Generated ${finalSuggestions.length} suggestions`);
      return finalSuggestions;

    } catch (error) {
      this.logger.error(`Error generating suggestions: ${error.message}`);
      return this.getFallbackSuggestions(currentCategory, limit);
    }
  }

  /**
   * Track when a user clicks on a suggested question
   */
  async trackSuggestionClick(
    trackingData: TrackSuggestionClickDto,
    userId?: string
  ): Promise<void> {
    try {
      const interaction: SuggestionInteraction = {
        id: trackingData.suggestionId,
        question: trackingData.question,
        category: trackingData.category,
        reason: trackingData.reason,
        timestamp: Date.now(),
        userId,
        clicked: true,
        successfulAnswer: trackingData.successfulAnswer,
        userRating: trackingData.userRating
      };

      // Store the interaction
      await this.storeInteraction(interaction);

      // Update metrics
      await this.updateMetrics(interaction);

      this.logger.debug(`Tracked suggestion click: ${trackingData.suggestionId}`);

    } catch (error) {
      this.logger.error(`Error tracking suggestion click: ${error.message}`);
    }
  }

  /**
   * Get suggestion analytics and metrics
   */
  async getMetrics(): Promise<SuggestionMetricsDto> {
    try {
      const cachedMetrics = await this.redisService.get(`${this.CACHE_PREFIX}:${this.METRICS_KEY}`);
      
      if (cachedMetrics) {
        return JSON.parse(cachedMetrics);
      }

      // Calculate metrics from interactions if no cache
      return await this.calculateMetricsFromInteractions();

    } catch (error) {
      this.logger.error(`Error getting metrics: ${error.message}`);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get related questions based on context
   */
  private async getRelatedQuestions(
    category: string,
    lastAnswer: string
  ): Promise<SuggestedQuestionDto[]> {
    const suggestions: SuggestedQuestionDto[] = [];
    
    // Extract keywords from last answer
    const keywords = this.extractKeywords(lastAnswer);
    
    // Find related questions from the category
    const categoryQuestions = this.categoryQuestions[category] || [];
    
    // Score questions based on keyword overlap
    const scoredQuestions = categoryQuestions.map(question => {
      const questionWords = this.extractKeywords(question);
      const overlap = keywords.filter(keyword => 
        questionWords.some(qWord => qWord.includes(keyword) || keyword.includes(qWord))
      ).length;
      
      return { question, score: overlap };
    });

    // Take top scoring questions
    scoredQuestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach((item, index) => {
        suggestions.push({
          id: `related_${Date.now()}_${index}`,
          question: item.question,
          category,
          priority: 0.9 - (index * 0.1),
          reason: SuggestionReason.RELATED,
          metadata: {
            relatedFaqId: `${category}_${index}`
          }
        });
      });

    return suggestions;
  }

  /**
   * Get popular questions from analytics
   */
  private async getPopularQuestions(userId?: string): Promise<SuggestedQuestionDto[]> {
    try {
      const metrics = await this.getMetrics();
      const suggestions: SuggestedQuestionDto[] = [];

      metrics.popularQuestions
        .slice(0, 3)
        .forEach((popular, index) => {
          suggestions.push({
            id: `popular_${Date.now()}_${index}`,
            question: popular.question,
            category: popular.category,
            priority: 0.8 - (index * 0.1),
            reason: SuggestionReason.POPULAR,
            metadata: {
              popularityScore: popular.clicks
            }
          });
        });

      return suggestions;

    } catch (error) {
      this.logger.warn(`Error getting popular questions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get seasonal questions based on current date
   */
  private getSeasonalQuestions(): SuggestedQuestionDto[] {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const suggestions: SuggestedQuestionDto[] = [];

    let seasonalKey: keyof typeof this.seasonalQuestions | null = null;

    // Determine season
    if (month >= 2 && month <= 4) {
      seasonalKey = 'tax_season';
    } else if (month >= 8 && month <= 9) {
      seasonalKey = 'back_to_school';
    } else if (month >= 11 || month === 12) {
      seasonalKey = 'holiday_spending';
    }

    if (seasonalKey) {
      const seasonalQuestions = this.seasonalQuestions[seasonalKey];
      seasonalQuestions.forEach((question, index) => {
        suggestions.push({
          id: `seasonal_${seasonalKey}_${index}`,
          question,
          category: 'Seasonal',
          priority: 0.85,
          reason: SuggestionReason.SEASONAL,
          metadata: {
            seasonalWeight: 1.0
          }
        });
      });
    }

    return suggestions;
  }

  /**
   * Get category-based questions
   */
  private getCategoryBasedQuestions(preferredCategory?: string): SuggestedQuestionDto[] {
    const suggestions: SuggestedQuestionDto[] = [];
    const categories = Object.keys(this.categoryQuestions);

    // Order categories with preferred first
    const orderedCategories = preferredCategory 
      ? [preferredCategory, ...categories.filter(c => c !== preferredCategory)]
      : categories;

    orderedCategories.forEach(category => {
      const categoryQuestions = this.categoryQuestions[category] || [];
      
      categoryQuestions.slice(0, 2).forEach((question, index) => {
        suggestions.push({
          id: `category_${category.replace(/\s+/g, '_')}_${index}`,
          question,
          category,
          priority: category === preferredCategory ? 0.6 : 0.4,
          reason: SuggestionReason.CATEGORY_FOLLOW_UP
        });
      });
    });

    return suggestions;
  }

  /**
   * Remove duplicates and prioritize suggestions
   */
  private deduplicateAndPrioritize(suggestions: SuggestedQuestionDto[]): SuggestedQuestionDto[] {
    const seen = new Set<string>();
    const unique = suggestions.filter(suggestion => {
      const key = suggestion.question.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get fallback suggestions when something fails
   */
  private getFallbackSuggestions(category?: string, limit: number = 6): SuggestedQuestionDto[] {
    const fallbacks = [
      { q: "How can I improve my credit score in Canada?", cat: "Credit Scores" },
      { q: "What's the best way to budget monthly expenses?", cat: "Budgeting" },
      { q: "How does ClariFi protect my financial data?", cat: "Using ClariFi" },
      { q: "What's the difference between TFSA and RRSP?", cat: "Banking in Canada" },
      { q: "How can I avoid banking fees in Canada?", cat: "Banking in Canada" },
      { q: "What should I look for in a Canadian bank?", cat: "Banking in Canada" }
    ];

    return fallbacks.slice(0, limit).map((item, index) => ({
      id: `fallback_${index}`,
      question: item.q,
      category: category || item.cat,
      priority: 0.5,
      reason: SuggestionReason.POPULAR
    }));
  }

  /**
   * Track when suggestions are shown
   */
  private async trackSuggestionsShown(
    suggestions: SuggestedQuestionDto[],
    userId?: string
  ): Promise<void> {
    try {
      const interactions: SuggestionInteraction[] = suggestions.map(suggestion => ({
        id: suggestion.id,
        question: suggestion.question,
        category: suggestion.category,
        reason: suggestion.reason,
        timestamp: Date.now(),
        userId,
        clicked: false
      }));

      // Store shown interactions
      for (const interaction of interactions) {
        await this.storeInteraction(interaction);
      }

    } catch (error) {
      this.logger.error(`Error tracking suggestions shown: ${error.message}`);
    }
  }

  /**
   * Store interaction in Redis
   */
  private async storeInteraction(interaction: SuggestionInteraction): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${this.INTERACTIONS_KEY}:${interaction.id}`;
    await this.redisService.setex(key, 86400 * 30, JSON.stringify(interaction)); // 30 days
  }

  /**
   * Update metrics based on interaction
   */
  private async updateMetrics(interaction: SuggestionInteraction): Promise<void> {
    try {
      const metrics = await this.getMetrics();

      if (interaction.clicked) {
        metrics.totalClicks++;
        
        // Update popular questions
        const existingPopular = metrics.popularQuestions.find(
          p => p.question === interaction.question
        );
        
        if (existingPopular) {
          existingPopular.clicks++;
        } else {
          metrics.popularQuestions.push({
            question: interaction.question,
            clicks: 1,
            category: interaction.category
          });
        }

        // Sort and limit popular questions
        metrics.popularQuestions.sort((a, b) => b.clicks - a.clicks);
        metrics.popularQuestions = metrics.popularQuestions.slice(0, 20);

        // Update category performance
        const categoryPerf = metrics.categoryPerformance.find(
          c => c.category === interaction.category
        );
        
        if (categoryPerf) {
          categoryPerf.totalClicks++;
          categoryPerf.ctr = categoryPerf.totalClicks / categoryPerf.totalShown;
        }

        // Update reason performance
        const reasonPerf = metrics.reasonPerformance.find(
          r => r.reason === interaction.reason
        );
        
        if (reasonPerf) {
          reasonPerf.totalClicks++;
          reasonPerf.ctr = reasonPerf.totalClicks / reasonPerf.totalShown;
        }
      } else {
        // Tracking shown suggestion
        metrics.totalSuggestions++;

        // Update category performance
        const categoryPerf = metrics.categoryPerformance.find(
          c => c.category === interaction.category
        );
        
        if (categoryPerf) {
          categoryPerf.totalShown++;
          categoryPerf.ctr = categoryPerf.totalClicks / categoryPerf.totalShown;
        } else {
          metrics.categoryPerformance.push({
            category: interaction.category,
            ctr: 0,
            totalShown: 1,
            totalClicks: 0
          });
        }

        // Update reason performance
        const reasonPerf = metrics.reasonPerformance.find(
          r => r.reason === interaction.reason
        );
        
        if (reasonPerf) {
          reasonPerf.totalShown++;
          reasonPerf.ctr = reasonPerf.totalClicks / reasonPerf.totalShown;
        } else {
          metrics.reasonPerformance.push({
            reason: interaction.reason,
            ctr: 0,
            totalShown: 1,
            totalClicks: 0
          });
        }
      }

      // Update overall CTR
      metrics.clickThroughRate = metrics.totalSuggestions > 0 
        ? metrics.totalClicks / metrics.totalSuggestions 
        : 0;
      
      metrics.lastUpdated = Date.now();

      // Cache updated metrics
      await this.redisService.setex(
        `${this.CACHE_PREFIX}:${this.METRICS_KEY}`,
        3600, // 1 hour
        JSON.stringify(metrics)
      );

    } catch (error) {
      this.logger.error(`Error updating metrics: ${error.message}`);
    }
  }

  /**
   * Calculate metrics from stored interactions
   */
  private async calculateMetricsFromInteractions(): Promise<SuggestionMetricsDto> {
    // This would scan Redis for interactions and calculate metrics
    // For now, return default metrics
    return this.getDefaultMetrics();
  }

  /**
   * Get default metrics structure
   */
  private getDefaultMetrics(): SuggestionMetricsDto {
    return {
      totalSuggestions: 0,
      totalClicks: 0,
      clickThroughRate: 0,
      popularQuestions: [],
      categoryPerformance: [],
      reasonPerformance: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 5);
  }
} 