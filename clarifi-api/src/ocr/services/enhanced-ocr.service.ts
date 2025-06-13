import { Injectable, Logger } from '@nestjs/common';
import { OcrService } from '../ocr.service';
import { RetryHandlerService } from '../common/retry-handler.service';
import { 
  OCRException, 
  ErrorContextBuilder, 
  ErrorType, 
  ErrorSeverity 
} from '../common/errors';
import {
  OcrRequestDto,
  OcrResultDto,
  OcrJobStatus
} from '../dto/ocr.dto';

/**
 * Enhanced OCR service with comprehensive error handling and retry logic
 */
@Injectable()
export class EnhancedOcrService {
  private readonly logger = new Logger(EnhancedOcrService.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly retryHandler: RetryHandlerService
  ) {}

  /**
   * Process image with enhanced error handling and retry logic
   */
  async processImageWithRetry(request: OcrRequestDto): Promise<OcrResultDto> {
    const context = this.retryHandler.createErrorContext()
      .addUserId(request.userId || 'anonymous')
      .addProcessingStage('enhanced_ocr_processing')
      .addCustomData('format', request.format)
      .addCustomData('features', request.features)
      .addCustomData('enablePreprocessing', request.enablePreprocessing)
      .build();

    this.logger.log(`Starting enhanced OCR processing with retry logic for user: ${request.userId}`);

    return await this.retryHandler.executeWithRetry(
      async () => {
        // Validate request before processing
        this.validateRequest(request);

        // Process with original OCR service
        const result = await this.ocrService.processImage(request);

        // Validate result quality
        this.validateResult(result, context);

        return result;
      },
      context,
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 15000,
        jitterPercent: 20,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeoutMs: 60000
      }
    );
  }

  /**
   * Process image with custom error handling
   */
  async processImageWithCustomHandling(
    request: OcrRequestDto,
    errorHandler: (error: any, attempt: any) => boolean | Promise<boolean>
  ): Promise<OcrResultDto> {
    const context = this.retryHandler.createErrorContext()
      .addUserId(request.userId || 'anonymous')
      .addProcessingStage('custom_ocr_processing')
      .build();

    return await this.retryHandler.executeWithCustomErrorHandling(
      () => this.ocrService.processImage(request),
      context,
      errorHandler
    );
  }

  /**
   * Batch process multiple images with enhanced error handling
   */
  async processBatch(
    requests: OcrRequestDto[],
    options: {
      continueOnError?: boolean;
      maxConcurrent?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<Array<{ request: OcrRequestDto; result?: OcrResultDto; error?: OCRException }>> {
    const { continueOnError = true, maxConcurrent = 3, timeoutMs = 300000 } = options;
    
    this.logger.log(`Processing batch of ${requests.length} images with enhanced error handling`);

    const results: Array<{ request: OcrRequestDto; result?: OcrResultDto; error?: OCRException }> = [];
    const semaphore = new Array(maxConcurrent).fill(null);

    // Process in chunks to respect concurrency limits
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const chunk = requests.slice(i, i + maxConcurrent);
      
      const chunkPromises = chunk.map(async (request) => {
        try {
          // Add timeout wrapper
          const result = await Promise.race([
            this.processImageWithRetry(request),
            this.createTimeoutPromise(timeoutMs)
          ]);

          return { request, result };
        } catch (error) {
          const ocrError = error instanceof OCRException ? error : new OCRException({
            type: ErrorType.OCR_PROCESSING_FAILED,
            severity: ErrorSeverity.HIGH,
            message: error.message || 'Batch processing failed',
            originalError: error,
            timestamp: new Date(),
            retryable: false,
            retryStrategy: RetryStrategy.NO_RETRY,
            maxRetries: 0
          });

          if (continueOnError) {
            this.logger.warn(`Batch item failed, continuing: ${error.message}`);
            return { request, error: ocrError };
          } else {
            throw ocrError;
          }
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Log progress
      this.logger.log(`Batch progress: ${results.length}/${requests.length} processed`);
    }

    // Log final results
    const successful = results.filter(r => r.result).length;
    const failed = results.filter(r => r.error).length;
    
    this.logger.log(`Batch processing completed: ${successful} successful, ${failed} failed`);

    return results;
  }

  /**
   * Process image with quality validation
   */
  async processImageWithQualityCheck(
    request: OcrRequestDto,
    qualityThreshold: number = 0.7
  ): Promise<OcrResultDto> {
    const result = await this.processImageWithRetry(request);

    if (result.confidence < qualityThreshold) {
      this.logger.warn(
        `OCR result quality below threshold: ${result.confidence} < ${qualityThreshold}`
      );

      // Try with enhanced preprocessing
      if (!request.enablePreprocessing) {
        this.logger.log('Retrying with enhanced preprocessing enabled');
        
        const enhancedRequest = { ...request, enablePreprocessing: true };
        const enhancedResult = await this.processImageWithRetry(enhancedRequest);
        
        if (enhancedResult.confidence > result.confidence) {
          return enhancedResult;
        }
      }

      // Return original result with warning
      result.warnings = result.warnings || [];
      result.warnings.push(`Low confidence score: ${result.confidence}`);
    }

    return result;
  }

  /**
   * Get error metrics from retry handler
   */
  getErrorMetrics() {
    return this.retryHandler.getErrorMetrics();
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return this.retryHandler.getCircuitBreakerStatus();
  }

  /**
   * Reset circuit breaker for specific operation
   */
  resetCircuitBreaker(operationId: string) {
    this.retryHandler.resetCircuitBreaker(operationId);
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: OcrRequestDto): void {
    if (!request.imageData) {
      throw new OCRException({
        type: ErrorType.INVALID_IMAGE_DATA,
        severity: ErrorSeverity.HIGH,
        message: 'Image data is required',
        timestamp: new Date(),
        retryable: false,
        retryStrategy: RetryStrategy.NO_RETRY,
        maxRetries: 0,
        suggestedAction: 'Provide valid base64 image data'
      });
    }

    if (!request.format) {
      throw new OCRException({
        type: ErrorType.INVALID_IMAGE_DATA,
        severity: ErrorSeverity.HIGH,
        message: 'Image format is required',
        timestamp: new Date(),
        retryable: false,
        retryStrategy: RetryStrategy.NO_RETRY,
        maxRetries: 0,
        suggestedAction: 'Specify image format (JPEG, PNG, etc.)'
      });
    }

    // Validate image data size (basic check)
    const imageSizeEstimate = (request.imageData.length * 3) / 4; // Base64 size estimate
    const maxSize = 20 * 1024 * 1024; // 20MB limit
    
    if (imageSizeEstimate > maxSize) {
      throw new OCRException({
        type: ErrorType.FILE_TOO_LARGE,
        severity: ErrorSeverity.HIGH,
        message: `Image size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
        timestamp: new Date(),
        retryable: false,
        retryStrategy: RetryStrategy.NO_RETRY,
        maxRetries: 0,
        suggestedAction: 'Reduce image size or use image compression'
      });
    }
  }

  /**
   * Validate result quality
   */
  private validateResult(result: OcrResultDto, context: Record<string, any>): void {
    if (result.status === OcrJobStatus.FAILED) {
      throw new OCRException({
        type: ErrorType.OCR_PROCESSING_FAILED,
        severity: ErrorSeverity.HIGH,
        message: result.errorMessage || 'OCR processing failed',
        context,
        timestamp: new Date(),
        retryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 2,
        suggestedAction: 'Check image quality and format'
      });
    }

    // Validate minimum confidence threshold
    const minConfidence = 0.1; // Very low threshold for basic validation
    if (result.confidence < minConfidence) {
      this.logger.warn(`Very low confidence OCR result: ${result.confidence}`);
    }

    // Validate text extraction
    if (!result.fullText && result.textBlocks.length === 0) {
      this.logger.warn('No text extracted from image - possible blank or invalid image');
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new OCRException({
          type: ErrorType.NETWORK_TIMEOUT,
          severity: ErrorSeverity.MEDIUM,
          message: `Operation timed out after ${timeoutMs}ms`,
          timestamp: new Date(),
          retryable: true,
          retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
          maxRetries: 2,
          suggestedAction: 'Increase timeout or check system performance'
        }));
      }, timeoutMs);
    });
  }
}

// Import for type annotation
import { RetryStrategy } from '../common/errors'; 