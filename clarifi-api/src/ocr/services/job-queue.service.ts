import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  JobDto,
  JobStatus,
  JobPriority,
  CreateJobDto,
  JobQueueStatsDto,
  QueuePositionDto,
  BatchJobDto,
  BatchJobResultDto
} from '../dto/job-queue.dto';
import { OcrService } from '../ocr.service';

export interface JobProcessingResult {
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
}

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly jobs = new Map<string, JobDto>();
  private readonly processingQueue: string[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalProcessingTime: 0,
    startTime: Date.now()
  };

  constructor(
    private readonly ocrService: OcrService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Job Queue Service initialized');
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.logger.log('Job Queue Service shutting down...');
    this.stopProcessing();
  }

  /**
   * Add a new job to the queue
   */
  async addJob(createJobDto: CreateJobDto): Promise<JobDto> {
    const jobId = uuidv4();
    
    const job: JobDto = {
      id: jobId,
      status: JobStatus.PENDING,
      priority: createJobDto.priority || JobPriority.NORMAL,
      userId: createJobDto.userId,
      ocrRequest: createJobDto.ocrRequest,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      callbackUrl: createJobDto.callbackUrl,
      metadata: createJobDto.metadata,
      progress: 0
    };

    this.jobs.set(jobId, job);
    this.addToQueue(jobId);
    
    this.logger.log(`Added job ${jobId} to queue with priority ${job.priority}`);
    
    return job;
  }

  /**
   * Add multiple jobs as a batch
   */
  async addBatchJobs(batchJobDto: BatchJobDto): Promise<BatchJobResultDto> {
    const batchId = uuidv4();
    const jobIds: string[] = [];
    let totalEstimatedTime = 0;

    for (const ocrRequest of batchJobDto.ocrRequests) {
      const createJobDto: CreateJobDto = {
        ocrRequest,
        userId: batchJobDto.userId,
        priority: batchJobDto.priority,
        callbackUrl: batchJobDto.callbackUrl,
        metadata: {
          ...batchJobDto.metadata,
          batchId,
          batchSize: batchJobDto.ocrRequests.length
        }
      };

      const job = await this.addJob(createJobDto);
      jobIds.push(job.id);
      totalEstimatedTime += this.estimateProcessingTime(ocrRequest);
    }

    this.logger.log(`Created batch ${batchId} with ${jobIds.length} jobs`);

    return {
      batchId,
      jobIds,
      totalJobs: jobIds.length,
      estimatedProcessingTime: Math.ceil(totalEstimatedTime / 60000) // Convert to minutes
    };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<JobDto | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get jobs by user ID
   */
  async getUserJobs(userId: string): Promise<JobDto[]> {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  /**
   * Get job position in queue
   */
  async getQueuePosition(jobId: string): Promise<QueuePositionDto | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JobStatus.PENDING) {
      return null;
    }

    const position = this.processingQueue.indexOf(jobId);
    if (position === -1) {
      return null;
    }

    const jobsAhead = position;
    const estimatedWaitTime = this.calculateEstimatedWaitTime(position);

    return {
      jobId,
      position: position + 1, // 1-indexed for user display
      estimatedWaitTime,
      jobsAhead
    };
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === JobStatus.PROCESSING) {
      this.logger.warn(`Cannot cancel job ${jobId} - already processing`);
      return false;
    }

    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date();
    
    // Remove from queue if pending
    const queueIndex = this.processingQueue.indexOf(jobId);
    if (queueIndex !== -1) {
      this.processingQueue.splice(queueIndex, 1);
    }

    this.logger.log(`Cancelled job ${jobId}`);
    return true;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<JobQueueStatsDto> {
    const allJobs = Array.from(this.jobs.values());
    
    const pendingJobs = allJobs.filter(job => job.status === JobStatus.PENDING).length;
    const processingJobs = allJobs.filter(job => job.status === JobStatus.PROCESSING).length;
    const completedJobs = allJobs.filter(job => job.status === JobStatus.COMPLETED).length;
    const failedJobs = allJobs.filter(job => job.status === JobStatus.FAILED).length;

    const averageProcessingTime = this.stats.totalProcessed > 0 
      ? this.stats.totalProcessingTime / this.stats.totalProcessed 
      : 0;

    const uptime = Date.now() - this.stats.startTime;
    const processingRate = this.stats.totalProcessed > 0 
      ? (this.stats.totalProcessed / uptime) * 60000 // Jobs per minute
      : 0;

    const estimatedWaitTime = this.calculateEstimatedWaitTime(pendingJobs);

    return {
      totalJobs: allJobs.length,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      averageProcessingTime,
      processingRate,
      estimatedWaitTime
    };
  }

  /**
   * Clear completed and failed jobs older than specified time
   */
  async cleanupOldJobs(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
        job.completedAt &&
        job.completedAt < cutoffTime
      ) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old jobs`);
    }

    return cleanedCount;
  }

  /**
   * Add job to processing queue with priority sorting
   */
  private addToQueue(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Insert job in queue based on priority (higher priority first)
    let insertIndex = this.processingQueue.length;
    
    for (let i = 0; i < this.processingQueue.length; i++) {
      const queuedJob = this.jobs.get(this.processingQueue[i]);
      if (queuedJob && job.priority > queuedJob.priority) {
        insertIndex = i;
        break;
      }
    }

    this.processingQueue.splice(insertIndex, 0, jobId);
  }

  /**
   * Start the job processing loop
   */
  private startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 1000); // Check every second

    this.logger.log('Job processing started');
  }

  /**
   * Stop the job processing loop
   */
  private stopProcessing(): void {
    if (!this.isProcessing) return;

    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.logger.log('Job processing stopped');
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    const jobId = this.processingQueue.shift()!;
    const job = this.jobs.get(jobId);
    
    if (!job || job.status !== JobStatus.PENDING) {
      return;
    }

    try {
      await this.processJob(job);
    } catch (error) {
      this.logger.error(`Error processing job ${jobId}:`, error);
      await this.markJobFailed(job, error.message);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: JobDto): Promise<void> {
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    job.progress = 10;

    this.logger.log(`Processing job ${job.id} for user ${job.userId || 'anonymous'}`);

    const startTime = Date.now();

    try {
      // Check user quota if userId provided
      if (job.userId) {
        const hasQuota = await this.ocrService.checkUserQuota(job.userId);
        if (!hasQuota) {
          throw new Error('User quota exceeded');
        }
      }

      job.progress = 30;

      // Process the OCR request
      const result = await this.ocrService.processImage(job.ocrRequest);
      
      job.progress = 90;

      // Mark job as completed
      job.status = JobStatus.COMPLETED;
      job.result = result;
      job.completedAt = new Date();
      job.processingTime = Date.now() - startTime;
      job.progress = 100;

      // Update statistics
      this.stats.totalProcessed++;
      this.stats.totalProcessingTime += job.processingTime;

      this.logger.log(`Completed job ${job.id} in ${job.processingTime}ms`);

      // Send callback notification if provided
      if (job.callbackUrl) {
        this.sendCallbackNotification(job);
      }

    } catch (error) {
      await this.markJobFailed(job, error.message);
    }
  }

  /**
   * Mark job as failed and handle retries
   */
  private async markJobFailed(job: JobDto, errorMessage: string): Promise<void> {
    job.retryCount = (job.retryCount || 0) + 1;

    if (job.retryCount < (job.maxRetries || 3)) {
      // Retry the job
      job.status = JobStatus.PENDING;
      job.error = `Retry ${job.retryCount}: ${errorMessage}`;
      job.progress = 0;
      
      // Add back to queue with exponential backoff
      setTimeout(() => {
        this.addToQueue(job.id);
      }, Math.pow(2, job.retryCount) * 1000);

      this.logger.warn(`Job ${job.id} failed, retrying (${job.retryCount}/${job.maxRetries}): ${errorMessage}`);
    } else {
      // Max retries reached, mark as failed
      job.status = JobStatus.FAILED;
      job.error = errorMessage;
      job.completedAt = new Date();
      job.progress = 0;

      this.stats.totalFailed++;

      this.logger.error(`Job ${job.id} failed after ${job.retryCount} retries: ${errorMessage}`);

      // Send callback notification if provided
      if (job.callbackUrl) {
        this.sendCallbackNotification(job);
      }
    }
  }

  /**
   * Send webhook notification for job completion/failure
   */
  private async sendCallbackNotification(job: JobDto): Promise<void> {
    if (!job.callbackUrl) return;

    try {
      const payload = {
        jobId: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        processingTime: job.processingTime,
        completedAt: job.completedAt
      };

      // In a real implementation, you would use an HTTP client to send the webhook
      this.logger.log(`Sending callback notification for job ${job.id} to ${job.callbackUrl}`);
      
      // TODO: Implement actual HTTP callback
      // await this.httpService.post(job.callbackUrl, payload).toPromise();
      
    } catch (error) {
      this.logger.error(`Failed to send callback for job ${job.id}:`, error);
    }
  }

  /**
   * Estimate processing time for an OCR request
   */
  private estimateProcessingTime(ocrRequest: any): number {
    // Basic estimation based on image size and features
    // This is a simplified estimation - in reality, you'd use historical data
    const baseTime = 5000; // 5 seconds base
    const featureMultiplier = (ocrRequest.features?.length || 1) * 1000;
    return baseTime + featureMultiplier;
  }

  /**
   * Calculate estimated wait time based on queue position
   */
  private calculateEstimatedWaitTime(position: number): number {
    const avgProcessingTime = this.stats.totalProcessed > 0 
      ? this.stats.totalProcessingTime / this.stats.totalProcessed 
      : 10000; // Default 10 seconds

    return Math.ceil((position * avgProcessingTime) / 60000); // Convert to minutes
  }
} 