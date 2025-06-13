import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url');

    // For development, skip Redis connection entirely
    if (!redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      this.logger.warn('Redis URL not configured or pointing to localhost. Using mock Redis client for development.');
      // Create a completely mock client that doesn't attempt any connections
      this.client = {} as Redis;
      return;
    }

    const options: RedisOptions = {
      tls: { rejectUnauthorized: false },
      lazyConnect: true, 
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Max Redis retry attempts reached. Giving up.');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Retrying Redis connection (attempt ${times})...`);
        return delay;
      },
    };

    this.client = new Redis(redisUrl, options);

    this.client.on('connect', () => {
      this.logger.log('Successfully connected to Redis (Upstash).');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
    
    this.client.on('reconnecting', () => {
      this.logger.log('Reconnecting to Redis...');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis during initialization:', error);
      // Don't throw in development - allow app to continue without Redis
      this.logger.warn('Continuing without Redis connection...');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed.');
    }
  }

  getClient(): Redis {
    if (!this.client || (this.client.status !== 'ready' && Object.keys(this.client).length > 0)) {
        this.logger.warn('Redis client not ready, using mock operations');
        // Return mock client for development
        return {
          ping: async () => 'PONG',
          get: async () => null,
          set: async () => 'OK',
          setex: async () => 'OK',
          del: async () => 0,
          incr: async () => 1,
          incrbyfloat: async () => '1.0',
          keys: async () => [],
          zadd: async () => 1,
          zrange: async () => [],
          zrangebyscore: async () => [],
          zrem: async () => 0,
          expire: async () => 1,
          ttl: async () => -1,
          zrevrange: async () => [],
        } as any;
    }
    return this.client;
  }

  async ping(): Promise<string> {
    try {
      const client = this.getClient();
      return await client.ping();
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.getClient().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.getClient().set(key, value, 'EX', ttlSeconds);
    } else {
      await this.getClient().set(key, value);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.getClient().setex(key, seconds, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.getClient().del(...keys);
  }

  async incr(key: string): Promise<number> {
    return this.getClient().incr(key);
  }

  async incrbyfloat(key: string, increment: number): Promise<string> {
    return this.getClient().incrbyfloat(key, increment);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.getClient().keys(pattern);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.getClient().zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.getClient().zrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: number | string, max: number | string, withscores?: boolean): Promise<string[]> {
    if (withscores) {
      return this.getClient().zrangebyscore(key, min, max, 'WITHSCORES');
    }
    return this.getClient().zrangebyscore(key, min, max);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.getClient().zrem(key, ...members);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.getClient().expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.getClient().ttl(key);
  }

  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    return this.del(...keys);
  }

  async zrevrange(key: string, start: number, stop: number, withscores?: boolean): Promise<string[]> {
    if (withscores) {
      return this.getClient().zrevrange(key, start, stop, 'WITHSCORES');
    }
    return this.getClient().zrevrange(key, start, stop);
  }
} 