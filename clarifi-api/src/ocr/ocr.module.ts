import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { JobQueueService } from './services/job-queue.service';
import { JobQueueController } from './controllers/job-queue.controller';
import { ImageOptimizerService } from './services/image-optimizer.service';
import { ImageOptimizationController } from './controllers/image-optimization.controller';
import { TextParserService } from './services/text-parser.service';
import { BankStatementParserService } from './services/bank-statement-parser.service';
import { TextParsingController } from './controllers/text-parsing.controller';
import { StorageModule } from '../storage/storage.module';
import { RetryHandlerService } from './common/retry-handler.service';
import { EnhancedOcrService } from './services/enhanced-ocr.service';
import { ErrorMonitoringController } from './controllers/error-monitoring.controller';
import { ApiUsageMonitorService } from './services/api-usage-monitor.service';
import { MonitoredOcrService } from './services/monitored-ocr.service';
import { MonitoringDashboardController } from './controllers/monitoring-dashboard.controller';
import { OcrCacheService } from './services/ocr-cache.service';
import { CostOptimizerService } from './services/cost-optimizer.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    StorageModule,
    MulterModule.register({
      storage: 'memory', // Use memory storage for cloud upload integration
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for large documents
        files: 1, // One file at a time
      },
      fileFilter: (req, file, callback) => {
        // Allow image and PDF files
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/bmp',
          'image/tiff',
          'application/pdf'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  ],
  controllers: [
    OcrController, 
    JobQueueController, 
    ImageOptimizationController, 
    TextParsingController,
    ErrorMonitoringController,
    MonitoringDashboardController
  ],
  providers: [
    OcrService, 
    JobQueueService, 
    ImageOptimizerService, 
    TextParserService, 
    BankStatementParserService,
    RetryHandlerService,
    EnhancedOcrService,
    ApiUsageMonitorService,
    MonitoredOcrService,
    OcrCacheService,
    CostOptimizerService
  ],
  exports: [
    OcrService, 
    JobQueueService, 
    ImageOptimizerService, 
    TextParserService, 
    BankStatementParserService,
    RetryHandlerService,
    EnhancedOcrService,
    ApiUsageMonitorService,
    MonitoredOcrService,
    OcrCacheService,
    CostOptimizerService
  ], // Export services for use in other modules
})
export class OcrModule {} 