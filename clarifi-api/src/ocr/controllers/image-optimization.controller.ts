import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ImageOptimizerService } from '../services/image-optimizer.service';
import {
  ImageOptimizationRequestDto,
  DocumentTypeOptimizationRequestDto,
  ImageOptimizationResultDto,
  ImageQualityAnalysisDto,
  ImageQualityResultDto
} from '../dto/image-optimization.dto';

@ApiTags('Image Optimization')
@Controller('ocr/image-optimization')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ImageOptimizationController {
  private readonly logger = new Logger(ImageOptimizationController.name);

  constructor(private readonly imageOptimizerService: ImageOptimizerService) {}

  @Post('optimize')
  @ApiOperation({
    summary: 'Optimize image for OCR processing',
    description: 'Apply various image enhancements to improve OCR accuracy'
  })
  @ApiResponse({ status: 200, description: 'Image optimized successfully', type: ImageOptimizationResultDto })
  async optimizeImage(@Body() request: ImageOptimizationRequestDto): Promise<ImageOptimizationResultDto> {
    const startTime = Date.now();
    
    try {
      const imageBuffer = this.extractImageBuffer(request.imageData);
      
      const options = {
        targetDpi: request.targetDpi,
        maxDimension: request.maxDimension,
        enhanceContrast: request.enhanceContrast,
        applySharpening: request.applySharpening,
        removeNoise: request.removeNoise,
        correctSkew: request.correctSkew,
        binarize: request.binarize,
        format: request.format,
        quality: request.quality
      };

      const cleanOptions = Object.fromEntries(
        Object.entries(options).filter(([_, value]) => value !== undefined)
      );

      const result = await this.imageOptimizerService.optimizeForOcr(imageBuffer, cleanOptions);
      
      const processingTime = Date.now() - startTime;
      const optimizedImageData = `data:image/png;base64,${result.buffer.toString('base64')}`;

      return {
        optimizedImage: optimizedImageData,
        metadata: result.metadata,
        processingTime,
        appliedSettings: cleanOptions
      };

    } catch (error) {
      this.logger.error('Image optimization failed', error);
      throw new HttpException(`Image optimization failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('optimize-by-type')
  @ApiOperation({
    summary: 'Optimize image based on document type',
    description: 'Apply document-specific optimization settings'
  })
  @ApiResponse({ status: 200, description: 'Image optimized successfully', type: ImageOptimizationResultDto })
  async optimizeByDocumentType(@Body() request: DocumentTypeOptimizationRequestDto): Promise<ImageOptimizationResultDto> {
    const startTime = Date.now();
    
    try {
      const imageBuffer = this.extractImageBuffer(request.imageData);
      const result = await this.imageOptimizerService.optimizeForDocumentType(imageBuffer, request.documentType);
      
      const processingTime = Date.now() - startTime;
      const optimizedImageData = `data:image/png;base64,${result.buffer.toString('base64')}`;

      return {
        optimizedImage: optimizedImageData,
        metadata: result.metadata,
        processingTime,
        appliedSettings: { documentType: request.documentType }
      };

    } catch (error) {
      this.logger.error('Document type optimization failed', error);
      throw new HttpException(`Document optimization failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('optimize-bank-statement')
  @ApiOperation({
    summary: 'Optimize image specifically for bank statements',
    description: 'Apply optimized settings for Canadian bank statement OCR'
  })
  @ApiResponse({ status: 200, description: 'Bank statement optimized successfully', type: ImageOptimizationResultDto })
  async optimizeBankStatement(@Body() request: { imageData: string }): Promise<ImageOptimizationResultDto> {
    const startTime = Date.now();
    
    try {
      const imageBuffer = this.extractImageBuffer(request.imageData);
      const result = await this.imageOptimizerService.optimizeForBankStatement(imageBuffer);
      
      const processingTime = Date.now() - startTime;
      const optimizedImageData = `data:image/png;base64,${result.buffer.toString('base64')}`;

      return {
        optimizedImage: optimizedImageData,
        metadata: result.metadata,
        processingTime,
        appliedSettings: { optimizedFor: 'bank_statement' }
      };

    } catch (error) {
      this.logger.error('Bank statement optimization failed', error);
      throw new HttpException(`Bank statement optimization failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('analyze-quality')
  @ApiOperation({
    summary: 'Analyze image quality for OCR processing',
    description: 'Evaluate image quality and provide recommendations'
  })
  @ApiResponse({ status: 200, description: 'Image quality analyzed successfully', type: ImageQualityResultDto })
  async analyzeImageQuality(@Body() request: ImageQualityAnalysisDto): Promise<ImageQualityResultDto> {
    const startTime = Date.now();
    
    try {
      const imageBuffer = this.extractImageBuffer(request.imageData);
      const result = await this.imageOptimizerService.analyzeImageQuality(imageBuffer);
      
      const analysisTime = Date.now() - startTime;

      return {
        quality: result.quality,
        recommendations: result.recommendations,
        metadata: result.metadata,
        analysisTime
      };

    } catch (error) {
      this.logger.error('Image quality analysis failed', error);
      throw new HttpException(`Image quality analysis failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private extractImageBuffer(imageData: string): Buffer {
    try {
      if (imageData.startsWith('data:')) {
        const base64Data = imageData.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid data URL format');
        }
        return Buffer.from(base64Data, 'base64');
      } else {
        return Buffer.from(imageData, 'base64');
      }
    } catch (error) {
      throw new HttpException('Invalid image data format', HttpStatus.BAD_REQUEST);
    }
  }
} 