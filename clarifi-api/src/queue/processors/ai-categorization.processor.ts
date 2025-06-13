import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AI_CATEGORIZATION_QUEUE, AiCategorizationJobData } from '../queue.types';
import { CategorizationService } from '../../categorization/categorization.service'; // Adjusted path

@Processor(AI_CATEGORIZATION_QUEUE)
export class AiCategorizationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiCategorizationProcessor.name);

  constructor(
    private readonly categorizationService: CategorizationService, // Injected CategorizationService
  ) {
    super(); // Call super() for WorkerHost
    this.logger.log(`Initialized processor for queue: ${AI_CATEGORIZATION_QUEUE}`);
  }

  async process(job: Job<AiCategorizationJobData, any, string>): Promise<any> { // Changed method name to process for WorkerHost
    this.logger.log(`Processing job ${job.id} (name: ${job.name}) from ${AI_CATEGORIZATION_QUEUE} queue.`);
    this.logger.log('Job Data:', JSON.stringify(job.data, null, 2));

    const { userId, transactions } = job.data;

    try {
      this.logger.log(`Starting AI categorization for ${transactions.length} transactions for user ${userId}.`);
      await job.updateProgress(10);

      // Call the actual categorization service
      const categorizedResults = await this.categorizationService.categorizeTransactions(transactions);
      
      this.logger.log(`Categorization service returned ${categorizedResults.length} results.`);
      // TODO: Further processing of categorizedResults (e.g., save to database, notify user)
      // For now, we can log them or include them in the job's return value.

      await job.updateProgress(100);
      this.logger.log(`AI categorization completed for job ${job.id}.`);

      return {
        success: true,
        message: `AI categorization for user ${userId} completed. Processed ${categorizedResults.length} transactions.`,
        data: categorizedResults, // Optionally return the data
      };

    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      // Ensure the error is rethrown so BullMQ handles it as a failed job
      // and respects retry strategies if configured.
      throw error; 
    }
  }
} 