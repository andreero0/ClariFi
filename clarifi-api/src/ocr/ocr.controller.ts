import 'multer'; // ADDED TO HELP WITH Express.Multer.File TYPE RESOLUTION
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OcrService } from './ocr.service';
import { TemporaryFileManagerService } from '../storage/temporary-file-manager.service';
import { StorageService } from '../storage/storage.service';
import {
  OcrRequestDto,
  OcrResultDto,
  OcrUsageStatsDto,
  ProcessImageRequestDto,
  ProcessImageResponseDto,
  OcrJobStatus,
  OcrFeatureType,
  OcrImageFormat
} from './dto/ocr.dto';
import {
  CreateTemporaryFileRequestDto,
  TemporaryFileDto,
  UpdateTemporaryFileRequestDto
} from '../storage/dto/temporary-file.dto';

// Extended metadata interface for OCR-specific fields
interface OcrMetadata {
  processingStage?: string;
  errorMessage?: string;
  retryCount?: number;
  tags?: string[];
  storageUrl?: string;
  ocrJobId?: string;
  ocrResultPath?: string;
  textBlocksCount?: number;
  confidence?: number;
  processingTime?: number;
  ocrFeatures?: string[];
}

// Configure multer for memory storage (cloud storage integration)
const multerConfig = {
  storage: 'memory', // Use memory storage instead of disk
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|tiff)$/)) {
      return callback(new BadRequestException('Only image and PDF files are allowed'), false);
    }
    callback(null, true);
  },
};

@ApiTags('OCR')
@Controller('ocr')
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly configService: ConfigService,
    private readonly temporaryFileManager: TemporaryFileManagerService,
    private readonly storageService: StorageService,
  ) {}

  @Post('process')
  @ApiOperation({ 
    summary: 'Process an image with OCR',
    description: 'Extract text from an image using Google Vision API with optimized preprocessing'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'OCR processing completed successfully',
    type: OcrResultDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'OCR processing failed'
  })
  @HttpCode(HttpStatus.CREATED)
  async processImage(@Body() request: OcrRequestDto): Promise<OcrResultDto> {
    this.logger.log(`Processing OCR request for user: ${request.userId || 'anonymous'}`);

    // Validate request
    if (!request.imageData || !request.format) {
      throw new BadRequestException('Image data and format are required');
    }

    // Check user quota if userId provided
    if (request.userId) {
      const hasQuota = await this.ocrService.checkUserQuota(request.userId);
      if (!hasQuota) {
        throw new BadRequestException('OCR quota exceeded for this month');
      }
    }

    try {
      const result = await this.ocrService.processImage(request);
      this.logger.log(`OCR processing completed for job: ${result.jobId}`);
      return result;
    } catch (error) {
      this.logger.error('OCR processing failed', error);
      throw error;
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ 
    summary: 'Upload and process an image file',
    description: 'Upload an image file and process it with OCR. Supports JPEG, PNG, PDF, and other formats.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        userId: {
          type: 'string',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
        },
        languageHints: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded and OCR processing initiated',
    type: ProcessImageResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid file or missing parameters'
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadAndProcess(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId?: string,
    @Body('features') features?: string[],
    @Body('languageHints') languageHints?: string[],
  ): Promise<ProcessImageResponseDto> {
    this.logger.log(`Processing uploaded file: ${file?.originalname}`);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    // Check user quota
    if (userId) {
      const hasQuota = await this.ocrService.checkUserQuota(userId);
      if (!hasQuota) {
        throw new BadRequestException('OCR quota exceeded for this month');
      }
    }

    try {
      // Create temporary file entry for tracking and lifecycle management
      const tempFileRequest: CreateTemporaryFileRequestDto = {
        originalFileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        expectedProcessingTime: 120, // 2 minutes expected processing time
        tags: ['ocr', 'upload', ...(features || [])]
      };

      const tempFile = await this.temporaryFileManager.createTemporaryFile(
        userId || 'anonymous',
        tempFileRequest
      );

      this.logger.log(`Created temporary file entry: ${tempFile.id} for OCR processing`);

      // Upload file to cloud storage
      const uploadResult = await this.storageService.uploadFile(
        file.buffer,
        tempFile.temporaryPath,
        tempFile.bucketName,
        file.mimetype
      );

      if (!uploadResult) {
        await this.temporaryFileManager.updateTemporaryFile(tempFile.id, {
          status: 'failed',
          metadata: { errorMessage: 'Failed to upload file to cloud storage' }
        });
        throw new BadRequestException('Failed to upload file to storage');
      }

      // Update temporary file status
      await this.temporaryFileManager.updateTemporaryFile(tempFile.id, {
        status: 'processing',
        metadata: { 
          processingStage: 'ocr_analysis',
          tags: ['storage_url', uploadResult.fullPath, ...(features || [])]
        }
      });

      // Parse processing options
      let options = {};
      if (features) {
        options = { features: features.map(f => f as OcrFeatureType) };
      }
      if (languageHints) {
        options = { ...options, languageHints: languageHints };
      }

      // Determine format from MIME type
      let format: OcrImageFormat;
      switch (file.mimetype) {
        case 'image/jpeg':
          format = OcrImageFormat.JPEG;
          break;
        case 'image/png':
          format = OcrImageFormat.PNG;
          break;
        case 'image/webp':
          format = OcrImageFormat.WEBP;
          break;
        case 'image/bmp':
          format = OcrImageFormat.BMP;
          break;
        case 'image/tiff':
          format = OcrImageFormat.TIFF;
          break;
        case 'application/pdf':
          format = OcrImageFormat.PDF;
          break;
        default:
          format = OcrImageFormat.JPEG;
      }

      // Convert file buffer to base64
      const base64Data = file.buffer.toString('base64');

      // Create OCR request
      const ocrRequest: OcrRequestDto = {
        imageData: `data:${file.mimetype};base64,${base64Data}`,
        format,
        features: (features as OcrFeatureType[]) || [OcrFeatureType.TEXT_DETECTION],
        languageHints: languageHints || ['en', 'fr'],
        enablePreprocessing: true,
        enableAutoRotation: true,
        priority: 5,
        userId,
        ...options
      };

      // Process the image
      const result = await this.ocrService.processImage(ocrRequest);

      // Store OCR results in temporary storage
      const ocrResultPath = `temp/ocr-results/${tempFile.sessionId}/${result.jobId}.json`;
      const ocrResultBuffer = Buffer.from(JSON.stringify(result, null, 2));
      
      await this.storageService.uploadFile(
        ocrResultBuffer,
        ocrResultPath,
        'temp-uploads',
        'application/json'
      );

      // Update temporary file with completion status and OCR results
      await this.temporaryFileManager.updateTemporaryFile(tempFile.id, {
        status: 'completed',
        metadata: {
          processingStage: 'completed',
          tags: [
            'ocr_completed',
            `job_id:${result.jobId}`,
            `result_path:${ocrResultPath}`,
            `blocks:${result.textBlocks.length}`,
            `confidence:${result.confidence}`,
            `time:${result.processingTime}ms`
          ]
        } as any
      });

      this.logger.log(`OCR processing completed for temp file: ${tempFile.id}, job: ${result.jobId}`);

      return {
        jobId: result.jobId,
        status: result.status,
        message: `File processed successfully. Extracted ${result.textBlocks.length} text blocks.`,
        estimatedProcessingTime: result.processingTime / 1000,
        queuePosition: 0, // Since we're processing synchronously
        temporaryFileId: tempFile.id,
        storageUrl: uploadResult.fullPath,
        ocrResultUrl: ocrResultPath
      };

    } catch (error) {
      this.logger.error('File upload and OCR processing failed', error);
      throw error;
    }
  }

  @Get('result/:jobId')
  @ApiOperation({ 
    summary: 'Get OCR result by job ID',
    description: 'Retrieve the OCR processing result for a specific job'
  })
  @ApiParam({ 
    name: 'jobId', 
    description: 'Unique job identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OCR result retrieved successfully',
    type: OcrResultDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Job not found'
  })
  async getResult(@Param('jobId', ParseUUIDPipe) jobId: string): Promise<OcrResultDto> {
    // Note: This is a placeholder - in a real implementation, you'd store results
    // in a database and retrieve them here. For now, we'll return a not implemented response.
    throw new BadRequestException('Result retrieval not implemented - use synchronous processing endpoint');
  }

  @Get('usage/:userId')
  @ApiOperation({ 
    summary: 'Get OCR usage statistics',
    description: 'Retrieve usage statistics and quota information for a user'
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'User identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usage statistics retrieved successfully',
    type: OcrUsageStatsDto 
  })
  async getUsageStats(@Param('userId', ParseUUIDPipe) userId: string): Promise<OcrUsageStatsDto> {
    this.logger.log(`Retrieving usage stats for user: ${userId}`);
    
    try {
      const stats = await this.ocrService.getUserUsageStats(userId);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to retrieve usage stats for user ${userId}`, error);
      throw error;
    }
  }

  @Get('quota/:userId')
  @ApiOperation({ 
    summary: 'Check user quota',
    description: 'Check if a user has remaining OCR quota for the current month'
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'User identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Quota check completed',
    schema: {
      type: 'object',
      properties: {
        hasQuota: { type: 'boolean' },
        remainingQuota: { type: 'number' },
        currentUsage: { type: 'number' },
        monthlyLimit: { type: 'number' }
      }
    }
  })
  async checkQuota(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Checking quota for user: ${userId}`);
    
    try {
      const hasQuota = await this.ocrService.checkUserQuota(userId);
      const stats = await this.ocrService.getUserUsageStats(userId);
      
      return {
        hasQuota,
        remainingQuota: stats.remainingQuota,
        currentUsage: stats.currentMonthUsage,
        monthlyLimit: 1000 // Free tier limit
      };
    } catch (error) {
      this.logger.error(`Failed to check quota for user ${userId}`, error);
      throw error;
    }
  }

  @Post('extract-bank-data')
  @ApiOperation({ 
    summary: 'Extract bank statement data',
    description: 'Process an image and extract structured bank statement data (transactions, account info, etc.)'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Bank statement data extracted successfully',
    schema: {
      type: 'object',
      properties: {
        ocrResult: { $ref: '#/components/schemas/OcrResultDto' },
        bankData: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  description: { type: 'string' },
                  amount: { type: 'string' },
                  balance: { type: 'string' }
                }
              }
            },
            accountNumber: { type: 'string' },
            statementPeriod: { type: 'string' },
            bankName: { type: 'string' }
          }
        }
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  async extractBankStatementData(@Body() request: OcrRequestDto) {
    this.logger.log(`Extracting bank statement data for user: ${request.userId || 'anonymous'}`);

    // Check quota
    if (request.userId) {
      const hasQuota = await this.ocrService.checkUserQuota(request.userId);
      if (!hasQuota) {
        throw new BadRequestException('OCR quota exceeded for this month');
      }
    }

    try {
      // Process image with OCR
      const ocrResult = await this.ocrService.processImage(request);
      
      // Extract bank-specific data
      const bankData = this.ocrService.extractBankStatementData(ocrResult.fullText);
      
      this.logger.log(`Extracted ${bankData.transactions.length} transactions from bank statement`);
      
      return {
        ocrResult,
        bankData
      };
    } catch (error) {
      this.logger.error('Bank statement data extraction failed', error);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check if the OCR service is healthy and ready to process requests'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        service: { type: 'string' },
        version: { type: 'string' },
        googleCloud: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            mockMode: { type: 'boolean' },
            projectId: { type: 'string' },
            authenticated: { type: 'boolean' },
            visionApiAccess: { type: 'boolean' },
            lastChecked: { type: 'string' }
          }
        },
        uptime: { type: 'number' }
      }
    }
  })
  async healthCheck(): Promise<{
    status: string;
    googleCloud: {
      configured: boolean;
      mockMode: boolean;
      projectId?: string;
      authenticated: boolean;
      visionApiAccess: boolean;
      lastChecked?: string;
      error?: string;
    };
    version: string;
    uptime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get Google Cloud configuration
      const googleCloudConfig = this.configService.get('googleCloud');
      
      // Check if service is configured
      const isConfigured = !!(
        googleCloudConfig?.projectId && 
        (googleCloudConfig?.keyFilename || 
         googleCloudConfig?.fallbackCredentials || 
         process.env.GOOGLE_APPLICATION_CREDENTIALS ||
         googleCloudConfig?.mock)
      );

      // Basic health check without actually calling external APIs
      const healthData = {
        status: 'healthy',
        googleCloud: {
          configured: isConfigured,
          mockMode: googleCloudConfig?.mock || false,
          projectId: googleCloudConfig?.projectId,
          authenticated: isConfigured, // Basic check
          visionApiAccess: isConfigured, // Assume access if configured
          lastChecked: new Date().toISOString(),
          error: undefined as string | undefined,
        },
        version: '1.0.0',
        uptime: process.uptime(),
      };

      // If not configured, mark as unhealthy
      if (!isConfigured) {
        healthData.status = 'unhealthy';
        healthData.googleCloud.authenticated = false;
        healthData.googleCloud.visionApiAccess = false;
        // Mark configuration error in status
      }

      return healthData;
    } catch (error) {
      return {
        status: 'unhealthy',
        googleCloud: {
          configured: false,
          mockMode: false,
          authenticated: false,
          visionApiAccess: false,
          error: error.message,
          lastChecked: new Date().toISOString(),
        },
        version: '1.0.0',
        uptime: process.uptime(),
      };
    }
  }
} 