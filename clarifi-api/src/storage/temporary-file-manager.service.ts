import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';
import {
  TemporaryFileDto,
  UploadSessionDto,
  CleanupPolicyDto,
  StorageQuotaDto,
  CleanupResultDto,
  CreateTemporaryFileRequestDto,
  UpdateTemporaryFileRequestDto,
  BulkCleanupRequestDto,
  StorageStatsDto,
} from './dto/temporary-file.dto';

@Injectable()
export class TemporaryFileManagerService {
  private readonly logger = new Logger(TemporaryFileManagerService.name);
  private readonly tempFiles = new Map<string, TemporaryFileDto>();
  private readonly sessions = new Map<string, UploadSessionDto>();
  private readonly cleanupPolicies: CleanupPolicyDto[] = [];
  private readonly userQuotas = new Map<string, StorageQuotaDto>();

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.initializeDefaultPolicies();
    this.initializeDefaultQuotas();
  }

  /**
   * Create a temporary file entry
   */
  async createTemporaryFile(
    userId: string,
    request: CreateTemporaryFileRequestDto,
  ): Promise<TemporaryFileDto> {
    // Check user quota
    await this.checkStorageQuota(userId, request.fileSize);

    const fileId = uuidv4();
    const sessionId = request.sessionId || uuidv4();
    const now = new Date();
    const expiryHours = request.expectedProcessingTime
      ? Math.max(request.expectedProcessingTime / 60, 1)
      : this.configService.get<number>('TEMP_FILE_DEFAULT_EXPIRY_HOURS', 24);

    const tempFile: TemporaryFileDto = {
      id: fileId,
      userId,
      sessionId,
      originalFileName: request.originalFileName,
      temporaryPath: `temp/${userId}/${sessionId}/${fileId}-${request.originalFileName}`,
      bucketName: 'temp-uploads',
      fileSize: request.fileSize,
      mimeType: request.mimeType,
      uploadStatus: 'pending',
      expiresAt: new Date(now.getTime() + expiryHours * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      metadata: {
        tags: request.tags || [],
        retryCount: 0,
      },
    };

    this.tempFiles.set(fileId, tempFile);
    await this.updateSession(sessionId, userId, tempFile);
    await this.updateUserQuota(userId);

    this.logger.log(
      `Created temporary file: ${fileId} for user: ${userId}, expires: ${tempFile.expiresAt}`,
    );

    return tempFile;
  }

  /**
   * Update temporary file status and metadata
   */
  async updateTemporaryFile(
    fileId: string,
    updates: UpdateTemporaryFileRequestDto,
  ): Promise<TemporaryFileDto> {
    const tempFile = this.tempFiles.get(fileId);
    if (!tempFile) {
      throw new Error(`Temporary file not found: ${fileId}`);
    }

    const now = new Date();

    if (updates.status) {
      tempFile.uploadStatus = updates.status;
    }

    if (updates.metadata) {
      tempFile.metadata = { ...tempFile.metadata, ...updates.metadata };
    }

    if (updates.extendExpiry) {
      tempFile.expiresAt = new Date(
        tempFile.expiresAt.getTime() + updates.extendExpiry * 60 * 60 * 1000,
      );
    }

    tempFile.updatedAt = now;
    this.tempFiles.set(fileId, tempFile);

    // Update session
    const session = this.sessions.get(tempFile.sessionId);
    if (session) {
      const fileIndex = session.files.findIndex((f) => f.id === fileId);
      if (fileIndex >= 0) {
        session.files[fileIndex] = tempFile;
        session.lastActivity = now;
        
        // Update session counters
        session.completedFiles = session.files.filter(
          (f) => f.uploadStatus === 'completed',
        ).length;
        session.failedFiles = session.files.filter(
          (f) => f.uploadStatus === 'failed',
        ).length;
      }
    }

    this.logger.log(
      `Updated temporary file: ${fileId}, status: ${tempFile.uploadStatus}`,
    );

    return tempFile;
  }

  /**
   * Get temporary file by ID
   */
  getTemporaryFile(fileId: string): TemporaryFileDto | null {
    return this.tempFiles.get(fileId) || null;
  }

  /**
   * Get upload session
   */
  getUploadSession(sessionId: string): UploadSessionDto | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get user's temporary files
   */
  getUserTemporaryFiles(userId: string): TemporaryFileDto[] {
    return Array.from(this.tempFiles.values()).filter(
      (file) => file.userId === userId,
    );
  }

  /**
   * Delete temporary file
   */
  async deleteTemporaryFile(fileId: string): Promise<void> {
    const tempFile = this.tempFiles.get(fileId);
    if (!tempFile) {
      return;
    }

    try {
      // Delete from storage if it exists
      await this.storageService.deleteFile?.(
        tempFile.bucketName,
        tempFile.temporaryPath,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete file from storage: ${tempFile.temporaryPath}`,
        error,
      );
    }

    this.tempFiles.delete(fileId);
    await this.updateUserQuota(tempFile.userId);

    this.logger.log(`Deleted temporary file: ${fileId}`);
  }

  /**
   * Automatic cleanup job - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async performScheduledCleanup(): Promise<CleanupResultDto> {
    this.logger.log('Starting scheduled cleanup of temporary files');
    
    const result = await this.performCleanup({
      forceCleanup: false,
      dryRun: false,
    });

    this.logger.log(
      `Scheduled cleanup completed: ${result.filesDeleted} files deleted, ${result.bytesReclaimed} bytes reclaimed`,
    );

    return result;
  }

  /**
   * Manual cleanup with custom parameters
   */
  async performCleanup(request: BulkCleanupRequestDto): Promise<CleanupResultDto> {
    const cleanupId = uuidv4();
    const startedAt = new Date();
    const result: CleanupResultDto = {
      cleanupId,
      startedAt,
      completedAt: new Date(),
      filesScanned: 0,
      filesDeleted: 0,
      bytesReclaimed: 0,
      errors: [],
      policyApplied: 'manual',
      summary: {
        byStatus: {},
        byAge: {},
        largestFileDeleted: 0,
      },
    };

    const allFiles = Array.from(this.tempFiles.values());
    result.filesScanned = allFiles.length;

    for (const file of allFiles) {
      try {
        if (this.shouldDeleteFile(file, request)) {
          if (!request.dryRun) {
            await this.deleteTemporaryFile(file.id);
            result.filesDeleted++;
            result.bytesReclaimed += file.fileSize;
            result.summary.largestFileDeleted = Math.max(
              result.summary.largestFileDeleted,
              file.fileSize,
            );
          }

          // Update summary
          const status = file.uploadStatus;
          result.summary.byStatus[status] = (result.summary.byStatus[status] || 0) + 1;

          const ageHours = Math.floor(
            (Date.now() - file.createdAt.getTime()) / (1000 * 60 * 60),
          );
          const ageGroup = this.getAgeGroup(ageHours);
          result.summary.byAge[ageGroup] = (result.summary.byAge[ageGroup] || 0) + 1;
        }
      } catch (error) {
        result.errors.push(`Failed to delete file ${file.id}: ${error.message}`);
      }
    }

    result.completedAt = new Date();
    return result;
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): StorageStatsDto {
    const allFiles = Array.from(this.tempFiles.values());
    
    const stats: StorageStatsDto = {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, file) => sum + file.fileSize, 0),
      temporaryFiles: allFiles.length,
      temporarySize: allFiles.reduce((sum, file) => sum + file.fileSize, 0),
      avgFileSize: 0,
      oldestFile: new Date(),
      largestFile: 0,
      byStatus: {},
      byMimeType: {},
      byUser: {},
    };

    if (allFiles.length > 0) {
      stats.avgFileSize = stats.totalSize / stats.totalFiles;
      stats.oldestFile = new Date(Math.min(...allFiles.map(f => f.createdAt.getTime())));
      stats.largestFile = Math.max(...allFiles.map(f => f.fileSize));

      // Group by status
      allFiles.forEach(file => {
        stats.byStatus[file.uploadStatus] = (stats.byStatus[file.uploadStatus] || 0) + 1;
        stats.byMimeType[file.mimeType] = (stats.byMimeType[file.mimeType] || 0) + 1;
        
        if (!stats.byUser[file.userId]) {
          stats.byUser[file.userId] = { count: 0, size: 0 };
        }
        stats.byUser[file.userId].count++;
        stats.byUser[file.userId].size += file.fileSize;
      });
    }

    return stats;
  }

  /**
   * Get user's storage quota
   */
  getUserQuota(userId: string): StorageQuotaDto {
    return this.userQuotas.get(userId) || this.createDefaultQuota(userId);
  }

  // Private helper methods

  private async updateSession(
    sessionId: string,
    userId: string,
    newFile: TemporaryFileDto,
  ): Promise<void> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        sessionId,
        userId,
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
        totalSize: 0,
        uploadedSize: 0,
        status: 'active',
        startedAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        files: [],
      };
    }

    session.files.push(newFile);
    session.totalFiles = session.files.length;
    session.totalSize += newFile.fileSize;
    session.lastActivity = new Date();

    this.sessions.set(sessionId, session);
  }

  private async checkStorageQuota(userId: string, fileSize: number): Promise<void> {
    const quota = this.getUserQuota(userId);
    
    if (quota.usedSpace + fileSize > quota.totalQuota) {
      throw new Error(`Storage quota exceeded for user ${userId}`);
    }

    if (fileSize > quota.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size for user ${userId}`);
    }

    const userFiles = this.getUserTemporaryFiles(userId);
    const activeUploads = userFiles.filter(
      f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending'
    ).length;

    if (activeUploads >= quota.maxConcurrentUploads) {
      throw new Error(`Maximum concurrent uploads exceeded for user ${userId}`);
    }
  }

  private async updateUserQuota(userId: string): Promise<void> {
    const quota = this.getUserQuota(userId);
    const userFiles = this.getUserTemporaryFiles(userId);
    
    quota.temporarySpace = userFiles.reduce((sum, file) => sum + file.fileSize, 0);
    quota.fileCount = userFiles.length;
    quota.lastUpdated = new Date();
    
    const usagePercentage = (quota.usedSpace / quota.totalQuota) * 100;
    quota.isWarningTriggered = usagePercentage >= quota.warningThreshold;
    quota.quotaExceeded = quota.usedSpace > quota.totalQuota;

    this.userQuotas.set(userId, quota);
  }

  private shouldDeleteFile(file: TemporaryFileDto, request: BulkCleanupRequestDto): boolean {
    // Check expiry
    if (file.expiresAt < new Date()) {
      return true;
    }

    // Check age
    if (request.olderThan) {
      const ageHours = (Date.now() - file.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > request.olderThan) {
        return true;
      }
    }

    // Check status
    if (request.statuses && request.statuses.includes(file.uploadStatus)) {
      return true;
    }

    // Check user filter
    if (request.userIds && !request.userIds.includes(file.userId)) {
      return false;
    }

    // Apply cleanup policies
    for (const policy of this.cleanupPolicies) {
      if (!policy.isActive) continue;
      
      if (this.fileMatchesPolicy(file, policy)) {
        return true;
      }
    }

    return false;
  }

  private fileMatchesPolicy(file: TemporaryFileDto, policy: CleanupPolicyDto): boolean {
    const ageHours = (Date.now() - file.createdAt.getTime()) / (1000 * 60 * 60);
    
    if (ageHours < policy.conditions.maxAge) {
      return false;
    }

    if (!policy.conditions.status.includes(file.uploadStatus)) {
      return false;
    }

    if (policy.conditions.minRetryCount && 
        (file.metadata?.retryCount || 0) < policy.conditions.minRetryCount) {
      return false;
    }

    if (policy.conditions.sizeThreshold && 
        file.fileSize < policy.conditions.sizeThreshold) {
      return false;
    }

    return true;
  }

  private getAgeGroup(hours: number): string {
    if (hours < 1) return '< 1 hour';
    if (hours < 24) return '< 1 day';
    if (hours < 168) return '< 1 week';
    return '> 1 week';
  }

  private initializeDefaultPolicies(): void {
    this.cleanupPolicies.push(
      {
        id: 'expired-files',
        name: 'Clean expired files',
        description: 'Remove files that have passed their expiry date',
        isActive: true,
        conditions: {
          maxAge: 0, // Immediate cleanup for expired
          status: ['expired', 'failed'],
        },
        actions: {
          deleteFile: true,
          notifyUser: false,
          logEvent: true,
        },
        priority: 1,
      },
      {
        id: 'old-completed-files',
        name: 'Clean old completed files',
        description: 'Remove completed files older than 7 days',
        isActive: true,
        conditions: {
          maxAge: 168, // 7 days
          status: ['completed'],
        },
        actions: {
          deleteFile: true,
          notifyUser: false,
          logEvent: true,
        },
        priority: 2,
      },
    );
  }

  private createDefaultQuota(userId: string): StorageQuotaDto {
    const quota: StorageQuotaDto = {
      userId,
      totalQuota: this.configService.get<number>('DEFAULT_USER_QUOTA', 5 * 1024 * 1024 * 1024), // 5GB
      usedSpace: 0,
      temporarySpace: 0,
      fileCount: 0,
      maxFileSize: this.configService.get<number>('MAX_FILE_SIZE', 100 * 1024 * 1024), // 100MB
      maxConcurrentUploads: this.configService.get<number>('MAX_CONCURRENT_UPLOADS', 5),
      quotaExceeded: false,
      warningThreshold: 80, // 80%
      isWarningTriggered: false,
      lastUpdated: new Date(),
    };

    this.userQuotas.set(userId, quota);
    return quota;
  }

  private initializeDefaultQuotas(): void {
    // Initialize any default quotas if needed
  }
} 