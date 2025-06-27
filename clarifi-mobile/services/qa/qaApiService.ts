import { API_BASE_URL } from '../../constants/config';
import { QAResultCacheService } from './qaResultCacheService';

export interface QAApiRequest {
  query: string;
}

export interface QAApiResponse {
  success: boolean;
  data?: {
    answer: string;
    source: 'faq' | 'llm';
    confidence: number;
    category?: string;
    queryId?: string;
    model?: string;
    cost?: number;
    cached: boolean;
  };
  error?: string;
  limits?: {
    remainingQueries: number;
    monthlyLimit: number;
    resetDate: string;
  };
}

export interface QAHealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  faqService: boolean;
  llmService: boolean;
  cacheService: boolean;
  totalQuestions: number;
  uptime: string;
}

export interface QAMetricsResponse {
  totalQueries: number;
  faqHitRate: number;
  averageResponseTime: number;
  costPerUser: number;
  activeUsers: number;
}

export class QAApiService {
  private static instance: QAApiService;
  private cacheService: QAResultCacheService;
  private baseUrl: string;

  private constructor() {
    this.cacheService = QAResultCacheService.getInstance();
    // Use the API_BASE_URL from config, fallback to localhost for development
    this.baseUrl =
      API_BASE_URL === 'http://your-api-base-url-here.com/api'
        ? 'http://localhost:3000/api'
        : API_BASE_URL;
  }

  public static getInstance(): QAApiService {
    if (!QAApiService.instance) {
      QAApiService.instance = new QAApiService();
    }
    return QAApiService.instance;
  }

  /**
   * Ask a question with smart caching integration
   */
  public async askQuestion(query: string): Promise<QAApiResponse> {
    const startTime = Date.now();

    try {
      // 1. Check cache first
      const cachedResult = await this.cacheService.getCachedResult(query);
      if (cachedResult) {
        console.log(
          `[QA API] Cache hit for query: "${query.substring(0, 50)}..."`
        );
        return {
          success: true,
          data: {
            answer:
              cachedResult.type === 'faq'
                ? cachedResult.result.faq.answer
                : cachedResult.result.response,
            source: cachedResult.type,
            confidence: cachedResult.confidence,
            category: cachedResult.result.category,
            cached: true,
            cost: 0, // No cost for cached results
          },
        };
      }

      // 2. Make API call
      console.log(
        `[QA API] Making API call for query: "${query.substring(0, 50)}..."`
      );

      const response = await fetch(`${this.baseUrl}/qa/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth header when authentication is implemented
          // 'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ query }),
        // Add timeout for mobile
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[QA API] API error:', response.status, errorData);

        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
          limits: errorData.limits,
        };
      }

      const data = await response.json();

      // 3. Cache the result if successful
      if (data.success && data.data) {
        if (data.data.source === 'faq') {
          // For FAQ results, create a structure compatible with cache
          const faqResults = [
            {
              faq: { answer: data.data.answer },
              category: data.data.category,
              confidence: data.data.confidence,
              relevanceScore: data.data.confidence,
              matchType: 'api_faq',
            },
          ];

          await this.cacheService.cacheFAQResult(
            query,
            faqResults,
            responseTime
          );
        } else if (data.data.source === 'llm') {
          // Cache LLM result
          await this.cacheService.cacheLLMResult(
            query,
            data.data.answer,
            data.data.model || 'unknown',
            data.data.cost || 0.002,
            data.data.confidence,
            responseTime
          );
        }
      }

      return {
        ...data,
        data: {
          ...data.data,
          cached: false,
        },
      };
    } catch (error) {
      console.error('[QA API] Network error:', error);

      // Return cached result as fallback if available
      const fallbackCache = await this.cacheService.getCachedResult(query);
      if (fallbackCache) {
        console.log('[QA API] Using cached result as fallback');
        return {
          success: true,
          data: {
            answer:
              fallbackCache.type === 'faq'
                ? fallbackCache.result.faq.answer
                : fallbackCache.result.response,
            source: fallbackCache.type,
            confidence: fallbackCache.confidence,
            category: fallbackCache.result.category,
            cached: true,
            cost: 0,
          },
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Check service health
   */
  public async checkHealth(): Promise<QAHealthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/qa/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[QA API] Health check failed:', error);
      return null;
    }
  }

  /**
   * Get service metrics (admin/monitoring use)
   */
  public async getMetrics(): Promise<QAMetricsResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/qa/metrics`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[QA API] Metrics fetch failed:', error);
      return null;
    }
  }

  /**
   * Get FAQ categories for UI
   */
  public async getCategories(): Promise<string[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/qa/categories`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('[QA API] Categories fetch failed:', error);
      return null;
    }
  }

  /**
   * Get user's current query usage and limits
   */
  public async getUserLimits(): Promise<{
    remainingQueries: number;
    monthlyLimit: number;
    resetDate: string;
    costThisMonth: number;
  } | null> {
    try {
      // This would typically require authentication
      // For now, return mock data or null
      return null;
    } catch (error) {
      console.error('[QA API] User limits fetch failed:', error);
      return null;
    }
  }
}

export default QAApiService;
