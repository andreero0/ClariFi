import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { TemporaryFileManagerService } from './temporary-file-manager.service';
import { UploadValidationModule } from '../upload-validation/upload-validation.module';
// SupabaseModule and ConfigModule are global, so they are available

@Module({
  imports: [UploadValidationModule, ScheduleModule.forRoot()],
  controllers: [StorageController],
  providers: [StorageService, TemporaryFileManagerService],
  exports: [StorageService, TemporaryFileManagerService], // Export if other modules need to use it directly
})
export class StorageModule {} 