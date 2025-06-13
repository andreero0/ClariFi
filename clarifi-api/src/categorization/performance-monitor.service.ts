import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { Redis } from 'ioredis';

interface PerformanceMetric {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  cacheHit?: boolean;
  batchSize?: number;
  error?: string;
}

interface CostBreakdown {
  aiApiCalls: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  averageCostPerTransaction: number;
  period: string;
}

interface PerformanceReport {
  period: string;
  totalTransactions: number;
  totalCost: number;
  averageCostPerTransaction: number;
  cacheHitRate: number;
  averageLatency: number;
  errorRate: number;
  throughput: number;
  costBreakdown: CostBreakdown;
  recommendations: string[];
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metricsPrefix = 'categorization:metrics';
  private readonly openAiCostPerInputToken: number;
  private readonly openAiCostPerOutputToken: number;
  private redis: Redis | null;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.redis = null;
    // GPT-3.5-Turbo pricing (as of 2024) - should be configurable
    this.openAiCostPerInputToken = this.configService.get<number>('OPENAI_INPUT_TOKEN_COST', 0.0005 / 1000);
    this.openAiCostPerOutputToken = this.configService.get<number>('OPENAI_OUTPUT_TOKEN_COST', 0.0015 / 1000);
  }

  private getRedisClient(): Redis {
    if (!this.redis) {
      try {
        this.redis = this.redisService.getClient();
      } catch (error) {
        this.logger.warn('Redis client not ready yet, performance monitoring will be skipped');
        throw error;
      }
    }
    return this.redis;
  }

  /**
   * Record a performance metric for monitoring and analysis
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `${this.metricsPrefix}:${this.getDateKey()}`;
      const value = JSON.stringify(metric);
      
      // Store metric with 30-day TTL
      await this.getRedisClient().lpush(key, value);
      await this.getRedisClient().expire(key, 30 * 24 * 60 * 60); // 30 days

      // Update aggregated counters
      await this.updateAggregatedMetrics(metric);

      this.logger.debug(`Recorded performance metric: ${metric.operation} - ${metric.duration}ms`);
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping performance metric recording');
        return;
      }
      this.logger.error(`Failed to record performance metric: ${error.message}`, error.stack);
    }
  }

  /**
   * Calculate the cost of an AI API call based on token usage
   */
  calculateApiCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * this.openAiCostPerInputToken) + (outputTokens * this.openAiCostPerOutputToken);
  }

  /**
   * Get performance metrics for a specific time period
   */
  async getPerformanceReport(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<PerformanceReport> {
    try {
      const metrics = await this.getMetricsForPeriod(period);
      return this.generatePerformanceReport(metrics, period);
    } catch (error) {
      this.logger.error(`Failed to generate performance report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get cost breakdown for a specific period
   */
  async getCostBreakdown(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<CostBreakdown> {
    const metrics = await this.getMetricsForPeriod(period);
    const aiMetrics = metrics.filter(m => m.operation === 'ai_categorization' && m.success);

    const totalTokens = aiMetrics.reduce((sum, m) => sum + (m.tokens?.total || 0), 0);
    const inputTokens = aiMetrics.reduce((sum, m) => sum + (m.tokens?.input || 0), 0);
    const outputTokens = aiMetrics.reduce((sum, m) => sum + (m.tokens?.output || 0), 0);
    const totalCost = aiMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      aiApiCalls: aiMetrics.length,
      totalTokens,
      inputTokens,
      outputTokens,
      totalCost,
      averageCostPerTransaction: totalCost / Math.max(metrics.length, 1),
      period,
    };
  }

  /**
   * Get current cache performance statistics
   */
  async getCacheStatistics(): Promise<{
    hitRate: number;
    totalRequests: number;
    hitCount: number;
    missCount: number;
    avgLookupTime: number;
  }> {
    try {
      const [hitCountRaw, missCountRaw, totalLookupTimeRaw] = await Promise.all([
        this.getRedisClient().get(`${this.metricsPrefix}:cache:hits`),
        this.getRedisClient().get(`${this.metricsPrefix}:cache:misses`),
        this.getRedisClient().get(`${this.metricsPrefix}:cache:lookup_time`),
      ]);

      const hits = parseInt(hitCountRaw || '0');
      const misses = parseInt(missCountRaw || '0');
      const totalRequests = hits + misses;
      const hitRate = totalRequests > 0 ? hits / totalRequests : 0;
      const avgLookupTime = totalRequests > 0 ? parseInt(totalLookupTimeRaw || '0') / totalRequests : 0;

      return {
        hitRate,
        totalRequests,
        hitCount: hits,
        missCount: misses,
        avgLookupTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get cache statistics: ${error.message}`, error.stack);
      return {
        hitRate: 0,
        totalRequests: 0,
        hitCount: 0,
        missCount: 0,
        avgLookupTime: 0,
      };
    }
  }

  /**
   * Get optimization recommendations based on current performance
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const report = await this.getPerformanceReport('day');
    const recommendations: string[] = [];

    // Cost optimization recommendations
    if (report.averageCostPerTransaction > 0.10) {
      recommendations.push(`Cost per transaction (${report.averageCostPerTransaction.toFixed(4)}) exceeds target of $0.10. Consider increasing cache TTL or improving rule-based matching.`);
    }

    // Cache optimization recommendations
    if (report.cacheHitRate < 0.30) {
      recommendations.push(`Cache hit rate (${(report.cacheHitRate * 100).toFixed(1)}%) is below 30% target. Consider extending cache TTL or improving merchant normalization.`);
    }

    // Performance recommendations
    if (report.averageLatency > 500) {
      recommendations.push(`Average latency (${report.averageLatency}ms) exceeds 500ms target. Consider optimizing batch sizes or increasing parallel processing.`);
    }

    // Error rate recommendations
    if (report.errorRate > 0.01) {
      recommendations.push(`Error rate (${(report.errorRate * 100).toFixed(2)}%) exceeds 1% target. Review error logs and improve error handling.`);
    }

    // Throughput recommendations
    if (report.throughput < 16.67) { // 1000 transactions/minute = 16.67 transactions/second
      recommendations.push(`Current throughput (${report.throughput.toFixed(2)} tx/sec) is below target of 16.67 tx/sec (1000/min). Consider increasing batch sizes or parallel processing.`);
    }

    return recommendations;
  }

  /**
   * Update aggregated metrics for faster querying
   */
  private async updateAggregatedMetrics(metric: PerformanceMetric): Promise<void> {
    const dateKey = this.getDateKey();
    
    // Update cache hit/miss counters
    if (metric.cacheHit !== undefined) {
      const key = metric.cacheHit ? `${this.metricsPrefix}:cache:hits` : `${this.metricsPrefix}:cache:misses`;
      await this.getRedisClient().incr(key);
      await this.getRedisClient().expire(key, 24 * 60 * 60); // 24 hours
      
      if (metric.cacheHit) {
        await this.getRedisClient().incrby(`${this.metricsPrefix}:cache:lookup_time`, metric.duration);
      }
    }

    // Update daily counters
    await this.getRedisClient().incr(`${this.metricsPrefix}:daily:${dateKey}:total`);
    if (!metric.success) {
      await this.getRedisClient().incr(`${this.metricsPrefix}:daily:${dateKey}:errors`);
    }
    if (metric.cost) {
      await this.getRedisClient().incrbyfloat(`${this.metricsPrefix}:daily:${dateKey}:cost`, metric.cost);
    }
  }

  /**
   * Retrieve metrics for a specific period
   */
  private async getMetricsForPeriod(period: string): Promise<PerformanceMetric[]> {
    const keys = this.getDateKeysForPeriod(period);
    const allMetrics: PerformanceMetric[] = [];

    for (const key of keys) {
      try {
        const rawMetrics = await this.getRedisClient().lrange(`${this.metricsPrefix}:${key}`, 0, -1);
        const metrics = rawMetrics.map(raw => JSON.parse(raw) as PerformanceMetric);
        allMetrics.push(...metrics);
      } catch (error) {
        this.logger.warn(`Failed to parse metrics for key ${key}: ${error.message}`);
      }
    }

    return allMetrics;
  }

  /**
   * Generate a comprehensive performance report
   */
  private generatePerformanceReport(metrics: PerformanceMetric[], period: string): PerformanceReport {
    const totalTransactions = metrics.length;
    const successfulTransactions = metrics.filter(m => m.success);
    const errorCount = metrics.filter(m => !m.success).length;
    
    // Cost calculations
    const aiMetrics = metrics.filter(m => m.operation === 'ai_categorization' && m.success);
    const totalCost = aiMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const averageCostPerTransaction = totalCost / Math.max(totalTransactions, 1);

    // Cache performance
    const cacheMetrics = metrics.filter(m => m.cacheHit !== undefined);
    const cacheHits = cacheMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = cacheMetrics.length > 0 ? cacheHits / cacheMetrics.length : 0;

    // Latency calculations
    const latencies = successfulTransactions.map(m => m.duration);
    const averageLatency = latencies.length > 0 ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length : 0;

    // Error rate
    const errorRate = totalTransactions > 0 ? errorCount / totalTransactions : 0;

    // Throughput (transactions per second)
    const periodDuration = this.getPeriodDurationInSeconds(period);
    const throughput = periodDuration > 0 ? totalTransactions / periodDuration : 0;

    // Cost breakdown
    const costBreakdown: CostBreakdown = {
      aiApiCalls: aiMetrics.length,
      totalTokens: aiMetrics.reduce((sum, m) => sum + (m.tokens?.total || 0), 0),
      inputTokens: aiMetrics.reduce((sum, m) => sum + (m.tokens?.input || 0), 0),
      outputTokens: aiMetrics.reduce((sum, m) => sum + (m.tokens?.output || 0), 0),
      totalCost,
      averageCostPerTransaction,
      period,
    };

    return {
      period,
      totalTransactions,
      totalCost,
      averageCostPerTransaction,
      cacheHitRate,
      averageLatency,
      errorRate,
      throughput,
      costBreakdown,
      recommendations: [], // Will be populated by getOptimizationRecommendations
    };
  }

  /**
   * Get date keys for a specific period
   */
  private getDateKeysForPeriod(period: string): string[] {
    const now = new Date();
    const keys: string[] = [];

    switch (period) {
      case 'hour':
        keys.push(this.getDateKey(now));
        break;
      case 'day':
        keys.push(this.getDateKey(now));
        break;
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          keys.push(this.getDateKey(date));
        }
        break;
      case 'month':
        for (let i = 0; i < 30; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          keys.push(this.getDateKey(date));
        }
        break;
    }

    return keys;
  }

  /**
   * Generate a date key for Redis storage
   */
  private getDateKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Get the duration of a period in seconds
   */
  private getPeriodDurationInSeconds(period: string): number {
    switch (period) {
      case 'hour': return 3600;
      case 'day': return 86400;
      case 'week': return 604800;
      case 'month': return 2592000;
      default: return 86400;
    }
  }
} 