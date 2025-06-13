import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { 
  STATEMENT_PROCESSING_QUEUE, 
  AI_CATEGORIZATION_QUEUE,
  StatementProcessingJobData,
  AiCategorizationJobData
} from './queue.types';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(STATEMENT_PROCESSING_QUEUE) 
    private statementProcessingQueue: Queue<StatementProcessingJobData, any, string>,
    @InjectQueue(AI_CATEGORIZATION_QUEUE) 
    private aiCategorizationQueue: Queue<AiCategorizationJobData, any, string>,
  ) {
    this.logger.log('QueueService initialized with specific queues.');
  }

  async addStatementProcessingJob(
    data: StatementProcessingJobData,
    jobId?: string, // Optional: for idempotent jobs or specific tracking
  ) {
    try {
      const job = await this.statementProcessingQueue.add('process-bank-statement', data, {
        jobId: jobId,
        // Default job options (attempts, backoff, etc.) are inherited from QueueModule
        // but can be overridden here if needed for specific jobs.
      });
      this.logger.log(`Added job ${job.id} (name: ${job.name}) to ${STATEMENT_PROCESSING_QUEUE} queue for statementImportId: ${data.statementImportId}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to ${STATEMENT_PROCESSING_QUEUE} queue`, error);
      throw error;
    }
  }

  async addAiCategorizationJob(
    data: AiCategorizationJobData,
    jobId?: string, // Optional jobId
  ) {
    try {
      const job = await this.aiCategorizationQueue.add('categorize-transactions', data, {
        jobId: jobId,
      });
      this.logger.log(`Added job ${job.id} (name: ${job.name}) to ${AI_CATEGORIZATION_QUEUE} queue for user: ${data.userId}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to ${AI_CATEGORIZATION_QUEUE} queue`, error);
      throw error;
    }
  }

  // --- Utility methods for queue health or specific queue operations (optional) ---
  async getQueueCounts(queueName: string) {
    let queue: Queue;
    if (queueName === STATEMENT_PROCESSING_QUEUE) {
      queue = this.statementProcessingQueue;
    } else if (queueName === AI_CATEGORIZATION_QUEUE) {
      queue = this.aiCategorizationQueue;
    } else {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
  }
} 