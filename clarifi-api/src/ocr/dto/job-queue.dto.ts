import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsObject, IsArray, IsUUID, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  URGENT = 10
}

export class CreateJobDto {
  @ApiProperty({ description: 'OCR request data' })
  @IsObject()
  ocrRequest: any;

  @ApiPropertyOptional({ description: 'User ID for quota tracking' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Job priority level',
    enum: JobPriority,
    default: JobPriority.NORMAL
  })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({ description: 'Optional callback URL for job completion notification' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Job metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class JobDto {
  @ApiProperty({ description: 'Unique job identifier' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Current job status', enum: JobStatus })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiProperty({ description: 'Job priority', enum: JobPriority })
  @IsEnum(JobPriority)
  priority: JobPriority;

  @ApiPropertyOptional({ description: 'User ID associated with this job' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'OCR request data' })
  @IsObject()
  ocrRequest: any;

  @ApiPropertyOptional({ description: 'OCR processing result' })
  @IsOptional()
  @IsObject()
  result?: any;

  @ApiPropertyOptional({ description: 'Error message if job failed' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: 'Job progress percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiProperty({ description: 'Job creation timestamp' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Job processing start timestamp' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Job completion timestamp' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Processing time in milliseconds' })
  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @ApiPropertyOptional({ description: 'Number of retry attempts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  retryCount?: number;

  @ApiPropertyOptional({ description: 'Maximum retry attempts allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRetries?: number;

  @ApiPropertyOptional({ description: 'Callback URL for completion notification' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Job metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class JobQueueStatsDto {
  @ApiProperty({ description: 'Total number of jobs in queue' })
  @IsNumber()
  totalJobs: number;

  @ApiProperty({ description: 'Number of pending jobs' })
  @IsNumber()
  pendingJobs: number;

  @ApiProperty({ description: 'Number of jobs currently processing' })
  @IsNumber()
  processingJobs: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  @IsNumber()
  completedJobs: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  @IsNumber()
  failedJobs: number;

  @ApiProperty({ description: 'Average processing time in milliseconds' })
  @IsNumber()
  averageProcessingTime: number;

  @ApiProperty({ description: 'Current queue processing rate (jobs per minute)' })
  @IsNumber()
  processingRate: number;

  @ApiProperty({ description: 'Estimated wait time for new jobs in minutes' })
  @IsNumber()
  estimatedWaitTime: number;
}

export class QueuePositionDto {
  @ApiProperty({ description: 'Job ID' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Current position in queue' })
  @IsNumber()
  @Min(0)
  position: number;

  @ApiProperty({ description: 'Estimated wait time in minutes' })
  @IsNumber()
  estimatedWaitTime: number;

  @ApiProperty({ description: 'Jobs ahead in queue' })
  @IsNumber()
  @Min(0)
  jobsAhead: number;
}

export class BatchJobDto {
  @ApiProperty({ description: 'Array of OCR requests to process' })
  @IsArray()
  @IsObject({ each: true })
  ocrRequests: any[];

  @ApiPropertyOptional({ description: 'User ID for quota tracking' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Batch priority level',
    enum: JobPriority,
    default: JobPriority.NORMAL
  })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({ description: 'Optional callback URL for batch completion notification' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Batch metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BatchJobResultDto {
  @ApiProperty({ description: 'Batch identifier' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ description: 'Array of job IDs created for this batch' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  jobIds: string[];

  @ApiProperty({ description: 'Total number of jobs in batch' })
  @IsNumber()
  totalJobs: number;

  @ApiProperty({ description: 'Estimated total processing time in minutes' })
  @IsNumber()
  estimatedProcessingTime: number;
} 