/**
 * Q&A Cache Configuration
 * Optimized for cost efficiency and performance
 */

export interface QACacheConfig {
  // Cache TTL settings
  faqCacheTtlDays: number;
  llmCacheTtlDays: number;

  // Performance thresholds
  maxCacheEntries: number;
  minRelevanceScore: number;
  costThresholds: {
    faqLookupCost: number;
    llmRequestCost: number;
    maxDailyCost: number;
  };

  // Search optimization
  searchConfig: {
    enableSynonymExpansion: boolean;
    enableFuzzyMatching: boolean;
    enableCaching: boolean;
    similarityThreshold: number;
  };

  // Metrics and monitoring
  metricsConfig: {
    enableMetrics: boolean;
    enableCostTracking: boolean;
    enablePerformanceTracking: boolean;
    reportingInterval: number; // hours
  };
}

export const DEFAULT_QA_CACHE_CONFIG: QACacheConfig = {
  faqCacheTtlDays: 30,
  llmCacheTtlDays: 30,

  maxCacheEntries: 500,
  minRelevanceScore: 0.3,

  costThresholds: {
    faqLookupCost: 0.001, // $0.001 per FAQ lookup
    llmRequestCost: 0.002, // $0.002 per LLM request
    maxDailyCost: 0.5, // $0.50 per user per day max
  },

  searchConfig: {
    enableSynonymExpansion: true,
    enableFuzzyMatching: true,
    enableCaching: true,
    similarityThreshold: 0.85,
  },

  metricsConfig: {
    enableMetrics: true,
    enableCostTracking: true,
    enablePerformanceTracking: true,
    reportingInterval: 24, // 24 hours
  },
};

/**
 * Get cache configuration with environment overrides
 */
export function getQACacheConfig(): QACacheConfig {
  return {
    ...DEFAULT_QA_CACHE_CONFIG,
    // Add any environment-specific overrides here
    maxCacheEntries: parseInt(process.env.QA_MAX_CACHE_ENTRIES || '500'),
    minRelevanceScore: parseFloat(process.env.QA_MIN_RELEVANCE_SCORE || '0.3'),
  };
}

/**
 * Cache key generation utilities
 */
export const CacheKeys = {
  FAQ_RESULT: 'qa_faq_result_',
  LLM_RESULT: 'qa_llm_result_',
  METRICS: 'qa_cache_metrics',
  CONFIG: 'qa_cache_config',
  USER_LIMITS: 'qa_user_limits_',
  COST_TRACKING: 'qa_cost_tracking_',
};

/**
 * Cost calculation utilities
 */
export class CostCalculator {
  static calculateFAQCost(searchTime: number, cacheHit: boolean): number {
    if (cacheHit) return 0;
    return DEFAULT_QA_CACHE_CONFIG.costThresholds.faqLookupCost;
  }

  static calculateLLMCost(tokens: { input: number; output: number }): number {
    // Simplified cost calculation - in production this would use actual model pricing
    const inputCost = tokens.input * 0.000001; // $1 per 1M input tokens
    const outputCost = tokens.output * 0.000002; // $2 per 1M output tokens
    return inputCost + outputCost;
  }

  static estimateDailyCostSavings(
    faqHits: number,
    llmHits: number,
    avgLLMCost: number
  ): number {
    const faqSavings =
      faqHits * DEFAULT_QA_CACHE_CONFIG.costThresholds.faqLookupCost;
    const llmSavings = llmHits * avgLLMCost;
    return faqSavings + llmSavings;
  }
}
