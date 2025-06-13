import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';
import { QueueService } from './queue.service';
import { StatementProcessingProcessor } from './processors/statement-processing.processor';
import { AiCategorizationProcessor } from './processors/ai-categorization.processor';
import { STATEMENT_PROCESSING_QUEUE, AI_CATEGORIZATION_QUEUE } from './queue.types';
import { CategorizationModule } from '../categorization/categorization.module';

// Bull Board imports
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    ConfigModule,
    CategorizationModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url');
        
        // Fallback to local Redis for development
        const fallbackUrl = redisUrl || 'redis://localhost:6379';
        
        let host = 'localhost';
        let port = 6379;
        let password: string | undefined = undefined;
        let tls = {};
        
        try {
          const url = new URL(fallbackUrl);
          host = url.hostname;
          port = url.port ? parseInt(url.port) : 6379;
          password = url.password ? url.password : undefined;
          if (url.protocol === 'rediss:') {
            tls = { rejectUnauthorized: false };
          }
        } catch (e) {
          // If URL parsing fails, use defaults
          console.warn('Using fallback Redis configuration for development');
          host = 'localhost';
          port = 6379;
          password = undefined;
          tls = {};
        }
        
        return {
          connection: {
            host: host,
            port: port,
            password: password,
            tls: tls,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
            retryDelayOnFailover: 100,
            enableOfflineQueue: false,
          } as RedisOptions,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 1000, age: 24 * 3600 },
            removeOnFail: { count: 5000, age: 7 * 24 * 3600 },
          },
        };
      },
      inject: [ConfigService],
    }),
    // Register specific queues that will be processed by workers in this application
    BullModule.registerQueue(
      {
        name: STATEMENT_PROCESSING_QUEUE,
      },
      {
        name: AI_CATEGORIZATION_QUEUE,
      },
    ),
    // Bull Board UI Setup
    BullBoardModule.forRoot({
      route: '/admin/queues', // Endpoint to access the Bull Board UI
      adapter: ExpressAdapter, // Specify the Express adapter
      // Optional: Add authentication middleware here for the UI endpoint
    }),
    // Register queues with Bull Board so they appear in the UI
    BullBoardModule.forFeature(
      {
        name: STATEMENT_PROCESSING_QUEUE,
        adapter: BullMQAdapter, // Each queue needs its own adapter instance
      },
      {
        name: AI_CATEGORIZATION_QUEUE,
        adapter: BullMQAdapter,
      },
    ),
  ],
  providers: [
    QueueService,
    StatementProcessingProcessor,
    AiCategorizationProcessor,
  ],
  exports: [BullModule, QueueService], // Export BullModule if other modules need to inject queues directly
})
export class QueueModule {} 