import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobQueueService } from '../services/job-queue.service';
import {
  CreateJobDto,
  JobDto,
  JobQueueStatsDto,
  QueuePositionDto,
  BatchJobDto,
  BatchJobResultDto
} from '../dto/job-queue.dto';

@ApiTags('OCR Job Queue')
@Controller('ocr/queue')
export class JobQueueController {
  private readonly logger = new Logger(JobQueueController.name);

  constructor(private readonly jobQueueService: JobQueueService) {}

  @Post('job')
  @ApiOperation({ 
    summary: 'Submit OCR job to queue',
    description: 'Add a new OCR processing job to the queue for asynchronous processing'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Job added to queue successfully',
    type: JobDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid job request'
  })
  @HttpCode(HttpStatus.CREATED)
  async submitJob(@Body() createJobDto: CreateJobDto): Promise<JobDto> {
    this.logger.log(`Submitting new OCR job for user: ${createJobDto.userId || 'anonymous'}`);
    
    try {
      const job = await this.jobQueueService.addJob(createJobDto);
      
      this.logger.log(`Job ${job.id} submitted successfully with priority ${job.priority}`);
      
      return job;
    } catch (error) {
      this.logger.error('Failed to submit job', error);
      throw new BadRequestException('Failed to submit job to queue');
    }
  }

  @Post('batch')
  @ApiOperation({ 
    summary: 'Submit batch OCR jobs',
    description: 'Submit multiple OCR processing jobs as a batch for improved efficiency'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Batch jobs added to queue successfully',
    type: BatchJobResultDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid batch request'
  })
  @HttpCode(HttpStatus.CREATED)
  async submitBatchJobs(@Body() batchJobDto: BatchJobDto): Promise<BatchJobResultDto> {
    this.logger.log(`Submitting batch of ${batchJobDto.ocrRequests.length} OCR jobs`);
    
    if (!batchJobDto.ocrRequests || batchJobDto.ocrRequests.length === 0) {
      throw new BadRequestException('Batch must contain at least one OCR request');
    }

    if (batchJobDto.ocrRequests.length > 50) {
      throw new BadRequestException('Batch size cannot exceed 50 jobs');
    }

    try {
      const result = await this.jobQueueService.addBatchJobs(batchJobDto);
      
      this.logger.log(`Batch ${result.batchId} with ${result.totalJobs} jobs submitted successfully`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to submit batch jobs', error);
      throw new BadRequestException('Failed to submit batch jobs to queue');
    }
  }

  @Get('job/:jobId')
  @ApiOperation({ 
    summary: 'Get job status and result',
    description: 'Retrieve the current status and result of a specific OCR job'
  })
  @ApiParam({ 
    name: 'jobId', 
    description: 'Unique job identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Job details retrieved successfully',
    type: JobDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Job not found'
  })
  async getJob(@Param('jobId', ParseUUIDPipe) jobId: string): Promise<JobDto> {
    this.logger.log(`Retrieving job details for: ${jobId}`);
    
    const job = await this.jobQueueService.getJob(jobId);
    
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    return job;
  }

  @Get('job/:jobId/position')
  @ApiOperation({ 
    summary: 'Get job queue position',
    description: 'Get the current position of a job in the processing queue'
  })
  @ApiParam({ 
    name: 'jobId', 
    description: 'Unique job identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue position retrieved successfully',
    type: QueuePositionDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Job not found or not in queue'
  })
  async getJobPosition(@Param('jobId', ParseUUIDPipe) jobId: string): Promise<QueuePositionDto> {
    this.logger.log(`Retrieving queue position for job: ${jobId}`);
    
    const position = await this.jobQueueService.getQueuePosition(jobId);
    
    if (!position) {
      throw new NotFoundException(`Job ${jobId} not found in queue or not pending`);
    }

    return position;
  }

  @Get('user/:userId/jobs')
  @ApiOperation({ 
    summary: 'Get user jobs',
    description: 'Retrieve all jobs submitted by a specific user'
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'User identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User jobs retrieved successfully',
    type: [JobDto]
  })
  async getUserJobs(@Param('userId', ParseUUIDPipe) userId: string): Promise<JobDto[]> {
    this.logger.log(`Retrieving jobs for user: ${userId}`);
    
    const jobs = await this.jobQueueService.getUserJobs(userId);
    
    return jobs;
  }

  @Delete('job/:jobId')
  @ApiOperation({ 
    summary: 'Cancel job',
    description: 'Cancel a pending job in the queue (cannot cancel jobs that are already processing)'
  })
  @ApiParam({ 
    name: 'jobId', 
    description: 'Unique job identifier',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Job cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        jobId: { type: 'string' },
        cancelled: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Job not found'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Job cannot be cancelled'
  })
  async cancelJob(@Param('jobId', ParseUUIDPipe) jobId: string): Promise<{
    message: string;
    jobId: string;
    cancelled: boolean;
  }> {
    this.logger.log(`Attempting to cancel job: ${jobId}`);
    
    const job = await this.jobQueueService.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const cancelled = await this.jobQueueService.cancelJob(jobId);
    
    if (!cancelled) {
      throw new BadRequestException('Job cannot be cancelled (may already be processing or completed)');
    }

    this.logger.log(`Job ${jobId} cancelled successfully`);

    return {
      message: 'Job cancelled successfully',
      jobId,
      cancelled: true
    };
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get queue statistics',
    description: 'Retrieve current queue statistics including job counts, processing rate, and wait times'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue statistics retrieved successfully',
    type: JobQueueStatsDto 
  })
  async getQueueStats(): Promise<JobQueueStatsDto> {
    this.logger.log('Retrieving queue statistics');
    
    const stats = await this.jobQueueService.getQueueStats();
    
    return stats;
  }

  @Post('cleanup')
  @ApiOperation({ 
    summary: 'Cleanup old jobs',
    description: 'Remove completed and failed jobs older than specified time (default: 24 hours)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cleanup completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        jobsRemoved: { type: 'number' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async cleanupOldJobs(@Body('olderThanHours') olderThanHours?: number): Promise<{
    message: string;
    jobsRemoved: number;
  }> {
    const hours = olderThanHours || 24;
    
    this.logger.log(`Cleaning up jobs older than ${hours} hours`);
    
    const jobsRemoved = await this.jobQueueService.cleanupOldJobs(hours);
    
    this.logger.log(`Cleanup completed: ${jobsRemoved} jobs removed`);

    return {
      message: `Cleanup completed successfully`,
      jobsRemoved
    };
  }
} 