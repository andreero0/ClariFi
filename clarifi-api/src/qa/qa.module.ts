import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QACacheService } from './qa-cache.service';
import { QALLMService } from './qa-llm.service';
import { QAQueryLimitService } from './qa-query-limit.service';
import { QAController } from './qa.controller';
import { QAAdminController } from './qa-admin.controller';
import { QADashboardController } from './qa-dashboard.controller';
import { QAMonitoringService } from './qa-monitoring.service';
import { QASuggestionsService } from './qa-suggestions.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule, // Required for OpenAI API calls
    RedisModule, // Required for Redis caching functionality
    PrismaModule, // Required for user profile queries
  ],
  controllers: [
    QAController,
    QAAdminController,
    QADashboardController,
  ],
  providers: [
    QACacheService,
    QALLMService,
    QAQueryLimitService,
    QAMonitoringService,
    QASuggestionsService,
  ],
  exports: [
    QACacheService,
    QALLMService,
    QAQueryLimitService,
    QAMonitoringService,
    QASuggestionsService,
  ],
})
export class QAModule {} 