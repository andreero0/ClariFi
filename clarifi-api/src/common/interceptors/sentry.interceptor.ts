// Sentry Interceptor for NestJS Error Tracking

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';
import { ErrorCategorizationService } from './error-categorization.service';
import { PrivacyFilterInterceptor } from './privacy-filter.interceptor';
import { Request, Response } from 'express';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);
  private readonly errorCategorization = new ErrorCategorizationService();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();
    
    // Set Sentry request context (sanitized for privacy)
    const sanitizedRequestData = PrivacyFilterInterceptor.sanitizeForExternalLogging({
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      headers: request.headers,
      query: request.query,
      params: request.params,
    });
    
    Sentry.setContext('request', sanitizedRequestData);

    // Set user context if available (no PII)
    if ((request as any).user) {
      Sentry.setUser({
        id: (request as any).user.id,
        // Don't include email or other PII for privacy compliance
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Monitor performance
        const responseTime = Date.now() - startTime;
        
        // Log slow requests
        if (responseTime > 5000) {
          Sentry.addBreadcrumb({
            message: 'Slow request detected',
            category: 'performance',
            level: 'warning',
            data: {
              method: request.method,
              url: request.url,
              responseTime,
              statusCode: response.statusCode,
            },
          });
        }
      }),
      catchError((error) => {
        this.reportErrorToSentry(error, request, context);
        return throwError(() => error);
      }),
    );
  }

  private reportErrorToSentry(
    error: any, 
    request: Request, 
    context: ExecutionContext
  ): void {
    // Sanitize error data for privacy compliance before processing
    const sanitizedError = PrivacyFilterInterceptor.sanitizeForExternalLogging(error);
    
    // Use error categorization service
    const errorCategorization = new ErrorCategorizationService();
    const categorizedError = errorCategorization.categorizeError(sanitizedError, {
      handler: context.getHandler().name,
      class: context.getClass().name,
      route: request.route?.path,
      method: request.method,
      url: request.url,
    });

    // Only report if categorization says we should
    if (!categorizedError.shouldReport) {
      return;
    }

    // Set error context
    Sentry.setContext('error_context', {
      handler: context.getHandler().name,
      class: context.getClass().name,
      timestamp: new Date().toISOString(),
      route: request.route?.path,
      category: categorizedError.category,
      severity: categorizedError.severity,
    });

    const tags: Record<string, string> = {
      endpoint: `${request.method} ${request.route?.path || request.url}`,
      environment: process.env.NODE_ENV || 'development',
      error_category: categorizedError.category,
      error_severity: categorizedError.severity,
    };

    // Add categorization tags
    if (categorizedError.tags) {
      categorizedError.tags.forEach((tag, index) => {
        tags[`tag_${index}`] = tag;
      });
    }

    // Determine Sentry level based on categorized severity
    let sentryLevel: Sentry.SeverityLevel;
    switch (categorizedError.severity) {
      case 'critical':
        sentryLevel = 'fatal';
        break;
      case 'high':
        sentryLevel = 'error';
        break;
      case 'medium':
        sentryLevel = 'warning';
        break;
      case 'low':
      default:
        sentryLevel = 'info';
        break;
    }

    Sentry.withScope((scope) => {
      scope.setTags(tags);
      scope.setLevel(sentryLevel);
      
      // Sanitize categorized error context for privacy compliance
      const sanitizedErrorContext = PrivacyFilterInterceptor.sanitizeForExternalLogging({
        category: categorizedError.category,
        severity: categorizedError.severity,
        userMessage: categorizedError.userMessage,
        technicalMessage: categorizedError.technicalMessage,
        context: categorizedError.context,
      });
      
      scope.setContext('categorized_error', sanitizedErrorContext);
      scope.setContext('privacy_compliance', {
        sanitized: true,
        sanitized_at: new Date().toISOString(),
        compliance_framework: 'PIPEDA',
      });
      
      if (categorizedError.severity === 'critical' || categorizedError.severity === 'high') {
        // Use sanitized error for exception reporting
        const sanitizedErrorForCapture = PrivacyFilterInterceptor.sanitizeForExternalLogging(error);
        Sentry.captureException(sanitizedErrorForCapture);
      } else {
        Sentry.captureMessage(categorizedError.technicalMessage);
      }
    });

    // Log based on categorized severity
    const logLevel = errorCategorization.getLogLevel(categorizedError);
    this.logger[logLevel](`${categorizedError.category}: ${categorizedError.technicalMessage}`, error.stack);
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
