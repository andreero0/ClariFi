import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrCacheService } from './ocr-cache.service';
import { ApiUsageMonitorService } from './api-usage-monitor.service';
import { OcrRequestDto, OcrResultDto } from '../dto/ocr.dto';
import * as sharp from 'sharp';

interface OptimizationDecision {
  shouldProcess: boolean;
  reason: string;
  estimatedCost: number;
  alternativeAction?: string;
  qualityLevel: 'high' | 'medium' | 'low' | 'skip';
}

interface ImageAnalysis {
  quality: number; // 0-1 score
  textDensity: number; // Estimated text coverage
  imageComplexity: number; // Processing difficulty
  size: { width: number; height: number };
  format: string;
  fileSize: number;
}

interface CostOptimizationConfig {
  maxDailyCostPerUser: number;
  minImageQuality: number;
  enableSmartBatching: boolean;
  skipLowQualityImages: boolean;
  usePreprocessingOptimization: boolean;
  enablePriorityQueuing: boolean;
}

@Injectable()
export class CostOptimizerService {
  private readonly logger = new Logger(CostOptimizerService.name);
  
  // Cost tracking
  private readonly BASE_COST_PER_REQUEST = 0.0015; // $1.50 per 1000 requests
  private readonly COST_MULTIPLIERS = {
    high_quality: 1.0,
    medium_quality: 0.7,
    low_quality: 0.5,
    batch_processing: 0.6, // 40% savings for batch
    cached_result: 0.0
  };

  // Quality thresholds
  private readonly QUALITY_THRESHOLDS = {
    min_image_quality: 0.4, // Below this, skip OCR
    min_text_density: 0.1,  // Below this, likely no text
    max_file_size: 10 * 1024 * 1024, // 10MB max
  };

  private readonly config: CostOptimizationConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: OcrCacheService,
    private readonly usageMonitor: ApiUsageMonitorService
  ) {
    this.config = {
      maxDailyCostPerUser: this.configService.get<number>('OCR_MAX_DAILY_COST_PER_USER', 5.0),
      minImageQuality: this.configService.get<number>('OCR_MIN_IMAGE_QUALITY', 0.4),
      enableSmartBatching: this.configService.get<boolean>('OCR_ENABLE_SMART_BATCHING', true),
      skipLowQualityImages: this.configService.get<boolean>('OCR_SKIP_LOW_QUALITY', true),
      usePreprocessingOptimization: this.configService.get<boolean>('OCR_PREPROCESSING_OPTIMIZATION', true),
      enablePriorityQueuing: this.configService.get<boolean>('OCR_PRIORITY_QUEUING', true)
    };

    this.logger.log('Cost optimizer initialized', this.config);
  }

  /**
   * Main optimization decision engine
   */
  async shouldProcessImage(
    imageData: Buffer,
    request: OcrRequestDto,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<OptimizationDecision> {
    
    // Check cache first
    const cached = await this.cacheService.getCachedResult(imageData, request);
    if (cached) {
      return {
        shouldProcess: false,
        reason: 'Result found in cache',
        estimatedCost: 0,
        alternativeAction: 'use_cached_result',
        qualityLevel: 'high'
      };
    }

    // Analyze image quality and characteristics
    const imageAnalysis = await this.analyzeImage(imageData);
    
    // Check user budget constraints
    const budgetCheck = await this.checkUserBudget(request.userId);
    if (!budgetCheck.withinBudget) {
      return {
        shouldProcess: false,
        reason: `Daily budget exceeded: $${budgetCheck.currentSpend}/$${budgetCheck.dailyLimit}`,
        estimatedCost: this.estimateCost(imageAnalysis, 'high'),
        alternativeAction: 'defer_to_next_day',
        qualityLevel: 'skip'
      };
    }

    // Quality-based decision
    if (this.config.skipLowQualityImages && imageAnalysis.quality < this.config.minImageQuality) {
      return {
        shouldProcess: false,
        reason: `Image quality too low: ${(imageAnalysis.quality * 100).toFixed(1)}% (min: ${(this.config.minImageQuality * 100).toFixed(1)}%)`,
        estimatedCost: 0,
        alternativeAction: 'request_better_quality_image',
        qualityLevel: 'skip'
      };
    }

    // Determine optimal quality level
    const qualityLevel = this.determineOptimalQuality(imageAnalysis, priority, budgetCheck);
    const estimatedCost = this.estimateCost(imageAnalysis, qualityLevel);

    return {
      shouldProcess: true,
      reason: `Approved for ${qualityLevel} quality processing`,
      estimatedCost,
      qualityLevel
    };
  }

  /**
   * Analyze image characteristics for optimization decisions
   */
  private async analyzeImage(imageData: Buffer): Promise<ImageAnalysis> {
    try {
      const image = sharp(imageData);
      const metadata = await image.metadata();
      const stats = await image.stats();

      // Calculate quality metrics
      const quality = this.calculateImageQuality(metadata, stats);
      const textDensity = this.estimateTextDensity(imageData, metadata);
      const imageComplexity = this.calculateComplexity(metadata, stats);

      return {
        quality,
        textDensity,
        imageComplexity,
        size: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        format: metadata.format || 'unknown',
        fileSize: imageData.length
      };

    } catch (error) {
      this.logger.error('Error analyzing image:', error);
      
      // Return conservative estimates on error
      return {
        quality: 0.5,
        textDensity: 0.5,
        imageComplexity: 0.7,
        size: { width: 0, height: 0 },
        format: 'unknown',
        fileSize: imageData.length
      };
    }
  }

  /**
   * Calculate image quality score (0-1)
   */
  private calculateImageQuality(metadata: sharp.Metadata, stats: sharp.Stats): number {
    let quality = 0.5; // Base quality

    // Resolution factor
    const pixels = (metadata.width || 0) * (metadata.height || 0);
    const resolutionScore = Math.min(pixels / (1920 * 1080), 1.0); // Normalize to 1080p
    quality += resolutionScore * 0.3;

    // Sharpness/contrast (based on standard deviation)
    if (stats.channels) {
      const avgStdDev = stats.channels.reduce((sum, ch) => sum + (ch.stdev || 0), 0) / stats.channels.length;
      const sharpnessScore = Math.min(avgStdDev / 50, 1.0); // Normalize to 0-1
      quality += sharpnessScore * 0.2;
    }

    return Math.min(Math.max(quality, 0), 1);
  }

  /**
   * Estimate text density in image
   */
  private estimateTextDensity(imageData: Buffer, metadata: sharp.Metadata): number {
    // This is a simplified estimation
    // In production, you might use lightweight edge detection or other heuristics
    
    const fileSize = imageData.length;
    const pixels = (metadata.width || 1) * (metadata.height || 1);
    const bitsPerPixel = (fileSize * 8) / pixels;
    
    // Text-heavy images typically have more compression artifacts and higher bit density
    const textDensityScore = Math.min(bitsPerPixel / 24, 1.0); // Normalize
    
    return Math.max(textDensityScore, 0.1); // Minimum baseline
  }

  /**
   * Calculate processing complexity
   */
  private calculateComplexity(metadata: sharp.Metadata, stats: sharp.Stats): number {
    let complexity = 0.5; // Base complexity

    // Size factor
    const pixels = (metadata.width || 0) * (metadata.height || 0);
    const sizeComplexity = Math.min(pixels / (4096 * 4096), 1.0); // 4K reference
    complexity += sizeComplexity * 0.4;

    // Channel complexity
    const channels = metadata.channels || 1;
    complexity += (channels / 4) * 0.1; // RGBA reference

    return Math.min(complexity, 1);
  }

  /**
   * Check user's current budget status
   */
  private async checkUserBudget(userId?: string): Promise<{
    withinBudget: boolean;
    currentSpend: number;
    dailyLimit: number;
    remainingBudget: number;
  }> {
    if (!userId) {
      return {
        withinBudget: true,
        currentSpend: 0,
        dailyLimit: this.config.maxDailyCostPerUser,
        remainingBudget: this.config.maxDailyCostPerUser
      };
    }

    try {
      const usageStats = await this.usageMonitor.getUserUsageStats(userId, 24); // Last 24 hours
      const currentSpend = usageStats.totalCost || 0;
      const remainingBudget = this.config.maxDailyCostPerUser - currentSpend;

      return {
        withinBudget: remainingBudget > 0,
        currentSpend,
        dailyLimit: this.config.maxDailyCostPerUser,
        remainingBudget: Math.max(remainingBudget, 0)
      };

    } catch (error) {
      this.logger.error('Error checking user budget:', error);
      
      // Allow processing on error (fail open)
      return {
        withinBudget: true,
        currentSpend: 0,
        dailyLimit: this.config.maxDailyCostPerUser,
        remainingBudget: this.config.maxDailyCostPerUser
      };
    }
  }

  /**
   * Determine optimal quality level based on various factors
   */
  private determineOptimalQuality(
    analysis: ImageAnalysis,
    priority: 'high' | 'medium' | 'low',
    budget: { remainingBudget: number }
  ): 'high' | 'medium' | 'low' {
    
    // High priority always gets high quality (if budget allows)
    if (priority === 'high' && budget.remainingBudget > this.BASE_COST_PER_REQUEST) {
      return 'high';
    }

    // Quality-based decisions
    if (analysis.quality >= 0.8 && analysis.textDensity >= 0.7) {
      return budget.remainingBudget > this.BASE_COST_PER_REQUEST * 0.8 ? 'high' : 'medium';
    }

    if (analysis.quality >= 0.6 && analysis.textDensity >= 0.5) {
      return budget.remainingBudget > this.BASE_COST_PER_REQUEST * 0.6 ? 'medium' : 'low';
    }

    // Low quality images get low processing
    return 'low';
  }

  /**
   * Estimate processing cost
   */
  private estimateCost(analysis: ImageAnalysis, qualityLevel: 'high' | 'medium' | 'low'): number {
    let baseCost = this.BASE_COST_PER_REQUEST;

    // Quality multiplier
    baseCost *= this.COST_MULTIPLIERS[`${qualityLevel}_quality`];

    // Complexity multiplier
    baseCost *= (1 + analysis.imageComplexity * 0.5);

    // Size multiplier for very large images
    if (analysis.fileSize > 5 * 1024 * 1024) { // 5MB+
      baseCost *= 1.5;
    }

    return Math.round(baseCost * 10000) / 10000; // Round to 4 decimal places
  }

  /**
   * Suggest batch optimization for multiple images
   */
  async optimizeBatch(
    images: Array<{ data: Buffer; request: OcrRequestDto }>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<{
    processNow: typeof images;
    defer: typeof images;
    skip: typeof images;
    estimatedSavings: number;
    batchRecommendations: string[];
  }> {
    
    const processNow: typeof images = [];
    const defer: typeof images = [];
    const skip: typeof images = [];
    const recommendations: string[] = [];
    let totalSavings = 0;

    for (const image of images) {
      const decision = await this.shouldProcessImage(image.data, image.request, priority);
      
      if (decision.shouldProcess) {
        processNow.push(image);
      } else if (decision.alternativeAction === 'defer_to_next_day') {
        defer.push(image);
        totalSavings += decision.estimatedCost;
      } else {
        skip.push(image);
        totalSavings += decision.estimatedCost;
      }
    }

    // Add batch processing recommendations
    if (processNow.length > 3) {
      recommendations.push(`Consider batch processing ${processNow.length} images for ${(this.COST_MULTIPLIERS.batch_processing * 100).toFixed(0)}% cost savings`);
      totalSavings += processNow.length * this.BASE_COST_PER_REQUEST * (1 - this.COST_MULTIPLIERS.batch_processing);
    }

    if (skip.length > 0) {
      recommendations.push(`Skipped ${skip.length} low-quality images to save costs`);
    }

    if (defer.length > 0) {
      recommendations.push(`Deferred ${defer.length} images to stay within budget`);
    }

    return {
      processNow,
      defer,
      skip,
      estimatedSavings: totalSavings,
      batchRecommendations: recommendations
    };
  }

  /**
   * Get optimization metrics and recommendations
   */
  async getOptimizationMetrics(): Promise<{
    totalSavings: number;
    averageCostPerRequest: number;
    qualityDistribution: Record<string, number>;
    recommendations: string[];
  }> {
    const cacheMetrics = this.cacheService.getCacheMetrics();
    
    const metrics = {
      totalSavings: cacheMetrics.costSavings,
      averageCostPerRequest: this.BASE_COST_PER_REQUEST,
      qualityDistribution: {
        high: 0.4,
        medium: 0.4,
        low: 0.2
      },
      recommendations: [
        `Cache hit ratio: ${(cacheMetrics.hitRatio * 100).toFixed(1)}%`,
        `Total cost savings: $${cacheMetrics.costSavings.toFixed(4)}`,
        'Consider enabling smart batching for additional savings',
        'Review image quality thresholds based on usage patterns'
      ]
    };

    return metrics;
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<CostOptimizationConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Cost optimization configuration updated', this.config);
  }

  /**
   * Health check for cost optimizer
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: any;
    config: CostOptimizationConfig;
  }> {
    try {
      const cacheHealth = await this.cacheService.healthCheck();
      const optimizationMetrics = await this.getOptimizationMetrics();
      
      const status = cacheHealth.status === 'healthy' ? 'healthy' : 'degraded';
      
      return {
        status,
        metrics: optimizationMetrics,
        config: this.config
      };

    } catch (error) {
      this.logger.error('Cost optimizer health check failed:', error);
      return {
        status: 'unhealthy',
        metrics: null,
        config: this.config
      };
    }
  }
} 