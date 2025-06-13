import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import redisConfig from './config/redis.config';
import googleCloudConfig from './config/google-cloud.config';
import openaiConfig from './config/openai.config';
import sentryConfig from './config/sentry.config';
import emailConfig from './config/email.config';
import { RedisModule } from './redis/redis.module';
// import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { UploadValidationModule } from './upload-validation/upload-validation.module';
import { OcrModule } from './ocr/ocr.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CategorizationModule } from './categorization/categorization.module';
import { SupportModule } from './support/support.module';
import { QAModule } from './qa/qa.module';
import { StatementProcessingModule } from './statement-processing/statement-processing.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [redisConfig, googleCloudConfig, openaiConfig, sentryConfig, emailConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    RedisModule,
    // QueueModule, // Temporarily disabled  
    StorageModule,
    UploadValidationModule,
    OcrModule,
    CategorizationModule,
    SupportModule,
    QAModule,
    StatementProcessingModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
