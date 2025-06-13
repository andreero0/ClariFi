import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as pdfParse from 'pdf-parse';
import { SupabaseService } from '../supabase/supabase.service'; // Assuming path
import { ValidationResultDto, ValidationErrorCode, FileDimensionDto } from './dto/validation.dto';

const MIN_FILE_SIZE_BYTES = 1024; // 1KB, example threshold for blank/empty file
const MIN_IMAGE_WIDTH = 600;
const MIN_IMAGE_HEIGHT = 600;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/csv',
];

@Injectable()
export class UploadValidationService {
  private readonly logger = new Logger(UploadValidationService.name);
  private readonly DEFAULT_BUCKET = 'statement-uploads'; // Added default bucket

  constructor(private readonly supabaseService: SupabaseService) {}

  async validateFile(
    filePathInBucket: string,
    originalMimeType: string,
    originalFileName: string,
  ): Promise<ValidationResultDto> {
    this.logger.log(
      `Starting validation for file: ${filePathInBucket}, original name: ${originalFileName}, mime: ${originalMimeType}`,
    );

    let fileBuffer: Buffer;
    try {
      fileBuffer = await this.supabaseService.downloadFileAsBuffer(this.DEFAULT_BUCKET, filePathInBucket);
      this.logger.log(`Successfully downloaded file ${filePathInBucket} from bucket ${this.DEFAULT_BUCKET}`);
    } catch (error) {
      this.logger.error(`Failed to download file ${filePathInBucket} from Supabase bucket ${this.DEFAULT_BUCKET}: ${error.message}`, error.stack);
      return {
        isValid: false,
        errorCode: ValidationErrorCode.FILE_NOT_FOUND,
        message: `Failed to retrieve file from storage: ${error.message}`,
      };
    }
    
    if (!fileBuffer || fileBuffer.length < MIN_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        errorCode: ValidationErrorCode.FILE_TOO_SMALL,
        message: `File is too small (less than ${MIN_FILE_SIZE_BYTES} bytes), possibly empty or corrupt.`,
      };
    }

    // Basic MIME type check from originalMimeType, can be enhanced by libraries like 'file-type' from buffer
    if (!ALLOWED_MIME_TYPES.includes(originalMimeType)) {
      return {
        isValid: false,
        errorCode: ValidationErrorCode.UNSUPPORTED_FILE_TYPE,
        message: `Unsupported file type: ${originalMimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        validatedMimeType: originalMimeType, // Reflect what was provided
      };
    }

    try {
      if (originalMimeType.startsWith('image/')) {
        return await this.validateImage(fileBuffer, originalMimeType);
      } else if (originalMimeType === 'application/pdf') {
        return await this.validatePdf(fileBuffer);
      } else if (originalMimeType === 'text/csv') {
        return this.validateCsv(fileBuffer, originalFileName);
      } else {
        // Should have been caught by ALLOWED_MIME_TYPES check, but as a safeguard:
        return {
          isValid: false,
          errorCode: ValidationErrorCode.UNSUPPORTED_FILE_TYPE,
          message: `File type ${originalMimeType} processing not implemented.`,
        };
      }
    } catch (processingError) {
      this.logger.error(`Error processing file ${originalFileName} (${originalMimeType}): ${processingError.message}`, processingError.stack);
      return {
        isValid: false,
        errorCode: ValidationErrorCode.FILE_PROCESSING_ERROR,
        message: `Failed to process file: ${processingError.message}`,
      };
    }
  }

  private async validateImage(fileBuffer: Buffer, mimeType: string): Promise<ValidationResultDto> {
    try {
      const metadata = await sharp(fileBuffer).metadata();
      const dimensions: FileDimensionDto = { width: metadata.width, height: metadata.height };

      if (!metadata.width || !metadata.height || metadata.width < MIN_IMAGE_WIDTH || metadata.height < MIN_IMAGE_HEIGHT) {
        return {
          isValid: false,
          errorCode: ValidationErrorCode.IMAGE_RESOLUTION_TOO_LOW,
          message: `Image resolution (${metadata.width}x${metadata.height}) is below minimum requirement (${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}).`,
          dimensions,
          validatedMimeType: mimeType,
        };
      }
      
      // Basic blank image check (e.g. if average pixel color is very uniform or mostly white/black)
      // This is a simplified example. Real blank check is more complex.
      // const stats = await sharp(fileBuffer).stats();
      // const { r, g, b } = stats.channels.reduce((acc, channel) => ({ ...acc, [channel.band]: channel.mean }), {});
      // if (stats.isOpaque && Math.abs(r-g) < 5 && Math.abs(g-b) < 5 && (r > 250 || r < 5)) {
      //   return { isValid: false, errorCode: ValidationErrorCode.IMAGE_BLANK, message: 'Image appears to be blank or mostly uniform color.', dimensions, validatedMimeType: mimeType };
      // }

      return { isValid: true, validatedMimeType: mimeType, dimensions };
    } catch (error) {
      this.logger.error(`Sharp image processing error: ${error.message}`, error.stack);
      throw error; // Re-throw to be caught by the main try-catch in validateFile
    }
  }

  private async validatePdf(fileBuffer: Buffer): Promise<ValidationResultDto> {
    try {
      const data = await pdfParse(fileBuffer, { max: 1 }); // Limit parsing to first page for initial check
      const pageCount = data.numpages;

      if (pageCount === 0) {
        return { isValid: false, errorCode: ValidationErrorCode.PDF_BLANK, message: 'PDF has no pages.', pageCount: 0, validatedMimeType: 'application/pdf' };
      }

      // Check if text is extractable (basic check)
      const isTextBased = !!(data.text && data.text.trim().length > 50); // Ensure boolean
      
      // if (!isTextBased) {
      //   // This might be a warning rather than a hard failure, depending on requirements
      //   return {
      //     isValid: false, // Or true if scanned PDFs are allowed but need flagging
      //     errorCode: ValidationErrorCode.PDF_NOT_TEXT_EXTRACTABLE,
      //     message: 'PDF does not seem to contain extractable text. It might be an image-only PDF.',
      //     isTextBasedPdf: false,
      //     pageCount,
      //     validatedMimeType: 'application/pdf',
      //   };
      // }

      return { isValid: true, validatedMimeType: 'application/pdf', isTextBasedPdf: isTextBased, pageCount };
    } catch (error) {
      this.logger.error(`pdf-parse processing error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validateCsv(fileBuffer: Buffer, fileName: string): ValidationResultDto {
    const content = fileBuffer.toString('utf-8');
    const lines = content.split(/\r\n|\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) { // Assuming at least a header and one data row
      return {
        isValid: false,
        errorCode: ValidationErrorCode.FILE_TOO_SMALL, // Or a more specific CSV error
        message: `CSV file '${fileName}' has too few lines (less than 2). Expected header and data.`,
        validatedMimeType: 'text/csv',
      };
    }
    // Further CSV structural validation can be added here (e.g., consistent column counts)
    return { isValid: true, validatedMimeType: 'text/csv' };
  }
} 