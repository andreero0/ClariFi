import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnhancedFAQSearchService,
  EnhancedSearchResult,
} from '../faq/enhancedFAQSearchService';

export interface CachedQAResult {
  query: string;
  type: 'faq' | 'llm';
  result: any;
  timestamp: number;
  hitCount: number;
  source: string;
  confidence: number;
  costSaving: number;
}

export interface QACacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalCostSavings: number;
  avgResponseTime: number;
  lastUpdated: Date;
}

export class QAResultCacheService {
  private static instance: QAResultCacheService;
  private readonly cachePrefix = 'qa_result_cache_';
  private readonly metricsKey = 'qa_cache_metrics';
  private readonly maxCacheEntries = 500;
  private readonly defaultTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  private faqSearchService: EnhancedFAQSearchService;
  private metrics: QACacheMetrics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    totalCostSavings: 0,
    avgResponseTime: 0,
    lastUpdated: new Date(),
  };

  private constructor() {
    this.faqSearchService = EnhancedFAQSearchService.getInstance();
    this.loadMetrics();
  }

  public static getInstance(): QAResultCacheService {
    if (!QAResultCacheService.instance) {
      QAResultCacheService.instance = new QAResultCacheService();
    }
    return QAResultCacheService.instance;
  }

  /**
   * Generate cache key from query
   */
  private generateCacheKey(query: string): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, '_');
    return `${this.cachePrefix}${normalized.substring(0, 100)}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidCacheEntry(entry: CachedQAResult): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age < this.defaultTTL;
  }

  /**
   * Get cached Q&A result
   */
  public async getCachedResult(query: string): Promise<CachedQAResult | null> {
    try {
      const cacheKey = this.generateCacheKey(query);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const entry: CachedQAResult = JSON.parse(cached);

        if (this.isValidCacheEntry(entry)) {
          // Update hit count and save back
          entry.hitCount++;
          await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));

          // Update metrics
          this.metrics.totalQueries++;
          this.metrics.cacheHits++;
          this.metrics.hitRate =
            this.metrics.cacheHits / this.metrics.totalQueries;
          this.metrics.totalCostSavings += entry.costSaving;
          this.metrics.lastUpdated = new Date();

          await this.saveMetrics();

          console.log(
            `[QA Cache] HIT for query: "${query.substring(0, 50)}..." (${entry.type})`
          );
          return entry;
        } else {
          // Remove expired entry
          await AsyncStorage.removeItem(cacheKey);
        }
      }

      // Record cache miss
      this.metrics.totalQueries++;
      this.metrics.cacheMisses++;
      this.metrics.hitRate =
        this.metrics.totalQueries > 0
          ? this.metrics.cacheHits / this.metrics.totalQueries
          : 0;
      this.metrics.lastUpdated = new Date();
      await this.saveMetrics();

      return null;
    } catch (error) {
      console.error('[QA Cache] Error getting cached result:', error);
      return null;
    }
  }

  /**
   * Cache FAQ search result
   */
  public async cacheFAQResult(
    query: string,
    faqResults: EnhancedSearchResult[],
    responseTime: number
  ): Promise<void> {
    if (!faqResults || faqResults.length === 0) return;

    try {
      const cacheKey = this.generateCacheKey(query);
      const topResult = faqResults[0];

      const entry: CachedQAResult = {
        query,
        type: 'faq',
        result: {
          faq: topResult.faq,
          category: topResult.category,
          relevanceScore: topResult.relevanceScore,
          confidence: topResult.confidence,
          matchType: topResult.matchType,
          allResults: faqResults.slice(0, 5), // Store top 5 results
        },
        timestamp: Date.now(),
        hitCount: 0,
        source: 'local_faq_search',
        confidence: topResult.confidence,
        costSaving: 0.001, // Estimated cost of API call avoided
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      await this.updateMetrics(responseTime);

      console.log(
        `[QA Cache] Cached FAQ result for: "${query.substring(0, 50)}..."`
      );
    } catch (error) {
      console.error('[QA Cache] Error caching FAQ result:', error);
    }
  }

  /**
   * Cache LLM API response result
   */
  public async cacheLLMResult(
    query: string,
    response: string,
    model: string,
    cost: number,
    confidence: number,
    responseTime: number
  ): Promise<void> {
    if (!response || response.trim().length === 0) return;

    try {
      const cacheKey = this.generateCacheKey(query);

      const entry: CachedQAResult = {
        query,
        type: 'llm',
        result: {
          response,
          model,
          generatedAt: new Date().toISOString(),
          wordCount: response.split(/\s+/).length,
        },
        timestamp: Date.now(),
        hitCount: 0,
        source: 'api_llm_response',
        confidence,
        costSaving: cost,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      await this.updateMetrics(responseTime);

      console.log(
        `[QA Cache] Cached LLM result for: "${query.substring(0, 50)}..." (cost: $${cost.toFixed(4)})`
      );
    } catch (error) {
      console.error('[QA Cache] Error caching LLM result:', error);
    }
  }

  /**
   * Smart search with cache-first approach
   */
  public async smartSearch(query: string): Promise<{
    result: CachedQAResult | null;
    fromCache: boolean;
    searchTime: number;
  }> {
    const startTime = performance.now();

    // 1. Try cache first
    const cachedResult = await this.getCachedResult(query);
    if (cachedResult) {
      const searchTime = performance.now() - startTime;
      return {
        result: cachedResult,
        fromCache: true,
        searchTime,
      };
    }

    // 2. Try FAQ search
    try {
      const faqResults = await this.faqSearchService.enhancedSearch(query);
      const searchTime = performance.now() - startTime;

      if (
        faqResults &&
        faqResults.length > 0 &&
        faqResults[0].relevanceScore > 0.3
      ) {
        // Cache the FAQ result
        await this.cacheFAQResult(query, faqResults, searchTime);

        const result: CachedQAResult = {
          query,
          type: 'faq',
          result: {
            faq: faqResults[0].faq,
            category: faqResults[0].category,
            relevanceScore: faqResults[0].relevanceScore,
            confidence: faqResults[0].confidence,
            matchType: faqResults[0].matchType,
            allResults: faqResults.slice(0, 5),
          },
          timestamp: Date.now(),
          hitCount: 0,
          source: 'local_faq_search',
          confidence: faqResults[0].confidence,
          costSaving: 0.001,
        };

        return {
          result,
          fromCache: false,
          searchTime,
        };
      }
    } catch (error) {
      console.error('[QA Cache] FAQ search error:', error);
    }

    const searchTime = performance.now() - startTime;
    return {
      result: null,
      fromCache: false,
      searchTime,
    };
  }

  /**
   * Update performance metrics
   */
  private async updateMetrics(responseTime: number): Promise<void> {
    try {
      // Update running average of response time
      const totalTime =
        this.metrics.avgResponseTime * (this.metrics.totalQueries - 1) +
        responseTime;
      this.metrics.avgResponseTime = totalTime / this.metrics.totalQueries;
      this.metrics.lastUpdated = new Date();

      await this.saveMetrics();
    } catch (error) {
      console.error('[QA Cache] Error updating metrics:', error);
    }
  }

  /**
   * Get current cache metrics
   */
  public async getMetrics(): Promise<QACacheMetrics> {
    await this.loadMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache size and optimization recommendations
   */
  public async getCacheInfo(): Promise<{
    entryCount: number;
    estimatedSizeKB: number;
    hitRate: number;
    totalCostSavings: number;
    recommendations: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));

      let totalSize = 0;
      const recommendations: string[] = [];

      // Sample a few entries to estimate size
      if (cacheKeys.length > 0) {
        const sampleKeys = cacheKeys.slice(0, Math.min(10, cacheKeys.length));
        for (const key of sampleKeys) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
        totalSize = (totalSize / sampleKeys.length) * cacheKeys.length;
      }

      // Generate recommendations
      if (cacheKeys.length > this.maxCacheEntries * 0.8) {
        recommendations.push(
          'Cache is approaching capacity. Consider clearing old entries.'
        );
      }

      if (this.metrics.hitRate < 0.6) {
        recommendations.push(
          'Low cache hit rate. Users may be asking diverse questions.'
        );
      }

      if (this.metrics.totalCostSavings > 1.0) {
        recommendations.push(
          'Excellent cost savings! Cache is working effectively.'
        );
      }

      return {
        entryCount: cacheKeys.length,
        estimatedSizeKB: Math.round(totalSize / 1024),
        hitRate: this.metrics.hitRate,
        totalCostSavings: this.metrics.totalCostSavings,
        recommendations,
      };
    } catch (error) {
      console.error('[QA Cache] Error getting cache info:', error);
      return {
        entryCount: 0,
        estimatedSizeKB: 0,
        hitRate: 0,
        totalCostSavings: 0,
        recommendations: ['Error analyzing cache'],
      };
    }
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.metricsKey);
      if (stored) {
        const parsedMetrics = JSON.parse(stored);
        this.metrics = {
          ...this.metrics,
          ...parsedMetrics,
          lastUpdated: new Date(parsedMetrics.lastUpdated),
        };
      }
    } catch (error) {
      console.error('[QA Cache] Error loading metrics:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.metricsKey, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[QA Cache] Error saving metrics:', error);
    }
  }

  /**
   * Clear old cache entries to maintain performance
   */
  public async optimizeCache(): Promise<{
    entriesRemoved: number;
    spaceFreedKB: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));

      if (cacheKeys.length <= this.maxCacheEntries) {
        return { entriesRemoved: 0, spaceFreedKB: 0 };
      }

      // Get all entries with timestamps
      const entries: Array<{ key: string; timestamp: number; size: number }> =
        [];

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const entry: CachedQAResult = JSON.parse(value);
            entries.push({
              key,
              timestamp: entry.timestamp,
              size: value.length,
            });
          } catch (error) {
            // Invalid entry, mark for removal
            entries.push({
              key,
              timestamp: 0,
              size: value.length,
            });
          }
        }
      }

      // Sort by timestamp (oldest first) and remove excess entries
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - this.maxCacheEntries);

      let spaceFreed = 0;
      for (const entry of toRemove) {
        await AsyncStorage.removeItem(entry.key);
        spaceFreed += entry.size;
      }

      return {
        entriesRemoved: toRemove.length,
        spaceFreedKB: Math.round(spaceFreed / 1024),
      };
    } catch (error) {
      console.error('[QA Cache] Error optimizing cache:', error);
      return { entriesRemoved: 0, spaceFreedKB: 0 };
    }
  }

  /**
   * Clear all cache data
   */
  public async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        key => key.startsWith(this.cachePrefix) || key === this.metricsKey
      );

      await AsyncStorage.multiRemove(cacheKeys);

      // Reset metrics
      this.metrics = {
        totalQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        totalCostSavings: 0,
        avgResponseTime: 0,
        lastUpdated: new Date(),
      };

      console.log(`[QA Cache] Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('[QA Cache] Error clearing cache:', error);
    }
  }
}
