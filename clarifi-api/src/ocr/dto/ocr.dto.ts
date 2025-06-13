import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum OcrImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  PDF = 'pdf',
  WEBP = 'webp',
  BMP = 'bmp',
  TIFF = 'tiff'
}

export enum OcrJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum OcrFeatureType {
  TEXT_DETECTION = 'TEXT_DETECTION',
  DOCUMENT_TEXT_DETECTION = 'DOCUMENT_TEXT_DETECTION',
  LOGO_DETECTION = 'LOGO_DETECTION',
  LABEL_DETECTION = 'LABEL_DETECTION'
}

export class OcrBoundingBoxDto {
  @ApiProperty({ description: 'X coordinate of the top-left corner' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y coordinate of the top-left corner' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'Width of the bounding box' })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Height of the bounding box' })
  @IsNumber()
  height: number;
}

export class OcrTextBlockDto {
  @ApiProperty({ description: 'Extracted text content' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Bounding box coordinates', type: OcrBoundingBoxDto })
  @ValidateNested()
  @Type(() => OcrBoundingBoxDto)
  boundingBox: OcrBoundingBoxDto;

  @ApiProperty({ description: 'Page number (for multi-page documents)', required: false })
  @IsOptional()
  @IsNumber()
  pageNumber?: number;

  @ApiProperty({ description: 'Block type (paragraph, line, word)', required: false })
  @IsOptional()
  @IsString()
  blockType?: string;
}

export class OcrRequestDto {
  @ApiProperty({ description: 'Image file to process (base64 encoded or file path)' })
  @IsString()
  imageData: string;

  @ApiProperty({ description: 'Image format', enum: OcrImageFormat })
  @IsEnum(OcrImageFormat)
  format: OcrImageFormat;

  @ApiProperty({ description: 'Features to extract', enum: OcrFeatureType, isArray: true })
  @IsArray()
  @IsEnum(OcrFeatureType, { each: true })
  features: OcrFeatureType[];

  @ApiProperty({ description: 'Language hints for OCR', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languageHints?: string[];

  @ApiProperty({ description: 'Enable image preprocessing', default: true })
  @IsOptional()
  @IsBoolean()
  enablePreprocessing?: boolean;

  @ApiProperty({ description: 'Enable auto-rotation detection', default: true })
  @IsOptional()
  @IsBoolean()
  enableAutoRotation?: boolean;

  @ApiProperty({ description: 'Job priority (1-10, higher = more priority)', default: 5 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'User ID for tracking', required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class OcrResultDto {
  @ApiProperty({ description: 'Job ID for tracking' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Job status', enum: OcrJobStatus })
  @IsEnum(OcrJobStatus)
  status: OcrJobStatus;

  @ApiProperty({ description: 'Extracted text blocks', type: [OcrTextBlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OcrTextBlockDto)
  textBlocks: OcrTextBlockDto[];

  @ApiProperty({ description: 'Full extracted text' })
  @IsString()
  fullText: string;

  @ApiProperty({ description: 'Overall confidence score' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  @IsNumber()
  processingTime: number;

  @ApiProperty({ description: 'API cost for this operation' })
  @IsNumber()
  apiCost: number;

  @ApiProperty({ description: 'Number of pages processed' })
  @IsNumber()
  pageCount: number;

  @ApiProperty({ description: 'Image dimensions', required: false })
  @IsOptional()
  imageDimensions?: {
    width: number;
    height: number;
  };

  @ApiProperty({ description: 'Error message if processing failed', required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Completed timestamp', required: false })
  @IsOptional()
  completedAt?: Date;

  @ApiProperty({ description: 'Processing warnings or notices', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];
}

export class OcrJobDto {
  @ApiProperty({ description: 'Unique job identifier' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'User ID who submitted the job' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Current job status', enum: OcrJobStatus })
  @IsEnum(OcrJobStatus)
  status: OcrJobStatus;

  @ApiProperty({ description: 'Job priority (1-10)' })
  @IsNumber()
  priority: number;

  @ApiProperty({ description: 'Original request parameters', type: OcrRequestDto })
  @ValidateNested()
  @Type(() => OcrRequestDto)
  request: OcrRequestDto;

  @ApiProperty({ description: 'Processing result', type: OcrResultDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => OcrResultDto)
  result?: OcrResultDto;

  @ApiProperty({ description: 'Number of retry attempts' })
  @IsNumber()
  retryCount: number;

  @ApiProperty({ description: 'Maximum retry attempts allowed' })
  @IsNumber()
  maxRetries: number;

  @ApiProperty({ description: 'Next retry attempt timestamp', required: false })
  @IsOptional()
  nextRetryAt?: Date;

  @ApiProperty({ description: 'Job created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Job updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Job started processing timestamp', required: false })
  @IsOptional()
  startedAt?: Date;

  @ApiProperty({ description: 'Job completed timestamp', required: false })
  @IsOptional()
  completedAt?: Date;
}

export class OcrBatchRequestDto {
  @ApiProperty({ description: 'List of OCR requests to process', type: [OcrRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OcrRequestDto)
  requests: OcrRequestDto[];

  @ApiProperty({ description: 'Batch processing priority', default: 5 })
  @IsOptional()
  @IsNumber()
  batchPriority?: number;

  @ApiProperty({ description: 'Enable parallel processing', default: true })
  @IsOptional()
  @IsBoolean()
  enableParallelProcessing?: boolean;
}

export class OcrBatchResultDto {
  @ApiProperty({ description: 'Batch job ID' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ description: 'Individual job results', type: [OcrResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OcrResultDto)
  results: OcrResultDto[];

  @ApiProperty({ description: 'Total processing time for batch' })
  @IsNumber()
  totalProcessingTime: number;

  @ApiProperty({ description: 'Total API cost for batch' })
  @IsNumber()
  totalApiCost: number;

  @ApiProperty({ description: 'Number of successful jobs' })
  @IsNumber()
  successCount: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  @IsNumber()
  failureCount: number;

  @ApiProperty({ description: 'Batch created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Batch completed timestamp' })
  completedAt: Date;
}

export class OcrUsageStatsDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Total API calls made' })
  @IsNumber()
  totalApiCalls: number;

  @ApiProperty({ description: 'Total API cost incurred' })
  @IsNumber()
  totalApiCost: number;

  @ApiProperty({ description: 'Total images processed' })
  @IsNumber()
  totalImagesProcessed: number;

  @ApiProperty({ description: 'Total pages processed' })
  @IsNumber()
  totalPagesProcessed: number;

  @ApiProperty({ description: 'Average processing time per image' })
  @IsNumber()
  averageProcessingTime: number;

  @ApiProperty({ description: 'Success rate percentage' })
  @IsNumber()
  successRate: number;

  @ApiProperty({ description: 'Current month usage count' })
  @IsNumber()
  currentMonthUsage: number;

  @ApiProperty({ description: 'Remaining quota for current month' })
  @IsNumber()
  remainingQuota: number;

  @ApiProperty({ description: 'Stats period start date' })
  periodStartDate: Date;

  @ApiProperty({ description: 'Stats period end date' })
  periodEndDate: Date;
}

export class ProcessImageRequestDto {
  @ApiProperty({ description: 'Image file', type: 'string', format: 'binary' })
  file: Express.Multer.File;

  @ApiProperty({ description: 'Processing options', required: false })
  @IsOptional()
  @IsString()
  options?: string; // JSON string of processing options
}

export class ProcessImageResponseDto {
  @ApiProperty({ description: 'Job ID for tracking the OCR process' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Current status of the job', enum: OcrJobStatus })
  @IsEnum(OcrJobStatus)
  status: OcrJobStatus;

  @ApiProperty({ description: 'Message describing the current state' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Estimated processing time in seconds' })
  @IsNumber()
  estimatedProcessingTime: number;

  @ApiProperty({ description: 'Queue position if job is pending' })
  @IsOptional()
  @IsNumber()
  queuePosition?: number;

  @ApiProperty({ description: 'Temporary file ID for tracking storage lifecycle' })
  @IsOptional()
  @IsUUID()
  temporaryFileId?: string;

  @ApiProperty({ description: 'Cloud storage URL for the uploaded image' })
  @IsOptional()
  @IsString()
  storageUrl?: string;

  @ApiProperty({ description: 'Cloud storage URL for the OCR results JSON' })
  @IsOptional()
  @IsString()
  ocrResultUrl?: string;

  @ApiProperty({ description: 'Extracted text from the image' })
  @IsOptional()
  @IsString()
  extractedText?: string;

  @ApiProperty({ description: 'Detected language of the text' })
  @IsOptional()
  @IsString()
  detectedLanguage?: string;

  @ApiProperty({ description: 'Named entities found in the text' })
  @IsOptional()
  @IsArray()
  entities?: any[];

  @ApiProperty({ description: 'Keywords extracted from the text' })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @ApiProperty({ description: 'Processing warnings or notices' })
  @IsOptional()
  @IsArray()
  warnings?: string[];
} 