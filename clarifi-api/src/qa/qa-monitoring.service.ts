import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

export interface QASystemMetrics {
  faqHitRate: number;
  llmHitRate: number;
  cacheHitRate: number;
  averageResponseTime: number;
  totalQueries: number;
  totalCost: number;
  activeUsers: number;
  errorRate: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  lastUpdated: string;
}

export interface QAErrorEvent {
  id: string;
  timestamp: string;
  type: 'faq_search_failed' | 'llm_request_failed' | 'cache_error' | 'query_limit_exceeded' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  query?: string;
  error: string;
  stackTrace?: string;
  context: Record<string, any>;
}

export interface CostAnomaly {
  id: string;
  timestamp: string;
  type: 'unusual_spike' | 'budget_exceeded' | 'user_limit_exceeded' | 'daily_threshold_exceeded';
  currentCost: number;
  expectedCost: number;
  variance: number;
  affectedUsers: string[];
  recommendation: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  component: 'faq_search' | 'llm_service' | 'cache_service' | 'query_limits' | 'monitoring';
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

@Injectable()
export class QAMonitoringService {
  private readonly logger = new Logger(QAMonitoringService.name);
  private readonly CACHE_PREFIX = 'qa_monitoring';
  private readonly METRICS_TTL = 3600; // 1 hour
  private readonly ERROR_RETENTION_DAYS = 7;
  private readonly ANOMALY_RETENTION_DAYS = 30;

  // Cost thresholds for anomaly detection
  private readonly COST_THRESHOLDS = {
    dailyBudget: 10.0, // $10 daily budget
    userMonthlyLimit: 0.10, // $0.10 per user per month
    queryLimit: 0.01, // $0.01 per query
    spikeThreshold: 2.0, // 200% increase triggers anomaly
    budgetWarningThreshold: 0.8, // 80% of budget triggers warning
  };

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Record a Q&A query event for monitoring
   */
  async recordQueryEvent(event: {
    userId: string;
    query: string;
    responseSource: 'faq' | 'cache' | 'llm';
    responseTime: number;
    cost: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      // Update real-time metrics
      await this.updateRealTimeMetrics(event);

      // Check for cost anomalies
      await this.checkCostAnomalies(event);

      // Record error if query failed
      if (!event.success && event.errorMessage) {
        await this.recordError({
          id: `query_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'system_error',
          severity: 'medium',
          userId: event.userId,
          query: event.query,
          error: event.errorMessage,
          context: {
            responseSource: event.responseSource,
            responseTime: event.responseTime,
            cost: event.cost
          }
        });
      }

      this.logger.debug(`Query event recorded: ${event.responseSource} response in ${event.responseTime}ms`);

    } catch (error) {
      this.logger.error(`Failed to record query event: ${error.message}`, error.stack);
    }
  }

  /**
   * Record an error event
   */
  async recordError(errorEvent: QAErrorEvent): Promise<void> {
    try {
      // Store error in Redis with TTL
      const errorKey = `${this.CACHE_PREFIX}:errors:${errorEvent.id}`;
      await this.redisService.setex(
        errorKey,
        86400 * this.ERROR_RETENTION_DAYS,
        JSON.stringify(errorEvent)
      );

      // Add to error index for querying
      const errorIndexKey = `${this.CACHE_PREFIX}:error_index`;
      await this.redisService.zadd(errorIndexKey, Date.now(), errorEvent.id);

      // Update error rate metrics
      await this.updateErrorMetrics(errorEvent);

      // Generate system alert for critical errors
      if (errorEvent.severity === 'critical') {
        await this.generateSystemAlert({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          level: 'critical',
          component: this.getComponentFromErrorType(errorEvent.type),
          message: `Critical Q&A system error: ${errorEvent.error}`,
          details: {
            errorId: errorEvent.id,
            userId: errorEvent.userId,
            query: errorEvent.query,
            context: errorEvent.context
          },
          resolved: false
        });
      }

      this.logger.error(`Q&A Error recorded: ${errorEvent.type} - ${errorEvent.error}`);

    } catch (error) {
      this.logger.error(`Failed to record error event: ${error.message}`, error.stack);
    }
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<QASystemMetrics> {
    try {
      const metricsKey = `${this.CACHE_PREFIX}:metrics:current`;
      const metricsData = await this.redisService.get(metricsKey);

      if (metricsData) {
        return JSON.parse(metricsData);
      }

      // Calculate metrics if not cached
      const metrics = await this.calculateSystemMetrics();
      
      // Cache metrics
      await this.redisService.setex(metricsKey, this.METRICS_TTL, JSON.stringify(metrics));
      
      return metrics;

    } catch (error) {
      this.logger.error(`Failed to get system metrics: ${error.message}`, error.stack);
      
      // Return default metrics on error
      return {
        faqHitRate: 0,
        llmHitRate: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        totalQueries: 0,
        totalCost: 0,
        activeUsers: 0,
        errorRate: 0,
        systemHealth: 'critical',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get recent errors with filtering
   */
  async getRecentErrors(filters?: {
    severity?: string;
    type?: string;
    userId?: string;
    limit?: number;
  }): Promise<QAErrorEvent[]> {
    try {
      const limit = filters?.limit || 50;
      const errorIndexKey = `${this.CACHE_PREFIX}:error_index`;
      
      // Get recent error IDs
      const errorIds = await this.redisService.zrevrange(errorIndexKey, 0, limit - 1);
      
      const errors: QAErrorEvent[] = [];
      
      for (const errorId of errorIds) {
        const errorKey = `${this.CACHE_PREFIX}:errors:${errorId}`;
        const errorData = await this.redisService.get(errorKey);
        
        if (errorData) {
          const error: QAErrorEvent = JSON.parse(errorData);
          
          // Apply filters
          if (filters?.severity && error.severity !== filters.severity) continue;
          if (filters?.type && error.type !== filters.type) continue;
          if (filters?.userId && error.userId !== filters.userId) continue;
          
          errors.push(error);
        }
      }

      return errors;

    } catch (error) {
      this.logger.error(`Failed to get recent errors: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get cost anomalies
   */
  async getCostAnomalies(limit: number = 20): Promise<CostAnomaly[]> {
    try {
      const anomalyIndexKey = `${this.CACHE_PREFIX}:anomaly_index`;
      const anomalyIds = await this.redisService.zrevrange(anomalyIndexKey, 0, limit - 1);
      
      const anomalies: CostAnomaly[] = [];
      
      for (const anomalyId of anomalyIds) {
        const anomalyKey = `${this.CACHE_PREFIX}:anomalies:${anomalyId}`;
        const anomalyData = await this.redisService.get(anomalyKey);
        
        if (anomalyData) {
          anomalies.push(JSON.parse(anomalyData));
        }
      }

      return anomalies;

    } catch (error) {
      this.logger.error(`Failed to get cost anomalies: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get system alerts
   */
  async getSystemAlerts(filters?: {
    level?: string;
    component?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<SystemAlert[]> {
    try {
      const limit = filters?.limit || 50;
      const alertIndexKey = `${this.CACHE_PREFIX}:alert_index`;
      
      const alertIds = await this.redisService.zrevrange(alertIndexKey, 0, limit - 1);
      
      const alerts: SystemAlert[] = [];
      
      for (const alertId of alertIds) {
        const alertKey = `${this.CACHE_PREFIX}:alerts:${alertId}`;
        const alertData = await this.redisService.get(alertKey);
        
        if (alertData) {
          const alert: SystemAlert = JSON.parse(alertData);
          
          // Apply filters
          if (filters?.level && alert.level !== filters.level) continue;
          if (filters?.component && alert.component !== filters.component) continue;
          if (filters?.resolved !== undefined && alert.resolved !== filters.resolved) continue;
          
          alerts.push(alert);
        }
      }

      return alerts;

    } catch (error) {
      this.logger.error(`Failed to get system alerts: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Resolve a system alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    try {
      const alertKey = `${this.CACHE_PREFIX}:alerts:${alertId}`;
      const alertData = await this.redisService.get(alertKey);
      
      if (alertData) {
        const alert: SystemAlert = JSON.parse(alertData);
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        
        if (resolvedBy) {
          alert.details.resolvedBy = resolvedBy;
        }
        
        await this.redisService.setex(alertKey, 86400 * 30, JSON.stringify(alert));
        
        this.logger.log(`System alert ${alertId} resolved`);
      }

    } catch (error) {
      this.logger.error(`Failed to resolve alert: ${error.message}`, error.stack);
    }
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    components: {
      faqSearch: 'healthy' | 'degraded' | 'critical';
      llmService: 'healthy' | 'degraded' | 'critical';
      cacheService: 'healthy' | 'degraded' | 'critical';
      queryLimits: 'healthy' | 'degraded' | 'critical';
    };
    details: Record<string, any>;
  }> {
    try {
      const metrics = await this.getSystemMetrics();
      const recentErrors = await this.getRecentErrors({ limit: 10 });
      
      // Check component health
      const componentHealth = {
        faqSearch: this.evaluateComponentHealth('faq_search', recentErrors, metrics),
        llmService: this.evaluateComponentHealth('llm_service', recentErrors, metrics),
        cacheService: this.evaluateComponentHealth('cache_service', recentErrors, metrics),
        queryLimits: this.evaluateComponentHealth('query_limits', recentErrors, metrics),
      };

      // Determine overall health
      const healthLevels = Object.values(componentHealth);
      const overall = healthLevels.includes('critical') ? 'critical' :
                     healthLevels.includes('degraded') ? 'degraded' : 'healthy';

      return {
        overall,
        components: componentHealth,
        details: {
          errorRate: metrics.errorRate,
          responseTime: metrics.averageResponseTime,
          costEfficiency: metrics.totalCost / Math.max(metrics.totalQueries, 1),
          faqHitRate: metrics.faqHitRate,
          recentErrorCount: recentErrors.length,
          lastUpdated: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error(`Failed to check system health: ${error.message}`, error.stack);
      
      return {
        overall: 'critical',
        components: {
          faqSearch: 'critical',
          llmService: 'critical',
          cacheService: 'critical',
          queryLimits: 'critical',
        },
        details: {
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Private helper methods

  private async updateRealTimeMetrics(event: any): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metricsKey = `${this.CACHE_PREFIX}:daily_metrics:${today}`;
      
      // Get existing metrics
      const existingMetrics = await this.redisService.get(metricsKey);
      const metrics = existingMetrics ? JSON.parse(existingMetrics) : {
        totalQueries: 0,
        faqQueries: 0,
        cacheQueries: 0,
        llmQueries: 0,
        totalCost: 0,
        totalResponseTime: 0,
        errorCount: 0,
        uniqueUsers: new Set()
      };

      // Update metrics
      metrics.totalQueries++;
      metrics.totalCost += event.cost;
      metrics.totalResponseTime += event.responseTime;
      
      if (event.responseSource === 'faq') metrics.faqQueries++;
      else if (event.responseSource === 'cache') metrics.cacheQueries++;
      else if (event.responseSource === 'llm') metrics.llmQueries++;
      
      if (!event.success) metrics.errorCount++;
      
      metrics.uniqueUsers.add(event.userId);

      // Store updated metrics
      await this.redisService.setex(metricsKey, 86400, JSON.stringify({
        ...metrics,
        uniqueUsers: Array.from(metrics.uniqueUsers) // Convert Set to Array for storage
      }));

    } catch (error) {
      this.logger.error(`Failed to update real-time metrics: ${error.message}`);
    }
  }

  private async checkCostAnomalies(event: any): Promise<void> {
    try {
      // Check daily budget
      const today = new Date().toISOString().split('T')[0];
      const dailyCostKey = `${this.CACHE_PREFIX}:daily_cost:${today}`;
      const dailyCost = parseFloat(await this.redisService.get(dailyCostKey) || '0');
      const newDailyCost = dailyCost + event.cost;
      
      await this.redisService.setex(dailyCostKey, 86400, newDailyCost.toString());

      // Check if daily budget exceeded
      if (newDailyCost > this.COST_THRESHOLDS.dailyBudget) {
        await this.recordCostAnomaly({
          id: `anomaly_${Date.now()}_daily_budget`,
          timestamp: new Date().toISOString(),
          type: 'daily_threshold_exceeded',
          currentCost: newDailyCost,
          expectedCost: this.COST_THRESHOLDS.dailyBudget,
          variance: (newDailyCost / this.COST_THRESHOLDS.dailyBudget - 1) * 100,
          affectedUsers: [event.userId],
          recommendation: 'Review query patterns and implement stricter rate limiting'
        });
      }

      // Check query cost anomaly
      if (event.cost > this.COST_THRESHOLDS.queryLimit) {
        await this.recordCostAnomaly({
          id: `anomaly_${Date.now()}_query_limit`,
          timestamp: new Date().toISOString(),
          type: 'user_limit_exceeded',
          currentCost: event.cost,
          expectedCost: this.COST_THRESHOLDS.queryLimit,
          variance: (event.cost / this.COST_THRESHOLDS.queryLimit - 1) * 100,
          affectedUsers: [event.userId],
          recommendation: 'Investigate query complexity and optimize prompt engineering'
        });
      }

    } catch (error) {
      this.logger.error(`Failed to check cost anomalies: ${error.message}`);
    }
  }

  private async recordCostAnomaly(anomaly: CostAnomaly): Promise<void> {
    try {
      const anomalyKey = `${this.CACHE_PREFIX}:anomalies:${anomaly.id}`;
      await this.redisService.setex(
        anomalyKey,
        86400 * this.ANOMALY_RETENTION_DAYS,
        JSON.stringify(anomaly)
      );

      const anomalyIndexKey = `${this.CACHE_PREFIX}:anomaly_index`;
      await this.redisService.zadd(anomalyIndexKey, Date.now(), anomaly.id);

      this.logger.warn(`Cost anomaly detected: ${anomaly.type} - $${anomaly.currentCost}`);

    } catch (error) {
      this.logger.error(`Failed to record cost anomaly: ${error.message}`);
    }
  }

  private async generateSystemAlert(alert: SystemAlert): Promise<void> {
    try {
      const alertKey = `${this.CACHE_PREFIX}:alerts:${alert.id}`;
      await this.redisService.setex(alertKey, 86400 * 30, JSON.stringify(alert));

      const alertIndexKey = `${this.CACHE_PREFIX}:alert_index`;
      await this.redisService.zadd(alertIndexKey, Date.now(), alert.id);

      this.logger.warn(`System alert generated: ${alert.level} - ${alert.message}`);

    } catch (error) {
      this.logger.error(`Failed to generate system alert: ${error.message}`);
    }
  }

  private async calculateSystemMetrics(): Promise<QASystemMetrics> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metricsKey = `${this.CACHE_PREFIX}:daily_metrics:${today}`;
      const metricsData = await this.redisService.get(metricsKey);
      
      if (!metricsData) {
        return {
          faqHitRate: 0,
          llmHitRate: 0,
          cacheHitRate: 0,
          averageResponseTime: 0,
          totalQueries: 0,
          totalCost: 0,
          activeUsers: 0,
          errorRate: 0,
          systemHealth: 'healthy',
          lastUpdated: new Date().toISOString()
        };
      }

      const metrics = JSON.parse(metricsData);
      const totalQueries = metrics.totalQueries || 1;

      return {
        faqHitRate: (metrics.faqQueries / totalQueries) * 100,
        llmHitRate: (metrics.llmQueries / totalQueries) * 100,
        cacheHitRate: (metrics.cacheQueries / totalQueries) * 100,
        averageResponseTime: metrics.totalResponseTime / totalQueries,
        totalQueries: metrics.totalQueries,
        totalCost: metrics.totalCost,
        activeUsers: metrics.uniqueUsers?.length || 0,
        errorRate: (metrics.errorCount / totalQueries) * 100,
        systemHealth: this.determineSystemHealth(metrics),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to calculate system metrics: ${error.message}`);
      throw error;
    }
  }

  private determineSystemHealth(metrics: any): 'healthy' | 'degraded' | 'critical' {
    const errorRate = (metrics.errorCount / Math.max(metrics.totalQueries, 1)) * 100;
    const avgResponseTime = metrics.totalResponseTime / Math.max(metrics.totalQueries, 1);
    
    if (errorRate > 10 || avgResponseTime > 5000) return 'critical';
    if (errorRate > 5 || avgResponseTime > 3000) return 'degraded';
    return 'healthy';
  }

  private evaluateComponentHealth(
    component: string,
    recentErrors: QAErrorEvent[],
    metrics: QASystemMetrics
  ): 'healthy' | 'degraded' | 'critical' {
    const componentErrors = recentErrors.filter(error => 
      this.getComponentFromErrorType(error.type) === component
    );

    const criticalErrors = componentErrors.filter(error => error.severity === 'critical');
    const highErrors = componentErrors.filter(error => error.severity === 'high');

    if (criticalErrors.length > 0) return 'critical';
    if (highErrors.length > 2 || componentErrors.length > 5) return 'degraded';
    
    // Component-specific health checks
    if (component === 'faq_search' && metrics.faqHitRate < 80) return 'degraded';
    if (component === 'cache_service' && metrics.cacheHitRate < 60) return 'degraded';
    
    return 'healthy';
  }

  private getComponentFromErrorType(errorType: string): 'faq_search' | 'llm_service' | 'cache_service' | 'query_limits' | 'monitoring' {
    if (errorType.includes('faq')) return 'faq_search';
    if (errorType.includes('llm')) return 'llm_service';
    if (errorType.includes('cache')) return 'cache_service';
    if (errorType.includes('limit')) return 'query_limits';
    return 'monitoring';
  }

  private async updateErrorMetrics(errorEvent: QAErrorEvent): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const errorMetricsKey = `${this.CACHE_PREFIX}:error_metrics:${today}`;
      
      const existingData = await this.redisService.get(errorMetricsKey);
      const errorMetrics = existingData ? JSON.parse(existingData) : {
        totalErrors: 0,
        errorsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        errorsByType: {}
      };

      errorMetrics.totalErrors++;
      errorMetrics.errorsBySeverity[errorEvent.severity]++;
      errorMetrics.errorsByType[errorEvent.type] = (errorMetrics.errorsByType[errorEvent.type] || 0) + 1;

      await this.redisService.setex(errorMetricsKey, 86400, JSON.stringify(errorMetrics));

    } catch (error) {
      this.logger.error(`Failed to update error metrics: ${error.message}`);
    }
  }
} 