import { Injectable, Logger } from '@nestjs/common';
import { QAQueryLimitService } from './qa-query-limit.service';
import { QACacheService } from './qa-cache.service';

export interface LimitTestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

export interface LimitTestSuite {
  totalTests: number;
  passed: number;
  failed: number;
  results: LimitTestResult[];
  timestamp: string;
}

@Injectable()
export class QALimitTestService {
  private readonly logger = new Logger(QALimitTestService.name);

  constructor(
    private readonly queryLimitService: QAQueryLimitService,
    private readonly cacheService: QACacheService,
  ) {}

  /**
   * Run comprehensive test suite for query limit system
   */
  async runComprehensiveTests(): Promise<LimitTestSuite> {
    this.logger.log('Starting comprehensive query limit tests');
    
    const results: LimitTestResult[] = [];
    
    // Test 1: New user initialization
    results.push(await this.testNewUserInitialization());
    
    // Test 2: Query limit enforcement
    results.push(await this.testQueryLimitEnforcement());
    
    // Test 3: Cost limit enforcement
    results.push(await this.testCostLimitEnforcement());
    
    // Test 4: Cache hit rate impact
    results.push(await this.testCacheHitRateImpact());
    
    // Test 5: Limit reset functionality
    results.push(await this.testLimitResetFunctionality());
    
    // Test 6: Usage statistics accuracy
    results.push(await this.testUsageStatisticsAccuracy());
    
    // Test 7: Daily budget tracking
    results.push(await this.testDailyBudgetTracking());
    
    // Test 8: Free vs premium user limits
    results.push(await this.testUserTypeHandling());

    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    this.logger.log(`Query limit tests completed: ${passed}/${results.length} passed`);

    return {
      totalTests: results.length,
      passed,
      failed,
      results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test new user initialization with default limits
   */
  private async testNewUserInitialization(): Promise<LimitTestResult> {
    try {
      const testUserId = `test_user_${Date.now()}`;
      
      const userLimit = await this.queryLimitService.getUserQueryLimit(testUserId);
      
      const isValid = 
        userLimit.userId === testUserId &&
        userLimit.userType === 'free' &&
        userLimit.maxQueries === 5 &&
        userLimit.currentQueries === 0 &&
        userLimit.costSpent === 0 &&
        userLimit.maxCost === 0.10;

      return {
        testName: 'New User Initialization',
        success: isValid,
        message: isValid ? 'New user initialized with correct default limits' : 'New user initialization failed',
        details: userLimit
      };

    } catch (error) {
      return {
        testName: 'New User Initialization',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test query limit enforcement
   */
  private async testQueryLimitEnforcement(): Promise<LimitTestResult> {
    try {
      const testUserId = `test_limit_${Date.now()}`;
      
      // Simulate reaching the limit
      for (let i = 0; i < 5; i++) {
        await this.queryLimitService.recordQuery(testUserId, 0.005, false);
      }
      
      // Check that 6th query is blocked
      const limitCheck = await this.queryLimitService.checkQueryLimit(testUserId);
      
      const isBlocked = !limitCheck.allowed && limitCheck.remaining === 0;

      return {
        testName: 'Query Limit Enforcement',
        success: isBlocked,
        message: isBlocked ? 'Query limit properly enforced after 5 queries' : 'Query limit enforcement failed',
        details: limitCheck
      };

    } catch (error) {
      return {
        testName: 'Query Limit Enforcement',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test cost limit enforcement
   */
  private async testCostLimitEnforcement(): Promise<LimitTestResult> {
    try {
      const testUserId = `test_cost_${Date.now()}`;
      
      // Simulate high cost queries to reach limit
      await this.queryLimitService.recordQuery(testUserId, 0.09, false);
      
      // Try to make another expensive query
      const limitCheck = await this.queryLimitService.checkQueryLimit(testUserId, 0.02);
      
      const isCostBlocked = !limitCheck.allowed && limitCheck.reason?.includes('Cost limit');

      return {
        testName: 'Cost Limit Enforcement',
        success: !!isCostBlocked,
        message: isCostBlocked ? 'Cost limit properly enforced' : 'Cost limit enforcement failed',
        details: limitCheck
      };

    } catch (error) {
      return {
        testName: 'Cost Limit Enforcement',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test that cached queries don't count toward limits
   */
  private async testCacheHitRateImpact(): Promise<LimitTestResult> {
    try {
      const testUserId = `test_cache_${Date.now()}`;
      
      // Record 3 normal queries
      for (let i = 0; i < 3; i++) {
        await this.queryLimitService.recordQuery(testUserId, 0.005, false);
      }
      
      // Record 5 cached queries (should not count toward limit)
      for (let i = 0; i < 5; i++) {
        await this.queryLimitService.recordQuery(testUserId, 0.000, true);
      }
      
      const limitCheck = await this.queryLimitService.checkQueryLimit(testUserId);
      
      // Should still have 2 queries remaining (5 - 3 = 2)
      const hasCorrectRemaining = limitCheck.remaining === 2;

      return {
        testName: 'Cache Hit Rate Impact',
        success: hasCorrectRemaining,
        message: hasCorrectRemaining ? 'Cached queries correctly excluded from limits' : 'Cache impact test failed',
        details: limitCheck
      };

    } catch (error) {
      return {
        testName: 'Cache Hit Rate Impact',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test limit reset functionality
   */
  private async testLimitResetFunctionality(): Promise<LimitTestResult> {
    try {
      const testUserId = `test_reset_${Date.now()}`;
      
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await this.queryLimitService.recordQuery(testUserId, 0.005, false);
      }
      
      // Reset the user's limits
      const resetResult = await this.queryLimitService.resetUserLimits([testUserId]);
      
      // Check that limits are reset
      const limitCheck = await this.queryLimitService.checkQueryLimit(testUserId);
      
      const isReset = resetResult.success === 1 && limitCheck.allowed && limitCheck.remaining === 5;

      return {
        testName: 'Limit Reset Functionality',
        success: isReset,
        message: isReset ? 'User limits successfully reset' : 'Limit reset failed',
        details: { resetResult, limitCheck }
      };

    } catch (error) {
      return {
        testName: 'Limit Reset Functionality',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test usage statistics accuracy
   */
  private async testUsageStatisticsAccuracy(): Promise<LimitTestResult> {
    try {
      // Get initial stats
      const initialStats = await this.queryLimitService.getUsageStatistics();
      
      // Create test users and record queries
      const testUserIds = [`stats_test_1_${Date.now()}`, `stats_test_2_${Date.now()}`];
      
      for (const userId of testUserIds) {
        await this.queryLimitService.recordQuery(userId, 0.005, false);
        await this.queryLimitService.recordQuery(userId, 0.003, false);
      }
      
      // Get updated stats
      const updatedStats = await this.queryLimitService.getUsageStatistics();
      
      // Verify stats increased correctly
      const userIncrease = updatedStats.totalActiveUsers >= initialStats.totalActiveUsers + 2;
      const queryIncrease = updatedStats.totalQueries >= initialStats.totalQueries + 4;
      const costIncrease = updatedStats.totalCost >= initialStats.totalCost + 0.016;

      const isAccurate = userIncrease && queryIncrease && costIncrease;

      return {
        testName: 'Usage Statistics Accuracy',
        success: isAccurate,
        message: isAccurate ? 'Usage statistics tracking accurately' : 'Usage statistics inaccurate',
        details: { 
          initial: initialStats, 
          updated: updatedStats,
          checks: { userIncrease, queryIncrease, costIncrease }
        }
      };

    } catch (error) {
      return {
        testName: 'Usage Statistics Accuracy',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test daily budget tracking
   */
  private async testDailyBudgetTracking(): Promise<LimitTestResult> {
    try {
      const testUserId = `test_budget_${Date.now()}`;
      
      // Record a high-cost query
      await this.queryLimitService.recordQuery(testUserId, 0.05, false);
      
      const stats = await this.queryLimitService.getUsageStatistics();
      
      // Verify daily budget is being tracked
      const hasBudgetTracking = stats.dailyBudgetUsed >= 0.05;

      return {
        testName: 'Daily Budget Tracking',
        success: hasBudgetTracking,
        message: hasBudgetTracking ? 'Daily budget correctly tracked' : 'Daily budget tracking failed',
        details: { dailyBudgetUsed: stats.dailyBudgetUsed }
      };

    } catch (error) {
      return {
        testName: 'Daily Budget Tracking',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test free vs premium user type handling
   */
  private async testUserTypeHandling(): Promise<LimitTestResult> {
    try {
      const freeUserId = `test_free_${Date.now()}`;
      // Note: Premium user testing would require database setup
      
      const freeUserLimit = await this.queryLimitService.getUserQueryLimit(freeUserId);
      
      const hasCorrectFreeLimit = 
        freeUserLimit.userType === 'free' && 
        freeUserLimit.maxQueries === 5;

      return {
        testName: 'User Type Handling',
        success: hasCorrectFreeLimit,
        message: hasCorrectFreeLimit ? 'User types handled correctly' : 'User type handling failed',
        details: { freeUserLimit }
      };

    } catch (error) {
      return {
        testName: 'User Type Handling',
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Run load test to verify system handles multiple concurrent users
   */
  async runLoadTest(userCount = 50, queriesPerUser = 3): Promise<LimitTestResult> {
    try {
      this.logger.log(`Starting load test: ${userCount} users, ${queriesPerUser} queries each`);
      
      const startTime = Date.now();
      const promises: Promise<void>[] = [];

      for (let i = 0; i < userCount; i++) {
        const userId = `load_test_${i}_${Date.now()}`;
        
        for (let j = 0; j < queriesPerUser; j++) {
          promises.push(
            this.queryLimitService.recordQuery(userId, 0.005, Math.random() > 0.5)
          );
        }
      }

      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      const totalOperations = userCount * queriesPerUser;
      const operationsPerSecond = totalOperations / (duration / 1000);

      const isPerformant = operationsPerSecond > 100; // Expect >100 ops/sec

      return {
        testName: 'Load Test',
        success: isPerformant,
        message: isPerformant ? 
          `Load test passed: ${operationsPerSecond.toFixed(0)} ops/sec` : 
          `Load test failed: ${operationsPerSecond.toFixed(0)} ops/sec (too slow)`,
        details: {
          userCount,
          queriesPerUser,
          totalOperations,
          duration,
          operationsPerSecond
        }
      };

    } catch (error) {
      return {
        testName: 'Load Test',
        success: false,
        message: `Load test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    try {
      this.logger.log('Cleaning up test data');
      
      // Clean up test users
      const testUserPattern = 'qa:limits:user:test_*';
      await this.cacheService.clearCache(testUserPattern);
      
      const loadTestPattern = 'qa:limits:user:load_test_*';
      await this.cacheService.clearCache(loadTestPattern);
      
      const statsTestPattern = 'qa:limits:user:stats_test_*';
      await this.cacheService.clearCache(statsTestPattern);

      this.logger.log('Test data cleanup completed');

    } catch (error) {
      this.logger.error('Failed to cleanup test data:', error);
    }
  }
} 