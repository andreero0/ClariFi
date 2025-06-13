import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as sharp from 'sharp';
import { MockCredentialsManager, MockOcrResponse } from './mock-credentials';
import { v4 as uuidv4 } from 'uuid';
import {
  OcrRequestDto,
  OcrResultDto,
  OcrTextBlockDto,
  OcrBoundingBoxDto,
  OcrJobStatus,
  OcrFeatureType,
  OcrImageFormat,
  OcrUsageStatsDto
} from './dto/ocr.dto';
import { RetryHandlerService } from './common/retry-handler.service';
import { OCRException, ErrorContextBuilder, ErrorType, ErrorSeverity, RetryStrategy } from './common/errors';
import { OcrCacheService } from './services/ocr-cache.service';
import { CostOptimizerService } from './services/cost-optimizer.service';

interface GoogleVisionResponse {
  textAnnotations?: Array<{
    description: string;
    boundingPoly: {
      vertices: Array<{ x: number; y: number }>;
    };
  }>;
  fullTextAnnotation?: {
    text: string;
    pages: Array<{
      blocks: Array<{
        paragraphs: Array<{
          words: Array<{
            symbols: Array<{
              text: string;
              confidence: number;
            }>;
          }>;
        }>;
      }>;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly visionClient: ImageAnnotatorClient;
  private readonly usageStats: Map<string, any> = new Map();

  // Cost tracking (based on Google Cloud Vision pricing)
  private readonly COST_PER_UNIT = 0.0015; // $1.50 per 1000 units
  private readonly FREE_TIER_LIMIT = 1000; // 1000 units per month free

  constructor(
    private readonly retryHandler?: RetryHandlerService,
    private readonly cacheService?: OcrCacheService,
    private readonly costOptimizer?: CostOptimizerService
  ) {
    try {
      // Setup mock credentials for development if needed
      MockCredentialsManager.setupMockCredentials();
      
      const envInfo = MockCredentialsManager.getEnvironmentInfo();
      this.logger.log(`OCR Service Environment: ${JSON.stringify(envInfo)}`);

      if (MockCredentialsManager.isMockMode()) {
        this.logger.warn('🔧 Running in MOCK MODE - OCR responses will be simulated');
        // Initialize with minimal config for mock mode
        this.visionClient = {} as ImageAnnotatorClient;
      } else {
        this.visionClient = new ImageAnnotatorClient({
          // Credentials will be automatically detected from GOOGLE_APPLICATION_CREDENTIALS
          // environment variable or default service account
        });
      }
      
      this.logger.log('Google Vision API client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Vision API client', error);
      
      // In development, continue with mock mode instead of failing
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('🔧 Falling back to mock mode for development');
        MockCredentialsManager.setupMockCredentials();
        this.visionClient = {} as ImageAnnotatorClient;
      } else {
        throw new InternalServerErrorException('OCR service initialization failed');
      }
    }
  }

  /**
   * Process a single image with OCR
   */
  async processImage(request: OcrRequestDto): Promise<OcrResultDto> {
    const startTime = Date.now();
    const jobId = uuidv4();

    this.logger.log(`Starting OCR processing for job ${jobId}`);

    const context = new ErrorContextBuilder()
      .addJobId(jobId)
      .addUserId(request.userId || 'anonymous')
      .addProcessingStage('ocr_processing')
      .addCustomData('features', request.features)
      .addCustomData('format', request.format)
      .build();

    // Use retry handler if available, otherwise fallback to basic error handling
    if (this.retryHandler) {
      return await this.retryHandler.executeWithRetry(
        () => this.processImageInternal(request, jobId, startTime, context),
        context,
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000
        }
      );
    } else {
      // Fallback to original implementation
      return await this.processImageInternal(request, jobId, startTime, context);
    }
  }

  /**
   * Internal method for processing image with enhanced error handling
   */
  private async processImageInternal(
    request: OcrRequestDto,
    jobId: string,
    startTime: number,
    context: Record<string, any>
  ): Promise<OcrResultDto> {
    try {
      // Validate and preprocess image
      const processedImageBuffer = await this.preprocessImage(
        request.imageData,
        request.format,
        request.enablePreprocessing ?? true
      );

      // Extract image dimensions
      const metadata = await sharp(processedImageBuffer).metadata();
      const imageDimensions = {
        width: metadata.width || 0,
        height: metadata.height || 0
      };

      // Prepare Vision API request
      const visionRequest = {
        image: {
          content: processedImageBuffer.toString('base64')
        },
        features: this.mapFeaturesToVisionFeatures(request.features),
        imageContext: {
          languageHints: request.languageHints || ['en', 'fr'] // Default to English and French for Canadian content
        }
      };

      // Call Google Vision API with retry logic
      this.logger.log(`Calling Google Vision API for job ${jobId}`);
      const result = await this.callVisionApiWithRetry(visionRequest, context);

      // Process the response
      const ocrResult = await this.processVisionResponse(
        result,
        jobId,
        startTime,
        imageDimensions,
        request.userId
      );

      this.logger.log(`OCR processing completed for job ${jobId} in ${ocrResult.processingTime}ms`);
      return ocrResult;

    } catch (error) {
      this.logger.error(`OCR processing failed for job ${jobId}`, error);
      
      // If it's already an OCRException, rethrow it
      if (error instanceof OCRException) {
        throw error;
      }
      
      return {
        jobId,
        status: OcrJobStatus.FAILED,
        textBlocks: [],
        fullText: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        apiCost: 0,
        pageCount: 0,
        errorMessage: error.message || 'Unknown OCR processing error',
        createdAt: new Date(),
        completedAt: new Date()
      };
    }
  }

  /**
   * Preprocess image for optimal OCR results
   */
  private async preprocessImage(
    imageData: string,
    format: OcrImageFormat,
    enablePreprocessing: boolean
  ): Promise<Buffer> {
    try {
      // Convert base64 to buffer if necessary
      let imageBuffer: Buffer;
      
      if (imageData.startsWith('data:')) {
        // Handle base64 data URLs
        const base64Data = imageData.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (imageData.startsWith('/') || imageData.includes('://')) {
        // Handle file paths or URLs (for internal use)
        throw new BadRequestException('File path processing not implemented in this version');
      } else {
        // Assume it's already base64 encoded
        imageBuffer = Buffer.from(imageData, 'base64');
      }

      if (!enablePreprocessing) {
        return imageBuffer;
      }

      // Use Sharp for image preprocessing
      let processor = sharp(imageBuffer);

      // Auto-rotate based on EXIF data
      processor = processor.rotate();

      // Optimize for OCR:
      // 1. Convert to grayscale for better text recognition
      processor = processor.greyscale();

      // 2. Enhance contrast
      processor = processor.normalize();

      // 3. Ensure sufficient resolution (minimum 300 DPI equivalent)
      const metadata = await sharp(imageBuffer).metadata();
      if (metadata.width && metadata.width < 1200) {
        const scaleFactor = Math.max(1.5, 1200 / metadata.width);
        processor = processor.resize(
          Math.round(metadata.width * scaleFactor),
          Math.round((metadata.height || 0) * scaleFactor),
          {
            kernel: sharp.kernel.cubic,
            withoutEnlargement: false
          }
        );
      }

      // 4. Apply slight sharpening
      processor = processor.sharpen({
        sigma: 1,
        m1: 0.5,
        m2: 2.5,
        x1: 2,
        y2: 10,
        y3: 20
      });

      // 5. Convert to PNG for lossless processing
      const processedBuffer = await processor.png({ quality: 100 }).toBuffer();

      this.logger.log(`Image preprocessed: ${imageBuffer.length} -> ${processedBuffer.length} bytes`);
      return processedBuffer;

    } catch (error) {
      this.logger.error('Image preprocessing failed', error);
      throw new BadRequestException(`Image preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Map our feature types to Google Vision API feature types
   */
  private mapFeaturesToVisionFeatures(features: OcrFeatureType[]): Array<{ type: string; maxResults?: number }> {
    return features.map(feature => {
      switch (feature) {
        case OcrFeatureType.TEXT_DETECTION:
          return { type: 'TEXT_DETECTION', maxResults: 50 };
        case OcrFeatureType.DOCUMENT_TEXT_DETECTION:
          return { type: 'DOCUMENT_TEXT_DETECTION' };
        case OcrFeatureType.LOGO_DETECTION:
          return { type: 'LOGO_DETECTION', maxResults: 10 };
        case OcrFeatureType.LABEL_DETECTION:
          return { type: 'LABEL_DETECTION', maxResults: 10 };
        default:
          return { type: 'DOCUMENT_TEXT_DETECTION' };
      }
    });
  }

  /**
   * Process Google Vision API response into our standard format
   */
  private async processVisionResponse(
    visionResult: GoogleVisionResponse,
    jobId: string,
    startTime: number,
    imageDimensions: { width: number; height: number },
    userId?: string
  ): Promise<OcrResultDto> {
    const processingTime = Date.now() - startTime;
    const apiCost = this.calculateApiCost(1); // 1 unit per image

    // Track usage
    if (userId) {
      this.updateUsageStats(userId, apiCost, processingTime);
    }

    // Handle API errors
    if (visionResult.error) {
      throw new Error(`Google Vision API error: ${visionResult.error.message}`);
    }

    // Extract text blocks
    const textBlocks: OcrTextBlockDto[] = [];
    let fullText = '';
    let overallConfidence = 0;

    // Process full text annotation (preferred for documents)
    if (visionResult.fullTextAnnotation) {
      fullText = visionResult.fullTextAnnotation.text || '';
      
      // Process blocks for structured data
      if (visionResult.fullTextAnnotation.pages) {
        let totalConfidence = 0;
        let blockCount = 0;

        for (const page of visionResult.fullTextAnnotation.pages) {
          let pageNumber = 0;
          
          for (const block of page.blocks || []) {
            for (const paragraph of block.paragraphs || []) {
              let paragraphText = '';
              let paragraphConfidence = 0;
              let wordCount = 0;

              for (const word of paragraph.words || []) {
                for (const symbol of word.symbols || []) {
                  paragraphText += symbol.text;
                  paragraphConfidence += symbol.confidence || 0;
                  wordCount++;
                }
                paragraphText += ' ';
              }

              if (paragraphText.trim()) {
                const avgConfidence = wordCount > 0 ? paragraphConfidence / wordCount : 0;
                
                textBlocks.push({
                  text: paragraphText.trim(),
                  confidence: avgConfidence,
                  boundingBox: {
                    x: 0, // Google Vision provides more complex bounding poly, simplified here
                    y: 0,
                    width: imageDimensions.width,
                    height: imageDimensions.height
                  },
                  pageNumber,
                  blockType: 'paragraph'
                });

                totalConfidence += avgConfidence;
                blockCount++;
              }
            }
            pageNumber++;
          }
        }

        overallConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;
      }
    }
    
    // Fallback to text annotations if full text annotation is not available
    else if (visionResult.textAnnotations && visionResult.textAnnotations.length > 0) {
      fullText = visionResult.textAnnotations[0].description || '';
      
      // Process individual text annotations (skip the first one as it's the full text)
      for (let i = 1; i < visionResult.textAnnotations.length; i++) {
        const annotation = visionResult.textAnnotations[i];
        
        if (annotation.boundingPoly && annotation.boundingPoly.vertices.length >= 2) {
          const vertices = annotation.boundingPoly.vertices;
          const boundingBox: OcrBoundingBoxDto = {
            x: Math.min(...vertices.map(v => v.x || 0)),
            y: Math.min(...vertices.map(v => v.y || 0)),
            width: Math.max(...vertices.map(v => v.x || 0)) - Math.min(...vertices.map(v => v.x || 0)),
            height: Math.max(...vertices.map(v => v.y || 0)) - Math.min(...vertices.map(v => v.y || 0))
          };

          textBlocks.push({
            text: annotation.description || '',
            confidence: 0.8, // Default confidence for text annotations
            boundingBox,
            blockType: 'word'
          });
        }
      }

      overallConfidence = 0.8; // Default confidence for text annotations
    }

    return {
      jobId,
      status: OcrJobStatus.COMPLETED,
      textBlocks,
      fullText,
      confidence: overallConfidence,
      processingTime,
      apiCost,
      pageCount: 1, // Single image = 1 page
      imageDimensions,
      createdAt: new Date(),
      completedAt: new Date()
    };
  }

  /**
   * Calculate API cost based on usage
   */
  private calculateApiCost(units: number): number {
    return units * this.COST_PER_UNIT;
  }

  /**
   * Update usage statistics for cost monitoring
   */
  private updateUsageStats(userId: string, cost: number, processingTime: number): void {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const key = `${userId}:${currentMonth}`;
    
    const current = this.usageStats.get(key) || {
      userId,
      totalApiCalls: 0,
      totalApiCost: 0,
      totalImagesProcessed: 0,
      totalProcessingTime: 0,
      month: currentMonth
    };

    current.totalApiCalls += 1;
    current.totalApiCost += cost;
    current.totalImagesProcessed += 1;
    current.totalProcessingTime += processingTime;

    this.usageStats.set(key, current);

    // Log warning if approaching limits
    if (current.totalApiCalls >= this.FREE_TIER_LIMIT * 0.8) {
      this.logger.warn(`User ${userId} approaching OCR quota limit: ${current.totalApiCalls}/${this.FREE_TIER_LIMIT}`);
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: string): Promise<OcrUsageStatsDto> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const key = `${userId}:${currentMonth}`;
    const stats = this.usageStats.get(key);

    if (!stats) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        userId,
        totalApiCalls: 0,
        totalApiCost: 0,
        totalImagesProcessed: 0,
        totalPagesProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
        currentMonthUsage: 0,
        remainingQuota: this.FREE_TIER_LIMIT,
        periodStartDate: monthStart,
        periodEndDate: monthEnd
      };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      userId,
      totalApiCalls: stats.totalApiCalls,
      totalApiCost: stats.totalApiCost,
      totalImagesProcessed: stats.totalImagesProcessed,
      totalPagesProcessed: stats.totalImagesProcessed, // Same as images for single-page processing
      averageProcessingTime: stats.totalProcessingTime / stats.totalApiCalls,
      successRate: 100, // Simplified - would need failure tracking in production
      currentMonthUsage: stats.totalApiCalls,
      remainingQuota: Math.max(0, this.FREE_TIER_LIMIT - stats.totalApiCalls),
      periodStartDate: monthStart,
      periodEndDate: monthEnd
    };
  }

  /**
   * Check if user has remaining quota
   */
  async checkUserQuota(userId: string): Promise<boolean> {
    const stats = await this.getUserUsageStats(userId);
    return stats.remainingQuota > 0;
  }

  /**
   * Call Google Vision API with retry logic
   */
  private async callVisionApiWithRetry(
    visionRequest: any,
    context: Record<string, any>
  ): Promise<GoogleVisionResponse> {
    if (MockCredentialsManager.isMockMode()) {
      this.logger.warn('🔧 Using mock OCR response in development mode');
      return MockOcrResponse.generateMockResponse('mock-image-data');
    }

    try {
      const [result] = await this.visionClient.textDetection(visionRequest);
      return result as GoogleVisionResponse;
    } catch (error) {
      this.logger.error('Google Vision API call failed', error);
      throw new OCRException({
        type: ErrorType.OCR_PROCESSING_FAILED,
        severity: ErrorSeverity.HIGH,
        message: 'Vision API call failed',
        originalError: error,
        context,
        timestamp: new Date(),
        retryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        maxRetries: 3,
        suggestedAction: 'Check API credentials and quota limits'
      });
    }
  }

  /**
   * Extract specific patterns from OCR text (bank statement specific)
   */
  extractBankStatementData(fullText: string): {
    transactions: Array<{
      date: string;
      description: string;
      amount: string;
      balance?: string;
    }>;
    accountNumber?: string;
    statementPeriod?: string;
    bankName?: string;
  } {
    const transactions: Array<{
      date: string;
      description: string;
      amount: string;
      balance?: string;
    }> = [];
    const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Patterns for Canadian bank statements
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
    const amountPattern = /\$?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/;
    const accountPattern = /account\s*(?:number|#)?\s*:?\s*([0-9\-\s]{8,})/i;

    let accountNumber: string | undefined;
    let bankName: string | undefined;
    let statementPeriod: string | undefined;

    // Extract account number and bank name
    for (const line of lines) {
      if (!accountNumber) {
        const accountMatch = line.match(accountPattern);
        if (accountMatch) {
          accountNumber = accountMatch[1].replace(/\s+/g, '');
        }
      }

      // Look for common Canadian bank names
      if (!bankName) {
        const bankPattern = /(Royal Bank|RBC|TD Bank|Bank of Montreal|BMO|Scotiabank|CIBC|National Bank)/i;
        const bankMatch = line.match(bankPattern);
        if (bankMatch) {
          bankName = bankMatch[1];
        }
      }

      // Look for statement period
      if (!statementPeriod && line.includes('statement period')) {
        statementPeriod = line;
      }
    }

    // Extract transactions
    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        const amounts = line.match(new RegExp(amountPattern.source, 'g'));
        if (amounts && amounts.length >= 1) {
          // Basic transaction extraction
          const date = dateMatch[1];
          const description = line.replace(datePattern, '').replace(new RegExp(amountPattern.source, 'g'), '').trim();
          const amount = amounts[0];
          const balance = amounts.length > 1 ? amounts[amounts.length - 1] : undefined;

          transactions.push({
            date,
            description,
            amount,
            balance
          });
        }
      }
    }

    return {
      transactions,
      accountNumber,
      statementPeriod,
      bankName
    };
  }

} 