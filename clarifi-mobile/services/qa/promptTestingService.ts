import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiConfig } from '../../config/api';

export interface PromptTestResult {
  testId: string;
  query: string;
  response: string;
  responseTime: number;
  source: 'cache' | 'faq' | 'llm';
  cost: number;
  userRating?: number;
  accuracy?: number;
  canadianRelevance?: number;
  timestamp: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  queries: TestQuery[];
  expectedResults: { [queryId: string]: ExpectedResult };
}

export interface TestQuery {
  id: string;
  query: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  canadianSpecific: boolean;
}

export interface ExpectedResult {
  shouldMentionKeywords: string[];
  shouldNotMentionKeywords: string[];
  expectedSource: 'cache' | 'faq' | 'llm';
  maxResponseTime: number;
  maxCost: number;
}

const STORAGE_KEYS = {
  TEST_RESULTS: 'qa_prompt_test_results',
  TEST_METRICS: 'qa_prompt_test_metrics',
  USER_FEEDBACK: 'qa_user_feedback',
};

export class PromptTestingService {
  private static instance: PromptTestingService;
  private testResults: PromptTestResult[] = [];

  // Predefined test suites for Canadian financial advice
  private readonly testSuites: TestSuite[] = [
    {
      id: 'canadian_banking_basics',
      name: 'Canadian Banking Basics',
      description:
        'Test understanding of fundamental Canadian banking concepts',
      queries: [
        {
          id: 'tfsa_rrsp_difference',
          query: "What's the difference between TFSA and RRSP?",
          category: 'banking',
          difficulty: 'medium',
          canadianSpecific: true,
        },
        {
          id: 'credit_score_check',
          query: 'How can I check my credit score for free in Canada?',
          category: 'credit',
          difficulty: 'easy',
          canadianSpecific: true,
        },
        {
          id: 'banking_fees',
          query: 'How can I avoid banking fees in Canada?',
          category: 'banking',
          difficulty: 'easy',
          canadianSpecific: true,
        },
        {
          id: 'emergency_fund',
          query: 'How much should I save for emergencies?',
          category: 'budgeting',
          difficulty: 'medium',
          canadianSpecific: false,
        },
      ],
      expectedResults: {
        tfsa_rrsp_difference: {
          shouldMentionKeywords: [
            'tax-free',
            'retirement',
            'contribution',
            'withdrawal',
          ],
          shouldNotMentionKeywords: ['401k', 'IRA', 'US tax'],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        credit_score_check: {
          shouldMentionKeywords: ['Equifax', 'TransUnion', 'free', 'annual'],
          shouldNotMentionKeywords: ['Experian', 'FICO'],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        banking_fees: {
          shouldMentionKeywords: [
            'minimum balance',
            'online banking',
            'credit union',
          ],
          shouldNotMentionKeywords: [],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        emergency_fund: {
          shouldMentionKeywords: ['3-6 months', 'expenses', 'emergency'],
          shouldNotMentionKeywords: [],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
      },
    },
    {
      id: 'credit_improvement',
      name: 'Credit Score Improvement',
      description:
        'Test advice quality for credit score improvement strategies',
      queries: [
        {
          id: 'improve_credit_fast',
          query: 'How can I improve my credit score quickly?',
          category: 'credit',
          difficulty: 'medium',
          canadianSpecific: false,
        },
        {
          id: 'credit_utilization',
          query: "What's the best credit utilization ratio?",
          category: 'credit',
          difficulty: 'easy',
          canadianSpecific: false,
        },
        {
          id: 'newcomer_credit',
          query: "I'm new to Canada, how do I build credit?",
          category: 'credit',
          difficulty: 'hard',
          canadianSpecific: true,
        },
      ],
      expectedResults: {
        improve_credit_fast: {
          shouldMentionKeywords: ['payment history', 'utilization', 'time'],
          shouldNotMentionKeywords: ['quick fix', 'overnight'],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        credit_utilization: {
          shouldMentionKeywords: ['30%', 'below', 'balance'],
          shouldNotMentionKeywords: [],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        newcomer_credit: {
          shouldMentionKeywords: ['secured card', 'SIN', 'credit history'],
          shouldNotMentionKeywords: [],
          expectedSource: 'llm',
          maxResponseTime: 3000,
          maxCost: 0.005,
        },
      },
    },
    {
      id: 'clarifi_features',
      name: 'ClariFi Feature Questions',
      description: 'Test responses about ClariFi app features and capabilities',
      queries: [
        {
          id: 'data_privacy',
          query: 'How does ClariFi protect my financial data?',
          category: 'clarifi',
          difficulty: 'medium',
          canadianSpecific: false,
        },
        {
          id: 'categorization_accuracy',
          query: "How accurate is ClariFi's transaction categorization?",
          category: 'clarifi',
          difficulty: 'easy',
          canadianSpecific: false,
        },
        {
          id: 'supported_banks',
          query: 'Which Canadian banks work with ClariFi?',
          category: 'clarifi',
          difficulty: 'medium',
          canadianSpecific: true,
        },
      ],
      expectedResults: {
        data_privacy: {
          shouldMentionKeywords: ['privacy', 'encryption', 'local processing'],
          shouldNotMentionKeywords: ['sell data', 'third party'],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        categorization_accuracy: {
          shouldMentionKeywords: ['AI', 'machine learning', 'accuracy'],
          shouldNotMentionKeywords: [],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
        supported_banks: {
          shouldMentionKeywords: ['Big Six', 'credit unions', 'major banks'],
          shouldNotMentionKeywords: [],
          expectedSource: 'faq',
          maxResponseTime: 1000,
          maxCost: 0.001,
        },
      },
    },
  ];

  private constructor() {
    this.loadStoredResults();
  }

  public static getInstance(): PromptTestingService {
    if (!PromptTestingService.instance) {
      PromptTestingService.instance = new PromptTestingService();
    }
    return PromptTestingService.instance;
  }

  /**
   * Run a specific test suite and return results
   */
  public async runTestSuite(suiteId: string): Promise<{
    suiteId: string;
    results: PromptTestResult[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      averageResponseTime: number;
      totalCost: number;
      accuracy: number;
    };
  }> {
    const suite = this.testSuites.find(s => s.id === suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    console.log(`[Prompt Testing] Running test suite: ${suite.name}`);

    const results: PromptTestResult[] = [];
    let totalResponseTime = 0;
    let totalCost = 0;
    let passed = 0;

    for (const query of suite.queries) {
      try {
        const result = await this.runSingleTest(
          query,
          suite.expectedResults[query.id]
        );
        results.push(result);

        totalResponseTime += result.responseTime;
        totalCost += result.cost;

        // Check if test passed based on expected results
        const testPassed = this.evaluateTestResult(
          result,
          suite.expectedResults[query.id]
        );
        if (testPassed) {
          passed++;
        }

        // Small delay between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `[Prompt Testing] Test failed for query ${query.id}:`,
          error
        );

        // Record failed test
        results.push({
          testId: `${suiteId}_${query.id}`,
          query: query.query,
          response: `Test failed: ${error.message}`,
          responseTime: 0,
          source: 'cache',
          cost: 0,
          timestamp: Date.now(),
        });
      }
    }

    // Store results
    this.testResults.push(...results);
    await this.saveTestResults();

    const summary = {
      totalTests: suite.queries.length,
      passed,
      failed: suite.queries.length - passed,
      averageResponseTime: totalResponseTime / suite.queries.length,
      totalCost,
      accuracy: passed / suite.queries.length,
    };

    console.log(`[Prompt Testing] Suite ${suite.name} completed:`, summary);

    return {
      suiteId,
      results,
      summary,
    };
  }

  /**
   * Run all test suites and generate comprehensive report
   */
  public async runAllTestSuites(): Promise<{
    overallSummary: {
      totalSuites: number;
      totalTests: number;
      overallAccuracy: number;
      totalCost: number;
      averageResponseTime: number;
    };
    suiteResults: { [suiteId: string]: any };
    recommendations: string[];
  }> {
    console.log('[Prompt Testing] Running all test suites...');

    const suiteResults: { [suiteId: string]: any } = {};
    let totalTests = 0;
    let totalPassed = 0;
    let totalCost = 0;
    let totalResponseTime = 0;

    for (const suite of this.testSuites) {
      const result = await this.runTestSuite(suite.id);
      suiteResults[suite.id] = result;

      totalTests += result.summary.totalTests;
      totalPassed += result.summary.passed;
      totalCost += result.summary.totalCost;
      totalResponseTime +=
        result.summary.averageResponseTime * result.summary.totalTests;
    }

    const overallAccuracy = totalPassed / totalTests;
    const averageResponseTime = totalResponseTime / totalTests;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallAccuracy,
      totalCost,
      averageResponseTime
    );

    const overallSummary = {
      totalSuites: this.testSuites.length,
      totalTests,
      overallAccuracy,
      totalCost,
      averageResponseTime,
    };

    // Save comprehensive results
    await this.saveTestMetrics({
      overallSummary,
      suiteResults,
      recommendations,
      timestamp: Date.now(),
    });

    return {
      overallSummary,
      suiteResults,
      recommendations,
    };
  }

  /**
   * Record user feedback on a response
   */
  public async recordUserFeedback(
    query: string,
    response: string,
    rating: number, // 1-5 scale
    feedback?: string
  ): Promise<void> {
    const userFeedback = {
      query,
      response: response.substring(0, 100), // Store first 100 chars
      rating,
      feedback,
      timestamp: Date.now(),
    };

    try {
      const existingFeedback = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_FEEDBACK
      );
      const feedbackArray = existingFeedback
        ? JSON.parse(existingFeedback)
        : [];

      feedbackArray.push(userFeedback);

      // Keep only last 100 feedback entries
      if (feedbackArray.length > 100) {
        feedbackArray.splice(0, feedbackArray.length - 100);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_FEEDBACK,
        JSON.stringify(feedbackArray)
      );
      console.log('[Prompt Testing] User feedback recorded');
    } catch (error) {
      console.error('[Prompt Testing] Error recording user feedback:', error);
    }
  }

  /**
   * Get user feedback analytics
   */
  public async getUserFeedbackAnalytics(): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: { [rating: number]: number };
    recentFeedback: any[];
  }> {
    try {
      const feedbackData = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_FEEDBACK
      );
      const feedback = feedbackData ? JSON.parse(feedbackData) : [];

      if (feedback.length === 0) {
        return {
          averageRating: 0,
          totalFeedback: 0,
          ratingDistribution: {},
          recentFeedback: [],
        };
      }

      const averageRating =
        feedback.reduce((sum: number, item: any) => sum + item.rating, 0) /
        feedback.length;

      const ratingDistribution = feedback.reduce(
        (dist: { [key: number]: number }, item: any) => {
          dist[item.rating] = (dist[item.rating] || 0) + 1;
          return dist;
        },
        {}
      );

      // Get recent feedback (last 10 items)
      const recentFeedback = feedback.slice(-10).reverse();

      return {
        averageRating,
        totalFeedback: feedback.length,
        ratingDistribution,
        recentFeedback,
      };
    } catch (error) {
      console.error(
        '[Prompt Testing] Error getting feedback analytics:',
        error
      );
      return {
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: {},
        recentFeedback: [],
      };
    }
  }

  /**
   * Get available test suites
   */
  public getAvailableTestSuites(): {
    id: string;
    name: string;
    description: string;
    queryCount: number;
  }[] {
    return this.testSuites.map(suite => ({
      id: suite.id,
      name: suite.name,
      description: suite.description,
      queryCount: suite.queries.length,
    }));
  }

  /**
   * Clear all test results and metrics
   */
  public async clearTestData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TEST_RESULTS),
        AsyncStorage.removeItem(STORAGE_KEYS.TEST_METRICS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_FEEDBACK),
      ]);

      this.testResults = [];
      console.log('[Prompt Testing] Test data cleared successfully');
    } catch (error) {
      console.error('[Prompt Testing] Error clearing test data:', error);
    }
  }

  // Private helper methods

  private async runSingleTest(
    query: TestQuery,
    expectedResult: ExpectedResult
  ): Promise<PromptTestResult> {
    const startTime = Date.now();

    // This would integrate with the actual QA service
    // For now, simulate the test
    const mockResponse = this.generateMockResponse(query);

    const responseTime = Date.now() - startTime;

    return {
      testId: `test_${Date.now()}_${query.id}`,
      query: query.query,
      response: mockResponse.response,
      responseTime,
      source: mockResponse.source,
      cost: mockResponse.cost,
      accuracy: this.calculateAccuracy(mockResponse.response, expectedResult),
      canadianRelevance: this.calculateCanadianRelevance(mockResponse.response),
      timestamp: Date.now(),
    };
  }

  private generateMockResponse(query: TestQuery): {
    response: string;
    source: 'cache' | 'faq' | 'llm';
    cost: number;
  } {
    // Simulate different response types based on query characteristics
    if (query.category === 'clarifi' || query.canadianSpecific) {
      if (query.difficulty === 'hard') {
        return {
          response: `Based on Canadian financial regulations and best practices, here's my recommendation for your specific situation. This advice considers current Canadian market conditions and regulatory requirements.`,
          source: 'llm',
          cost: 0.004,
        };
      } else {
        return {
          response: `For Canadian residents, the recommended approach is to focus on established financial institutions and government-backed programs. Always verify current rates and limits with official sources.`,
          source: 'faq',
          cost: 0.001,
        };
      }
    }

    return {
      response: `This is a general financial guidance response that addresses your question with practical advice. Consider consulting with a financial advisor for personalized recommendations.`,
      source: 'faq',
      cost: 0.001,
    };
  }

  private evaluateTestResult(
    result: PromptTestResult,
    expected: ExpectedResult
  ): boolean {
    const response = result.response.toLowerCase();

    // Check required keywords
    const hasRequiredKeywords = expected.shouldMentionKeywords.every(keyword =>
      response.includes(keyword.toLowerCase())
    );

    // Check prohibited keywords
    const hasProhibitedKeywords = expected.shouldNotMentionKeywords.some(
      keyword => response.includes(keyword.toLowerCase())
    );

    // Check performance criteria
    const meetsPerformanceCriteria =
      result.responseTime <= expected.maxResponseTime &&
      result.cost <= expected.maxCost;

    return (
      hasRequiredKeywords && !hasProhibitedKeywords && meetsPerformanceCriteria
    );
  }

  private calculateAccuracy(
    response: string,
    expected: ExpectedResult
  ): number {
    const lowerResponse = response.toLowerCase();

    let score = 0;
    const totalCriteria =
      expected.shouldMentionKeywords.length +
      expected.shouldNotMentionKeywords.length +
      1;

    // Check required keywords
    const foundRequired = expected.shouldMentionKeywords.filter(keyword =>
      lowerResponse.includes(keyword.toLowerCase())
    ).length;
    score += foundRequired / expected.shouldMentionKeywords.length;

    // Check prohibited keywords (penalty for mentioning them)
    const foundProhibited = expected.shouldNotMentionKeywords.filter(keyword =>
      lowerResponse.includes(keyword.toLowerCase())
    ).length;
    score +=
      (expected.shouldNotMentionKeywords.length - foundProhibited) /
      Math.max(expected.shouldNotMentionKeywords.length, 1);

    // Basic quality check (response length)
    score += response.length > 50 && response.length < 500 ? 1 : 0;

    return Math.min(score / totalCriteria, 1.0);
  }

  private calculateCanadianRelevance(response: string): number {
    const canadianKeywords = [
      'canada',
      'canadian',
      'cra',
      'tfsa',
      'rrsp',
      'cpp',
      'oas',
      'equifax',
      'transunion',
      'big six',
      'credit union',
      'interac',
    ];

    const lowerResponse = response.toLowerCase();
    const foundKeywords = canadianKeywords.filter(keyword =>
      lowerResponse.includes(keyword)
    );

    return Math.min(foundKeywords.length / 3, 1.0); // Normalize to max 3 keywords
  }

  private generateRecommendations(
    accuracy: number,
    totalCost: number,
    responseTime: number
  ): string[] {
    const recommendations: string[] = [];

    if (accuracy < 0.8) {
      recommendations.push('Improve FAQ content coverage - accuracy below 80%');
    }

    if (totalCost > 0.05) {
      recommendations.push(
        'Optimize cost efficiency - total test cost exceeds target'
      );
    }

    if (responseTime > 2000) {
      recommendations.push('Improve response time - average exceeds 2 seconds');
    }

    if (accuracy >= 0.9) {
      recommendations.push(
        'Excellent performance - maintain current optimization'
      );
    }

    return recommendations;
  }

  private async loadStoredResults(): Promise<void> {
    try {
      const resultsData = await AsyncStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
      if (resultsData) {
        this.testResults = JSON.parse(resultsData);
      }
    } catch (error) {
      console.error('[Prompt Testing] Error loading stored results:', error);
    }
  }

  private async saveTestResults(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TEST_RESULTS,
        JSON.stringify(this.testResults)
      );
    } catch (error) {
      console.error('[Prompt Testing] Error saving test results:', error);
    }
  }

  private async saveTestMetrics(metrics: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TEST_METRICS,
        JSON.stringify(metrics)
      );
    } catch (error) {
      console.error('[Prompt Testing] Error saving test metrics:', error);
    }
  }
}

export default PromptTestingService;
