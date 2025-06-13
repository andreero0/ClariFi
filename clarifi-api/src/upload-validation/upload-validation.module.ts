import { Module } from "@nestjs/common";
import { UploadValidationService } from "./upload-validation.service";
import { PdfProcessorService } from "./pdf-processor.service";
import { SupabaseModule } from "../supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  providers: [UploadValidationService, PdfProcessorService],
  exports: [UploadValidationService, PdfProcessorService],
})
export class UploadValidationModule {}
