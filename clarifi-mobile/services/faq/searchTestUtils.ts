import { EnhancedFAQSearchService } from './enhancedFAQSearchService';
import { FuzzyMatchingUtils } from './fuzzyMatchingUtils';

interface SearchTestCase {
  query: string;
  expectedFAQId?: string;
  expectedCategory?: string;
  expectedMatchType?: string;
  minScore?: number;
  description: string;
}

interface TestResult {
  testCase: SearchTestCase;
  results: any[];
  passed: boolean;
  actualScore: number;
  actualMatchType: string;
  actualFAQId?: string;
  executionTime: number;
}

export class SearchTestUtils {
  private static instance: SearchTestUtils;
  private searchService: EnhancedFAQSearchService;

  private constructor() {
    this.searchService = EnhancedFAQSearchService.getInstance();
  }

  public static getInstance(): SearchTestUtils {
    if (!SearchTestUtils.instance) {
      SearchTestUtils.instance = new SearchTestUtils();
    }
    return SearchTestUtils.instance;
  }

  /**
   * Comprehensive test cases for Canadian financial queries
   */
  private getTestCases(): SearchTestCase[] {
    return [
      // Credit Score Tests
      {
        query: 'What is my credit score?',
        expectedFAQId: 'credit-score-basics',
        expectedCategory: 'credit-scores',
        minScore: 0.7,
        description: 'Basic credit score question',
      },
      {
        query: 'How do I improve my credit rating?',
        expectedFAQId: 'improve-credit-score',
        expectedCategory: 'credit-scores',
        minScore: 0.6,
        description: 'Credit improvement with synonym (rating)',
      },
      {
        query: 'credit utilization ratio optimization',
        expectedFAQId: 'credit-utilization-ratio',
        expectedCategory: 'credit-scores',
        minScore: 0.8,
        description: 'Credit utilization technical query',
      },
      {
        query: 'free credit report canada',
        expectedFAQId: 'check-credit-score',
        expectedCategory: 'credit-scores',
        minScore: 0.6,
        description: 'Free credit checking with Canadian context',
      },

      // Budgeting Tests
      {
        query: 'How to make a budget in Canada?',
        expectedFAQId: 'create-budget-canada',
        expectedCategory: 'budgeting',
        minScore: 0.7,
        description: 'Canadian budgeting basics',
      },
      {
        query: 'emergency fund 6 months expenses',
        expectedFAQId: 'emergency-fund-canada',
        expectedCategory: 'budgeting',
        minScore: 0.6,
        description: 'Emergency fund sizing',
      },
      {
        query: 'track my spending expenses',
        expectedFAQId: 'track-expenses',
        expectedCategory: 'budgeting',
        minScore: 0.5,
        description: 'Expense tracking methods',
      },
      {
        query: 'reduce monthly bills costs',
        expectedFAQId: 'reduce-monthly-expenses',
        expectedCategory: 'budgeting',
        minScore: 0.5,
        description: 'Cost reduction strategies',
      },

      // Banking Tests
      {
        query: 'best bank in Canada for newcomers',
        expectedFAQId: 'choose-bank-canada',
        expectedCategory: 'banking-canada',
        minScore: 0.6,
        description: 'Bank selection for newcomers',
      },
      {
        query: 'TFSA vs RRSP account types',
        expectedFAQId: 'bank-account-types',
        expectedCategory: 'banking-canada',
        minScore: 0.6,
        description: 'Canadian account types',
      },
      {
        query: 'avoid banking fees canada',
        expectedFAQId: 'bank-fees-canada',
        expectedCategory: 'banking-canada',
        minScore: 0.6,
        description: 'Fee avoidance strategies',
      },
      {
        query: 'interac etransfer safe secure',
        expectedFAQId: 'e-transfer-canada',
        expectedCategory: 'banking-canada',
        minScore: 0.5,
        description: 'E-transfer security',
      },

      // ClariFi Tests
      {
        query: 'How do I start using ClariFi?',
        expectedFAQId: 'getting-started-clarifi',
        expectedCategory: 'using-clarifi',
        minScore: 0.8,
        description: 'ClariFi onboarding',
      },
      {
        query: 'upload bank statements PDF',
        expectedFAQId: 'upload-statements',
        expectedCategory: 'using-clarifi',
        minScore: 0.6,
        description: 'Statement upload process',
      },
      {
        query: 'AI categorization accuracy rate',
        expectedFAQId: 'ai-categorization',
        expectedCategory: 'using-clarifi',
        minScore: 0.6,
        description: 'AI accuracy information',
      },

      // Fuzzy/Typo Tests
      {
        query: 'cedit scor imporvement',
        expectedFAQId: 'improve-credit-score',
        expectedCategory: 'credit-scores',
        minScore: 0.3,
        description: 'Typos in credit score query',
      },
      {
        query: 'budgeting 50 30 20 rule',
        expectedFAQId: 'create-budget-canada',
        expectedCategory: 'budgeting',
        minScore: 0.4,
        description: 'Specific budgeting method',
      },

      // Synonym Tests
      {
        query: 'creditworthiness rating check',
        expectedFAQId: 'check-credit-score',
        expectedCategory: 'credit-scores',
        minScore: 0.4,
        description: 'Credit score synonyms',
      },
      {
        query: 'rainy day fund emergency money',
        expectedFAQId: 'emergency-fund-canada',
        expectedCategory: 'budgeting',
        minScore: 0.4,
        description: 'Emergency fund synonyms',
      },

      // Complex Queries
      {
        query:
          'How can I improve my credit utilization to boost my credit score in Canada?',
        expectedCategory: 'credit-scores',
        minScore: 0.5,
        description: 'Complex multi-concept query',
      },
      {
        query:
          'Best way to track expenses and create budget for Canadian student',
        expectedCategory: 'budgeting',
        minScore: 0.4,
        description: 'Complex budgeting query',
      },
    ];
  }

  /**
   * Run comprehensive search performance tests
   */
  public async runPerformanceTests(): Promise<{
    results: TestResult[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      passRate: number;
      averageScore: number;
      averageExecutionTime: number;
      categoryBreakdown: {
        [category: string]: { passed: number; total: number };
      };
    };
  }> {
    const testCases = this.getTestCases();
    const results: TestResult[] = [];

    console.log(
      `Running ${testCases.length} fuzzy search performance tests...`
    );

    for (const testCase of testCases) {
      const startTime = performance.now();

      try {
        const searchResults = await this.searchService.enhancedSearch(
          testCase.query
        );
        const executionTime = performance.now() - startTime;

        const topResult = searchResults[0];
        const actualScore = topResult?.relevanceScore || 0;
        const actualMatchType = topResult?.matchType || 'none';
        const actualFAQId = topResult?.faq.id;

        // Determine if test passed
        let passed = true;

        if (testCase.minScore && actualScore < testCase.minScore) {
          passed = false;
        }

        if (testCase.expectedFAQId && actualFAQId !== testCase.expectedFAQId) {
          passed = false;
        }

        if (
          testCase.expectedCategory &&
          topResult?.category.id !== testCase.expectedCategory
        ) {
          passed = false;
        }

        results.push({
          testCase,
          results: searchResults,
          passed,
          actualScore,
          actualMatchType,
          actualFAQId,
          executionTime,
        });

        console.log(
          `✓ Test: ${testCase.description} - ${passed ? 'PASSED' : 'FAILED'} (Score: ${actualScore.toFixed(3)})`
        );
      } catch (error) {
        console.error(`✗ Test failed: ${testCase.description}`, error);
        results.push({
          testCase,
          results: [],
          passed: false,
          actualScore: 0,
          actualMatchType: 'error',
          executionTime: performance.now() - startTime,
        });
      }
    }

    // Calculate summary statistics
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const passRate = (passed / results.length) * 100;
    const averageScore =
      results.reduce((sum, r) => sum + r.actualScore, 0) / results.length;
    const averageExecutionTime =
      results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;

    // Category breakdown
    const categoryBreakdown: {
      [category: string]: { passed: number; total: number };
    } = {};

    results.forEach(result => {
      const category = result.testCase.expectedCategory || 'unknown';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { passed: 0, total: 0 };
      }
      categoryBreakdown[category].total++;
      if (result.passed) {
        categoryBreakdown[category].passed++;
      }
    });

    const summary = {
      totalTests: results.length,
      passed,
      failed,
      passRate: Math.round(passRate * 100) / 100,
      averageScore: Math.round(averageScore * 1000) / 1000,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      categoryBreakdown,
    };

    console.log('\n=== FUZZY SEARCH PERFORMANCE TEST SUMMARY ===');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed} (${summary.passRate}%)`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Average Score: ${summary.averageScore}`);
    console.log(`Average Execution Time: ${summary.averageExecutionTime}ms`);
    console.log('\nCategory Breakdown:');

    Object.entries(categoryBreakdown).forEach(([category, stats]) => {
      const categoryPassRate = (stats.passed / stats.total) * 100;
      console.log(
        `  ${category}: ${stats.passed}/${stats.total} (${categoryPassRate.toFixed(1)}%)`
      );
    });

    return { results, summary };
  }

  /**
   * Test FAQ hit rate with various query patterns
   */
  public async testFAQHitRate(queries: string[]): Promise<{
    hitRate: number;
    totalQueries: number;
    hits: number;
    misses: string[];
    averageTopScore: number;
  }> {
    let hits = 0;
    const misses: string[] = [];
    let totalScore = 0;

    for (const query of queries) {
      const results = await this.searchService.enhancedSearch(query);

      if (results.length > 0 && results[0].relevanceScore > 0.3) {
        hits++;
        totalScore += results[0].relevanceScore;
      } else {
        misses.push(query);
      }
    }

    const hitRate = (hits / queries.length) * 100;
    const averageTopScore = hits > 0 ? totalScore / hits : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      totalQueries: queries.length,
      hits,
      misses,
      averageTopScore: Math.round(averageTopScore * 1000) / 1000,
    };
  }

  /**
   * Generate test queries based on FAQ content
   */
  public generateTestQueries(): string[] {
    const categories = this.searchService.getCategories();
    const queries: string[] = [];

    categories.forEach(category => {
      category.faqs.forEach(faq => {
        // Original question
        queries.push(faq.question);

        // Simplified versions
        const simplified = faq.question
          .replace(/^(How|What|Why|When|Where|Which|Should|Can|Is)/i, '')
          .trim();
        if (simplified !== faq.question) {
          queries.push(simplified);
        }

        // Keyword combinations
        faq.keywords.slice(0, 3).forEach(keyword => {
          queries.push(keyword);
        });
      });
    });

    return queries;
  }

  /**
   * Benchmark fuzzy matching algorithms
   */
  public benchmarkFuzzyMatching(): {
    levenshteinPerformance: number;
    ngramPerformance: number;
    comprehensiveMatchPerformance: number;
  } {
    const testPairs = [
      ['credit score', 'credit rating'],
      ['budget', 'budgeting plan'],
      ['emergency fund', 'rainy day money'],
      ['bank account', 'banking account'],
      ['how to improve credit', 'ways to boost credit score'],
    ];

    const iterations = 1000;

    // Benchmark Levenshtein distance
    const levenshteinStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testPairs.forEach(([str1, str2]) => {
        FuzzyMatchingUtils.levenshteinDistance(str1, str2);
      });
    }
    const levenshteinTime = performance.now() - levenshteinStart;

    // Benchmark comprehensive match
    const comprehensiveStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testPairs.forEach(([str1, str2]) => {
        FuzzyMatchingUtils.comprehensiveFuzzyMatch(str1, str2);
      });
    }
    const comprehensiveTime = performance.now() - comprehensiveStart;

    return {
      levenshteinPerformance: Math.round(levenshteinTime * 100) / 100,
      ngramPerformance: 0, // Placeholder
      comprehensiveMatchPerformance: Math.round(comprehensiveTime * 100) / 100,
    };
  }
}
