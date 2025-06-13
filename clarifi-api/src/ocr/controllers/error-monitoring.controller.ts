import { Controller, Get, Post, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RetryHandlerService } from '../common/retry-handler.service';
import { EnhancedOcrService } from '../services/enhanced-ocr.service';

@ApiTags('OCR Error Monitoring')
@Controller('ocr/monitoring')
export class ErrorMonitoringController {
  private readonly logger = new Logger(ErrorMonitoringController.name);

  constructor(
    private readonly retryHandler: RetryHandlerService,
    private readonly enhancedOcrService: EnhancedOcrService
  ) {}

  @Get('error-metrics')
  @ApiOperation({
    summary: 'Get error metrics',
    description: 'Retrieve error metrics for monitoring OCR system health'
  })
  @ApiResponse({
    status: 200,
    description: 'Error metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorType: { type: 'string' },
              count: { type: 'number' },
              lastOccurrence: { type: 'string', format: 'date-time' },
              severity: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getErrorMetrics() {
    this.logger.log('Retrieving error metrics');

    try {
      const metrics = this.enhancedOcrService.getErrorMetrics();
      
      return {
        message: 'Error metrics retrieved successfully',
        data: metrics,
        timestamp: new Date().toISOString(),
        totalErrors: metrics.reduce((sum, metric) => sum + metric.count, 0)
      };
    } catch (error) {
      this.logger.error('Failed to retrieve error metrics', error);
      throw error;
    }
  }

  @Get('circuit-breaker-status')
  @ApiOperation({
    summary: 'Get circuit breaker status',
    description: 'Retrieve current circuit breaker status for all operations'
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operationId: { type: 'string' },
              state: { type: 'string' },
              failureCount: { type: 'number' },
              lastFailureTime: { type: 'string', format: 'date-time' },
              nextAttemptTime: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  async getCircuitBreakerStatus() {
    this.logger.log('Retrieving circuit breaker status');

    try {
      const status = this.enhancedOcrService.getCircuitBreakerStatus();
      
      const openCircuits = status.filter(s => s.breaker.state === 'OPEN').length;
      const halfOpenCircuits = status.filter(s => s.breaker.state === 'HALF_OPEN').length;
      
      return {
        message: 'Circuit breaker status retrieved successfully',
        data: status,
        summary: {
          totalCircuits: status.length,
          openCircuits,
          halfOpenCircuits,
          closedCircuits: status.length - openCircuits - halfOpenCircuits
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to retrieve circuit breaker status', error);
      throw error;
    }
  }

  @Post('circuit-breaker/:operationId/reset')
  @ApiOperation({
    summary: 'Reset circuit breaker',
    description: 'Reset a specific circuit breaker to closed state'
  })
  @ApiParam({
    name: 'operationId',
    description: 'Operation ID for the circuit breaker to reset'
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        operationId: { type: 'string' },
        resetAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async resetCircuitBreaker(@Param('operationId') operationId: string) {
    this.logger.log(`Resetting circuit breaker for operation: ${operationId}`);

    try {
      this.enhancedOcrService.resetCircuitBreaker(operationId);
      
      return {
        message: 'Circuit breaker reset successfully',
        operationId,
        resetAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to reset circuit breaker for ${operationId}`, error);
      throw error;
    }
  }

  @Get('health-check')
  @ApiOperation({
    summary: 'Health check for OCR system',
    description: 'Comprehensive health check including error rates and circuit breaker status'
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        checks: {
          type: 'object',
          properties: {
            errorRate: { type: 'object' },
            circuitBreakers: { type: 'object' },
            recentErrors: { type: 'object' }
          }
        }
      }
    }
  })
  async healthCheck() {
    this.logger.log('Performing OCR system health check');

    try {
      const errorMetrics = this.enhancedOcrService.getErrorMetrics();
      const circuitBreakerStatus = this.enhancedOcrService.getCircuitBreakerStatus();
      
      // Calculate error rates
      const recentErrors = errorMetrics.filter(metric => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return metric.lastOccurrence > oneHourAgo;
      });

      const totalRecentErrors = recentErrors.reduce((sum, metric) => sum + metric.count, 0);
      const criticalErrors = errorMetrics.filter(metric => metric.severity === 'critical');
      const openCircuits = circuitBreakerStatus.filter(s => s.breaker.state === 'OPEN');

      // Determine overall health status
      let status = 'healthy';
      const issues: string[] = [];

      if (criticalErrors.length > 0) {
        status = 'critical';
        issues.push(`${criticalErrors.length} critical errors detected`);
      } else if (openCircuits.length > 0) {
        status = 'degraded';
        issues.push(`${openCircuits.length} circuit breakers are open`);
      } else if (totalRecentErrors > 10) {
        status = 'warning';
        issues.push(`High error rate: ${totalRecentErrors} errors in the last hour`);
      }

      return {
        status,
        issues,
        checks: {
          errorRate: {
            status: totalRecentErrors < 10 ? 'pass' : 'fail',
            recentErrors: totalRecentErrors,
            threshold: 10
          },
          circuitBreakers: {
            status: openCircuits.length === 0 ? 'pass' : 'fail',
            openCircuits: openCircuits.length,
            totalCircuits: circuitBreakerStatus.length
          },
          criticalErrors: {
            status: criticalErrors.length === 0 ? 'pass' : 'fail',
            count: criticalErrors.length
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      
      return {
        status: 'critical',
        issues: ['Health check system failure'],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('system-stats')
  @ApiOperation({
    summary: 'Get system statistics',
    description: 'Retrieve comprehensive system statistics including performance metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully'
  })
  async getSystemStats() {
    this.logger.log('Retrieving system statistics');

    try {
      const errorMetrics = this.enhancedOcrService.getErrorMetrics();
      const circuitBreakerStatus = this.enhancedOcrService.getCircuitBreakerStatus();
      
      // Calculate various statistics
      const errorsByType = errorMetrics.reduce((acc, metric) => {
        acc[metric.errorType] = metric.count;
        return acc;
      }, {} as Record<string, number>);

      const errorsBySeverity = errorMetrics.reduce((acc, metric) => {
        acc[metric.severity] = (acc[metric.severity] || 0) + metric.count;
        return acc;
      }, {} as Record<string, number>);

      const circuitBreakersByState = circuitBreakerStatus.reduce((acc, status) => {
        acc[status.breaker.state] = (acc[status.breaker.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        message: 'System statistics retrieved successfully',
        data: {
          errors: {
            total: errorMetrics.reduce((sum, metric) => sum + metric.count, 0),
            byType: errorsByType,
            bySeverity: errorsBySeverity,
            recentCount: errorMetrics.filter(m => {
              const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
              return m.lastOccurrence > oneHourAgo;
            }).length
          },
          circuitBreakers: {
            total: circuitBreakerStatus.length,
            byState: circuitBreakersByState
          },
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to retrieve system statistics', error);
      throw error;
    }
  }
} 