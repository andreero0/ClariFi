import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

export interface UserQueryLimit {
  userId: string;
  period: 'monthly' | 'weekly' | 'daily';
  maxQueries: number;
  currentQueries: number;
  resetDate: Date;
  userType: 'free' | 'premium';
  costSpent: number;
  maxCost: number;
}

export interface QueryLimitCheck {
  allowed: boolean;
  remaining: number;
  resetDate: Date;
  reason?: string;
  costRemaining: number;
  suggestionMessage?: string;
}

export interface QueryLimitConfig {
  freeUserLimit: number;
  premiumUserLimit: number;
  timeWindowHours: number;
  maxCostPerUser: number;
  maxCostPerQuery: number;
  dailyBudgetLimit: number;
}

@Injectable()
export class QAQueryLimitService {
  private readonly logger = new Logger(QAQueryLimitService.name);
  private readonly config: QueryLimitConfig;
  private readonly redisKeyPrefix = 'qa:limits';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {
    // Load configuration from QA config
    this.config = {
      freeUserLimit: this.configService.get<number>('qa.queryLimits.freeUserLimit') || 5,
      premiumUserLimit: this.configService.get<number>('qa.queryLimits.premiumUserLimit') || 20,
      timeWindowHours: this.configService.get<number>('qa.queryLimits.timeWindow') || 720, // 30 days
      maxCostPerUser: this.configService.get<number>('qa.costThresholds.maxCostPerUser') || 0.10,
      maxCostPerQuery: this.configService.get<number>('qa.costThresholds.maxCostPerQuery') || 0.01,
      dailyBudgetLimit: this.configService.get<number>('qa.costThresholds.dailyBudgetLimit') || 10.00,
    };

    this.logger.log(`Query limit service initialized: Free=${this.config.freeUserLimit}, Premium=${this.config.premiumUserLimit}, Window=${this.config.timeWindowHours}h`);
  }

  /**
   * Check if user can make a query and return limit information
   */
  async checkQueryLimit(userId: string, estimatedCost = 0.005): Promise<QueryLimitCheck> {
    try {
      const userLimit = await this.getUserQueryLimit(userId);
      const isAllowed = this.isQueryAllowed(userLimit, estimatedCost);

      return {
        allowed: isAllowed.allowed,
        remaining: Math.max(0, userLimit.maxQueries - userLimit.currentQueries),
        resetDate: userLimit.resetDate,
        reason: isAllowed.reason,
        costRemaining: Math.max(0, userLimit.maxCost - userLimit.costSpent),
        suggestionMessage: this.getSuggestionMessage(userLimit, isAllowed)
      };

    } catch (error) {
      this.logger.error(`Failed to check query limit for user ${userId}:`, error);
      // Fail open - allow queries if service is unavailable
      return {
        allowed: true,
        remaining: this.config.freeUserLimit,
        resetDate: this.getNextResetDate(),
        costRemaining: this.config.maxCostPerUser
      };
    }
  }

  /**
   * Record a query and its cost for a user
   */
  async recordQuery(userId: string, cost: number, wasFromCache = false): Promise<void> {
    try {
      const redisKey = this.getUserLimitKey(userId);
      const userLimit = await this.getUserQueryLimit(userId);

      // Only count non-cached queries toward the limit
      if (!wasFromCache) {
        userLimit.currentQueries += 1;
      }
      
      // Always track cost (even cached responses have infrastructure cost)
      userLimit.costSpent += cost;

      // Update Redis cache
      await this.redisService.setex(
        redisKey,
        this.getSecondsUntilReset(userLimit.resetDate),
        JSON.stringify(userLimit)
      );

      // Log for monitoring and cost tracking
      this.logger.log(
        `Query recorded for user ${userId}: ` +
        `cost=$${cost.toFixed(4)}, cached=${wasFromCache}, ` +
        `remaining=${userLimit.maxQueries - userLimit.currentQueries}, ` +
        `costRemaining=$${(userLimit.maxCost - userLimit.costSpent).toFixed(4)}`
      );

      // Check for daily budget alerts
      await this.checkDailyBudgetAlerts(cost);

    } catch (error) {
      this.logger.error(`Failed to record query for user ${userId}:`, error);
      // Don't throw - query recording failures shouldn't break user experience
    }
  }

  /**
   * Get current user query limit information
   */
  async getUserQueryLimit(userId: string): Promise<UserQueryLimit> {
    const redisKey = this.getUserLimitKey(userId);
    
    try {
      // Try Redis first for performance
      const cachedLimit = await this.redisService.get(redisKey);
      
      if (cachedLimit) {
        const parsed = JSON.parse(cachedLimit);
        const limit = this.deserializeUserLimit(parsed);
        
        // Check if limit has expired and needs reset
        if (new Date() > limit.resetDate) {
          return this.resetUserLimit(userId, limit.userType);
        }
        
        return limit;
      }

      // If not in cache, check database or create new limit
      return this.initializeUserLimit(userId);

    } catch (error) {
      this.logger.error(`Failed to get user limit for ${userId}:`, error);
      // Return default limit if service fails
      return this.getDefaultUserLimit(userId);
    }
  }

  /**
   * Reset user limits (admin function)
   */
  async resetUserLimits(userIds: string[] | 'all'): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    try {
      if (userIds === 'all') {
        // Clear all limit keys
        const pattern = `${this.redisKeyPrefix}:user:*`;
        await this.redisService.deletePattern(pattern);
        this.logger.warn('All user query limits reset by admin');
        return { success: 1, failed: 0 };
      }

      // Reset specific users
      for (const userId of userIds) {
        try {
          const redisKey = this.getUserLimitKey(userId);
          await this.redisService.del(redisKey);
          success++;
        } catch (error) {
          this.logger.error(`Failed to reset limits for user ${userId}:`, error);
          failed++;
        }
      }

      this.logger.log(`Admin reset: ${success} users reset, ${failed} failed`);
      return { success, failed };

    } catch (error) {
      this.logger.error('Failed to reset user limits:', error);
      return { success: 0, failed: userIds === 'all' ? 1 : userIds.length };
    }
  }

  /**
   * Get aggregated usage statistics for monitoring
   */
  async getUsageStatistics(): Promise<{
    totalActiveUsers: number;
    totalQueries: number;
    totalCost: number;
    averageQueriesPerUser: number;
    freeUserCount: number;
    premiumUserCount: number;
    nearLimitUsers: number;
    dailyBudgetUsed: number;
  }> {
    try {
      const pattern = `${this.redisKeyPrefix}:user:*`;
      const keys = await this.redisService.keys(pattern);
      
      let totalQueries = 0;
      let totalCost = 0;
      let freeUserCount = 0;
      let premiumUserCount = 0;
      let nearLimitUsers = 0;

      for (const key of keys) {
        try {
          const limitData = await this.redisService.get(key);
          if (limitData) {
            const limit = this.deserializeUserLimit(JSON.parse(limitData));
            totalQueries += limit.currentQueries;
            totalCost += limit.costSpent;
            
            if (limit.userType === 'free') freeUserCount++;
            else premiumUserCount++;
            
            const usageRatio = limit.currentQueries / limit.maxQueries;
            if (usageRatio >= 0.8) nearLimitUsers++; // 80% or more of limit used
          }
        } catch (error) {
          this.logger.warn(`Failed to parse limit data for key ${key}:`, error);
        }
      }

      const dailyBudgetUsed = await this.getDailyBudgetUsed();

      return {
        totalActiveUsers: keys.length,
        totalQueries,
        totalCost,
        averageQueriesPerUser: keys.length > 0 ? totalQueries / keys.length : 0,
        freeUserCount,
        premiumUserCount,
        nearLimitUsers,
        dailyBudgetUsed
      };

    } catch (error) {
      this.logger.error('Failed to get usage statistics:', error);
      return {
        totalActiveUsers: 0,
        totalQueries: 0,
        totalCost: 0,
        averageQueriesPerUser: 0,
        freeUserCount: 0,
        premiumUserCount: 0,
        nearLimitUsers: 0,
        dailyBudgetUsed: 0
      };
    }
  }

  /**
   * Get daily budget usage for budget alerts
   */
  private async getDailyBudgetUsed(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const budgetKey = `${this.redisKeyPrefix}:daily_budget:${today}`;
    
    try {
      const budgetData = await this.redisService.get(budgetKey);
      return budgetData ? parseFloat(budgetData) : 0;
    } catch (error) {
      this.logger.warn('Failed to get daily budget usage:', error);
      return 0;
    }
  }

  /**
   * Check daily budget and send alerts if needed
   */
  private async checkDailyBudgetAlerts(cost: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const budgetKey = `${this.redisKeyPrefix}:daily_budget:${today}`;
    
    try {
      const currentBudget = await this.getDailyBudgetUsed();
      const newBudget = currentBudget + cost;
      
      // Update daily budget
      await this.redisService.setex(budgetKey, 86400, newBudget.toString()); // 24 hours TTL
      
      // Alert thresholds
      const alertThresholds = [0.5, 0.75, 0.9, 1.0]; // 50%, 75%, 90%, 100%
      
      for (const threshold of alertThresholds) {
        const thresholdAmount = this.config.dailyBudgetLimit * threshold;
        
        if (currentBudget < thresholdAmount && newBudget >= thresholdAmount) {
          this.logger.warn(
            `Daily budget alert: ${(threshold * 100).toFixed(0)}% threshold reached. ` +
            `Used: $${newBudget.toFixed(2)} / $${this.config.dailyBudgetLimit.toFixed(2)}`
          );
          
          // In production, this would trigger alerts to administrators
          // Could integrate with Sentry, Slack, or email notifications
        }
      }

    } catch (error) {
      this.logger.error('Failed to check daily budget alerts:', error);
    }
  }

  /**
   * Initialize user limit for new user
   */
  private async initializeUserLimit(userId: string): Promise<UserQueryLimit> {
    try {
      // Check user type from database
      const userProfile = await this.prismaService.users_profile.findUnique({
        where: { id: userId },
        select: { id: true, email: true } // Add subscription fields when available
      });

      const userType = 'free'; // For now, all users are free. Add premium logic later
      return this.resetUserLimit(userId, userType);

    } catch (error) {
      this.logger.error(`Failed to initialize user limit for ${userId}:`, error);
      return this.getDefaultUserLimit(userId);
    }
  }

  /**
   * Reset user limit for new period
   */
  private resetUserLimit(userId: string, userType: 'free' | 'premium'): UserQueryLimit {
    const maxQueries = userType === 'premium' ? this.config.premiumUserLimit : this.config.freeUserLimit;
    const resetDate = this.getNextResetDate();
    
    const newLimit: UserQueryLimit = {
      userId,
      period: 'monthly',
      maxQueries,
      currentQueries: 0,
      resetDate,
      userType,
      costSpent: 0,
      maxCost: this.config.maxCostPerUser
    };

    // Cache the new limit
    const redisKey = this.getUserLimitKey(userId);
    this.redisService.setex(
      redisKey,
      this.getSecondsUntilReset(resetDate),
      JSON.stringify(newLimit)
    ).catch(error => {
      this.logger.error(`Failed to cache reset limit for user ${userId}:`, error);
    });

    this.logger.log(`User limit reset for ${userId}: ${userType} user, ${maxQueries} queries`);
    return newLimit;
  }

  /**
   * Get default user limit for fallback scenarios
   */
  private getDefaultUserLimit(userId: string): UserQueryLimit {
    return {
      userId,
      period: 'monthly',
      maxQueries: this.config.freeUserLimit,
      currentQueries: 0,
      resetDate: this.getNextResetDate(),
      userType: 'free',
      costSpent: 0,
      maxCost: this.config.maxCostPerUser
    };
  }

  /**
   * Check if query is allowed based on limits
   */
  private isQueryAllowed(limit: UserQueryLimit, estimatedCost: number): { allowed: boolean; reason?: string } {
    // Check query count limit
    if (limit.currentQueries >= limit.maxQueries) {
      return {
        allowed: false,
        reason: `Query limit reached (${limit.maxQueries} queries per ${limit.period}). Resets on ${limit.resetDate.toLocaleDateString()}.`
      };
    }

    // Check cost limit
    if (limit.costSpent + estimatedCost > limit.maxCost) {
      return {
        allowed: false,
        reason: `Cost limit reached ($${limit.maxCost.toFixed(2)} per ${limit.period}). Try browsing FAQs instead.`
      };
    }

    // Check per-query cost limit
    if (estimatedCost > this.config.maxCostPerQuery) {
      return {
        allowed: false,
        reason: 'Query too complex. Please try a shorter, more specific question.'
      };
    }

    return { allowed: true };
  }

  /**
   * Generate helpful suggestion message for users approaching limits
   */
  private getSuggestionMessage(limit: UserQueryLimit, allowCheck: { allowed: boolean; reason?: string }): string | undefined {
    if (!allowCheck.allowed) {
      return allowCheck.reason;
    }

    const queryUsageRatio = limit.currentQueries / limit.maxQueries;
    const costUsageRatio = limit.costSpent / limit.maxCost;

    if (queryUsageRatio >= 0.8 || costUsageRatio >= 0.8) {
      return `You have ${limit.maxQueries - limit.currentQueries} AI questions remaining this month. Browse our FAQ section for instant answers!`;
    }

    if (queryUsageRatio >= 0.5 || costUsageRatio >= 0.5) {
      return 'Tip: Check our FAQ section first - you might find your answer instantly without using an AI question!';
    }

    return undefined;
  }

  /**
   * Helper methods
   */
  private getUserLimitKey(userId: string): string {
    return `${this.redisKeyPrefix}:user:${userId}`;
  }

  private getNextResetDate(): Date {
    const now = new Date();
    return new Date(now.getTime() + this.config.timeWindowHours * 60 * 60 * 1000);
  }

  private getSecondsUntilReset(resetDate: Date): number {
    return Math.max(1, Math.floor((resetDate.getTime() - Date.now()) / 1000));
  }

  private deserializeUserLimit(data: any): UserQueryLimit {
    return {
      ...data,
      resetDate: new Date(data.resetDate)
    };
  }
} 