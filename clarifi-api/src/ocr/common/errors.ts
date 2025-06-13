import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error classification for OCR system
 */
export enum ErrorType {
  // Transient errors (retry possible)
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_TEMPORARILY_UNAVAILABLE = 'API_TEMPORARILY_UNAVAILABLE',
  STORAGE_TEMPORARILY_UNAVAILABLE = 'STORAGE_TEMPORARILY_UNAVAILABLE',
  TEMPORARY_PROCESSING_ERROR = 'TEMPORARY_PROCESSING_ERROR',
  
  // Permanent errors (no retry)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_IMAGE_DATA = 'INVALID_IMAGE_DATA',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Infrastructure errors (may retry with backoff)
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  STORAGE_CONNECTION_ERROR = 'STORAGE_CONNECTION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Processing errors (may retry with different parameters)
  OCR_PROCESSING_FAILED = 'OCR_PROCESSING_FAILED',
  IMAGE_PREPROCESSING_FAILED = 'IMAGE_PREPROCESSING_FAILED',
  TEXT_PARSING_FAILED = 'TEXT_PARSING_FAILED'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Retry strategy types
 */
export enum RetryStrategy {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  FIXED_DELAY = 'fixed_delay',
  NO_RETRY = 'no_retry'
}

/**
 * Base error interface for OCR system
 */
export interface OCRError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
  retryStrategy: RetryStrategy;
  maxRetries: number;
  suggestedAction?: string;
}

/**
 * Custom OCR exception class
 */
export class OCRException extends HttpException {
  public readonly errorType: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly retryStrategy: RetryStrategy;
  public readonly maxRetries: number;
  public readonly context?: Record<string, any>;
  public readonly suggestedAction?: string;

  constructor(error: OCRError, httpStatus?: HttpStatus) {
    const status = httpStatus || OCRException.getHttpStatusFromErrorType(error.type);
    
    super({
      message: error.message,
      error: error.type,
      severity: error.severity,
      retryable: error.retryable,
      context: error.context,
      suggestedAction: error.suggestedAction,
      timestamp: error.timestamp.toISOString()
    }, status);

    this.errorType = error.type;
    this.severity = error.severity;
    this.retryable = error.retryable;
    this.retryStrategy = error.retryStrategy;
    this.maxRetries = error.maxRetries;
    this.context = error.context;
    this.suggestedAction = error.suggestedAction;
  }

  private static getHttpStatusFromErrorType(errorType: ErrorType): HttpStatus {
    switch (errorType) {
      case ErrorType.INVALID_CREDENTIALS:
      case ErrorType.PERMISSION_DENIED:
        return HttpStatus.UNAUTHORIZED;
      
      case ErrorType.QUOTA_EXCEEDED:
        return HttpStatus.TOO_MANY_REQUESTS;
      
      case ErrorType.UNSUPPORTED_FORMAT:
      case ErrorType.FILE_TOO_LARGE:
      case ErrorType.INVALID_IMAGE_DATA:
        return HttpStatus.BAD_REQUEST;
      
      case ErrorType.API_TEMPORARILY_UNAVAILABLE:
      case ErrorType.STORAGE_TEMPORARILY_UNAVAILABLE:
      case ErrorType.SERVICE_UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      
      case ErrorType.RATE_LIMIT_EXCEEDED:
        return HttpStatus.TOO_MANY_REQUESTS;
      
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}

/**
 * Error classification utility
 */
export class ErrorClassifier {
  private static readonly errorMappings = new Map<string, Partial<OCRError>>([
    // Google Vision API errors
    ['RATE_LIMIT_EXCEEDED', {
      type: ErrorType.RATE_LIMIT_EXCEEDED,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      maxRetries: 5,
      suggestedAction: 'Reduce request frequency or upgrade quota'
    }],
    ['INVALID_ARGUMENT', {
      type: ErrorType.INVALID_IMAGE_DATA,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      retryStrategy: RetryStrategy.NO_RETRY,
      maxRetries: 0,
      suggestedAction: 'Check image format and data validity'
    }],
    ['UNAUTHENTICATED', {
      type: ErrorType.INVALID_CREDENTIALS,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      retryStrategy: RetryStrategy.NO_RETRY,
      maxRetries: 0,
      suggestedAction: 'Verify API credentials configuration'
    }],
    ['RESOURCE_EXHAUSTED', {
      type: ErrorType.QUOTA_EXCEEDED,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      retryStrategy: RetryStrategy.NO_RETRY,
      maxRetries: 0,
      suggestedAction: 'Check API quota usage and limits'
    }],
    ['UNAVAILABLE', {
      type: ErrorType.API_TEMPORARILY_UNAVAILABLE,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      maxRetries: 3,
      suggestedAction: 'Retry after a brief delay'
    }],
    
    // Storage errors
    ['ENOTFOUND', {
      type: ErrorType.STORAGE_CONNECTION_ERROR,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      maxRetries: 3,
      suggestedAction: 'Check storage service connectivity'
    }],
    ['ECONNRESET', {
      type: ErrorType.NETWORK_TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      maxRetries: 3,
      suggestedAction: 'Retry with exponential backoff'
    }],
    
    // Processing errors
    ['Image optimization failed', {
      type: ErrorType.IMAGE_PREPROCESSING_FAILED,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryStrategy: RetryStrategy.LINEAR_BACKOFF,
      maxRetries: 2,
      suggestedAction: 'Try with different optimization parameters'
    }],
    ['Text parsing failed', {
      type: ErrorType.TEXT_PARSING_FAILED,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryStrategy: RetryStrategy.LINEAR_BACKOFF,
      maxRetries: 2,
      suggestedAction: 'Review text parsing configuration'
    }]
  ]);

  static classifyError(error: Error, context?: Record<string, any>): OCRError {
    const errorMessage = error.message;
    
    // Try to find a specific mapping
    for (const [pattern, config] of this.errorMappings) {
      if (errorMessage.includes(pattern)) {
        return {
          type: config.type!,
          severity: config.severity!,
          message: errorMessage,
          originalError: error,
          context,
          timestamp: new Date(),
          retryable: config.retryable!,
          retryStrategy: config.retryStrategy!,
          maxRetries: config.maxRetries!,
          suggestedAction: config.suggestedAction
        };
      }
    }

    // Default classification for unknown errors
    return {
      type: ErrorType.TEMPORARY_PROCESSING_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: errorMessage,
      originalError: error,
      context,
      timestamp: new Date(),
      retryable: true,
      retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      maxRetries: 3,
      suggestedAction: 'Check system logs for more details'
    };
  }

  static isRetryable(errorType: ErrorType): boolean {
    const nonRetryableTypes = [
      ErrorType.INVALID_CREDENTIALS,
      ErrorType.QUOTA_EXCEEDED,
      ErrorType.UNSUPPORTED_FORMAT,
      ErrorType.FILE_TOO_LARGE,
      ErrorType.INVALID_IMAGE_DATA,
      ErrorType.PERMISSION_DENIED
    ];
    
    return !nonRetryableTypes.includes(errorType);
  }
}

/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
  errorType: ErrorType;
  count: number;
  lastOccurrence: Date;
  severity: ErrorSeverity;
  averageResolutionTime?: number;
}

/**
 * Error context builder
 */
export class ErrorContextBuilder {
  private context: Record<string, any> = {};

  addUserId(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  addJobId(jobId: string): this {
    this.context.jobId = jobId;
    return this;
  }

  addFileInfo(fileName: string, fileSize: number, mimeType: string): this {
    this.context.file = { fileName, fileSize, mimeType };
    return this;
  }

  addProcessingStage(stage: string): this {
    this.context.processingStage = stage;
    return this;
  }

  addCustomData(key: string, value: any): this {
    this.context[key] = value;
    return this;
  }

  build(): Record<string, any> {
    return { ...this.context };
  }
} 