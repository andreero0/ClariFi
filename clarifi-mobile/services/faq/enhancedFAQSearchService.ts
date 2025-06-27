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

interface EnhancedSearchResult {
  faq: FAQ;
  category: FAQCategory;
  relevanceScore: number;
  confidence: number;
  matchType: 'exact' | 'keyword' | 'fuzzy' | 'semantic' | 'partial';
  matchedTerms: string[];
  fuzzyMatchDetails: FuzzyMatchResult;
  boosts: {
    canadian: number;
    clarifi: number;
    synonyms: number;
    questionPattern: number;
  };
}

interface SearchConfiguration {
  minScore: number;
  maxResults: number;
  enableSynonymExpansion: boolean;
  enableFuzzyMatching: boolean;
  canadianBoostWeight: number;
  clarifiBoostWeight: number;
}

export class EnhancedFAQSearchService {
  private static instance: EnhancedFAQSearchService;
  private categories: FAQCategory[] = FAQContent.categories;
  private searchHistory: string[] = [];
  private config: SearchConfiguration = {
    minScore: 0.1,
    maxResults: 20,
    enableSynonymExpansion: true,
    enableFuzzyMatching: true,
    canadianBoostWeight: 1.3,
    clarifiBoostWeight: 1.25,
  };

  private constructor() {
    this.loadSearchHistory();
  }

  public static getInstance(): EnhancedFAQSearchService {
    if (!EnhancedFAQSearchService.instance) {
      EnhancedFAQSearchService.instance = new EnhancedFAQSearchService();
    }
    return EnhancedFAQSearchService.instance;
  }

  /**
   * Enhanced search with advanced fuzzy matching and Canadian financial optimization
   */
  public async enhancedSearch(
    query: string,
    categoryFilter?: string
  ): Promise<EnhancedSearchResult[]> {
    const startTime = performance.now();
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const results: EnhancedSearchResult[] = [];

    // Filter categories if specified
    const searchCategories = categoryFilter
      ? this.categories.filter(cat => cat.id === categoryFilter)
      : this.categories;

    // Generate expanded queries with synonyms
    const expandedQueries = this.config.enableSynonymExpansion
      ? FuzzyMatchingUtils.expandQueryWithSynonyms(query)
      : [query];

    for (const category of searchCategories) {
      for (const faq of category.faqs) {
        const result = this.calculateEnhancedRelevance(
          faq,
          category,
          query,
          expandedQueries
        );

        if (result.relevanceScore >= this.config.minScore) {
          results.push(result);
        }
      }
    }

    // Sort by relevance score and confidence
    results.sort((a, b) => {
      const scoreA = a.relevanceScore * a.confidence;
      const scoreB = b.relevanceScore * b.confidence;
      return scoreB - scoreA;
    });

    // Limit results
    const limitedResults = results.slice(0, this.config.maxResults);

    // Record search metrics
    const searchTime = performance.now() - startTime;
    await this.recordSearchAnalytics(query, limitedResults, searchTime);

    return limitedResults;
  }

  /**
   * Calculate enhanced relevance with multiple matching strategies
   */
  private calculateEnhancedRelevance(
    faq: FAQ,
    category: FAQCategory,
    originalQuery: string,
    expandedQueries: string[]
  ): EnhancedSearchResult {
    const question = faq.question.toLowerCase();
    const answer = faq.answer.toLowerCase();
    const fullText = `${question} ${answer} ${faq.keywords.join(' ')}`;

    let maxScore = 0;
    let bestMatch: FuzzyMatchResult = {
      score: 0,
      confidence: 0,
      matchType: 'exact',
      matchedSegments: [],
    };
    let bestQuery = originalQuery;

    // Test all expanded queries and keep the best match
    for (const query of expandedQueries) {
      const questionMatch = FuzzyMatchingUtils.comprehensiveFuzzyMatch(
        query,
        question
      );
      const fullTextMatch = FuzzyMatchingUtils.comprehensiveFuzzyMatch(
        query,
        fullText
      );

      // Weighted score: question match is more important
      const combinedScore =
        questionMatch.score * 0.7 + fullTextMatch.score * 0.3;
      const combinedConfidence =
        questionMatch.confidence * 0.7 + fullTextMatch.confidence * 0.3;

      if (combinedScore > maxScore) {
        maxScore = combinedScore;
        bestMatch = {
          score: combinedScore,
          confidence: combinedConfidence,
          matchType:
            questionMatch.score > fullTextMatch.score
              ? questionMatch.matchType
              : fullTextMatch.matchType,
          matchedSegments: [
            ...questionMatch.matchedSegments,
            ...fullTextMatch.matchedSegments,
          ],
        };
        bestQuery = query;
      }
    }

    // Calculate boost factors
    const canadianBoost = FuzzyMatchingUtils.getCanadianBoost(fullText);
    const clarifiBoost = FuzzyMatchingUtils.getClariFiRelevanceBoost(
      originalQuery,
      fullText
    );
    const synonymBoost = bestQuery !== originalQuery ? 0.2 : 0;
    const questionPatternBoost = this.calculateQuestionPatternBoost(
      originalQuery,
      question
    );

    // Apply boosts
    const boostedScore =
      maxScore *
      (1 + canadianBoost * this.config.canadianBoostWeight) *
      (1 + clarifiBoost * this.config.clarifiBoostWeight) *
      (1 + synonymBoost) *
      (1 + questionPatternBoost);

    // Determine primary match type
    const matchType = this.determineEnhancedMatchType(
      bestMatch,
      faq,
      originalQuery
    );

    return {
      faq,
      category,
      relevanceScore: boostedScore,
      confidence: bestMatch.confidence,
      matchType,
      matchedTerms: [...new Set(bestMatch.matchedSegments)],
      fuzzyMatchDetails: bestMatch,
      boosts: {
        canadian: canadianBoost,
        clarifi: clarifiBoost,
        synonyms: synonymBoost,
        questionPattern: questionPatternBoost,
      },
    };
  }

  /**
   * Calculate boost for question pattern matching
   */
  private calculateQuestionPatternBoost(
    query: string,
    question: string
  ): number {
    const questionPatterns = [
      'how to',
      'how do i',
      'how can i',
      'what is',
      'what are',
      'why should',
      'when should',
      'where can',
      'which is',
      'should i',
      'can i',
      'is it',
      'best way to',
      'how much',
      'what happens if',
    ];

    const queryLower = query.toLowerCase();
    const questionLower = question.toLowerCase();

    for (const pattern of questionPatterns) {
      if (queryLower.startsWith(pattern) && questionLower.includes(pattern)) {
        return 0.15; // 15% boost for question pattern match
      }
    }

    return 0;
  }

  /**
   * Determine enhanced match type based on multiple factors
   */
  private determineEnhancedMatchType(
    fuzzyMatch: FuzzyMatchResult,
    faq: FAQ,
    query: string
  ): 'exact' | 'keyword' | 'fuzzy' | 'semantic' | 'partial' {
    if (fuzzyMatch.matchType === 'exact' && fuzzyMatch.score > 0.9) {
      return 'exact';
    }

    const queryLower = query.toLowerCase();
    const hasKeywordMatch = faq.keywords.some(
      keyword =>
        queryLower.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(queryLower)
    );

    if (hasKeywordMatch) {
      return 'keyword';
    }

    if (
      fuzzyMatch.matchType === 'partial' ||
      fuzzyMatch.matchType === 'fuzzy'
    ) {
      return fuzzyMatch.score > 0.7 ? 'partial' : 'fuzzy';
    }

    return 'semantic';
  }

  /**
   * Smart search suggestions based on partial input
   */
  public getSmartSuggestions(
    partialQuery: string,
    limit: number = 8
  ): string[] {
    const normalized = partialQuery.toLowerCase().trim();
    if (normalized.length < 2) return [];

    const suggestions = new Set<string>();

    // Add common Canadian financial questions
    const commonQuestions = [
      'How to improve credit score in Canada',
      'What is a good credit utilization ratio',
      'How to create a budget',
      'Best bank account types in Canada',
      'How to check credit score for free',
      'Emergency fund how much',
      'TFSA vs RRSP difference',
      'How to avoid bank fees',
      'Best way to track expenses',
      'How to use ClariFi app',
    ];

    commonQuestions.forEach(question => {
      if (question.toLowerCase().includes(normalized)) {
        suggestions.add(question);
      }
    });

    // Add suggestions from FAQ questions
    this.categories.forEach(category => {
      category.faqs.forEach(faq => {
        if (faq.question.toLowerCase().includes(normalized)) {
          suggestions.add(faq.question);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get contextual follow-up questions
   */
  public getContextualQuestions(faqId: string, userQuery: string): string[] {
    const faqData = this.getFAQById(faqId);
    if (!faqData) return [];

    const contextualQuestions: string[] = [];

    // Add related questions from FAQ
    faqData.faq.relatedQuestions.forEach(relatedId => {
      const related = this.getFAQById(relatedId);
      if (related) {
        contextualQuestions.push(related.faq.question);
      }
    });

    // Add category-based suggestions
    const categoryFAQs = faqData.category.faqs
      .filter(faq => faq.id !== faqId)
      .slice(0, 3);

    categoryFAQs.forEach(faq => {
      contextualQuestions.push(faq.question);
    });

    return contextualQuestions.slice(0, 5);
  }

  /**
   * Get FAQ by ID with category information
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
   * Get all categories
   */
  public getCategories(): FAQCategory[] {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  /**
   * Update search configuration
   */
  public updateConfiguration(newConfig: Partial<SearchConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current search configuration
   */
  public getConfiguration(): SearchConfiguration {
    return { ...this.config };
  }

  /**
   * Search history management
   */
  private async loadSearchHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem('enhanced_faq_search_history');
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  private async recordSearchAnalytics(
    query: string,
    results: EnhancedSearchResult[],
    searchTime: number
  ): Promise<void> {
    try {
      // Record search metrics for analytics
      const metrics = {
        query,
        resultCount: results.length,
        searchTime,
        avgConfidence:
          results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        topMatchType: results[0]?.matchType || 'none',
        timestamp: new Date().toISOString(),
      };

      const existing = await AsyncStorage.getItem('enhanced_search_analytics');
      const analytics = existing ? JSON.parse(existing) : [];
      analytics.push(metrics);

      // Keep only last 1000 entries
      const limitedAnalytics = analytics.slice(-1000);

      await AsyncStorage.setItem(
        'enhanced_search_analytics',
        JSON.stringify(limitedAnalytics)
      );

      // Update search history
      this.searchHistory = this.searchHistory.filter(term => term !== query);
      this.searchHistory.unshift(query);
      this.searchHistory = this.searchHistory.slice(0, 50);

      await AsyncStorage.setItem(
        'enhanced_faq_search_history',
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.error('Error recording search analytics:', error);
    }
  }

  /**
   * Get search analytics
   */
  public async getSearchAnalytics(): Promise<{
    totalSearches: number;
    averageConfidence: number;
    averageSearchTime: number;
    matchTypeDistribution: { [key: string]: number };
    topQueries: Array<{ query: string; count: number }>;
  }> {
    try {
      const analyticsData = await AsyncStorage.getItem(
        'enhanced_search_analytics'
      );
      if (!analyticsData) {
        return {
          totalSearches: 0,
          averageConfidence: 0,
          averageSearchTime: 0,
          matchTypeDistribution: {},
          topQueries: [],
        };
      }

      const analytics = JSON.parse(analyticsData);
      const totalSearches = analytics.length;

      if (totalSearches === 0) {
        return {
          totalSearches: 0,
          averageConfidence: 0,
          averageSearchTime: 0,
          matchTypeDistribution: {},
          topQueries: [],
        };
      }

      const averageConfidence =
        analytics.reduce(
          (sum: number, a: any) => sum + (a.avgConfidence || 0),
          0
        ) / totalSearches;
      const averageSearchTime =
        analytics.reduce((sum: number, a: any) => sum + a.searchTime, 0) /
        totalSearches;

      const matchTypes: { [key: string]: number } = {};
      const queryCount: { [key: string]: number } = {};

      analytics.forEach((a: any) => {
        matchTypes[a.topMatchType] = (matchTypes[a.topMatchType] || 0) + 1;
        queryCount[a.query] = (queryCount[a.query] || 0) + 1;
      });

      const topQueries = Object.entries(queryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      return {
        totalSearches,
        averageConfidence: Math.round(averageConfidence * 1000) / 1000,
        averageSearchTime: Math.round(averageSearchTime * 100) / 100,
        matchTypeDistribution: matchTypes,
        topQueries,
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        totalSearches: 0,
        averageConfidence: 0,
        averageSearchTime: 0,
        matchTypeDistribution: {},
        topQueries: [],
      };
    }
  }
}
