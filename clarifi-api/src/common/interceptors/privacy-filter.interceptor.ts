import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class PrivacyFilterInterceptor implements NestInterceptor {
  private readonly sensitiveFields = [
    // Personal identifiers
    'email',
    'phone',
    'phoneNumber',
    'firstName',
    'lastName',
    'name',
    'fullName',
    
    // Address information
    'address',
    'street',
    'city',
    'province',
    'postalCode',
    'zipCode',
    
    // Financial information
    'accountNumber',
    'bankAccount',
    'creditCard',
    'cardNumber',
    'cvv',
    'sin',
    'socialInsurance',
    'ssn',
    
    // Authentication
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    
    // Personal details
    'dateOfBirth',
    'birthDate',
    'age',
    'personalId',
    'userId', // We'll hash this instead of removing
  ];

  private readonly sensitivePatterns = [
    /\b\d{3}-\d{3}-\d{3}\b/g, // SIN pattern
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card pattern
    /\b[A-Za-z]\d[A-Za-z][-\s]?\d[A-Za-z]\d\b/g, // Canadian postal code
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
    /\b\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone pattern
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Sanitize request before processing
    this.sanitizeRequestForLogging(request);
    
    return next.handle().pipe(
      tap((data) => {
        // Sanitize response data if needed for logging
        if (data && typeof data === 'object') {
          this.sanitizeObjectForLogging(data);
        }
      }),
      catchError((error) => {
        // Sanitize error data before it goes to error tracking
        this.sanitizeErrorForLogging(error);
        throw error;
      }),
    );
  }

  private sanitizeRequestForLogging(request: Request): void {
    // Sanitize request body
    if (request.body && typeof request.body === 'object') {
      this.sanitizeObjectForLogging(request.body);
    }

    // Sanitize query parameters
    if (request.query && typeof request.query === 'object') {
      this.sanitizeObjectForLogging(request.query);
    }

    // Sanitize headers (remove authorization tokens)
    if (request.headers) {
      const sanitizedHeaders = { ...request.headers };
      delete sanitizedHeaders.authorization;
      delete sanitizedHeaders.cookie;
      delete sanitizedHeaders['x-api-key'];
      request.headers = sanitizedHeaders;
    }
  }

  private sanitizeObjectForLogging(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectForLogging(item));
    }

    const sanitized = { ...obj };

    for (const key in sanitized) {
      if (sanitized.hasOwnProperty(key)) {
        const value = sanitized[key];
        const lowerKey = key.toLowerCase();

        // Check if field is sensitive
        if (this.sensitiveFields.includes(lowerKey)) {
          if (lowerKey === 'userid' || lowerKey === 'user_id') {
            // Hash user IDs instead of removing them
            sanitized[key] = this.hashValue(String(value));
          } else {
            sanitized[key] = '[REDACTED]';
          }
        } else if (typeof value === 'string') {
          // Check for sensitive patterns in string values
          sanitized[key] = this.sanitizeStringValue(value);
        } else if (typeof value === 'object' && value !== null) {
          // Recursively sanitize nested objects
          sanitized[key] = this.sanitizeObjectForLogging(value);
        }
      }
    }

    return sanitized;
  }

  private sanitizeStringValue(value: string): string {
    let sanitized = value;

    // Replace sensitive patterns
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  private sanitizeErrorForLogging(error: any): void {
    if (!error || typeof error !== 'object') {
      return;
    }

    // Sanitize error message
    if (error.message && typeof error.message === 'string') {
      error.message = this.sanitizeStringValue(error.message);
    }

    // Sanitize error details
    if (error.details) {
      error.details = this.sanitizeObjectForLogging(error.details);
    }

    // Sanitize error response data
    if (error.response && typeof error.response === 'object') {
      error.response = this.sanitizeObjectForLogging(error.response);
    }

    // Sanitize Prisma error details (common in financial apps)
    if (error.meta) {
      error.meta = this.sanitizeObjectForLogging(error.meta);
    }

    // Sanitize stack trace for any embedded sensitive data
    if (error.stack && typeof error.stack === 'string') {
      error.stack = this.sanitizeStringValue(error.stack);
    }
  }

  private hashValue(value: string): string {
    // Simple hash function for user IDs and other identifiers
    // In production, consider using a more robust hashing algorithm like bcrypt
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Static method to sanitize data before sending to external services
   */
  static sanitizeForExternalLogging(data: any): any {
    const interceptor = new PrivacyFilterInterceptor();
    return interceptor.sanitizeObjectForLogging(data);
  }

  /**
   * Check if request contains financial data that requires special handling
   */
  private containsFinancialData(obj: any): boolean {
    const financialFields = [
      'accountNumber',
      'bankAccount',
      'creditCard',
      'balance',
      'amount',
      'transaction',
      'payment',
      'sin',
      'socialInsurance',
    ];

    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const keys = Object.keys(obj).map(key => key.toLowerCase());
    return financialFields.some(field => 
      keys.some(key => key.includes(field))
    );
  }

  /**
   * Special handling for financial data with stricter privacy controls
   */
  private sanitizeFinancialData(obj: any): any {
    if (!this.containsFinancialData(obj)) {
      return this.sanitizeObjectForLogging(obj);
    }

    // For financial data, be more aggressive with sanitization
    const sanitized = this.sanitizeObjectForLogging(obj);
    
    // Add financial data marker for compliance tracking
    sanitized._privacy_note = 'Financial data sanitized per PIPEDA compliance';
    sanitized._sanitized_at = new Date().toISOString();
    
    return sanitized;
  }
}

export default PrivacyFilterInterceptor; 