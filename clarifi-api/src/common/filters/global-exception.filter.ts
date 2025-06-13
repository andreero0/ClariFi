import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCategorizationService } from '../interceptors/error-categorization.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly errorCategorization = new ErrorCategorizationService();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Categorize the error
    const categorizedError = this.errorCategorization.categorizeError(
      exception as Error,
      {
        url: request.url,
        method: request.method,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        timestamp: new Date().toISOString(),
      }
    );

    // Determine HTTP status
    let status: number;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // Log the error with appropriate level
    const logLevel = this.errorCategorization.getLogLevel(categorizedError);
    const logMessage = `${request.method} ${request.url} - ${categorizedError.category}: ${categorizedError.technicalMessage}`;
    
    this.logger[logLevel](logMessage, (exception as Error).stack);

    // Prepare error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: categorizedError.userMessage || 'An error occurred',
      category: categorizedError.category,
      severity: categorizedError.severity,
      errorId: this.generateErrorId(),
      ...(process.env.NODE_ENV === 'development' && {
        technicalMessage: categorizedError.technicalMessage,
        stack: (exception as Error).stack,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 