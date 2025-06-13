import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param,
  Query,
  UseGuards,
  Logger 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { QAMonitoringService } from './qa-monitoring.service';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export class GetErrorsQueryDto {
  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class GetAlertsQueryDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @IsString()
  resolved?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class ResolveAlertDto {
  @IsString()
  resolvedBy: string;
}

@ApiTags('Q&A Dashboard')
@Controller('qa/dashboard')
@ApiBearerAuth()
export class QADashboardController {
  private readonly logger = new Logger(QADashboardController.name);

  constructor(
    private readonly monitoringService: QAMonitoringService,
  ) {}

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get Q&A system metrics',
    description: 'Retrieve comprehensive system metrics including hit rates, costs, and performance'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System metrics retrieved successfully' 
  })
  async getSystemMetrics() {
    try {
      this.logger.debug('Dashboard metrics requested');

      const metrics = await this.monitoringService.getSystemMetrics();
      
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get system metrics: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to retrieve system metrics',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Check Q&A system health',
    description: 'Get overall system health status and component-level health information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System health check completed' 
  })
  async getSystemHealth() {
    try {
      this.logger.debug('System health check requested');

      const health = await this.monitoringService.checkSystemHealth();
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to check system health: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Health check failed',
        data: {
          overall: 'critical',
          components: {
            faqSearch: 'critical',
            llmService: 'critical',
            cacheService: 'critical',
            queryLimits: 'critical',
          },
          details: {
            error: 'Health check service unavailable',
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('errors')
  @ApiOperation({ 
    summary: 'Get recent errors',
    description: 'Retrieve recent error events with optional filtering'
  })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by error severity' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by error type' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of errors to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Errors retrieved successfully' 
  })
  async getRecentErrors(@Query() query: GetErrorsQueryDto) {
    try {
      this.logger.debug(`Errors requested with filters: ${JSON.stringify(query)}`);

      const errors = await this.monitoringService.getRecentErrors({
        severity: query.severity,
        type: query.type,
        userId: query.userId,
        limit: query.limit || 50
      });
      
      return {
        success: true,
        data: {
          errors,
          count: errors.length,
          filters: query
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get recent errors: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to retrieve errors',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('anomalies')
  @ApiOperation({ 
    summary: 'Get cost anomalies',
    description: 'Retrieve recent cost anomalies and unusual spending patterns'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of anomalies to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cost anomalies retrieved successfully' 
  })
  async getCostAnomalies(@Query('limit') limit?: number) {
    try {
      this.logger.debug(`Cost anomalies requested (limit: ${limit || 20})`);

      const anomalies = await this.monitoringService.getCostAnomalies(limit || 20);
      
      return {
        success: true,
        data: {
          anomalies,
          count: anomalies.length
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get cost anomalies: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to retrieve cost anomalies',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('alerts')
  @ApiOperation({ 
    summary: 'Get system alerts',
    description: 'Retrieve system alerts with optional filtering'
  })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by alert level' })
  @ApiQuery({ name: 'component', required: false, description: 'Filter by system component' })
  @ApiQuery({ name: 'resolved', required: false, description: 'Filter by resolution status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of alerts to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerts retrieved successfully' 
  })
  async getSystemAlerts(@Query() query: GetAlertsQueryDto) {
    try {
      this.logger.debug(`Alerts requested with filters: ${JSON.stringify(query)}`);

      const resolved = query.resolved ? query.resolved === 'true' : undefined;

      const alerts = await this.monitoringService.getSystemAlerts({
        level: query.level,
        component: query.component,
        resolved,
        limit: query.limit || 50
      });
      
      return {
        success: true,
        data: {
          alerts,
          count: alerts.length,
          filters: query
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get system alerts: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to retrieve alerts',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('alerts/:alertId/resolve')
  @ApiOperation({ 
    summary: 'Resolve a system alert',
    description: 'Mark a system alert as resolved'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alert resolved successfully' 
  })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() resolveData: ResolveAlertDto
  ) {
    try {
      this.logger.debug(`Resolving alert ${alertId} by ${resolveData.resolvedBy}`);

      await this.monitoringService.resolveAlert(alertId, resolveData.resolvedBy);
      
      return {
        success: true,
        message: `Alert ${alertId} resolved successfully`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to resolve alert ${alertId}: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: `Failed to resolve alert: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('analytics/overview')
  @ApiOperation({ 
    summary: 'Get analytics overview',
    description: 'Get comprehensive analytics overview with key performance indicators'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics overview retrieved successfully' 
  })
  async getAnalyticsOverview() {
    try {
      this.logger.debug('Analytics overview requested');

      const [metrics, health, recentErrors, anomalies] = await Promise.all([
        this.monitoringService.getSystemMetrics(),
        this.monitoringService.checkSystemHealth(),
        this.monitoringService.getRecentErrors({ limit: 10 }),
        this.monitoringService.getCostAnomalies(5)
      ]);

      // Calculate key performance indicators
      const kpis = {
        faqEffectiveness: metrics.faqHitRate,
        costEfficiency: metrics.totalCost / Math.max(metrics.totalQueries, 1),
        systemReliability: 100 - metrics.errorRate,
        userSatisfaction: health.overall === 'healthy' ? 95 : 
                         health.overall === 'degraded' ? 75 : 50,
        responsePerformance: metrics.averageResponseTime < 1000 ? 95 :
                           metrics.averageResponseTime < 3000 ? 75 : 50
      };

      // System status summary
      const statusSummary = {
        overallHealth: health.overall,
        criticalAlerts: recentErrors.filter(e => e.severity === 'critical').length,
        costAnomalies: anomalies.length,
        activeUsers: metrics.activeUsers,
        dailyCost: metrics.totalCost,
        faqHitRate: metrics.faqHitRate
      };

      return {
        success: true,
        data: {
          kpis,
          statusSummary,
          metrics,
          health: health.overall,
          trends: {
            costTrend: anomalies.length > 0 ? 'increasing' : 'stable',
            errorTrend: recentErrors.length > 5 ? 'increasing' : 'stable',
            performanceTrend: metrics.averageResponseTime < 1000 ? 'improving' : 'stable'
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get analytics overview: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to retrieve analytics overview',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('analytics/performance')
  @ApiOperation({ 
    summary: 'Get performance analytics',
    description: 'Get detailed performance metrics and trends'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Performance analytics retrieved successfully' 
  })
  async getPerformanceAnalytics() {
    try {
      this.logger.debug('Performance analytics requested');

      const metrics = await this.monitoringService.getSystemMetrics();
      
      // Performance analysis
      const performanceScore = this.calculatePerformanceScore(metrics);
      const recommendations = this.generatePerformanceRecommendations(metrics);

      return {
        success: true,
        data: {
          performanceScore,
          metrics: {
            responseTime: {
              current: metrics.averageResponseTime,
              target: 1000,
              status: metrics.averageResponseTime < 1000 ? 'good' : 
                     metrics.averageResponseTime < 3000 ? 'warning' : 'critical'
            },
            hitRates: {
              faq: metrics.faqHitRate,
              cache: metrics.cacheHitRate,
              llm: metrics.llmHitRate,
              target: 95
            },
            costEfficiency: {
              currentRate: metrics.totalCost / Math.max(metrics.totalQueries, 1),
              target: 0.005,
              dailySpend: metrics.totalCost
            },
            reliability: {
              errorRate: metrics.errorRate,
              uptime: 100 - metrics.errorRate,
              target: 99.5
            }
          },
          recommendations
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get performance analytics: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to retrieve performance analytics',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Private helper methods

  private calculatePerformanceScore(metrics: any): number {
    let score = 100;
    
    // Response time penalty
    if (metrics.averageResponseTime > 3000) score -= 20;
    else if (metrics.averageResponseTime > 1000) score -= 10;
    
    // FAQ hit rate bonus/penalty
    if (metrics.faqHitRate < 80) score -= 15;
    else if (metrics.faqHitRate > 95) score += 5;
    
    // Error rate penalty
    if (metrics.errorRate > 5) score -= 20;
    else if (metrics.errorRate > 2) score -= 10;
    
    // Cost efficiency
    const costPerQuery = metrics.totalCost / Math.max(metrics.totalQueries, 1);
    if (costPerQuery > 0.01) score -= 15;
    else if (costPerQuery < 0.005) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private generatePerformanceRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.faqHitRate < 90) {
      recommendations.push('Improve FAQ content coverage and search algorithms');
    }
    
    if (metrics.averageResponseTime > 2000) {
      recommendations.push('Optimize response times through better caching strategies');
    }
    
    if (metrics.errorRate > 3) {
      recommendations.push('Investigate and resolve recurring error patterns');
    }
    
    const costPerQuery = metrics.totalCost / Math.max(metrics.totalQueries, 1);
    if (costPerQuery > 0.008) {
      recommendations.push('Optimize prompt engineering and caching to reduce LLM costs');
    }
    
    if (metrics.cacheHitRate < 70) {
      recommendations.push('Improve cache strategy and retention policies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System performance is optimal - maintain current strategies');
    }
    
    return recommendations;
  }
} 