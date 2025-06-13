import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { createHash } from 'crypto';
import { Redis } from 'ioredis';

export interface FAQCacheEntry {
  faqId: string;
  question: string;
  answer: string;
  category: string;
  relevanceScore: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'keyword';
  timestamp: number;
  hitCount: number;
}

export interface LLMCacheEntry {
  query: string;
  response: string;
  model: string;
  tokens: { input: number; output: number; total: number };
  cost: number;
  timestamp: number;
  hitCount: number;
  contextHash: string;
}

export interface CacheMetrics {
  faqCache: { hits: number; misses: number; hitRate: number; costSavings: number };
  llmCache: { hits: number; misses: number; hitRate: number; costSavings: number };
  totalCostSavings: number;
}

@Injectable()
export class QACacheService {
  private readonly logger = new Logger(QACacheService.name);
  private redis: Redis | null;
  private readonly faqCachePrefix = 'qa:faq:';
  private readonly llmCachePrefix = 'qa:llm:';
  private readonly metricsPrefix = 'qa:metrics:';
  
  private readonly faqCacheTtl: number;
  private readonly llmCacheTtl: number;
  private readonly costPerLLMRequest: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.redis = null;
    this.faqCacheTtl = this.configService.get<number>('QA_FAQ_CACHE_TTL_SECONDS', 30 * 24 * 60 * 60); // 30 days
    this.llmCacheTtl = this.configService.get<number>('QA_LLM_CACHE_TTL_SECONDS', 30 * 24 * 60 * 60); // 30 days
    this.costPerLLMRequest = this.configService.get<number>('QA_COST_PER_LLM_REQUEST', 0.002);
  }

  private getRedisClient(): Redis {
    if (!this.redis) {
      try {
        this.redis = this.redisService.getClient();
      } catch (error) {
        this.logger.warn('Redis client not ready yet, QA cache will be skipped');
        throw error;
      }
    }
    return this.redis;
  }

  private generateCacheKey(prefix: string, input: string): string {
    const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
    const hash = createHash('sha256').update(normalized).digest('hex');
    return `${prefix}${hash}`;
  }

  // ===== FAQ CACHE METHODS =====

  async getCachedFAQResult(query: string): Promise<FAQCacheEntry | null> {
    try {
      const cacheKey = this.generateCacheKey(this.faqCachePrefix, query);
      const cached = await this.getRedisClient().get(cacheKey);
      
      if (cached) {
        const entry: FAQCacheEntry = JSON.parse(cached);
        entry.hitCount++;
        await this.getRedisClient().setex(cacheKey, this.faqCacheTtl, JSON.stringify(entry));
        await this.recordMetric('faq_hit');
        
        this.logger.debug(`FAQ Cache HIT: ${query.substring(0, 50)}... -> ${entry.faqId}`);
        return entry;
      }

      await this.recordMetric('faq_miss');
      return null;
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping FAQ cache lookup');
        return null;
      }
      this.logger.error(`FAQ cache read error: ${error.message}`);
      return null;
    }
  }

  async cacheFAQResult(
    query: string,
    faqId: string,
    question: string,
    answer: string,
    category: string,
    relevanceScore: number,
    matchType: 'exact' | 'fuzzy' | 'semantic' | 'keyword'
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(this.faqCachePrefix, query);
      const entry: FAQCacheEntry = {
        faqId, question, answer, category, relevanceScore, matchType,
        timestamp: Date.now(), hitCount: 0
      };

      await this.getRedisClient().setex(cacheKey, this.faqCacheTtl, JSON.stringify(entry));
      this.logger.debug(`Cached FAQ result: ${query.substring(0, 50)}... -> ${faqId}`);
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping FAQ cache write');
        return;
      }
      this.logger.error(`FAQ cache write error: ${error.message}`);
    }
  }

  // ===== LLM CACHE METHODS =====

  async getCachedLLMResponse(query: string, context?: string): Promise<LLMCacheEntry | null> {
    try {
      const contextHash = context ? createHash('md5').update(context).digest('hex') : 'no_context';
      const cacheKey = this.generateCacheKey(this.llmCachePrefix, `${query}:${contextHash}`);
      const cached = await this.getRedisClient().get(cacheKey);
      
      if (cached) {
        const entry: LLMCacheEntry = JSON.parse(cached);
        entry.hitCount++;
        await this.getRedisClient().setex(cacheKey, this.llmCacheTtl, JSON.stringify(entry));
        await this.recordMetric('llm_hit', entry.cost);
        
        this.logger.log(`LLM Cache HIT: ${query.substring(0, 50)}... - Cost saved: $${entry.cost.toFixed(4)}`);
        return entry;
      }

      await this.recordMetric('llm_miss');
      return null;
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping LLM cache lookup');
        return null;
      }
      this.logger.error(`LLM cache read error: ${error.message}`);
      return null;
    }
  }

  async cacheLLMResponse(
    query: string,
    response: string,
    model: string,
    tokens: { input: number; output: number; total: number },
    cost: number,
    context?: string
  ): Promise<void> {
    if (!response) return;

    try {
      const contextHash = context ? createHash('md5').update(context).digest('hex') : 'no_context';
      const cacheKey = this.generateCacheKey(this.llmCachePrefix, `${query}:${contextHash}`);
      
      const entry: LLMCacheEntry = {
        query, response, model, tokens, cost, contextHash,
        timestamp: Date.now(), hitCount: 0
      };

      await this.getRedisClient().setex(cacheKey, this.llmCacheTtl, JSON.stringify(entry));
      this.logger.log(`Cached LLM response: ${query.substring(0, 50)}... - Cost: $${cost.toFixed(4)}`);
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping LLM cache write');
        return;
      }
      this.logger.error(`LLM cache write error: ${error.message}`);
    }
  }

  // ===== METRICS =====

  private async recordMetric(type: string, cost?: number): Promise<void> {
    try {
      await this.getRedisClient().incr(`${this.metricsPrefix}${type}`);
      if (cost) {
        await this.getRedisClient().incrbyfloat(`${this.metricsPrefix}cost_savings`, cost);
      }
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping metric recording');
        return;
      }
      this.logger.error(`Metric recording error: ${error.message}`);
    }
  }

  async getCacheMetrics(): Promise<CacheMetrics> {
    try {
      const [faqHits, faqMisses, llmHits, llmMisses, costSavings] = await Promise.all([
        this.getRedisClient().get(`${this.metricsPrefix}faq_hit`),
        this.getRedisClient().get(`${this.metricsPrefix}faq_miss`),
        this.getRedisClient().get(`${this.metricsPrefix}llm_hit`),
        this.getRedisClient().get(`${this.metricsPrefix}llm_miss`),
        this.getRedisClient().get(`${this.metricsPrefix}cost_savings`)
      ]);

      const faqHitCount = parseInt(faqHits || '0');
      const faqMissCount = parseInt(faqMisses || '0');
      const llmHitCount = parseInt(llmHits || '0');
      const llmMissCount = parseInt(llmMisses || '0');
      const totalCostSavings = parseFloat(costSavings || '0');

      const faqTotal = faqHitCount + faqMissCount;
      const llmTotal = llmHitCount + llmMissCount;

      return {
        faqCache: {
          hits: faqHitCount,
          misses: faqMissCount,
          hitRate: faqTotal > 0 ? faqHitCount / faqTotal : 0,
          costSavings: faqHitCount * 0.001 // $0.001 per FAQ lookup saved
        },
        llmCache: {
          hits: llmHitCount,
          misses: llmMissCount,
          hitRate: llmTotal > 0 ? llmHitCount / llmTotal : 0,
          costSavings: llmHitCount * this.costPerLLMRequest
        },
        totalCostSavings
      };
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, returning default metrics');
      } else {
        this.logger.error(`Metrics retrieval error: ${error.message}`);
      }
      return {
        faqCache: { hits: 0, misses: 0, hitRate: 0, costSavings: 0 },
        llmCache: { hits: 0, misses: 0, hitRate: 0, costSavings: 0 },
        totalCostSavings: 0
      };
    }
  }

  async healthCheck(): Promise<{ status: string; redis: boolean; metrics: CacheMetrics }> {
    try {
      const ping = await this.getRedisClient().ping();
      const metrics = await this.getCacheMetrics();
      
      return {
        status: ping === 'PONG' ? 'healthy' : 'unhealthy',
        redis: ping === 'PONG',
        metrics
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        redis: false,
        metrics: { faqCache: { hits: 0, misses: 0, hitRate: 0, costSavings: 0 }, llmCache: { hits: 0, misses: 0, hitRate: 0, costSavings: 0 }, totalCostSavings: 0 }
      };
    }
  }

  async clearCache(pattern = 'qa:*'): Promise<void> {
    try {
      const keys = await this.getRedisClient().keys(pattern);
      if (keys.length > 0) {
        await this.getRedisClient().del(...keys);
        this.logger.log(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping cache clear');
        return;
      }
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }
} 