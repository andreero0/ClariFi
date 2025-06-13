import { Module } from '@nestjs/common';
import { StatementProcessingService } from './statement-processing.service';
import { StatementProcessingController } from './statement-processing.controller';
import { AuthModule } from '../auth/auth.module';
import { OcrModule } from '../ocr/ocr.module';
import { CategorizationModule } from '../categorization/categorization.module';
import { StorageModule } from '../storage/storage.module';
import { UploadValidationModule } from '../upload-validation/upload-validation.module';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    OcrModule,
    CategorizationModule,
    StorageModule,
    UploadValidationModule,
    QueueModule,
    PrismaModule,
  ],
  controllers: [StatementProcessingController],
  providers: [StatementProcessingService],
  exports: [StatementProcessingService],
})
export class StatementProcessingModule {}