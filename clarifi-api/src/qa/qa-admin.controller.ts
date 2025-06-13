import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param,
  UseGuards,
  Logger,
  BadRequestException,
  ValidationPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiParam 
} from '@nestjs/swagger';
import { QAQueryLimitService } from './qa-query-limit.service';
import { QACacheService } from './qa-cache.service';
import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class ResetLimitsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @IsOptional()
  @IsString()
  resetAll?: 'true' | 'false';
}

export class UpdateConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  freeUserLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  premiumUserLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1.00)
  maxCostPerUser?: number;

  @IsOptional()
  @IsNumber()
  @Min(1.00)
  @Max(100.00)
  dailyBudgetLimit?: number;
}

export interface AdminDashboardData {
  usage: {
    totalActiveUsers: number;
    totalQueries: number;
    totalCost: number;
    averageQueriesPerUser: number;
    freeUserCount: number;
    premiumUserCount: number;
    nearLimitUsers: number;
    dailyBudgetUsed: number;
  };
  cache: {
    faqHitRate: number;
    llmHitRate: number;
    totalCostSavings: number;
  };
  alerts: {
    budgetAlerts: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    highUsageUsers: Array<{
      type: string;
      message: string;
      count: number;
    }>;
    systemHealth: string;
  };
  config: {
    freeUserLimit: number;
    premiumUserLimit: number;
    maxCostPerUser: number;
    dailyBudgetLimit: number;
  };
  timestamp: string;
}

@ApiTags('Q&A Admin')
@Controller('qa/admin')
// @UseGuards(AuthGuard, AdminGuard) // Uncomment when admin authentication is ready
export class QAAdminController {
  private readonly logger = new Logger(QAAdminController.name);

  constructor(
    private readonly queryLimitService: QAQueryLimitService,
    private readonly cacheService: QACacheService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get Q&A system admin dashboard data',
    description: 'Comprehensive dashboard data for monitoring Q&A system usage, costs, and performance'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully' 
  })
  // @ApiBearerAuth() // Uncomment when auth is ready
  async getAdminDashboard(): Promise<AdminDashboardData> {
    try {
      this.logger.log('Admin dashboard data requested');

      // Get usage statistics
      const usage = await this.queryLimitService.getUsageStatistics();

      // Get cache metrics
      const cacheMetrics = await this.cacheService.getCacheMetrics();

      // Mock configuration (would come from ConfigService in production)
      const config = {
        freeUserLimit: 5,
        premiumUserLimit: 20,
        maxCostPerUser: 0.10,
        dailyBudgetLimit: 10.00
      };

      // Generate alerts based on usage
      const alerts = this.generateAlerts(usage, cacheMetrics, config);

      return {
        usage,
        cache: {
          faqHitRate: cacheMetrics.faqCache.hitRate,
          llmHitRate: cacheMetrics.llmCache.hitRate,
          totalCostSavings: cacheMetrics.totalCostSavings
        },
        alerts,
        config,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Admin dashboard failed: ${error.message}`, error.stack);
      throw new BadRequestException('Unable to retrieve dashboard data');
    }
  }

  @Get('usage-stats')
  @ApiOperation({ 
    summary: 'Get detailed usage statistics',
    description: 'Retrieve comprehensive usage statistics for cost monitoring and optimization'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usage statistics retrieved successfully' 
  })
  async getUsageStatistics() {
    try {
      this.logger.log('Usage statistics requested');
      
      const stats = await this.queryLimitService.getUsageStatistics();
      
      return {
        ...stats,
        projections: {
          monthlyQueryProjection: stats.totalQueries * 30, // Rough projection
          monthlyCostProjection: stats.totalCost * 30,
          averageCostPerQuery: stats.totalQueries > 0 ? stats.totalCost / stats.totalQueries : 0,
          efficiencyRating: this.calculateEfficiencyRating(stats)
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Usage statistics failed: ${error.message}`, error.stack);
      throw new BadRequestException('Unable to retrieve usage statistics');
    }
  }

  @Post('reset-limits')
  @ApiOperation({ 
    summary: 'Reset query limits for users',
    description: 'Reset query limits for specific users or all users (admin emergency function)'
  })
  @ApiBody({ type: ResetLimitsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Limits reset successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request parameters' 
  })
  async resetQueryLimits(@Body(ValidationPipe) resetDto: ResetLimitsDto) {
    try {
      this.logger.warn(`Admin limit reset requested: ${JSON.stringify(resetDto)}`);

      let result;
      
      if (resetDto.resetAll === 'true') {
        result = await this.queryLimitService.resetUserLimits('all');
        this.logger.warn('ADMIN ACTION: All user limits reset');
      } else if (resetDto.userIds && resetDto.userIds.length > 0) {
        result = await this.queryLimitService.resetUserLimits(resetDto.userIds);
        this.logger.warn(`ADMIN ACTION: Limits reset for users: ${resetDto.userIds.join(', ')}`);
      } else {
        throw new BadRequestException('Must specify either userIds or resetAll=true');
      }

      return {
        success: true,
        message: `Successfully reset limits for ${result.success} users`,
        details: {
          successCount: result.success,
          failedCount: result.failed
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Reset limits failed: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to reset user limits');
    }
  }

  @Get('user-limit/:userId')
  @ApiOperation({ 
    summary: 'Get specific user query limit information',
    description: 'Retrieve detailed limit information for a specific user'
  })
  @ApiParam({ name: 'userId', description: 'User ID to check limits for' })
  @ApiResponse({ 
    status: 200, 
    description: 'User limit information retrieved' 
  })
  async getUserLimit(@Param('userId') userId: string) {
    try {
      this.logger.log(`Admin checking limits for user: ${userId}`);

      const userLimit = await this.queryLimitService.getUserQueryLimit(userId);
      const limitCheck = await this.queryLimitService.checkQueryLimit(userId);

      return {
        user: {
          userId: userLimit.userId,
          userType: userLimit.userType,
          period: userLimit.period
        },
        limits: {
          maxQueries: userLimit.maxQueries,
          currentQueries: userLimit.currentQueries,
          remaining: limitCheck.remaining,
          maxCost: userLimit.maxCost,
          costSpent: userLimit.costSpent,
          costRemaining: limitCheck.costRemaining
        },
        status: {
          canQuery: limitCheck.allowed,
          resetDate: userLimit.resetDate,
          reason: limitCheck.reason,
          suggestion: limitCheck.suggestionMessage
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Get user limit failed for ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException(`Unable to retrieve limit information for user ${userId}`);
    }
  }

  @Get('health-check')
  @ApiOperation({ 
    summary: 'Health check for Q&A admin systems',
    description: 'Comprehensive health check for all Q&A system components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check completed' 
  })
  async healthCheck() {
    try {
      const cacheHealth = await this.cacheService.healthCheck();
      const usageStats = await this.queryLimitService.getUsageStatistics();

      const systemHealth = {
        cache: {
          status: cacheHealth.status,
          redis: cacheHealth.redis,
          operational: cacheHealth.status === 'healthy'
        },
        queryLimits: {
          operational: true, // Simple check - service responded
          activeUsers: usageStats.totalActiveUsers,
          totalQueries: usageStats.totalQueries
        },
        budget: {
          dailyUsed: usageStats.dailyBudgetUsed,
          dailyLimit: 10.00, // From config
          utilizationPercent: (usageStats.dailyBudgetUsed / 10.00) * 100
        },
        overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy'
      };

      // Determine overall health
      if (!systemHealth.cache.operational) {
        systemHealth.overall = 'degraded';
      }

      if (systemHealth.budget.utilizationPercent > 90) {
        systemHealth.overall = 'degraded';
      }

      return {
        status: systemHealth.overall,
        components: systemHealth,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('cost-analysis')
  @ApiOperation({ 
    summary: 'Get detailed cost analysis and optimization recommendations',
    description: 'Analyze Q&A system costs and provide optimization recommendations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cost analysis completed' 
  })
  async getCostAnalysis() {
    try {
      const usage = await this.queryLimitService.getUsageStatistics();
      const cacheMetrics = await this.cacheService.getCacheMetrics();

      const analysis = {
        currentCosts: {
          totalCost: usage.totalCost,
          averageCostPerUser: usage.totalActiveUsers > 0 ? usage.totalCost / usage.totalActiveUsers : 0,
          averageCostPerQuery: usage.totalQueries > 0 ? usage.totalCost / usage.totalQueries : 0,
          dailyBudgetUtilization: (usage.dailyBudgetUsed / 10.00) * 100
        },
        optimization: {
          faqHitRate: cacheMetrics.faqCache.hitRate,
          llmCacheHitRate: cacheMetrics.llmCache.hitRate,
          totalSavingsFromCache: cacheMetrics.totalCostSavings,
          recommendedActions: this.getCostOptimizationRecommendations(usage, cacheMetrics)
        },
        projections: {
          monthlyProjection: usage.totalCost * 30,
          annualProjection: usage.totalCost * 365,
          targetAchievement: this.getTargetAchievement(usage, cacheMetrics)
        },
        timestamp: new Date().toISOString()
      };

      return analysis;

    } catch (error) {
      this.logger.error(`Cost analysis failed: ${error.message}`, error.stack);
      throw new BadRequestException('Unable to generate cost analysis');
    }
  }

  /**
   * Private helper methods
   */
  private generateAlerts(usage: any, cache: any, config: any) {
    const alerts = {
      budgetAlerts: [] as Array<{
        type: string;
        message: string;
        severity: string;
      }>,
      highUsageUsers: [] as Array<{
        type: string;
        message: string;
        count: number;
      }>,
      systemHealth: 'good'
    };

    // Budget alerts
    const budgetUtilization = (usage.dailyBudgetUsed / config.dailyBudgetLimit) * 100;
    if (budgetUtilization > 80) {
      alerts.budgetAlerts.push({
        type: 'budget_warning',
        message: `Daily budget ${budgetUtilization.toFixed(1)}% utilized`,
        severity: budgetUtilization > 95 ? 'critical' : 'warning'
      });
    }

    // High usage alerts
    if (usage.nearLimitUsers > 0) {
      alerts.highUsageUsers.push({
        type: 'high_usage',
        message: `${usage.nearLimitUsers} users near query limits`,
        count: usage.nearLimitUsers
      });
    }

    // System health
    if (cache.faqCache.hitRate < 0.90) {
      alerts.systemHealth = 'needs_attention';
      alerts.budgetAlerts.push({
        type: 'efficiency_warning',
        message: `FAQ hit rate below target: ${(cache.faqCache.hitRate * 100).toFixed(1)}%`,
        severity: 'warning'
      });
    }

    return alerts;
  }

  private calculateEfficiencyRating(stats: any): string {
    const queryPerUserRatio = stats.totalActiveUsers > 0 ? stats.totalQueries / stats.totalActiveUsers : 0;
    
    if (queryPerUserRatio < 2) return 'Excellent';
    if (queryPerUserRatio < 3) return 'Good';
    if (queryPerUserRatio < 4) return 'Fair';
    return 'Needs Improvement';
  }

  private getCostOptimizationRecommendations(usage: any, cache: any): string[] {
    const recommendations: string[] = [];

    if (cache.faqCache.hitRate < 0.95) {
      recommendations.push('Improve FAQ content coverage to increase hit rate');
    }

    if (cache.llmCache.hitRate < 0.70) {
      recommendations.push('Optimize LLM response caching for similar queries');
    }

    if (usage.averageCostPerQuery > 0.008) {
      recommendations.push('Consider prompt optimization to reduce token usage');
    }

    if (usage.nearLimitUsers > usage.totalActiveUsers * 0.1) {
      recommendations.push('Consider adding more FAQ content for common questions');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is well optimized for cost efficiency');
    }

    return recommendations;
  }

  private getTargetAchievement(usage: any, cache: any) {
    return {
      costPerUserTarget: 0.10,
      currentCostPerUser: usage.totalActiveUsers > 0 ? usage.totalCost / usage.totalActiveUsers : 0,
      faqHitRateTarget: 0.95,
      currentFaqHitRate: cache.faqCache.hitRate,
      overallScore: this.calculateOverallScore(usage, cache)
    };
  }

  private calculateOverallScore(usage: any, cache: any): number {
    const costScore = usage.totalActiveUsers > 0 ? Math.min(1, 0.10 / (usage.totalCost / usage.totalActiveUsers)) : 1;
    const faqScore = cache.faqCache.hitRate / 0.95;
    return Math.min(1, (costScore + faqScore) / 2);
  }
} 