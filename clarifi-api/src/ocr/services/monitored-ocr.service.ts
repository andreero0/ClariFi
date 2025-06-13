import { Injectable, Logger } from '@nestjs/common';
import { OcrService } from '../ocr.service';
import { ApiUsageMonitorService, UsageRecord } from './api-usage-monitor.service';
import { ProcessImageResponseDto } from '../dto/ocr.dto';
import { ConfigService } from '@nestjs/config';

/**
 * Monitored OCR Service that wraps the OCR service with usage tracking
 */
@Injectable()
export class MonitoredOcrService {
  private readonly logger = new Logger(MonitoredOcrService.name);
  
  // Cost per operation (Google Cloud Vision API pricing)
  private readonly baseCostPerImage: number;
  private readonly costPerFeature: number;

  constructor(
    private readonly ocrService: OcrService,
    private readonly apiUsageMonitorService: ApiUsageMonitorService,
    private readonly configService: ConfigService,
  ) {
    // Initialize pricing (these would come from config in production)
    this.baseCostPerImage = this.configService.get<number>('VISION_API_BASE_COST', 0.0015); // $0.0015 per image
    this.costPerFeature = this.configService.get<number>('VISION_API_FEATURE_COST', 0.0005); // $0.0005 per feature
  }

  /**
   * Process image with monitoring
   */
  async processImage(
    imageBuffer: Buffer,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<ProcessImageResponseDto> {
    const startTime = Date.now();
    const operationId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`Starting OCR operation: ${operationId}, user: ${userId || 'anonymous'}`);

    let result: ProcessImageResponseDto | undefined;
    let success = false;
    let errorType: string | undefined;
    let tokenCount = 0;

    try {
      // Create OCR request from buffer
      const ocrRequest = {
        imageData: imageBuffer.toString('base64'),
        format: 'jpeg' as any, // Default format, could be enhanced to detect actual format
        features: ['TEXT_DETECTION' as any],
        userId: userId,
        enablePreprocessing: true
      };

      // Call the actual OCR service
      const ocrResult = await this.ocrService.processImage(ocrRequest);
      success = true;
      
      // Convert OcrResultDto to ProcessImageResponseDto
      result = {
        jobId: ocrResult.jobId,
        status: ocrResult.status as any,
        message: 'OCR processing completed',
        estimatedProcessingTime: ocrResult.processingTime / 1000, // Convert ms to seconds
        extractedText: ocrResult.fullText,
        detectedLanguage: 'en', // Default language, could be enhanced
        entities: [], // Would need additional processing to extract entities
        keywords: [], // Would need additional processing to extract keywords
        warnings: ocrResult.errorMessage ? [ocrResult.errorMessage] : []
      };
      
      // Estimate token count based on extracted text
      tokenCount = this.estimateTokenCount(result.extractedText || '');
      
      this.logger.log(`OCR operation completed successfully: ${operationId}`);
      
    } catch (error) {
      errorType = error.constructor.name;
      this.logger.error(`OCR operation failed: ${operationId}`, error);
      throw error;
      
    } finally {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Calculate cost based on features used and text extracted
      const cost = this.calculateCost(tokenCount, result?.extractedText?.length || 0);
      
      // Record usage metrics
      const usageRecord: UsageRecord = {
        timestamp: new Date(startTime),
        userId,
        operation: 'process_image',
        responseTime,
        success,
        cost,
        tokenCount,
        errorType,
        metadata: {
          ...metadata,
          operation_id: operationId,
          image_size: imageBuffer.length,
          extracted_text_length: result?.extractedText?.length || 0,
          detected_language: result?.detectedLanguage || 'unknown',
          has_entities: (result?.entities?.length || 0) > 0,
          has_keywords: (result?.keywords?.length || 0) > 0
        }
      };

      this.apiUsageMonitorService.recordApiUsage(usageRecord);
    }

    return result!;
  }

  /**
   * Process images in batch with monitoring
   */
  async processBatch(
    images: Array<{ buffer: Buffer; filename?: string }>,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<Array<ProcessImageResponseDto & { filename?: string }>> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    this.logger.log(`Starting batch OCR operation: ${batchId}, images: ${images.length}, user: ${userId || 'anonymous'}`);

    const results: Array<ProcessImageResponseDto & { filename?: string }> = [];
    let successCount = 0;
    let totalCost = 0;
    let totalTokens = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        const result = await this.processImage(
          image.buffer,
          userId,
          {
            ...metadata,
            batch_id: batchId,
            batch_index: i,
            batch_total: images.length,
            filename: image.filename
          }
        );

        results.push({
          ...result,
          filename: image.filename
        });

        successCount++;
        totalTokens += this.estimateTokenCount(result.extractedText || '');
        totalCost += this.calculateCost(totalTokens, result.extractedText?.length || 0);

      } catch (error) {
        this.logger.error(`Failed to process image ${i} in batch ${batchId}:`, error);
        
        // Add error result
        results.push({
          extractedText: '',
          confidence: 0,
          detectedLanguage: 'unknown',
          entities: [],
          keywords: [],
          filename: image.filename,
          error: error.message
        } as any);
      }
    }

    const endTime = Date.now();
    const totalResponseTime = endTime - startTime;

    // Record batch summary
    const batchRecord: UsageRecord = {
      timestamp: new Date(startTime),
      userId,
      operation: 'process_batch',
      responseTime: totalResponseTime,
      success: successCount === images.length,
      cost: totalCost,
      tokenCount: totalTokens,
      metadata: {
        ...metadata,
        batch_id: batchId,
        total_images: images.length,
        successful_images: successCount,
        failed_images: images.length - successCount,
        success_rate: (successCount / images.length) * 100,
        average_response_time: totalResponseTime / images.length
      }
    };

    this.apiUsageMonitorService.recordApiUsage(batchRecord);

    this.logger.log(`Batch OCR operation completed: ${batchId}, success: ${successCount}/${images.length}, total cost: $${totalCost.toFixed(4)}`);

    return results;
  }

  /**
   * Get user usage statistics
   */
  async getUserUsageStats(userId: string, timeRangeHours: number = 24) {
    const timeRangeMs = timeRangeHours * 60 * 60 * 1000;
    return this.apiUsageMonitorService.getUserUsageStats(userId, timeRangeMs);
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics() {
    return this.apiUsageMonitorService.getCurrentMetrics();
  }

  /**
   * Check if user is approaching usage limits
   */
  async checkUserLimits(userId: string): Promise<{
    withinLimits: boolean;
    dailyUsage: number;
    dailyLimit: number;
    monthlyCost: number;
    monthlyLimit: number;
    warnings: string[];
  }> {
    const dailyStats = await this.getUserUsageStats(userId, 24);
    const monthlyStats = await this.getUserUsageStats(userId, 24 * 30);

    const dailyLimit = this.configService.get<number>('USER_DAILY_CALL_LIMIT', 100);
    const monthlyCostLimit = this.configService.get<number>('USER_MONTHLY_COST_LIMIT', 10);

    const warnings: string[] = [];
    let withinLimits = true;

    // Check daily call limit
    if (dailyStats.totalCalls >= dailyLimit) {
      warnings.push(`Daily call limit reached: ${dailyStats.totalCalls}/${dailyLimit}`);
      withinLimits = false;
    } else if (dailyStats.totalCalls >= dailyLimit * 0.8) {
      warnings.push(`Approaching daily call limit: ${dailyStats.totalCalls}/${dailyLimit}`);
    }

    // Check monthly cost limit
    if (monthlyStats.totalCost >= monthlyCostLimit) {
      warnings.push(`Monthly cost limit reached: $${monthlyStats.totalCost.toFixed(2)}/$${monthlyCostLimit}`);
      withinLimits = false;
    } else if (monthlyStats.totalCost >= monthlyCostLimit * 0.8) {
      warnings.push(`Approaching monthly cost limit: $${monthlyStats.totalCost.toFixed(2)}/$${monthlyCostLimit}`);
    }

    return {
      withinLimits,
      dailyUsage: dailyStats.totalCalls,
      dailyLimit,
      monthlyCost: monthlyStats.totalCost,
      monthlyLimit: monthlyCostLimit,
      warnings
    };
  }

  /**
   * Get usage analytics for dashboard
   */
  async getUsageAnalytics(userId?: string, timeRangeHours: number = 24) {
    const timeRangeMs = timeRangeHours * 60 * 60 * 1000;
    
    if (userId) {
      const userStats = await this.getUserUsageStats(userId, timeRangeHours);
      return {
        user_stats: userStats,
        system_stats: await this.getSystemMetrics(),
        time_range_hours: timeRangeHours
      };
    } else {
      return {
        system_stats: await this.getSystemMetrics(),
        top_users: this.apiUsageMonitorService.getTopUsersByUsage(10, timeRangeMs),
        time_range_hours: timeRangeHours
      };
    }
  }

  /**
   * Estimate token count from text
   */
  private estimateTokenCount(text: string): number {
    // Simple estimation: roughly 4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for operation
   */
  private calculateCost(tokenCount: number, textLength: number): number {
    let cost = this.baseCostPerImage;
    
    // Add cost based on text length (proxy for processing complexity)
    if (textLength > 1000) {
      cost += this.costPerFeature; // Complex text processing
    }
    
    // Add cost based on token count
    cost += (tokenCount / 1000) * 0.001; // $0.001 per 1K tokens
    
    return cost;
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: any;
    alerts: any[];
    recommendations: string[];
  }> {
    const metrics = await this.getSystemMetrics();
    const alerts = this.apiUsageMonitorService.getActiveAlerts();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const recommendations: string[] = [];
    
    // Determine status based on metrics
    if (metrics.errorRate > 15 || metrics.averageResponseTime > 10000) {
      status = 'unhealthy';
      recommendations.push('System is experiencing significant issues');
    } else if (metrics.errorRate > 5 || metrics.averageResponseTime > 5000) {
      status = 'degraded';
      recommendations.push('System performance is degraded');
    }
    
    // Check for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      status = 'unhealthy';
      recommendations.push('Critical alerts require immediate attention');
    }
    
    // Cost recommendations
    if (metrics.totalCost > 20) {
      recommendations.push('High daily costs detected - review usage patterns');
    }
    
    // Performance recommendations
    if (metrics.averageResponseTime > 3000) {
      recommendations.push('Consider optimizing image processing pipeline');
    }
    
    return {
      status,
      metrics,
      alerts,
      recommendations
    };
  }
} 