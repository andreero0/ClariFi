import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CategorizationService } from './categorization.service';
import { CategorizationCacheService } from './categorization-cache.service';
import { RuleBasedCategorizationService } from './rule-based-categorization.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { CategorizationController } from './categorization.controller';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FeedbackService } from './feedback.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitoringService } from './monitoring.service';
import { AlertingService } from './alerting.service';
import { ValidationService } from './validation.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    RedisModule, // Required for cache service and performance monitoring
    PrismaModule,
    AuthModule, // Required for AuthGuard to access AuthService
    ScheduleModule.forRoot(), // Required for scheduled monitoring
  ],
  controllers: [CategorizationController],
  providers: [
    CategorizationService, 
    CategorizationCacheService, 
    RuleBasedCategorizationService,
    PerformanceMonitorService,
    FeedbackService,
    MonitoringService,
    AlertingService,
    ValidationService,
  ],
  exports: [
    CategorizationService,
    CategorizationCacheService,
    RuleBasedCategorizationService,
    PerformanceMonitorService,
    FeedbackService,
    MonitoringService,
    AlertingService,
    ValidationService,
  ],
})
export class CategorizationModule {} 