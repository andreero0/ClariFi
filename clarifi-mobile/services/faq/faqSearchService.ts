import AsyncStorage from '@react-native-async-storage/async-storage';
import FAQContent from '../../assets/faq-content.json';
import { FuzzyMatchingUtils, FuzzyMatchResult } from './fuzzyMatchingUtils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  tags: string[];
  relatedQuestions: string[];
  lastUpdated: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  order: number;
  questionCount: number;
  faqs: FAQ[];
}

interface SearchResult {
  faq: FAQ;
  category: FAQCategory;
  relevanceScore: number;
  matchType: 'exact' | 'keyword' | 'fuzzy' | 'category';
  matchedTerms: string[];
}

interface SearchMetrics {
  query: string;
  resultCount: number;
  searchTime: number;
  timestamp: Date;
  selectedResultId?: string;
}

export class FAQSearchService {
  private static instance: FAQSearchService;
  private categories: FAQCategory[] = FAQContent.categories;
  private searchHistory: string[] = [];
  private searchMetrics: SearchMetrics[] = [];

  private constructor() {
    this.loadSearchHistory();
  }

  public static getInstance(): FAQSearchService {
    if (!FAQSearchService.instance) {
      FAQSearchService.instance = new FAQSearchService();
    }
    return FAQSearchService.instance;
  }

  /**
   * Main search function with multiple search strategies
   */
  public async search(
    query: string,
    categoryFilter?: string
  ): Promise<SearchResult[]> {
    const startTime = performance.now();
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];
    const queryTerms = normalizedQuery.split(/\s+/);

    // Filter categories if specified
    const searchCategories = categoryFilter
      ? this.categories.filter(cat => cat.id === categoryFilter)
      : this.categories;

    for (const category of searchCategories) {
      for (const faq of category.faqs) {
        const relevanceScore = this.calculateRelevanceScore(
          faq,
          normalizedQuery,
          queryTerms
        );

        if (relevanceScore > 0) {
          const matchType = this.determineMatchType(
            faq,
            normalizedQuery,
            queryTerms
          );
          const matchedTerms = this.getMatchedTerms(faq, queryTerms);

          results.push({
            faq,
            category,
            relevanceScore,
            matchType,
            matchedTerms,
          });
        }
      }
    }

    // Sort by relevance score (descending)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results to top 20
    const limitedResults = results.slice(0, 20);

    // Record search metrics
    const searchTime = performance.now() - startTime;
    await this.recordSearchMetrics({
      query,
      resultCount: limitedResults.length,
      searchTime,
      timestamp: new Date(),
    });

    // Add to search history
    await this.addToSearchHistory(query);

    return limitedResults;
  }

  /**
   * Get all FAQs by category
   */
  public getFAQsByCategory(
    categoryId: string
  ): { category: FAQCategory; faqs: FAQ[] } | null {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category) return null;

    return {
      category,
      faqs: category.faqs,
    };
  }

  /**
   * Get all available categories
   */
  public getCategories(): FAQCategory[] {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  /**
   * Get a specific FAQ by ID
   */
  public getFAQById(faqId: string): { faq: FAQ; category: FAQCategory } | null {
    for (const category of this.categories) {
      const faq = category.faqs.find(f => f.id === faqId);
      if (faq) {
        return { faq, category };
      }
    }
    return null;
  }

  /**
   * Get related FAQs for a given FAQ
   */
  public getRelatedFAQs(faqId: string, limit: number = 5): SearchResult[] {
    const current = this.getFAQById(faqId);
    if (!current) return [];

    const related: SearchResult[] = [];

    // First, add explicitly related questions
    for (const relatedId of current.faq.relatedQuestions) {
      const relatedFAQ = this.getFAQById(relatedId);
      if (relatedFAQ) {
        related.push({
          faq: relatedFAQ.faq,
          category: relatedFAQ.category,
          relevanceScore: 1.0,
          matchType: 'exact',
          matchedTerms: [],
        });
      }
    }

    // Then, add FAQs from the same category
    if (related.length < limit) {
      const categoryFAQs = current.category.faqs
        .filter(
          faq =>
            faq.id !== faqId && !current.faq.relatedQuestions.includes(faq.id)
        )
        .slice(0, limit - related.length);

      for (const faq of categoryFAQs) {
        related.push({
          faq,
          category: current.category,
          relevanceScore: 0.8,
          matchType: 'category',
          matchedTerms: [],
        });
      }
    }

    return related.slice(0, limit);
  }

  /**
   * Get popular search terms
   */
  public async getPopularSearchTerms(): Promise<string[]> {
    const metrics = await this.getSearchMetrics();
    const termCounts = new Map<string, number>();

    metrics.forEach(metric => {
      const terms = metric.query.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        if (term.length > 2) {
          termCounts.set(term, (termCounts.get(term) || 0) + 1);
        }
      });
    });

    return Array.from(termCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }

  /**
   * Get search suggestions based on partial input
   */
  public getSearchSuggestions(partialQuery: string): string[] {
    const normalized = partialQuery.toLowerCase().trim();
    if (normalized.length < 2) return [];

    const suggestions = new Set<string>();

    // Add suggestions from FAQ questions
    this.categories.forEach(category => {
      category.faqs.forEach(faq => {
        if (faq.question.toLowerCase().includes(normalized)) {
          suggestions.add(faq.question);
        }

        // Add keyword suggestions
        faq.keywords.forEach(keyword => {
          if (keyword.toLowerCase().includes(normalized)) {
            suggestions.add(keyword);
          }
        });
      });
    });

    // Add suggestions from search history
    this.searchHistory.forEach(term => {
      if (term.toLowerCase().includes(normalized)) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }

  /**
   * Record when a user selects a search result
   */
  public async recordResultSelection(
    query: string,
    selectedFAQId: string
  ): Promise<void> {
    const metrics = await this.getSearchMetrics();
    const recentMetric = metrics.find(
      m => m.query === query && Date.now() - m.timestamp.getTime() < 60000 // Within last minute
    );

    if (recentMetric) {
      recentMetric.selectedResultId = selectedFAQId;
      await this.saveSearchMetrics(metrics);
    }
  }

  /**
   * Calculate relevance score for a FAQ against search query using advanced fuzzy matching
   */
  private calculateRelevanceScore(
    faq: FAQ,
    query: string,
    queryTerms: string[]
  ): number {
    let score = 0;
    const question = faq.question.toLowerCase();
    const answer = faq.answer.toLowerCase();
    const keywords = faq.keywords.map(k => k.toLowerCase());
    const tags = faq.tags.map(t => t.toLowerCase());
    const fullText = `${question} ${answer}`;

    // 1. Advanced fuzzy matching on question (highest weight)
    const questionMatch = FuzzyMatchingUtils.comprehensiveFuzzyMatch(
      query,
      question
    );
    score += questionMatch.score * 15; // Higher weight for question matches

    // 2. Advanced fuzzy matching on full text
    const fullTextMatch = FuzzyMatchingUtils.comprehensiveFuzzyMatch(
      query,
      fullText
    );
    score += fullTextMatch.score * 8;

    // 3. Expand query with synonyms for enhanced matching
    const expandedQueries = FuzzyMatchingUtils.expandQueryWithSynonyms(query);
    let synonymBoost = 0;

    for (const expandedQuery of expandedQueries) {
      if (expandedQuery !== query) {
        const synonymMatch = FuzzyMatchingUtils.comprehensiveFuzzyMatch(
          expandedQuery,
          fullText
        );
        synonymBoost = Math.max(synonymBoost, synonymMatch.score * 6);
      }
    }
    score += synonymBoost;

    // 4. Enhanced keyword matching with fuzzy logic
    keywords.forEach(keyword => {
      queryTerms.forEach(term => {
        if (keyword.includes(term) || term.includes(keyword)) {
          score += 5;
        } else {
          // Fuzzy keyword matching
          const keywordFuzzy = FuzzyMatchingUtils.fuzzyScore(term, keyword);
          if (keywordFuzzy > 0.8) {
            score += keywordFuzzy * 3;
          }
        }
      });
    });

    // 5. Tag matching with fuzzy logic
    tags.forEach(tag => {
      queryTerms.forEach(term => {
        if (tag.includes(term) || term.includes(tag)) {
          score += 2;
        } else {
          const tagFuzzy = FuzzyMatchingUtils.fuzzyScore(term, tag);
          if (tagFuzzy > 0.8) {
            score += tagFuzzy * 1.5;
          }
        }
      });
    });

    // 6. Canadian content boost
    const canadianBoost = FuzzyMatchingUtils.getCanadianBoost(fullText);
    score += score * canadianBoost;

    // 7. ClariFi relevance boost
    const clarifiBoost = FuzzyMatchingUtils.getClariFiRelevanceBoost(
      query,
      fullText
    );
    score += score * clarifiBoost;

    // 8. Question pattern matching bonus
    const questionPatterns = [
      'how to',
      'what is',
      'how do i',
      'how can i',
      'best way',
    ];
    const queryLower = query.toLowerCase();

    for (const pattern of questionPatterns) {
      if (queryLower.startsWith(pattern) && question.includes(pattern)) {
        score += 2;
        break;
      }
    }

    // 9. Length-based scoring adjustment (prefer concise, relevant answers)
    const answerLength = answer.length;
    if (answerLength > 500 && answerLength < 2000) {
      score += 1; // Bonus for comprehensive but not overwhelming answers
    }

    // 10. Confidence-based final adjustment
    const avgConfidence =
      (questionMatch.confidence + fullTextMatch.confidence) / 2;
    score = score * (0.7 + 0.3 * avgConfidence); // Scale by confidence

    return Math.max(score, 0); // Ensure non-negative score
  }

  /**
   * Determine the type of match found
   */
  private determineMatchType(
    faq: FAQ,
    query: string,
    queryTerms: string[]
  ): 'exact' | 'keyword' | 'fuzzy' | 'category' {
    const question = faq.question.toLowerCase();
    const keywords = faq.keywords.map(k => k.toLowerCase());

    if (question.includes(query)) {
      return 'exact';
    }

    const hasKeywordMatch = keywords.some(keyword =>
      queryTerms.some(term => keyword.includes(term) || term.includes(keyword))
    );

    if (hasKeywordMatch) {
      return 'keyword';
    }

    const hasQuestionWordMatch = queryTerms.some(term =>
      question.includes(term)
    );
    if (hasQuestionWordMatch) {
      return 'fuzzy';
    }

    return 'category';
  }

  /**
   * Get terms that matched in the search
   */
  private getMatchedTerms(faq: FAQ, queryTerms: string[]): string[] {
    const matched: string[] = [];
    const question = faq.question.toLowerCase();
    const keywords = faq.keywords.map(k => k.toLowerCase());

    queryTerms.forEach(term => {
      if (question.includes(term)) {
        matched.push(term);
      }
      keywords.forEach(keyword => {
        if (keyword.includes(term) && !matched.includes(keyword)) {
          matched.push(keyword);
        }
      });
    });

    return matched;
  }

  /**
   * Search history management
   */
  private async loadSearchHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem('faq_search_history');
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  private async addToSearchHistory(query: string): Promise<void> {
    try {
      // Remove if already exists
      this.searchHistory = this.searchHistory.filter(term => term !== query);

      // Add to beginning
      this.searchHistory.unshift(query);

      // Limit to 50 items
      this.searchHistory = this.searchHistory.slice(0, 50);

      await AsyncStorage.setItem(
        'faq_search_history',
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  public async getSearchHistory(): Promise<string[]> {
    return [...this.searchHistory];
  }

  public async clearSearchHistory(): Promise<void> {
    try {
      this.searchHistory = [];
      await AsyncStorage.removeItem('faq_search_history');
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  /**
   * Search metrics management
   */
  private async getSearchMetrics(): Promise<SearchMetrics[]> {
    try {
      const metrics = await AsyncStorage.getItem('faq_search_metrics');
      if (metrics) {
        return JSON.parse(metrics).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
    } catch (error) {
      console.error('Error loading search metrics:', error);
    }
    return [];
  }

  private async saveSearchMetrics(metrics: SearchMetrics[]): Promise<void> {
    try {
      await AsyncStorage.setItem('faq_search_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.error('Error saving search metrics:', error);
    }
  }

  private async recordSearchMetrics(metric: SearchMetrics): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('faq_search_metrics');
      const metrics = existing ? JSON.parse(existing) : [];
      metrics.push(metric);

      // Keep only last 1000 metrics
      const limitedMetrics = metrics.slice(-1000);

      await AsyncStorage.setItem(
        'faq_search_metrics',
        JSON.stringify(limitedMetrics)
      );
    } catch (error) {
      console.error('Error recording search metrics:', error);
    }
  }

  /**
   * Get search analytics
   */
  public async getSearchAnalytics(): Promise<{
    totalSearches: number;
    averageResultCount: number;
    averageSearchTime: number;
    topQueries: Array<{ query: string; count: number }>;
    successRate: number; // Percentage of searches that led to selection
  }> {
    const metrics = await this.getSearchMetrics();

    if (metrics.length === 0) {
      return {
        totalSearches: 0,
        averageResultCount: 0,
        averageSearchTime: 0,
        topQueries: [],
        successRate: 0,
      };
    }

    const totalSearches = metrics.length;
    const averageResultCount =
      metrics.reduce((sum, m) => sum + m.resultCount, 0) / totalSearches;
    const averageSearchTime =
      metrics.reduce((sum, m) => sum + m.searchTime, 0) / totalSearches;

    const queryCountMap = new Map<string, number>();
    let successfulSearches = 0;

    metrics.forEach(metric => {
      queryCountMap.set(
        metric.query,
        (queryCountMap.get(metric.query) || 0) + 1
      );
      if (metric.selectedResultId) {
        successfulSearches++;
      }
    });

    const topQueries = Array.from(queryCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    const successRate = (successfulSearches / totalSearches) * 100;

    return {
      totalSearches,
      averageResultCount: Math.round(averageResultCount * 10) / 10,
      averageSearchTime: Math.round(averageSearchTime * 100) / 100,
      topQueries,
      successRate: Math.round(successRate * 10) / 10,
    };
  }

  /**
   * Clear all search data
   */
  public async clearAllSearchData(): Promise<void> {
    await Promise.all([
      this.clearSearchHistory(),
      AsyncStorage.removeItem('faq_search_metrics'),
    ]);
    this.searchMetrics = [];
  }
}
