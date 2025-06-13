import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ErrorType, 
  ErrorSeverity, 
  RetryStrategy, 
  OCRError, 
  OCRException, 
  ErrorClassifier,
  ErrorContextBuilder,
  ErrorMetrics 
} from './errors';

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  maxRetries: number;
  strategy: RetryStrategy;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterPercent: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeoutMs: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  totalAttempts: number;
  delay: number;
  error: OCRError;
  context: Record<string, any>;
}

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Circuit breaker information
 */
export interface CircuitBreaker {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: Date;
  nextAttemptTime: Date;
  successCount: number;
}

/**
 * Comprehensive retry handler with circuit breaker pattern
 */
@Injectable()
export class RetryHandlerService {
  private readonly logger = new Logger(RetryHandlerService.name);
  private readonly errorMetrics = new Map<ErrorType, ErrorMetrics>();
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly defaultConfig: RetryConfig;

  constructor(private readonly configService: ConfigService) {
    this.defaultConfig = {
      maxRetries: this.configService.get<number>('OCR_MAX_RETRIES', 3),
      strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      baseDelayMs: this.configService.get<number>('OCR_BASE_DELAY_MS', 1000),
      maxDelayMs: this.configService.get<number>('OCR_MAX_DELAY_MS', 30000),
      jitterPercent: this.configService.get<number>('OCR_JITTER_PERCENT', 10),
      circuitBreakerThreshold: this.configService.get<number>('OCR_CIRCUIT_BREAKER_THRESHOLD', 5),
      circuitBreakerTimeoutMs: this.configService.get<number>('OCR_CIRCUIT_BREAKER_TIMEOUT_MS', 60000)
    };
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Record<string, any>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.defaultConfig, ...customConfig };
    const operationId = this.generateOperationId(context);
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(operationId)) {
      throw new OCRException(
        ErrorClassifier.classifyError(
          new Error('Circuit breaker is open - too many recent failures'),
          context
        )
      );
    }

    let lastError: OCRError | null = null;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        this.logger.log(`Executing operation attempt ${attempt}/${config.maxRetries + 1}`, context);
        
        const result = await operation();
        
        // Success - reset circuit breaker
        this.recordSuccess(operationId);
        
        // Log retry success if this wasn't the first attempt
        if (attempt > 1) {
          this.logger.log(`Operation succeeded on attempt ${attempt} after previous failures`, {
            ...context,
            attempts: attempt,
            previousErrors: lastError?.type
          });
        }
        
        return result;
        
      } catch (error) {
        const classifiedError = ErrorClassifier.classifyError(error, context);
        lastError = classifiedError;
        
        // Record error metrics
        this.recordError(classifiedError);
        
        // Log the error with context
        this.logger.error(
          `Operation failed on attempt ${attempt}: ${classifiedError.message}`,
          {
            ...context,
            attempt,
            errorType: classifiedError.type,
            severity: classifiedError.severity,
            retryable: classifiedError.retryable
          }
        );

        // Check if this is the last attempt or error is not retryable
        if (attempt > config.maxRetries || !classifiedError.retryable) {
          // Record circuit breaker failure
          this.recordFailure(operationId);
          
          // Throw the classified error
          throw new OCRException(classifiedError);
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config, classifiedError.retryStrategy);
        
        this.logger.warn(
          `Retrying operation in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`,
          {
            ...context,
            delay,
            strategy: classifiedError.retryStrategy,
            errorType: classifiedError.type
          }
        );

        // Wait before retry
        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    throw new OCRException(lastError!);
  }

  /**
   * Execute operation with custom error handling
   */
  async executeWithCustomErrorHandling<T>(
    operation: () => Promise<T>,
    context: Record<string, any>,
    errorHandler: (error: OCRError, attempt: RetryAttempt) => boolean | Promise<boolean>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.defaultConfig, ...customConfig };
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const classifiedError = ErrorClassifier.classifyError(error, context);
        const retryAttempt: RetryAttempt = {
          attemptNumber: attempt,
          totalAttempts: config.maxRetries + 1,
          delay: this.calculateDelay(attempt, config, classifiedError.retryStrategy),
          error: classifiedError,
          context
        };

        // Let custom handler decide whether to retry
        const shouldRetry = await errorHandler(classifiedError, retryAttempt);
        
        if (!shouldRetry || attempt > config.maxRetries) {
          throw new OCRException(classifiedError);
        }

        await this.delay(retryAttempt.delay);
      }
    }
    
    // This should never be reached, but satisfies TypeScript
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Calculate delay based on retry strategy
   */
  private calculateDelay(
    attempt: number,
    config: RetryConfig,
    strategy: RetryStrategy
  ): number {
    let delay: number;

    switch (strategy) {
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        delay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt - 1),
          config.maxDelayMs
        );
        break;
      
      case RetryStrategy.LINEAR_BACKOFF:
        delay = Math.min(
          config.baseDelayMs * attempt,
          config.maxDelayMs
        );
        break;
      
      case RetryStrategy.FIXED_DELAY:
        delay = config.baseDelayMs;
        break;
      
      default:
        delay = config.baseDelayMs;
    }

    // Add jitter to prevent thundering herd
    const jitter = delay * (config.jitterPercent / 100);
    const randomJitter = (Math.random() - 0.5) * 2 * jitter;
    
    return Math.max(0, Math.round(delay + randomJitter));
  }

  /**
   * Add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate operation ID for circuit breaker
   */
  private generateOperationId(context: Record<string, any>): string {
    const components = [
      context.userId || 'anonymous',
      context.processingStage || 'unknown',
      context.operationType || 'general'
    ];
    return components.join(':');
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(operationId: string): boolean {
    const breaker = this.circuitBreakers.get(operationId);
    
    if (!breaker) {
      return false;
    }

    const now = new Date();
    
    switch (breaker.state) {
      case CircuitBreakerState.OPEN:
        if (now >= breaker.nextAttemptTime) {
          // Transition to half-open
          breaker.state = CircuitBreakerState.HALF_OPEN;
          breaker.successCount = 0;
          this.logger.log(`Circuit breaker transitioning to HALF_OPEN for ${operationId}`);
          return false;
        }
        return true;
      
      case CircuitBreakerState.HALF_OPEN:
        // Allow limited attempts in half-open state
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId);
    
    if (breaker) {
      if (breaker.state === CircuitBreakerState.HALF_OPEN) {
        breaker.successCount++;
        
        // Reset circuit breaker after successful attempts
        if (breaker.successCount >= 3) {
          breaker.state = CircuitBreakerState.CLOSED;
          breaker.failureCount = 0;
          this.logger.log(`Circuit breaker CLOSED for ${operationId} after successful recovery`);
        }
      } else {
        // Reset failure count on success
        breaker.failureCount = 0;
      }
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationId: string): void {
    let breaker = this.circuitBreakers.get(operationId);
    
    if (!breaker) {
      breaker = {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date(),
        successCount: 0
      };
      this.circuitBreakers.set(operationId, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    // Open circuit breaker if threshold reached
    if (breaker.failureCount >= this.defaultConfig.circuitBreakerThreshold) {
      breaker.state = CircuitBreakerState.OPEN;
      breaker.nextAttemptTime = new Date(
        Date.now() + this.defaultConfig.circuitBreakerTimeoutMs
      );
      
      this.logger.warn(
        `Circuit breaker OPENED for ${operationId} after ${breaker.failureCount} failures`
      );
    }
  }

  /**
   * Record error for metrics
   */
  private recordError(error: OCRError): void {
    const existing = this.errorMetrics.get(error.type);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = error.timestamp;
    } else {
      this.errorMetrics.set(error.type, {
        errorType: error.type,
        count: 1,
        lastOccurrence: error.timestamp,
        severity: error.severity
      });
    }
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values());
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Array<{ operationId: string; breaker: CircuitBreaker }> {
    return Array.from(this.circuitBreakers.entries()).map(([operationId, breaker]) => ({
      operationId,
      breaker
    }));
  }

  /**
   * Reset circuit breaker for specific operation
   */
  resetCircuitBreaker(operationId: string): void {
    const breaker = this.circuitBreakers.get(operationId);
    if (breaker) {
      breaker.state = CircuitBreakerState.CLOSED;
      breaker.failureCount = 0;
      breaker.successCount = 0;
      this.logger.log(`Circuit breaker manually reset for ${operationId}`);
    }
  }

  /**
   * Create error context builder
   */
  createErrorContext(): ErrorContextBuilder {
    return new ErrorContextBuilder();
  }
} 