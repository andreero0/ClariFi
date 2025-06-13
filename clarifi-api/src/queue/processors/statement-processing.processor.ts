import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { STATEMENT_PROCESSING_QUEUE, StatementProcessingJobData } from '../queue.types';

@Processor(STATEMENT_PROCESSING_QUEUE)
export class StatementProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(StatementProcessingProcessor.name);

  constructor() {
    super();
    // Inject services needed for statement processing here
    // e.g., private readonly ocrService: OcrService,
    //        private readonly transactionExtractionService: TransactionExtractionService
    this.logger.log(`Initialized processor for queue: ${STATEMENT_PROCESSING_QUEUE}`);
  }

  async process(job: Job<StatementProcessingJobData, any, string>) {
    this.logger.log(`Processing job ${job.id} (name: ${job.name}) from ${STATEMENT_PROCESSING_QUEUE} queue.`);
    this.logger.log('Job Data:', JSON.stringify(job.data, null, 2));

    const { userId, statementImportId, fileKey, bankName } = job.data;

    try {
      this.logger.log(`Starting OCR and data extraction for file: ${fileKey} (bank: ${bankName}) for user ${userId}.`);
      await job.updateProgress(10);

      // Simulate OCR processing
      // For example, call OCR service to extract text from the file at fileKey
      this.logger.log(`Simulating OCR for file: ${fileKey}`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
      await job.updateProgress(50);

      // Simulate transaction extraction from OCR data
      this.logger.log(`Extracting transactions from OCR data for statement: ${statementImportId}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate extraction time
      await job.updateProgress(80);

      // Simulate storing transactions to database
      this.logger.log(`Storing transactions to database for user: ${userId}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate DB operations
      await job.updateProgress(100);

      this.logger.log(`Statement processing completed for job ${job.id}.`);

      return { success: true, message: `Processing for statement ${statementImportId} completed.` };

    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Rethrow to let BullMQ handle it as a failed job
    }
  }
} 