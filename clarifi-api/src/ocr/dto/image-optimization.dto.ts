import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp'
}

export enum DocumentType {
  BANK_STATEMENT = 'bank_statement',
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  GENERAL = 'general'
}

export class ImageOptimizationRequestDto {
  @ApiProperty({ description: 'Base64 encoded image data' })
  imageData: string;

  @ApiPropertyOptional({ description: 'Target DPI for optimization' })
  @IsOptional()
  @IsNumber()
  @Min(150)
  @Max(600)
  targetDpi?: number;

  @ApiPropertyOptional({ description: 'Maximum dimension in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(800)
  @Max(4000)
  maxDimension?: number;

  @ApiPropertyOptional({ description: 'Enable contrast enhancement' })
  @IsOptional()
  @IsBoolean()
  enhanceContrast?: boolean;

  @ApiPropertyOptional({ description: 'Apply sharpening filter' })
  @IsOptional()
  @IsBoolean()
  applySharpening?: boolean;

  @ApiPropertyOptional({ description: 'Apply noise reduction' })
  @IsOptional()
  @IsBoolean()
  removeNoise?: boolean;

  @ApiPropertyOptional({ description: 'Apply skew correction' })
  @IsOptional()
  @IsBoolean()
  correctSkew?: boolean;

  @ApiPropertyOptional({ description: 'Convert to binary' })
  @IsOptional()
  @IsBoolean()
  binarize?: boolean;

  @ApiPropertyOptional({ description: 'Output image format', enum: ImageFormat })
  @IsOptional()
  @IsEnum(ImageFormat)
  format?: ImageFormat;

  @ApiPropertyOptional({ description: 'Output quality (1-100)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;
}

export class DocumentTypeOptimizationRequestDto {
  @ApiProperty({ description: 'Base64 encoded image data' })
  imageData: string;

  @ApiProperty({ description: 'Type of document for optimization', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;
}

export class ImageMetadataDto {
  @ApiProperty({ description: 'Original image width in pixels' })
  originalWidth: number;

  @ApiProperty({ description: 'Original image height in pixels' })
  originalHeight: number;

  @ApiProperty({ description: 'Original image format' })
  originalFormat: string;

  @ApiProperty({ description: 'Original image file size in bytes' })
  originalSize: number;

  @ApiProperty({ description: 'Processed image width in pixels' })
  processedWidth: number;

  @ApiProperty({ description: 'Processed image height in pixels' })
  processedHeight: number;

  @ApiProperty({ description: 'Processed image file size in bytes' })
  processedSize: number;

  @ApiProperty({ description: 'Effective DPI of the processed image' })
  dpi: number;

  @ApiProperty({ description: 'Aspect ratio of the processed image' })
  aspectRatio: number;

  @ApiProperty({ description: 'Color space of the processed image' })
  colorSpace: string;
}

export class ImageOptimizationResultDto {
  @ApiProperty({ description: 'Optimized image as base64 encoded string' })
  optimizedImage: string;

  @ApiProperty({ description: 'Processing metadata', type: ImageMetadataDto })
  metadata: ImageMetadataDto;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTime: number;

  @ApiProperty({ description: 'Optimization settings applied' })
  appliedSettings: Record<string, any>;
}

export class ImageQualityAnalysisDto {
  @ApiProperty({ description: 'Base64 encoded image data' })
  imageData: string;
}

export class ImageQualityResultDto {
  @ApiProperty({ description: 'Overall image quality assessment', enum: ['excellent', 'good', 'fair', 'poor'] })
  quality: 'excellent' | 'good' | 'fair' | 'poor';

  @ApiProperty({ description: 'Recommendations for improvement', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Image metadata and analysis', type: ImageMetadataDto })
  metadata: Partial<ImageMetadataDto>;

  @ApiProperty({ description: 'Analysis processing time in milliseconds' })
  analysisTime: number;
} 