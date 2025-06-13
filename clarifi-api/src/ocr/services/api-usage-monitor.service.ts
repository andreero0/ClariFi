import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * API usage metrics interface
 */
export interface ApiUsageMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  quotaUsage: number;
  quotaLimit: number;
  lastUpdated: Date;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  responseTime: {
    min: number;
    max: number;
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  errorRate: {
    last5Min: number;
    lastHour: number;
    last24Hours: number;
  };
}

/**
 * Alert configuration interface
 */
export interface AlertConfig {
  quotaThresholds: {
    warning: number; // 80%
    critical: number; // 95%
  };
  errorRateThresholds: {
    warning: number; // 5%
    critical: number; // 15%
  };
  responseTimeThresholds: {
    warning: number; // 5000ms
    critical: number; // 10000ms
  };
  costThresholds: {
    dailyWarning: number;
    monthlyWarning: number;
  };
}

/**
 * Usage record interface
 */
export interface UsageRecord {
  timestamp: Date;
  userId?: string;
  operation: string;
  responseTime: number;
  success: boolean;
  cost: number;
  tokenCount?: number;
  errorType?: string;
  metadata?: Record<string, any>;
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: 'quota' | 'error_rate' | 'response_time' | 'cost';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Comprehensive API usage monitoring service
 */
@Injectable()
export class ApiUsageMonitorService {
  private readonly logger = new Logger(ApiUsageMonitorService.name);
  
  // In-memory storage (in production, use Redis or database)
  private readonly usageRecords: UsageRecord[] = [];
  private readonly alerts: Alert[] = [];
  private readonly metrics = new Map<string, any>();
  
  // Configuration
  private readonly alertConfig: AlertConfig;
  private readonly maxRecordsInMemory: number;
  
  // Performance tracking
  private readonly responseTimes: number[] = [];
  private readonly hourlyStats = new Map<string, any>();
  private readonly dailyStats = new Map<string, any>();

  constructor(private readonly configService: ConfigService) {
    this.maxRecordsInMemory = this.configService.get<number>('MONITOR_MAX_RECORDS', 10000);
    
    this.alertConfig = {
      quotaThresholds: {
        warning: this.configService.get<number>('QUOTA_WARNING_THRESHOLD', 80),
        critical: this.configService.get<number>('QUOTA_CRITICAL_THRESHOLD', 95)
      },
      errorRateThresholds: {
        warning: this.configService.get<number>('ERROR_RATE_WARNING_THRESHOLD', 5),
        critical: this.configService.get<number>('ERROR_RATE_CRITICAL_THRESHOLD', 15)
      },
      responseTimeThresholds: {
        warning: this.configService.get<number>('RESPONSE_TIME_WARNING_THRESHOLD', 5000),
        critical: this.configService.get<number>('RESPONSE_TIME_CRITICAL_THRESHOLD', 10000)
      },
      costThresholds: {
        dailyWarning: this.configService.get<number>('DAILY_COST_WARNING', 10),
        monthlyWarning: this.configService.get<number>('MONTHLY_COST_WARNING', 200)
      }
    };

    this.logger.log('API Usage Monitor Service initialized');
  }

  /**
   * Record API usage
   */
  recordApiUsage(record: UsageRecord): void {
    // Add timestamp if not provided
    if (!record.timestamp) {
      record.timestamp = new Date();
    }

    // Store the record
    this.usageRecords.push(record);

    // Clean up old records to prevent memory issues
    if (this.usageRecords.length > this.maxRecordsInMemory) {
      this.usageRecords.splice(0, this.usageRecords.length - this.maxRecordsInMemory);
    }

    // Update real-time metrics
    this.updateMetrics(record);

    // Track response times for performance analysis
    if (record.responseTime) {
      this.responseTimes.push(record.responseTime);
      if (this.responseTimes.length > 1000) {
        this.responseTimes.splice(0, 100); // Keep last 1000 response times
      }
    }

    // Check for alerts
    this.checkAlerts(record);

    this.logger.debug(`Recorded API usage: ${record.operation}, success: ${record.success}, cost: $${record.cost}`);
  }

  /**
   * Get current API usage metrics
   */
  getCurrentMetrics(): ApiUsageMetrics {
    const now = new Date();
    const records = this.getRecordsInTimeRange(now, 24 * 60 * 60 * 1000); // Last 24 hours

    const totalCalls = records.length;
    const successfulCalls = records.filter(r => r.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const averageResponseTime = records.length > 0 
      ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length 
      : 0;
    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

    // Get quota usage from Google Cloud Vision API (this would be from actual API in production)
    const quotaUsage = this.estimateQuotaUsage(records);
    const quotaLimit = this.configService.get<number>('VISION_API_QUOTA_LIMIT', 1000);

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCost,
      averageResponseTime,
      errorRate,
      quotaUsage,
      quotaLimit,
      lastUpdated: now
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = new Date();
    
    // Calculate response time percentiles
    const sortedResponseTimes = [...this.responseTimes].sort((a, b) => a - b);
    const responseTime = {
      min: sortedResponseTimes[0] || 0,
      max: sortedResponseTimes[sortedResponseTimes.length - 1] || 0,
      average: sortedResponseTimes.length > 0 
        ? sortedResponseTimes.reduce((sum, rt) => sum + rt, 0) / sortedResponseTimes.length 
        : 0,
      p95: this.calculatePercentile(sortedResponseTimes, 95),
      p99: this.calculatePercentile(sortedResponseTimes, 99)
    };

    // Calculate throughput
    const last1Min = this.getRecordsInTimeRange(now, 1 * 60 * 1000);
    const lastHour = this.getRecordsInTimeRange(now, 60 * 60 * 1000);
    const last24Hours = this.getRecordsInTimeRange(now, 24 * 60 * 60 * 1000);

    const throughput = {
      requestsPerMinute: last1Min.length,
      requestsPerHour: lastHour.length,
      requestsPerDay: last24Hours.length
    };

    // Calculate error rates
    const errorRate = {
      last5Min: this.calculateErrorRate(this.getRecordsInTimeRange(now, 5 * 60 * 1000)),
      lastHour: this.calculateErrorRate(lastHour),
      last24Hours: this.calculateErrorRate(last24Hours)
    };

    return {
      responseTime,
      throughput,
      errorRate
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.log(`Alert acknowledged: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Get usage by time period
   */
  getUsageByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    granularity: 'hour' | 'day' = 'hour'
  ): Array<{ timestamp: Date; metrics: ApiUsageMetrics }> {
    const records = this.usageRecords.filter(
      r => r.timestamp >= startDate && r.timestamp <= endDate
    );

    const grouped = this.groupRecordsByTime(records, granularity);
    
    return Object.entries(grouped).map(([timestamp, records]) => ({
      timestamp: new Date(timestamp),
      metrics: this.calculateMetricsForRecords(records as UsageRecord[])
    }));
  }

  /**
   * Get user-specific usage stats
   */
  getUserUsageStats(userId: string, timeRangeMs: number = 24 * 60 * 60 * 1000): ApiUsageMetrics {
    const now = new Date();
    const records = this.usageRecords.filter(
      r => r.userId === userId && 
           r.timestamp >= new Date(now.getTime() - timeRangeMs)
    );

    return this.calculateMetricsForRecords(records);
  }

  /**
   * Get top users by usage
   */
  getTopUsersByUsage(limit: number = 10, timeRangeMs: number = 24 * 60 * 60 * 1000): Array<{
    userId: string;
    metrics: ApiUsageMetrics;
  }> {
    const now = new Date();
    const recentRecords = this.usageRecords.filter(
      r => r.timestamp >= new Date(now.getTime() - timeRangeMs)
    );

    const userGroups = recentRecords.reduce((groups, record) => {
      const userId = record.userId || 'anonymous';
      if (!groups[userId]) {
        groups[userId] = [];
      }
      groups[userId].push(record);
      return groups;
    }, {} as Record<string, UsageRecord[]>);

    return Object.entries(userGroups)
      .map(([userId, records]) => ({
        userId,
        metrics: this.calculateMetricsForRecords(records)
      }))
      .sort((a, b) => b.metrics.totalCalls - a.metrics.totalCalls)
      .slice(0, limit);
  }

  /**
   * Scheduled task to clean up old data and generate reports
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async performHousekeeping(): Promise<void> {
    this.logger.log('Performing monitoring housekeeping tasks');

    // Clean up old alerts
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alertsToRemove = this.alerts.filter(alert => 
      alert.acknowledged && alert.timestamp < oneDayAgo
    );
    
    alertsToRemove.forEach(alert => {
      const index = this.alerts.indexOf(alert);
      if (index > -1) {
        this.alerts.splice(index, 1);
      }
    });

    // Generate hourly statistics
    this.generateHourlyStats();

    // Check system health
    this.performHealthCheck();

    this.logger.log(`Housekeeping completed. Removed ${alertsToRemove.length} old alerts.`);
  }

  /**
   * Update metrics with new record
   */
  private updateMetrics(record: UsageRecord): void {
    const key = `${record.operation}_${new Date().toISOString().split('T')[0]}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        calls: 0,
        successfulCalls: 0,
        totalCost: 0,
        totalResponseTime: 0
      });
    }

    const metric = this.metrics.get(key);
    metric.calls++;
    metric.totalCost += record.cost;
    metric.totalResponseTime += record.responseTime;
    
    if (record.success) {
      metric.successfulCalls++;
    }
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(record: UsageRecord): void {
    // Check response time alerts
    const responseTimeWarningThreshold = this.configService.get<number>('RESPONSE_TIME_WARNING_THRESHOLD', 5000);
    const responseTimeCriticalThreshold = this.configService.get<number>('RESPONSE_TIME_CRITICAL_THRESHOLD', 10000);

    if (record.responseTime > responseTimeCriticalThreshold) {
      this.createAlert('response_time', 'critical', 
        `Response time exceeded critical threshold: ${record.responseTime}ms`,
        record.responseTime, responseTimeCriticalThreshold);
    } else if (record.responseTime > responseTimeWarningThreshold) {
      this.createAlert('response_time', 'warning',
        `Response time exceeded warning threshold: ${record.responseTime}ms`,
        record.responseTime, responseTimeWarningThreshold);
    }

    // Check error rate
    const recentRecords = this.usageRecords.slice(-100);
    const errorRate = this.calculateErrorRate(recentRecords);
    
    const errorRateWarningThreshold = this.configService.get<number>('ERROR_RATE_WARNING_THRESHOLD', 5);
    const errorRateCriticalThreshold = this.configService.get<number>('ERROR_RATE_CRITICAL_THRESHOLD', 15);

    if (errorRate > errorRateCriticalThreshold) {
      this.createAlert('error_rate', 'critical',
        `Error rate exceeded critical threshold: ${errorRate.toFixed(2)}%`,
        errorRate, errorRateCriticalThreshold);
    } else if (errorRate > errorRateWarningThreshold) {
      this.createAlert('error_rate', 'warning',
        `Error rate exceeded warning threshold: ${errorRate.toFixed(2)}%`,
        errorRate, errorRateWarningThreshold);
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: Alert['type'], 
    severity: Alert['severity'], 
    message: string, 
    value: number, 
    threshold: number
  ): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      alert => alert.type === type && 
               alert.severity === severity && 
               !alert.acknowledged &&
               (new Date().getTime() - alert.timestamp.getTime()) < 5 * 60 * 1000 // Within 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: `${type}_${severity}_${Date.now()}`,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    this.logger.warn(`Alert created: ${alert.message}`);

    // In production, this would trigger notification systems
    this.sendAlert(alert);
  }

  /**
   * Send alert notification (placeholder for actual notification system)
   */
  private sendAlert(alert: Alert): void {
    // This would integrate with email, Slack, PagerDuty, etc.
    this.logger.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
  }

  /**
   * Helper methods
   */
  private getRecordsInTimeRange(endTime: Date, rangeMs: number): UsageRecord[] {
    const startTime = new Date(endTime.getTime() - rangeMs);
    return this.usageRecords.filter(
      r => r.timestamp >= startTime && r.timestamp <= endTime
    );
  }

  private calculateErrorRate(records: UsageRecord[]): number {
    if (records.length === 0) return 0;
    const failures = records.filter(r => !r.success).length;
    return (failures / records.length) * 100;
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  private estimateQuotaUsage(records: UsageRecord[]): number {
    // This is a simplified estimation - in production, use actual API quota data
    return records.filter(r => r.success).length;
  }

  private calculateMetricsForRecords(records: UsageRecord[]): ApiUsageMetrics {
    const totalCalls = records.length;
    const successfulCalls = records.filter(r => r.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const averageResponseTime = records.length > 0 
      ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length 
      : 0;
    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCost,
      averageResponseTime,
      errorRate,
      quotaUsage: successfulCalls,
      quotaLimit: this.configService.get<number>('VISION_API_QUOTA_LIMIT', 1000),
      lastUpdated: new Date()
    };
  }

  private groupRecordsByTime(records: UsageRecord[], granularity: 'hour' | 'day'): Record<string, UsageRecord[]> {
    return records.reduce((groups, record) => {
      let timeKey: string;
      
      if (granularity === 'hour') {
        timeKey = record.timestamp.toISOString().slice(0, 13) + ':00:00.000Z';
      } else {
        timeKey = record.timestamp.toISOString().slice(0, 10) + 'T00:00:00.000Z';
      }

      if (!groups[timeKey]) {
        groups[timeKey] = [];
      }
      groups[timeKey].push(record);
      
      return groups;
    }, {} as Record<string, UsageRecord[]>);
  }

  private generateHourlyStats(): void {
    const now = new Date();
    const hourKey = now.toISOString().slice(0, 13);
    
    const hourlyRecords = this.getRecordsInTimeRange(now, 60 * 60 * 1000);
    const stats = this.calculateMetricsForRecords(hourlyRecords);
    
    this.hourlyStats.set(hourKey, stats);
    
    // Keep only last 24 hours of stats
    if (this.hourlyStats.size > 24) {
      const oldestKey = Array.from(this.hourlyStats.keys()).sort()[0];
      this.hourlyStats.delete(oldestKey);
    }
  }

  private performHealthCheck(): void {
    const metrics = this.getCurrentMetrics();
    const performance = this.getPerformanceMetrics();
    
    this.logger.log(`Health Check - Calls: ${metrics.totalCalls}, Error Rate: ${metrics.errorRate.toFixed(2)}%, Avg Response: ${metrics.averageResponseTime.toFixed(2)}ms`);
    
    if (metrics.errorRate > 20) {
      this.logger.error(`High error rate detected: ${metrics.errorRate.toFixed(2)}%`);
    }
    
    if (performance.responseTime.average > 5000) {
      this.logger.warn(`High average response time: ${performance.responseTime.average.toFixed(2)}ms`);
    }
  }
} 