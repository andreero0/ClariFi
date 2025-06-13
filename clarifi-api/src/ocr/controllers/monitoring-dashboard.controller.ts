import { Controller, Get, Post, Param, Query, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ApiUsageMonitorService, ApiUsageMetrics, PerformanceMetrics, Alert } from '../services/api-usage-monitor.service';

@ApiTags('Monitoring Dashboard')
@Controller('monitoring')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MonitoringDashboardController {
  constructor(
    private readonly apiUsageMonitorService: ApiUsageMonitorService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get monitoring overview dashboard data' })
  @ApiResponse({ status: 200, description: 'Returns comprehensive monitoring overview' })
  async getOverview() {
    const currentMetrics = this.apiUsageMonitorService.getCurrentMetrics();
    const performanceMetrics = this.apiUsageMonitorService.getPerformanceMetrics();
    const activeAlerts = this.apiUsageMonitorService.getActiveAlerts();

    return {
      overview: {
        status: this.determineSystemStatus(currentMetrics, performanceMetrics, activeAlerts),
        last_updated: new Date(),
        uptime_percentage: 99.9, // This would be calculated from actual uptime data
      },
      metrics: currentMetrics,
      performance: performanceMetrics,
      alerts: {
        active_count: activeAlerts.length,
        critical_count: activeAlerts.filter(a => a.severity === 'critical').length,
        warning_count: activeAlerts.filter(a => a.severity === 'warning').length,
        recent_alerts: activeAlerts.slice(0, 5)
      },
      health_indicators: this.generateHealthIndicators(currentMetrics, performanceMetrics)
    };
  }

  @Get('metrics/current')
  @ApiOperation({ summary: 'Get current API usage metrics' })
  @ApiResponse({ status: 200, description: 'Returns current API usage statistics' })
  async getCurrentMetrics(): Promise<ApiUsageMetrics> {
    return this.apiUsageMonitorService.getCurrentMetrics();
  }

  @Get('metrics/performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Returns system performance metrics' })
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.apiUsageMonitorService.getPerformanceMetrics();
  }

  @Get('metrics/historical')
  @ApiOperation({ summary: 'Get historical usage data' })
  @ApiResponse({ status: 200, description: 'Returns historical usage metrics' })
  async getHistoricalMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity: 'hour' | 'day' = 'hour'
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const historicalData = this.apiUsageMonitorService.getUsageByTimePeriod(start, end, granularity);
    
    return {
      data: historicalData,
      summary: {
        total_records: historicalData.length,
        period: {
          start,
          end,
          granularity
        },
        trends: this.calculateTrends(historicalData)
      }
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all active alerts' })
  @ApiResponse({ status: 200, description: 'Returns list of active alerts' })
  async getAlerts(): Promise<Alert[]> {
    return this.apiUsageMonitorService.getActiveAlerts();
  }

  @Post('alerts/:alertId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  @HttpCode(200)
  async acknowledgeAlert(@Param('alertId') alertId: string) {
    const success = this.apiUsageMonitorService.acknowledgeAlert(alertId);
    
    if (!success) {
      return { error: 'Alert not found', alertId };
    }

    return { 
      message: 'Alert acknowledged successfully', 
      alertId,
      acknowledged_at: new Date()
    };
  }

  @Get('users/top')
  @ApiOperation({ summary: 'Get top users by API usage' })
  @ApiResponse({ status: 200, description: 'Returns top users by usage' })
  async getTopUsers(
    @Query('limit') limit: string = '10',
    @Query('timeRange') timeRange: string = '24' // hours
  ) {
    const limitNum = parseInt(limit, 10);
    const timeRangeMs = parseInt(timeRange, 10) * 60 * 60 * 1000; // Convert hours to milliseconds

    const topUsers = this.apiUsageMonitorService.getTopUsersByUsage(limitNum, timeRangeMs);
    
    return {
      users: topUsers,
      metadata: {
        limit: limitNum,
        time_range_hours: parseInt(timeRange, 10),
        generated_at: new Date()
      }
    };
  }

  @Get('users/:userId/stats')
  @ApiOperation({ summary: 'Get usage statistics for a specific user' })
  @ApiResponse({ status: 200, description: 'Returns user-specific usage statistics' })
  async getUserStats(
    @Param('userId') userId: string,
    @Query('timeRange') timeRange: string = '24' // hours
  ) {
    const timeRangeMs = parseInt(timeRange, 10) * 60 * 60 * 1000;
    const userStats = this.apiUsageMonitorService.getUserUsageStats(userId, timeRangeMs);
    
    return {
      user_id: userId,
      stats: userStats,
      metadata: {
        time_range_hours: parseInt(timeRange, 10),
        generated_at: new Date()
      }
    };
  }

  @Get('quota/status')
  @ApiOperation({ summary: 'Get current quota status' })
  @ApiResponse({ status: 200, description: 'Returns quota usage and limits' })
  async getQuotaStatus() {
    const metrics = this.apiUsageMonitorService.getCurrentMetrics();
    const quotaPercentage = (metrics.quotaUsage / metrics.quotaLimit) * 100;
    
    return {
      quota: {
        used: metrics.quotaUsage,
        limit: metrics.quotaLimit,
        percentage: quotaPercentage,
        remaining: metrics.quotaLimit - metrics.quotaUsage
      },
      status: this.getQuotaStatusLevel(quotaPercentage),
      projected_exhaustion: this.calculateProjectedExhaustion(metrics),
      recommendations: this.generateQuotaRecommendations(quotaPercentage)
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Returns comprehensive system health' })
  async getHealthStatus() {
    const metrics = this.apiUsageMonitorService.getCurrentMetrics();
    const performance = this.apiUsageMonitorService.getPerformanceMetrics();
    const alerts = this.apiUsageMonitorService.getActiveAlerts();

    const healthScore = this.calculateHealthScore(metrics, performance, alerts);
    
    return {
      overall_health: this.getHealthLevel(healthScore),
      health_score: healthScore,
      components: {
        api_availability: {
          status: metrics.errorRate < 5 ? 'healthy' : metrics.errorRate < 15 ? 'degraded' : 'unhealthy',
          error_rate: metrics.errorRate,
          success_rate: (metrics.successfulCalls / metrics.totalCalls) * 100
        },
        performance: {
          status: performance.responseTime.average < 5000 ? 'healthy' : 
                  performance.responseTime.average < 10000 ? 'degraded' : 'unhealthy',
          average_response_time: performance.responseTime.average,
          p95_response_time: performance.responseTime.p95
        },
        quota_usage: {
          status: (metrics.quotaUsage / metrics.quotaLimit) < 0.8 ? 'healthy' : 
                  (metrics.quotaUsage / metrics.quotaLimit) < 0.95 ? 'warning' : 'critical',
          usage_percentage: (metrics.quotaUsage / metrics.quotaLimit) * 100
        },
        alerts: {
          status: alerts.length === 0 ? 'healthy' : 
                  alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning',
          active_alerts: alerts.length,
          critical_alerts: alerts.filter(a => a.severity === 'critical').length
        }
      },
      last_updated: new Date()
    };
  }

  @Get('costs')
  @ApiOperation({ summary: 'Get cost analysis and projections' })
  @ApiResponse({ status: 200, description: 'Returns cost analysis data' })
  async getCostAnalysis(
    @Query('period') period: string = '30' // days
  ) {
    const periodDays = parseInt(period, 10);
    const metrics = this.apiUsageMonitorService.getCurrentMetrics();
    
    // Calculate daily average cost
    const dailyAverage = metrics.totalCost; // This is 24h data, so it's already daily
    const projectedMonthlyCost = dailyAverage * 30;
    const projectedYearlyCost = dailyAverage * 365;

    return {
      current_period: {
        total_cost: metrics.totalCost,
        period_days: 1, // 24h period
        daily_average: dailyAverage
      },
      projections: {
        monthly: projectedMonthlyCost,
        yearly: projectedYearlyCost
      },
      breakdown: {
        cost_per_call: metrics.totalCalls > 0 ? metrics.totalCost / metrics.totalCalls : 0,
        cost_per_successful_call: metrics.successfulCalls > 0 ? metrics.totalCost / metrics.successfulCalls : 0
      },
      recommendations: this.generateCostRecommendations(metrics, dailyAverage),
      last_updated: new Date()
    };
  }

  /**
   * Helper methods for calculations and status determination
   */
  private determineSystemStatus(
    metrics: ApiUsageMetrics, 
    performance: PerformanceMetrics, 
    alerts: Alert[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    
    if (criticalAlerts.length > 0 || metrics.errorRate > 15 || performance.responseTime.average > 10000) {
      return 'unhealthy';
    }
    
    if (alerts.length > 0 || metrics.errorRate > 5 || performance.responseTime.average > 5000) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private generateHealthIndicators(metrics: ApiUsageMetrics, performance: PerformanceMetrics) {
    return [
      {
        name: 'API Success Rate',
        value: metrics.totalCalls > 0 ? (metrics.successfulCalls / metrics.totalCalls) * 100 : 0,
        unit: '%',
        status: metrics.errorRate < 5 ? 'good' : metrics.errorRate < 15 ? 'warning' : 'critical'
      },
      {
        name: 'Average Response Time',
        value: performance.responseTime.average,
        unit: 'ms',
        status: performance.responseTime.average < 2000 ? 'good' : 
                performance.responseTime.average < 5000 ? 'warning' : 'critical'
      },
      {
        name: 'Quota Usage',
        value: (metrics.quotaUsage / metrics.quotaLimit) * 100,
        unit: '%',
        status: (metrics.quotaUsage / metrics.quotaLimit) < 0.7 ? 'good' : 
                (metrics.quotaUsage / metrics.quotaLimit) < 0.9 ? 'warning' : 'critical'
      },
      {
        name: 'Daily Cost',
        value: metrics.totalCost,
        unit: '$',
        status: metrics.totalCost < 5 ? 'good' : metrics.totalCost < 20 ? 'warning' : 'critical'
      }
    ];
  }

  private calculateTrends(historicalData: Array<{ timestamp: Date; metrics: ApiUsageMetrics }>) {
    if (historicalData.length < 2) {
      return { calls: 'stable', errors: 'stable', response_time: 'stable', cost: 'stable' };
    }

    const recent = historicalData.slice(-5); // Last 5 data points
    const older = historicalData.slice(-10, -5); // Previous 5 data points

    const recentAvg = {
      calls: recent.reduce((sum, d) => sum + d.metrics.totalCalls, 0) / recent.length,
      errors: recent.reduce((sum, d) => sum + d.metrics.errorRate, 0) / recent.length,
      responseTime: recent.reduce((sum, d) => sum + d.metrics.averageResponseTime, 0) / recent.length,
      cost: recent.reduce((sum, d) => sum + d.metrics.totalCost, 0) / recent.length
    };

    const olderAvg = {
      calls: older.reduce((sum, d) => sum + d.metrics.totalCalls, 0) / older.length,
      errors: older.reduce((sum, d) => sum + d.metrics.errorRate, 0) / older.length,
      responseTime: older.reduce((sum, d) => sum + d.metrics.averageResponseTime, 0) / older.length,
      cost: older.reduce((sum, d) => sum + d.metrics.totalCost, 0) / older.length
    };

    return {
      calls: this.getTrendDirection(recentAvg.calls, olderAvg.calls),
      errors: this.getTrendDirection(recentAvg.errors, olderAvg.errors),
      response_time: this.getTrendDirection(recentAvg.responseTime, olderAvg.responseTime),
      cost: this.getTrendDirection(recentAvg.cost, olderAvg.cost)
    };
  }

  private getTrendDirection(recent: number, older: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = 0.1; // 10% change threshold
    const change = (recent - older) / older;
    
    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  }

  private getQuotaStatusLevel(percentage: number): 'normal' | 'warning' | 'critical' {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'normal';
  }

  private calculateProjectedExhaustion(metrics: ApiUsageMetrics): Date | null {
    if (metrics.quotaUsage === 0) return null;
    
    // Simple linear projection based on current usage rate
    const remaining = metrics.quotaLimit - metrics.quotaUsage;
    const usageRate = metrics.quotaUsage / 24; // Assuming 24h metrics, get hourly rate
    
    if (usageRate <= 0) return null;
    
    const hoursToExhaustion = remaining / usageRate;
    return new Date(Date.now() + hoursToExhaustion * 60 * 60 * 1000);
  }

  private generateQuotaRecommendations(percentage: number): string[] {
    const recommendations: string[] = [];
    
    if (percentage > 90) {
      recommendations.push('Consider increasing quota limits immediately');
      recommendations.push('Implement request throttling for non-critical operations');
      recommendations.push('Review and optimize API usage patterns');
    } else if (percentage > 70) {
      recommendations.push('Monitor quota usage closely');
      recommendations.push('Consider implementing usage optimization strategies');
      recommendations.push('Review peak usage patterns');
    } else {
      recommendations.push('Quota usage is within normal ranges');
      recommendations.push('Continue monitoring for unusual patterns');
    }
    
    return recommendations;
  }

  private calculateHealthScore(
    metrics: ApiUsageMetrics, 
    performance: PerformanceMetrics, 
    alerts: Alert[]
  ): number {
    let score = 100;
    
    // Deduct for error rate
    score -= metrics.errorRate * 2; // 2 points per % error rate
    
    // Deduct for slow response times
    if (performance.responseTime.average > 5000) {
      score -= (performance.responseTime.average - 5000) / 100; // 1 point per 100ms over 5s
    }
    
    // Deduct for alerts
    score -= alerts.filter(a => a.severity === 'critical').length * 20; // 20 points per critical alert
    score -= alerts.filter(a => a.severity === 'warning').length * 10; // 10 points per warning alert
    
    // Deduct for high quota usage
    const quotaPercentage = (metrics.quotaUsage / metrics.quotaLimit) * 100;
    if (quotaPercentage > 80) {
      score -= (quotaPercentage - 80) * 2; // 2 points per % over 80%
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getHealthLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private generateCostRecommendations(metrics: ApiUsageMetrics, dailyAverage: number): string[] {
    const recommendations: string[] = [];
    
    if (dailyAverage > 20) {
      recommendations.push('High daily cost detected - review API usage patterns');
      recommendations.push('Consider implementing caching to reduce redundant API calls');
      recommendations.push('Evaluate cost-effectiveness of current usage model');
    } else if (dailyAverage > 10) {
      recommendations.push('Monitor cost trends for optimization opportunities');
      recommendations.push('Consider implementing usage analytics for cost control');
    } else {
      recommendations.push('Cost levels are within acceptable ranges');
      recommendations.push('Continue monitoring for cost optimization opportunities');
    }
    
    const costPerCall = metrics.totalCalls > 0 ? metrics.totalCost / metrics.totalCalls : 0;
    if (costPerCall > 0.05) {
      recommendations.push('High cost-per-call detected - optimize request efficiency');
    }
    
    return recommendations;
  }
} 