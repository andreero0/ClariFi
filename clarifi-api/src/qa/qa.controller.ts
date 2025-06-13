import { 
  Controller, 
  Post, 
  Body, 
  Get,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  ValidationPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { QALLMService, QARequest, QAResponse } from './qa-llm.service';
import { QACacheService } from './qa-cache.service';
import { QAQueryLimitService, QueryLimitCheck } from './qa-query-limit.service';
import { QASuggestionsService } from './qa-suggestions.service';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class QueryRequestDto {
  @IsString()
  @MinLength(5, { message: 'Question must be at least 5 characters long' })
  @MaxLength(500, { message: 'Question must be less than 500 characters' })
  query: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Context must be less than 200 characters' })
  context?: string;

  @IsOptional()
  maxTokens?: number;
}

export interface QueryResponseDto {
  answer: string;
  fromCache: boolean;
  model: string;
  responseTime: number;
  confidence: number;
  source: 'cache' | 'llm';
  cost: number;
  remainingQueries?: number;
  usage?: {
    tokens: {
      input: number;
      output: number;
      total: number;
    };
  };
}

export interface ServiceHealthDto {
  qa: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    configured: boolean;
    model: string;
    maxTokens: number;
  };
  cache: {
    status: string;
    redis: boolean;
    metrics: any;
  };
  costs: {
    faqHitRate: number;
    llmHitRate: number;
    totalCostSavings: number;
  };
  timestamp: string;
}

@ApiTags('Q&A System')
@Controller('qa')
// @UseGuards(AuthGuard) // Uncomment when auth is ready
export class QAController {
  private readonly logger = new Logger(QAController.name);

  constructor(
    private readonly qaLLMService: QALLMService,
    private readonly cacheService: QACacheService,
    private readonly queryLimitService: QAQueryLimitService,
    private readonly suggestionsService: QASuggestionsService,
  ) {}

  @Post('ask')
  @ApiOperation({ 
    summary: 'Ask a Canadian financial advice question',
    description: 'Submit a financial question and get AI-powered advice optimized for Canadian users'
  })
  @ApiBody({ type: QueryRequestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Successful response with financial advice',
    type: Object // Would be QueryResponseDto in a real API
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid query or validation error' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Rate limit exceeded - too many queries' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  // @ApiBearerAuth() // Uncomment when auth is ready
  async askQuestion(
    @Body(ValidationPipe) queryDto: QueryRequestDto,
    @Request() req?: any
  ): Promise<QueryResponseDto> {
    try {
      // Extract user ID (mock for now, would come from auth)
      const userId = req?.user?.id || 'anonymous';
      
      this.logger.log(`Q&A request from user ${userId}: "${queryDto.query.substring(0, 50)}..."`);

      // Validate the query
      const validation = this.qaLLMService.validateQuery(queryDto.query);
      if (!validation.isValid) {
        throw new BadRequestException(validation.reason);
      }

      // Check query limits before processing
      const limitCheck = await this.queryLimitService.checkQueryLimit(userId);
      
      if (!limitCheck.allowed) {
        this.logger.warn(`Query blocked for user ${userId}: ${limitCheck.reason}`);
        throw new HttpException(limitCheck.reason || 'Query limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Process the question
      const qaRequest: QARequest = {
        query: queryDto.query,
        userId,
        context: queryDto.context,
        maxTokens: queryDto.maxTokens
      };

      const response = await this.qaLLMService.processQuery(qaRequest);

      // Record the query for limit tracking
      await this.queryLimitService.recordQuery(userId, response.cost, response.fromCache);

      // Log successful response for monitoring
      this.logger.log(
        `Q&A response generated for user ${userId}: ` +
        `${response.source}, cost: $${response.cost.toFixed(4)}, ` +
        `responseTime: ${response.responseTime}ms`
      );

      // Format response for API
      const apiResponse: QueryResponseDto = {
        answer: response.answer,
        fromCache: response.fromCache,
        model: response.model,
        responseTime: response.responseTime,
        confidence: response.confidence,
        source: response.source,
        cost: response.cost,
        remainingQueries: limitCheck.remaining
      };

      // Add token usage if available
      if (response.tokens) {
        apiResponse.usage = {
          tokens: response.tokens
        };
      }

      return apiResponse;

    } catch (error) {
      this.logger.error(`Q&A request failed: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }
      
      // Generic error for unexpected failures
      throw new BadRequestException('Unable to process your question at this time. Please try again.');
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Get Q&A system health status',
    description: 'Check the health and configuration of the Q&A system including cache performance'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System health information',
    type: Object // Would be ServiceHealthDto in a real API
  })
  async getHealth(): Promise<ServiceHealthDto> {
    try {
      this.logger.debug('Health check requested');

      // Get service health
      const qaHealth = await this.qaLLMService.getServiceHealth();
      
      // Get cache metrics
      const cacheHealth = await this.cacheService.healthCheck();
      const cacheMetrics = await this.cacheService.getCacheMetrics();

      const healthResponse: ServiceHealthDto = {
        qa: {
          status: qaHealth.status,
          configured: qaHealth.configured,
          model: qaHealth.model,
          maxTokens: qaHealth.maxTokens
        },
        cache: {
          status: cacheHealth.status,
          redis: cacheHealth.redis,
          metrics: cacheHealth.metrics
        },
        costs: {
          faqHitRate: cacheMetrics.faqCache.hitRate,
          llmHitRate: cacheMetrics.llmCache.hitRate,
          totalCostSavings: cacheMetrics.totalCostSavings
        },
        timestamp: new Date().toISOString()
      };

      return healthResponse;

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      
      return {
        qa: {
          status: 'unhealthy',
          configured: false,
          model: 'unknown',
          maxTokens: 0
        },
        cache: {
          status: 'unhealthy',
          redis: false,
          metrics: {}
        },
        costs: {
          faqHitRate: 0,
          llmHitRate: 0,
          totalCostSavings: 0
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get detailed cache and cost metrics',
    description: 'Retrieve comprehensive metrics for monitoring FAQ hit rates and cost optimization'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed metrics information' 
  })
  async getMetrics() {
    try {
      this.logger.debug('Metrics requested');

      const metrics = await this.cacheService.getCacheMetrics();
      
      return {
        ...metrics,
        timestamp: new Date().toISOString(),
        summary: {
          overallHitRate: (metrics.faqCache.hits + metrics.llmCache.hits) / 
                          (metrics.faqCache.hits + metrics.faqCache.misses + metrics.llmCache.hits + metrics.llmCache.misses),
          projectedMonthlySavings: metrics.totalCostSavings * 30, // Rough projection
          costEfficiencyRating: metrics.faqCache.hitRate > 0.95 ? 'Excellent' : 
                               metrics.faqCache.hitRate > 0.85 ? 'Good' : 
                               metrics.faqCache.hitRate > 0.70 ? 'Fair' : 'Needs Improvement'
        }
      };

    } catch (error) {
      this.logger.error(`Metrics retrieval failed: ${error.message}`, error.stack);
      throw new BadRequestException('Unable to retrieve metrics at this time');
    }
  }

  @Post('cache/clear')
  @ApiOperation({ 
    summary: 'Clear cache entries (admin only)',
    description: 'Clear cache entries for maintenance or testing purposes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache cleared successfully' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Insufficient permissions' 
  })
  // @UseGuards(AdminGuard) // Would need admin authentication
  async clearCache(@Body() clearOptions?: { pattern?: string }) {
    try {
      this.logger.warn('Cache clear requested');
      
      const pattern = clearOptions?.pattern || 'qa:*';
      await this.cacheService.clearCache(pattern);
      
      return {
        success: true,
        message: `Cache cleared with pattern: ${pattern}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Cache clear failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to clear cache');
    }
  }

  @Get('categories')
  @ApiOperation({ 
    summary: 'Get available FAQ categories',
    description: 'Retrieve the list of FAQ categories for frontend navigation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of FAQ categories' 
  })
  async getFAQCategories() {
    // This would integrate with the FAQ content from the mobile service
    // For now, return the categories we know about
    return {
      categories: [
        {
          id: 'credit-scores',
          title: 'Credit Scores',
          icon: 'credit-card',
          description: 'Learn about credit scores, utilization, and improvement strategies',
          questionCount: 15
        },
        {
          id: 'budgeting',
          title: 'Budgeting',
          icon: 'calculator',
          description: 'Master budgeting techniques and expense management',
          questionCount: 12
        },
        {
          id: 'banking-canada',
          title: 'Banking in Canada',
          icon: 'bank',
          description: 'Navigate Canadian banks, accounts, and financial products',
          questionCount: 10
        },
        {
          id: 'using-clarifi',
          title: 'Using ClariFi',
          icon: 'help-circle',
          description: 'Get help with ClariFi features and functionality',
          questionCount: 8
        }
      ],
      timestamp: new Date().toISOString()
    };
  }

  @Post('suggestions')
  @ApiOperation({ 
    summary: 'Get suggested questions based on context',
    description: 'Retrieve contextually relevant question suggestions for enhanced user experience'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of suggested questions' 
  })
  async getSuggestions(
    @Body() requestDto: {
      currentCategory?: string;
      lastAnswer?: string;
      limit?: number;
      userContext?: string;
    },
    @Request() req?: any
  ) {
    try {
      const userId = req?.user?.id || 'anonymous';
      
      this.logger.debug(`Suggestions requested for user ${userId}, category: ${requestDto.currentCategory}`);

      const suggestions = await this.suggestionsService.getSuggestions(
        requestDto.currentCategory,
        requestDto.lastAnswer,
        requestDto.limit || 6,
        userId
      );

      return {
        success: true,
        suggestions,
        context: requestDto.currentCategory,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Suggestions request failed: ${error.message}`, error.stack);
      return {
        success: false,
        suggestions: [],
        error: 'Unable to generate suggestions at this time',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('suggestions/track')
  @ApiOperation({ 
    summary: 'Track suggestion click for analytics',
    description: 'Record when a user clicks on a suggested question for effectiveness tracking'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Click tracked successfully' 
  })
  async trackSuggestionClick(
    @Body() trackingDto: {
      suggestionId: string;
      question: string;
      category: string;
      reason: string;
      successfulAnswer?: boolean;
      userRating?: number;
    },
    @Request() req?: any
  ) {
    try {
      const userId = req?.user?.id || 'anonymous';
      
      this.logger.debug(`Tracking suggestion click for user ${userId}: ${trackingDto.suggestionId}`);

      await this.suggestionsService.trackSuggestionClick(trackingDto as any, userId);

      return {
        success: true,
        message: 'Suggestion click tracked successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Suggestion tracking failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to track suggestion click',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('suggestions/metrics')
  @ApiOperation({ 
    summary: 'Get suggestion effectiveness metrics',
    description: 'Retrieve analytics on suggestion performance and user engagement'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Suggestion metrics and analytics' 
  })
  async getSuggestionMetrics() {
    try {
      this.logger.debug('Suggestion metrics requested');

      const metrics = await this.suggestionsService.getMetrics();

      return {
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Suggestion metrics retrieval failed: ${error.message}`, error.stack);
      return {
        success: false,
        metrics: {
          totalSuggestions: 0,
          totalClicks: 0,
          clickThroughRate: 0,
          popularQuestions: [],
          categoryPerformance: [],
          reasonPerformance: [],
          lastUpdated: Date.now()
        },
        error: 'Unable to retrieve suggestion metrics',
        timestamp: new Date().toISOString()
      };
    }
  }
} 