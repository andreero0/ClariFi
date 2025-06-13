export interface TemporaryFileDto {
  id: string;
  userId: string;
  sessionId: string;
  originalFileName: string;
  temporaryPath: string;
  bucketName: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'processing' | 'failed' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    processingStage?: string;
    errorMessage?: string;
    retryCount?: number;
    tags?: string[];
    // OCR-specific metadata
    storageUrl?: string;
    ocrJobId?: string;
    ocrResultPath?: string;
    textBlocksCount?: number;
    confidence?: number;
    processingTime?: number;
    ocrFeatures?: string[];
  };
}

export interface UploadSessionDto {
  sessionId: string;
  userId: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
  status: 'active' | 'completed' | 'failed' | 'expired';
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  files: TemporaryFileDto[];
}

export interface CleanupPolicyDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: {
    maxAge: number; // hours
    status: string[];
    minRetryCount?: number;
    sizeThreshold?: number; // bytes
  };
  actions: {
    deleteFile: boolean;
    notifyUser: boolean;
    logEvent: boolean;
    moveToArchive?: boolean;
  };
  priority: number;
}

export interface StorageQuotaDto {
  userId: string;
  totalQuota: number; // bytes
  usedSpace: number; // bytes
  temporarySpace: number; // bytes
  fileCount: number;
  maxFileSize: number; // bytes
  maxConcurrentUploads: number;
  quotaExceeded: boolean;
  warningThreshold: number; // percentage
  isWarningTriggered: boolean;
  lastUpdated: Date;
}

export interface CleanupResultDto {
  cleanupId: string;
  startedAt: Date;
  completedAt: Date;
  filesScanned: number;
  filesDeleted: number;
  bytesReclaimed: number;
  errors: string[];
  policyApplied: string;
  summary: {
    byStatus: Record<string, number>;
    byAge: Record<string, number>;
    largestFileDeleted: number;
  };
}

export interface CreateTemporaryFileRequestDto {
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  sessionId?: string;
  expectedProcessingTime?: number; // minutes
  tags?: string[];
}

export interface UpdateTemporaryFileRequestDto {
  status?: TemporaryFileDto['uploadStatus'];
  metadata?: TemporaryFileDto['metadata'] & {
    // OCR-specific metadata extensions
    storageUrl?: string;
    ocrJobId?: string;
    ocrResultPath?: string;
    textBlocksCount?: number;
    confidence?: number;
    processingTime?: number;
    ocrFeatures?: string[];
  };
  extendExpiry?: number; // hours
}

export interface BulkCleanupRequestDto {
  policyIds?: string[];
  forceCleanup?: boolean;
  dryRun?: boolean;
  olderThan?: number; // hours
  statuses?: string[];
  userIds?: string[];
}

export interface StorageStatsDto {
  totalFiles: number;
  totalSize: number;
  temporaryFiles: number;
  temporarySize: number;
  avgFileSize: number;
  oldestFile: Date;
  largestFile: number;
  byStatus: Record<string, number>;
  byMimeType: Record<string, number>;
  byUser: Record<string, { count: number; size: number }>;
} 