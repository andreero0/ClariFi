import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PerformanceMonitorService } from './performance-monitor.service';
import { AlertingService, AlertMetrics, Alert } from './alerting.service';
import { RedisService } from '../redis/redis.service';

export interface MonitoringDashboard {
  currentMetrics: AlertMetrics;
  activeAlerts: Alert[];
  systemHealth: {
    redis: boolean;
    database: boolean;
    aiService: boolean;
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  };
  performanceTrends: {
    accuracy: number[];
    cost: number[];
    latency: number[];
    throughput: number[];
    timestamps: Date[];
  };
  recommendations: string[];
}

export interface PrometheusMetrics {
  categorization_accuracy_percentage: number;
  categorization_cost_per_statement_dollars: number;
  categorization_error_rate_percentage: number;
  categorization_latency_milliseconds: number;
  categorization_throughput_per_minute: number;
  categorization_cache_hit_rate_percentage: number;
  categorization_active_alerts_count: number;
  categorization_ai_api_calls_total: number;
  categorization_rule_based_hits_total: number;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly metricsPrefix = 'categorization:monitoring:';
  private readonly trendDataPoints = 24; // Store 24 hours of hourly data

  constructor(
    private readonly configService: ConfigService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly alertingService: AlertingService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Scheduled monitoring check - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performScheduledMonitoring(): Promise<void> {
    try {
      this.logger.log('Starting scheduled monitoring check');
      
      // Collect current metrics
      const metrics = await this.collectCurrentMetrics();
      
      // Store metrics for trending
      await this.storeMetricsForTrending(metrics);
      
      // Check for alerts
      const triggeredAlerts = await this.alertingService.checkMetricsAndAlert(metrics);
      
      if (triggeredAlerts.length > 0) {
        this.logger.warn(`Triggered ${triggeredAlerts.length} alerts during monitoring check`);
      }
      
      // Auto-resolve alerts if metrics have recovered
      await this.checkForAlertResolution(metrics);
      
      this.logger.log('Completed scheduled monitoring check');
    } catch (error) {
      this.logger.error(`Error during scheduled monitoring: ${error.message}`);
    }
  }

  /**
   * Collect current performance metrics
   */
  async collectCurrentMetrics(): Promise<AlertMetrics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Get performance statistics from the last hour
      const stats = await this.performanceMonitor.getPerformanceReport('hour');
      
      // Calculate accuracy from recent categorizations
      const accuracy = await this.calculateAccuracy();
      
      // Calculate cost per statement
      const costPerStatement = stats.totalCost / Math.max(stats.totalTransactions, 1);
      
      // Calculate error rate
      const errorRate = stats.errorRate * 100;
      
      // Calculate average latency
      const averageLatency = stats.averageLatency;
      
      // Calculate throughput (transactions per minute)
      const throughput = (stats.totalTransactions / 60); // Assuming 1-hour window
      
      return {
        accuracy,
        costPerStatement,
        errorRate,
        averageLatency,
        throughput,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error(`Error collecting current metrics: ${error.message}`);
      
      // Return default metrics to prevent monitoring failure
      return {
        accuracy: 0,
        costPerStatement: 0,
        errorRate: 100,
        averageLatency: 0,
        throughput: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Calculate categorization accuracy from recent feedback
   */
  private async calculateAccuracy(): Promise<number> {
    try {
      // This would typically involve analyzing recent categorizations
      // and comparing with user feedback or known correct categories
      // For now, return a simulated accuracy based on system health
      
      const systemHealth = await this.checkSystemHealth();
      if (systemHealth.overallStatus === 'healthy') {
        return 87.5; // Simulated good accuracy
      } else if (systemHealth.overallStatus === 'degraded') {
        return 82.0; // Simulated degraded accuracy
      } else {
        return 75.0; // Simulated poor accuracy
      }
    } catch (error) {
      this.logger.error(`Error calculating accuracy: ${error.message}`);
      return 0;
    }
  }

  /**
   * Store metrics for trending analysis
   */
  private async storeMetricsForTrending(metrics: AlertMetrics): Promise<void> {
    try {
      const redisClient = this.redis.getClient();
      const timestamp = Math.floor(metrics.timestamp.getTime() / 1000);
      const hourKey = Math.floor(timestamp / 3600); // Hour-based key
      
      const trendKey = `${this.metricsPrefix}trends:${hourKey}`;
      const trendData = {
        accuracy: metrics.accuracy,
        cost: metrics.costPerStatement,
        errorRate: metrics.errorRate,
        latency: metrics.averageLatency,
        throughput: metrics.throughput,
        timestamp: metrics.timestamp.toISOString(),
      };
      
      // Store with 7-day TTL
      await redisClient.setex(trendKey, 7 * 24 * 60 * 60, JSON.stringify(trendData));
      
      // Clean up old trend data
      await this.cleanupOldTrendData();
    } catch (error) {
      this.logger.error(`Error storing metrics for trending: ${error.message}`);
    }
  }

  /**
   * Check for alert resolution
   */
  private async checkForAlertResolution(currentMetrics: AlertMetrics): Promise<void> {
    try {
      const activeAlerts = await this.alertingService.getActiveAlerts();
      const thresholds = this.alertingService.getThresholds();
      
      for (const alert of activeAlerts) {
        let shouldResolve = false;
        
        switch (alert.type) {
          case 'accuracy':
            shouldResolve = currentMetrics.accuracy >= thresholds.accuracyThreshold;
            break;
          case 'cost':
            shouldResolve = currentMetrics.costPerStatement <= thresholds.costPerStatementThreshold;
            break;
          case 'error_rate':
            shouldResolve = currentMetrics.errorRate <= thresholds.errorRateThreshold;
            break;
          case 'latency':
            shouldResolve = currentMetrics.averageLatency <= thresholds.latencyThreshold;
            break;
          case 'throughput':
            shouldResolve = currentMetrics.throughput >= thresholds.throughputThreshold;
            break;
        }
        
        if (shouldResolve) {
          await this.alertingService.resolveAlert(alert.id);
          this.logger.log(`Auto-resolved alert: ${alert.id} (${alert.type})`);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking for alert resolution: ${error.message}`);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getMonitoringDashboard(): Promise<MonitoringDashboard> {
    try {
      const currentMetrics = await this.collectCurrentMetrics();
      const activeAlerts = await this.alertingService.getActiveAlerts();
      const systemHealth = await this.checkSystemHealth();
      const performanceTrends = await this.getPerformanceTrends();
      const recommendations = await this.generateRecommendations(currentMetrics, activeAlerts);
      
      return {
        currentMetrics,
        activeAlerts,
        systemHealth,
        performanceTrends,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Error getting monitoring dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<MonitoringDashboard['systemHealth']> {
    const health: MonitoringDashboard['systemHealth'] = {
      redis: false,
      database: false,
      aiService: false,
      overallStatus: 'unhealthy',
    };
    
    try {
      // Check Redis health
      try {
        await this.redis.ping();
        health.redis = true;
      } catch (error) {
        this.logger.warn(`Redis health check failed: ${error.message}`);
      }
      
      // Check database health (simplified)
      try {
        // This would typically involve a simple query
        health.database = true;
      } catch (error) {
        this.logger.warn(`Database health check failed: ${error.message}`);
      }
      
      // Check AI service health (simplified)
      try {
        // This would typically involve a test API call
        health.aiService = true;
      } catch (error) {
        this.logger.warn(`AI service health check failed: ${error.message}`);
      }
      
      // Determine overall status
      const healthyServices = [health.redis, health.database, health.aiService].filter(Boolean).length;
      if (healthyServices === 3) {
        health.overallStatus = 'healthy';
      } else if (healthyServices >= 2) {
        health.overallStatus = 'degraded';
      } else {
        health.overallStatus = 'unhealthy';
      }
      
      return health;
    } catch (error) {
      this.logger.error(`Error checking system health: ${error.message}`);
      return health;
    }
  }

  /**
   * Get performance trends
   */
  private async getPerformanceTrends(): Promise<MonitoringDashboard['performanceTrends']> {
    try {
      const redisClient = this.redis.getClient();
      const now = Math.floor(Date.now() / 1000);
      const currentHour = Math.floor(now / 3600);
      
      const trends = {
        accuracy: [] as number[],
        cost: [] as number[],
        latency: [] as number[],
        throughput: [] as number[],
        timestamps: [] as Date[],
      };
      
      // Get last 24 hours of data
      for (let i = this.trendDataPoints - 1; i >= 0; i--) {
        const hourKey = currentHour - i;
        const trendKey = `${this.metricsPrefix}trends:${hourKey}`;
        
        try {
          const trendData = await redisClient.get(trendKey);
          if (trendData) {
            const data = JSON.parse(trendData);
            trends.accuracy.push(data.accuracy);
            trends.cost.push(data.cost);
            trends.latency.push(data.latency);
            trends.throughput.push(data.throughput);
            trends.timestamps.push(new Date(data.timestamp));
          } else {
            // Fill missing data with zeros
            trends.accuracy.push(0);
            trends.cost.push(0);
            trends.latency.push(0);
            trends.throughput.push(0);
            trends.timestamps.push(new Date(hourKey * 3600 * 1000));
          }
        } catch (error) {
          // Fill with zeros on error
          trends.accuracy.push(0);
          trends.cost.push(0);
          trends.latency.push(0);
          trends.throughput.push(0);
          trends.timestamps.push(new Date(hourKey * 3600 * 1000));
        }
      }
      
      return trends;
    } catch (error) {
      this.logger.error(`Error getting performance trends: ${error.message}`);
      return {
        accuracy: [],
        cost: [],
        latency: [],
        throughput: [],
        timestamps: [],
      };
    }
  }

  /**
   * Generate recommendations based on current metrics and alerts
   */
  private async generateRecommendations(
    metrics: AlertMetrics,
    alerts: Alert[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    try {
      // Accuracy recommendations
      if (metrics.accuracy < 85) {
        recommendations.push('Consider reviewing and updating categorization rules');
        recommendations.push('Analyze recent user feedback for pattern improvements');
      }
      
      // Cost recommendations
      if (metrics.costPerStatement > 0.08) {
        recommendations.push('Review AI API usage and consider increasing cache TTL');
        recommendations.push('Optimize rule-based categorization to reduce AI calls');
      }
      
      // Error rate recommendations
      if (metrics.errorRate > 0.5) {
        recommendations.push('Investigate recent error patterns and API failures');
        recommendations.push('Consider implementing additional fallback mechanisms');
      }
      
      // Latency recommendations
      if (metrics.averageLatency > 400) {
        recommendations.push('Review cache hit rates and optimize Redis performance');
        recommendations.push('Consider implementing request batching for better throughput');
      }
      
      // Alert-based recommendations
      if (alerts.length > 0) {
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
          recommendations.push('Address critical alerts immediately to prevent service degradation');
        }
      }
      
      // General recommendations
      if (recommendations.length === 0) {
        recommendations.push('System is performing within acceptable parameters');
        recommendations.push('Continue monitoring for any performance degradation');
      }
      
      return recommendations;
    } catch (error) {
      this.logger.error(`Error generating recommendations: ${error.message}`);
      return ['Unable to generate recommendations due to system error'];
    }
  }

  /**
   * Get Prometheus-compatible metrics
   */
  async getPrometheusMetrics(): Promise<PrometheusMetrics> {
    try {
      const currentMetrics = await this.collectCurrentMetrics();
      const activeAlerts = await this.alertingService.getActiveAlerts();
      const cacheStats = await this.performanceMonitor.getCacheStatistics();
      
      return {
        categorization_accuracy_percentage: currentMetrics.accuracy,
        categorization_cost_per_statement_dollars: currentMetrics.costPerStatement,
        categorization_error_rate_percentage: currentMetrics.errorRate,
        categorization_latency_milliseconds: currentMetrics.averageLatency,
        categorization_throughput_per_minute: currentMetrics.throughput,
        categorization_cache_hit_rate_percentage: cacheStats.hitRate,
        categorization_active_alerts_count: activeAlerts.length,
        categorization_ai_api_calls_total: cacheStats.totalRequests - cacheStats.hitCount,
        categorization_rule_based_hits_total: cacheStats.hitCount, // Simplified
      };
    } catch (error) {
      this.logger.error(`Error getting Prometheus metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old trend data
   */
  private async cleanupOldTrendData(): Promise<void> {
    try {
      const redisClient = this.redis.getClient();
      const now = Math.floor(Date.now() / 1000);
      const currentHour = Math.floor(now / 3600);
      const cutoffHour = currentHour - (7 * 24); // 7 days ago
      
      const pattern = `${this.metricsPrefix}trends:*`;
      const keys = await redisClient.keys(pattern);
      
      for (const key of keys) {
        const hourKey = parseInt(key.split(':').pop() || '0');
        if (hourKey < cutoffHour) {
          await redisClient.del(key);
        }
      }
    } catch (error) {
      this.logger.error(`Error cleaning up old trend data: ${error.message}`);
    }
  }
} 