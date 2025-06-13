export interface ValidateUploadRequestDto {
  filePathInBucket: string;
  originalFileName: string;
  originalMimeType: string;
}

export interface FileDimensionDto {
  width: number;
  height: number;
}

export enum ValidationErrorCode {
  INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
  FILE_TOO_SMALL = 'FILE_TOO_SMALL',
  IMAGE_RESOLUTION_TOO_LOW = 'IMAGE_RESOLUTION_TOO_LOW',
  PDF_NOT_TEXT_EXTRACTABLE = 'PDF_NOT_TEXT_EXTRACTABLE', // Could be a warning rather than error
  PDF_BLANK = 'PDF_BLANK',
  IMAGE_BLANK = 'IMAGE_BLANK', // Basic check
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
}

export interface ValidationResultDto {
  isValid: boolean;
  message?: string;
  errorCode?: ValidationErrorCode;
  validatedMimeType?: string;
  dimensions?: FileDimensionDto;
  isTextBasedPdf?: boolean;
  pageCount?: number; // For PDFs
} 