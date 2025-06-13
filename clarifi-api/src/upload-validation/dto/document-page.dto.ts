export interface DocumentPageDto {
  id: string;
  documentId: string;
  pageNumber: number;
  originalPageNumber: number;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSize: number;
  extractedText?: string;
  confidence?: number;
  isBlank?: boolean;
  rotation?: number;
}

export interface DocumentStructureDto {
  id: string;
  originalFileName: string;
  totalPages: number;
  pages: DocumentPageDto[];
  documentType: 'pdf' | 'image';
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PageReorderRequestDto {
  documentId: string;
  pageOrders: {
    pageId: string;
    newPosition: number;
  }[];
}

export interface PageOperationRequestDto {
  documentId: string;
  operation: 'delete' | 'rotate' | 'duplicate';
  pageId: string;
  rotationAngle?: number; // For rotate operation
}

export interface SplitDocumentRequestDto {
  documentId: string;
  splitPoints: number[]; // Page numbers where to split
}

export interface MergeDocumentsRequestDto {
  documentIds: string[];
  outputFileName: string;
}

export interface DocumentPageValidationDto {
  isValid: boolean;
  pageNumber: number;
  issues: string[];
  recommendations: string[];
  quality: {
    resolution: number;
    contrast: number;
    brightness: number;
    blur: number;
  };
}

export interface ProcessDocumentResponseDto {
  documentId: string;
  structure: DocumentStructureDto;
  validationResults: DocumentPageValidationDto[];
  thumbnails: string[];
  extractedText: string;
  recommendations: string[];
} 