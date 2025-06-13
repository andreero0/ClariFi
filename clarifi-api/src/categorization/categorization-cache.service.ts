import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service'; // Corrected path
import { createHash } from 'crypto';
import { Redis } from 'ioredis';

@Injectable()
export class CategorizationCacheService {
  private readonly logger = new Logger(CategorizationCacheService.name);
  private redisClient: Redis | null;
  private readonly keyPrefix = 'categorization:merchant:';
  private readonly aiSuggestedCategoryTtlSeconds: number;
  private readonly userCorrectedCategoryTtlSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    // Don't get client immediately - defer until first use
    this.redisClient = null;

    this.aiSuggestedCategoryTtlSeconds = this.configService.get<number>(
      'AI_SUGGESTED_CATEGORY_TTL_SECONDS',
      604800, // Default 7 days
    );
    this.userCorrectedCategoryTtlSeconds = this.configService.get<number>(
      'USER_CORRECTED_CATEGORY_TTL_SECONDS',
      7776000, // Default 90 days
    );
  }

  private getRedisClient(): Redis {
    if (!this.redisClient) {
      try {
        this.redisClient = this.redisService.getClient();
      } catch (error) {
        this.logger.warn('Redis client not ready yet, cache operations will be skipped');
        throw error;
      }
    }
    return this.redisClient;
  }

  private generateCacheKey(normalizedMerchantName: string): string {
    const hash = createHash('sha256').update(normalizedMerchantName).digest('hex');
    return `${this.keyPrefix}${hash}`;
  }

  async getCachedCategory(normalizedMerchantName: string): Promise<string | null> {
    const cacheKey = this.generateCacheKey(normalizedMerchantName);
    try {
      const categoryId = await this.getRedisClient().get(cacheKey);
      if (categoryId) {
        this.logger.debug(`Cache HIT for merchant: ${normalizedMerchantName} (Key: ${cacheKey}) -> Category: ${categoryId}`);
        return categoryId;
      }
      this.logger.debug(`Cache MISS for merchant: ${normalizedMerchantName} (Key: ${cacheKey})`);
      return null;
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping cache read');
        return null;
      }
      this.logger.error(`Error getting category from cache for key ${cacheKey}: ${error.message}`, error.stack);
      return null; // On error, proceed as if cache miss
    }
  }

  async setCachedCategory(normalizedMerchantName: string, categoryId: string, isUserCorrection: boolean): Promise<void> {
    const cacheKey = this.generateCacheKey(normalizedMerchantName);
    const ttl = isUserCorrection ? this.userCorrectedCategoryTtlSeconds : this.aiSuggestedCategoryTtlSeconds;
    try {
      await this.getRedisClient().setex(cacheKey, ttl, categoryId);
      this.logger.debug(`Cached category for merchant: ${normalizedMerchantName} (Key: ${cacheKey}) -> Category: ${categoryId}, TTL: ${ttl}s`);
    } catch (error) {
      if (error.message?.includes('Redis client is not connected')) {
        this.logger.debug('Redis not ready, skipping cache write');
        return;
      }
      this.logger.error(`Error setting category in cache for key ${cacheKey}: ${error.message}`, error.stack);
    }
  }
} 