import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { OcrResultDto } from '../dto/ocr.dto';

interface CacheEntry {
  result: OcrResultDto;
  timestamp: number;
  hitCount: number;
  contentHash: string;
  metadata: {
    fileSize: number;
    imageFormat: string;
    userId?: string;
    quality: 'high' | 'medium' | 'low';
  };
}

interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  costSavings: number;
  bytesStored: number;
}

@Injectable()
export class OcrCacheService {
  private readonly logger = new Logger(OcrCacheService.name);
  private readonly redis: Redis | null;
  private readonly metrics: CacheMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    costSavings: 0,
    bytesStored: 0
  };

  // Cache configuration
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days
  private readonly COST_PER_REQUEST = 0.0015; // $1.50 per 1000 requests
  private readonly MAX_CACHE_SIZE = 1024 * 1024 * 1024; // 1GB
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity for content-based caching

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keyPrefix: 'ocr:cache:'
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis for OCR caching');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

    } catch (error) {
      this.logger.error('Failed to initialize Redis connection', error);
      // Continue without caching in case of Redis failure
      this.redis = null;
    }
  }

  /**
   * Generate cache key for an image
   */
  generateCacheKey(imageData: Buffer, options?: Record<string, any>): string {
    const imageHash = createHash('sha256').update(imageData).digest('hex');
    const optionsHash = options ? createHash('md5').update(JSON.stringify(options)).digest('hex') : '';
    return `${imageHash}:${optionsHash}`;
  }

  /**
   * Check cache for existing OCR result
   */
  async getCachedResult(imageData: Buffer, options?: Record<string, any>): Promise<OcrResultDto | null> {
    if (!this.redis) return null;

    this.metrics.totalRequests++;
    
    try {
      const cacheKey = this.generateCacheKey(imageData, options);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        
        // Update hit count and extend TTL
        entry.hitCount++;
        await this.redis.setex(cacheKey, this.DEFAULT_TTL, JSON.stringify(entry));
        
        this.metrics.cacheHits++;
        this.metrics.costSavings += this.COST_PER_REQUEST;
        
        this.logger.log(`Cache HIT for key: ${cacheKey.substring(0, 16)}...`);
        return entry.result;
      }

      this.metrics.cacheMisses++;
      return null;

    } catch (error) {
      this.logger.error('Error retrieving from cache:', error);
      return null;
    }
  }

  /**
   * Store OCR result in cache
   */
  async cacheResult(
    imageData: Buffer,
    result: OcrResultDto,
    options?: Record<string, any>
  ): Promise<void> {
    if (!this.redis || !result.fullText) return;

    try {
      const cacheKey = this.generateCacheKey(imageData, options);
      const contentHash = createHash('md5').update(result.fullText.toLowerCase()).digest('hex');
      
      const entry: CacheEntry = {
        result,
        timestamp: Date.now(),
        hitCount: 0,
        contentHash,
        metadata: {
          fileSize: imageData.length,
          imageFormat: options?.format || 'unknown',
          userId: options?.userId,
          quality: this.determineQuality(result)
        }
      };

      await this.redis.setex(cacheKey, this.DEFAULT_TTL, JSON.stringify(entry));
      this.logger.log(`Cached OCR result: ${cacheKey.substring(0, 16)}...`);

    } catch (error) {
      this.logger.error('Error storing to cache:', error);
    }
  }

  /**
   * Determine quality level of OCR result
   */
  private determineQuality(result: OcrResultDto): 'high' | 'medium' | 'low' {
    if (result.confidence >= 0.9) return 'high';
    if (result.confidence >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Get cache metrics and statistics
   */
  getCacheMetrics(): CacheMetrics & {
    hitRatio: number;
    averageCostSavings: number;
    cacheEfficiency: number;
  } {
    const hitRatio = this.metrics.totalRequests > 0 
      ? this.metrics.cacheHits / this.metrics.totalRequests 
      : 0;

    const averageCostSavings = this.metrics.cacheHits > 0
      ? this.metrics.costSavings / this.metrics.cacheHits
      : 0;

    const cacheEfficiency = hitRatio * 100;

    return {
      ...this.metrics,
      hitRatio,
      averageCostSavings,
      cacheEfficiency
    };
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: boolean;
    metrics: any;
  }> {
    const health: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      redis: boolean;
      metrics: any;
    } = {
      status: 'healthy',
      redis: false,
      metrics: this.getCacheMetrics()
    };

    try {
      if (this.redis) {
        const pong = await this.redis.ping();
        health.redis = pong === 'PONG';
        
        if (!health.redis) {
          health.status = 'degraded';
        }
      } else {
        health.status = 'unhealthy';
      }

    } catch (error) {
      health.status = 'unhealthy';
      this.logger.error('Cache health check failed:', error);
    }

    return health;
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushall();
      
      // Reset metrics
      this.metrics.totalRequests = 0;
      this.metrics.cacheHits = 0;
      this.metrics.cacheMisses = 0;
      this.metrics.costSavings = 0;
      this.metrics.bytesStored = 0;
      
      this.logger.log('Cache cleared successfully');

    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }
} 