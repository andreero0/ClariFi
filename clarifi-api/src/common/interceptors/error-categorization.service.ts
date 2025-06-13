import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  RATE_LIMIT = 'rate_limit',
  FILE_PROCESSING = 'file_processing',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface CategorizedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  shouldReport: boolean;
  userMessage?: string;
  technicalMessage: string;
  context?: Record<string, any>;
  tags?: string[];
}

@Injectable()
export class ErrorCategorizationService {
  categorizeError(error: Error | HttpException, context?: Record<string, any>): CategorizedError {
    // HTTP exceptions
    if (error instanceof HttpException) {
      return this.categorizeHttpException(error, context);
    }

    // Database errors
    if (this.isDatabaseError(error)) {
      return this.categorizeDatabaseError(error, context);
    }

    // External service errors
    if (this.isExternalServiceError(error)) {
      return this.categorizeExternalServiceError(error, context);
    }

    // File processing errors
    if (this.isFileProcessingError(error)) {
      return this.categorizeFileProcessingError(error, context);
    }

    // Default categorization
    return this.categorizeGenericError(error, context);
  }

  private categorizeHttpException(error: HttpException, context?: Record<string, any>): CategorizedError {
    const status = error.getStatus();
    const message = error.message;

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return {
          category: ErrorCategory.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          shouldReport: false,
          userMessage: 'Authentication required. Please log in.',
          technicalMessage: message,
          context,
          tags: ['auth', 'unauthorized'],
        };

      case HttpStatus.FORBIDDEN:
        return {
          category: ErrorCategory.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          shouldReport: true,
          userMessage: 'Access denied.',
          technicalMessage: message,
          context,
          tags: ['auth', 'forbidden'],
        };

      case HttpStatus.BAD_REQUEST:
        return {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.LOW,
          shouldReport: false,
          userMessage: 'Invalid request. Please check your data.',
          technicalMessage: message,
          context,
          tags: ['validation', 'bad_request'],
        };

      case HttpStatus.INTERNAL_SERVER_ERROR:
        return {
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.CRITICAL,
          shouldReport: true,
          userMessage: 'An unexpected error occurred.',
          technicalMessage: message,
          context,
          tags: ['system', 'internal_error'],
        };

      default:
        return {
          category: ErrorCategory.UNKNOWN,
          severity: this.assessSeverityFromStatus(status),
          shouldReport: status >= 500,
          userMessage: 'An error occurred.',
          technicalMessage: message,
          context,
          tags: ['http', `status_${status}`],
        };
    }
  }

  private isDatabaseError(error: Error): boolean {
    return (
      error.name.includes('Prisma') ||
      error.message.includes('database') ||
      error.message.includes('connection') ||
      error.name.includes('P2')
    );
  }

  private categorizeDatabaseError(error: Error, context?: Record<string, any>): CategorizedError {
    const message = error.message.toLowerCase();
    
    if (message.includes('connection') || message.includes('timeout')) {
      return {
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.CRITICAL,
        shouldReport: true,
        userMessage: 'Service temporarily unavailable.',
        technicalMessage: error.message,
        context,
        tags: ['database', 'connection'],
      };
    }

    if (message.includes('unique') || message.includes('constraint')) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        shouldReport: false,
        userMessage: 'This data already exists.',
        technicalMessage: error.message,
        context,
        tags: ['database', 'constraint'],
      };
    }

    return {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      shouldReport: true,
      userMessage: 'A database error occurred.',
      technicalMessage: error.message,
      context,
      tags: ['database'],
    };
  }

  private isExternalServiceError(error: Error): boolean {
    return (
      error.message.includes('supabase') ||
      error.message.includes('api') ||
      error.message.includes('fetch')
    );
  }

  private categorizeExternalServiceError(error: Error, context?: Record<string, any>): CategorizedError {
    return {
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: ErrorSeverity.HIGH,
      shouldReport: true,
      userMessage: 'External service unavailable.',
      technicalMessage: error.message,
      context,
      tags: ['external_service'],
    };
  }

  private isFileProcessingError(error: Error): boolean {
    return (
      error.message.includes('file') ||
      error.message.includes('upload') ||
      error.message.includes('ocr')
    );
  }

  private categorizeFileProcessingError(error: Error, context?: Record<string, any>): CategorizedError {
    return {
      category: ErrorCategory.FILE_PROCESSING,
      severity: ErrorSeverity.MEDIUM,
      shouldReport: true,
      userMessage: 'File processing failed.',
      technicalMessage: error.message,
      context,
      tags: ['file'],
    };
  }

  private categorizeGenericError(error: Error, context?: Record<string, any>): CategorizedError {
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      shouldReport: true,
      userMessage: 'An unexpected error occurred.',
      technicalMessage: error.message,
      context,
      tags: ['unknown'],
    };
  }

  private assessSeverityFromStatus(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  getErrorResponse(categorizedError: CategorizedError) {
    return {
      message: categorizedError.userMessage || 'An error occurred',
      category: categorizedError.category,
      severity: categorizedError.severity,
    };
  }

  getLogLevel(categorizedError: CategorizedError): 'error' | 'warn' | 'info' {
    switch (categorizedError.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }
}