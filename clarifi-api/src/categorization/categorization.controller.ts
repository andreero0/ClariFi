import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  Req,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  HttpException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CategorizationService } from './categorization.service';
import { CategorizationCacheService } from './categorization-cache.service';
import { RuleBasedCategorizationService } from './rule-based-categorization.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { FeedbackService } from './feedback.service';
import { MonitoringService } from './monitoring.service';
import { AlertingService } from './alerting.service';
import { ValidationService } from './validation.service';
import {
  TransactionForCategorizationDto,
  CategorizedTransactionDto,
  BatchCategorizationRequestDto,
  BatchCategorizationResponseDto,
  CategoryStatsDto,
  CategorizationHealthDto,
  UserCategoryFeedbackDto,
  CategoryValidationDto,
  UserFeedbackDto,
  BulkFeedbackDto,
  BulkFeedbackResponseDto,
  FeedbackHistoryDto,
  FeedbackAnalyticsDto,
  FeedbackStatsDto,
} from './dto/categorization.dto';

@ApiTags('Transaction Categorization')
@Controller('categorization')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CategorizationController {
  private readonly logger = new Logger(CategorizationController.name);

  constructor(
    private readonly categorizationService: CategorizationService,
    private readonly cacheService: CategorizationCacheService,
    private readonly ruleBasedService: RuleBasedCategorizationService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly feedbackService: FeedbackService,
    private readonly monitoringService: MonitoringService,
    private readonly alertingService: AlertingService,
    private readonly validationService: ValidationService,
  ) {}

  @Post('single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Categorize a single transaction',
    description: 'Process and categorize a single transaction using AI and rule-based analysis'
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction categorized successfully',
    type: CategorizedTransactionDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction data'
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async categorizeSingleTransaction(
    @Body() transaction: TransactionForCategorizationDto,
    @Req() req: any,
  ): Promise<CategorizedTransactionDto> {
    const userId = req.user?.id || 'anonymous';
    this.logger.log(`Single categorization request from user ${userId} for transaction ${transaction.id}`);

    try {
      const result = await this.categorizationService.categorizeTransactions([transaction]);
      
      if (!result || result.length === 0) {
        throw new InternalServerErrorException('Failed to categorize transaction');
      }

      this.logger.log(`Transaction ${transaction.id} categorized as: ${result[0].category}`);
      return result[0];
    } catch (error) {
      this.logger.error(`Single categorization failed for transaction ${transaction.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Categorization failed: ${error.message}`);
    }
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Categorize multiple transactions',
    description: 'Process and categorize multiple transactions in a single request for improved efficiency'
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions categorized successfully',
    type: BatchCategorizationResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction data or batch size too large'
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async categorizeBatchTransactions(
    @Body() batchRequest: BatchCategorizationRequestDto,
    @Req() req: any,
  ): Promise<BatchCategorizationResponseDto> {
    const userId = req.user?.id || 'anonymous';
    this.logger.log(`Batch categorization request from user ${userId} for ${batchRequest.transactions.length} transactions`);

    // Validate batch size (max 100 transactions per request)
    if (batchRequest.transactions.length > 100) {
      throw new BadRequestException('Batch size cannot exceed 100 transactions');
    }

    if (batchRequest.transactions.length === 0) {
      throw new BadRequestException('At least one transaction is required');
    }

    const startTime = Date.now();

    try {
      const results = await this.categorizationService.categorizeTransactions(batchRequest.transactions);
      const processingTime = Date.now() - startTime;

      // Calculate success rate and other metrics
      const successCount = results.filter(r => r && !r.rawApiResponse?.error).length;
      const errorCount = results.length - successCount;

      this.logger.log(
        `Batch categorization completed: ${successCount}/${results.length} successful, ${processingTime}ms total time`
      );

      return {
        results,
        metadata: {
          totalTransactions: batchRequest.transactions.length,
          successfulCategorizations: successCount,
          failedCategorizations: errorCount,
          processingTimeMs: processingTime,
          averageTimePerTransaction: Math.round(processingTime / batchRequest.transactions.length),
        }
      };
    } catch (error) {
      this.logger.error(`Batch categorization failed for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Batch categorization failed: ${error.message}`);
    }
  }

  @Put('feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Submit user feedback for transaction categorization',
    description: 'Allows users to correct transaction categorizations and provide feedback for machine learning improvements'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Feedback processed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        processed: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid feedback data' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async submitFeedback(@Body() feedbackDto: UserFeedbackDto) {
    try {
      this.logger.log(`Processing feedback for transaction ${feedbackDto.transactionId}`);
      
      await this.feedbackService.processFeedback(feedbackDto);
      
      return {
        message: 'Feedback processed successfully',
        processed: true,
      };
    } catch (error) {
      this.logger.error(`Error processing feedback: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to process feedback: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('feedback/bulk')
  @ApiOperation({ 
    summary: 'Submit bulk feedback for multiple transactions',
    description: 'Process feedback for multiple transactions in a single request for improved efficiency'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk feedback processed',
    type: BulkFeedbackResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid bulk feedback data' })
  async submitBulkFeedback(@Body() bulkFeedbackDto: BulkFeedbackDto): Promise<BulkFeedbackResponseDto> {
    try {
      this.logger.log(`Processing bulk feedback for ${bulkFeedbackDto.feedbacks.length} transactions`);
      
      const result = await this.feedbackService.processBulkFeedback(bulkFeedbackDto);
      
      return result;
    } catch (error) {
      this.logger.error(`Error processing bulk feedback: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to process bulk feedback: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('feedback/history')
  @ApiOperation({ 
    summary: 'Get user feedback history',
    description: 'Retrieve the history of feedback submissions for a specific user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Feedback history retrieved successfully',
    type: [FeedbackHistoryDto]
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getFeedbackHistory(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<FeedbackHistoryDto[]> {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      if (limitNum > 100) {
        throw new HttpException('Limit cannot exceed 100', HttpStatus.BAD_REQUEST);
      }

      return await this.feedbackService.getFeedbackHistory(userId, limitNum, offsetNum);
    } catch (error) {
      this.logger.error(`Error retrieving feedback history: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to retrieve feedback history: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('feedback/analytics')
  @ApiOperation({ 
    summary: 'Get feedback analytics',
    description: 'Retrieve analytics about feedback patterns and accuracy improvements'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Feedback analytics retrieved successfully',
    type: FeedbackAnalyticsDto
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getFeedbackAnalytics(
    @Query('userId') userId?: string,
    @Query('period') period: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
  ): Promise<FeedbackAnalyticsDto> {
    try {
      if (period && !['weekly', 'monthly', 'quarterly'].includes(period)) {
        throw new HttpException('Invalid period. Must be weekly, monthly, or quarterly', HttpStatus.BAD_REQUEST);
      }

      return await this.feedbackService.getFeedbackAnalytics(userId, period);
    } catch (error) {
      this.logger.error(`Error retrieving feedback analytics: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to retrieve feedback analytics: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('feedback/stats')
  @ApiOperation({ 
    summary: 'Get feedback system statistics',
    description: 'Retrieve overall statistics about the feedback system performance'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Feedback statistics retrieved successfully',
    type: FeedbackStatsDto
  })
  async getFeedbackStats(): Promise<FeedbackStatsDto> {
    try {
      return await this.feedbackService.getFeedbackStats();
    } catch (error) {
      this.logger.error(`Error retrieving feedback stats: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to retrieve feedback stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available categories',
    description: 'Retrieve the list of available transaction categories'
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string' }
        },
        count: { type: 'number' }
      }
    }
  })
  async getAvailableCategories(): Promise<{
    categories: readonly string[];
    count: number;
  }> {
    try {
      const categories = this.categorizationService.getAvailableCategories();
      
      return {
        categories,
        count: categories.length
      };
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve categories: ${error.message}`);
    }
  }

  @Post('validate-category')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate category name',
    description: 'Check if a category name is valid and available'
  })
  @ApiResponse({
    status: 200,
    description: 'Category validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        category: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateCategory(
    @Body() validation: CategoryValidationDto,
  ): Promise<{
    isValid: boolean;
    category: string;
    message: string;
  }> {
    try {
      const availableCategories = this.categorizationService.getAvailableCategories();
      const isValid = availableCategories.includes(validation.category as any);

      return {
        isValid,
        category: validation.category,
        message: isValid 
          ? 'Category is valid' 
          : `Invalid category. Available categories: ${availableCategories.join(', ')}`
      };
    } catch (error) {
      this.logger.error(`Category validation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Category validation failed: ${error.message}`);
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get categorization statistics',
    description: 'Retrieve performance and usage statistics for the categorization service'
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for stats (hour, day, week, month)',
    enum: ['hour', 'day', 'week', 'month']
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: CategoryStatsDto
  })
  async getCategorizationStats(
    @Query('period') period: string = 'day',
    @Req() req: any,
  ): Promise<CategoryStatsDto> {
    const userId = req.user?.id || 'anonymous';
    this.logger.log(`Stats request from user ${userId} for period: ${period}`);

    try {
      const validPeriod = ['hour', 'day', 'week', 'month'].includes(period) ? period as any : 'day';
      const performanceReport = await this.performanceMonitor.getPerformanceReport(validPeriod);
      const cacheStats = await this.performanceMonitor.getCacheStatistics();
      
      return {
        period: validPeriod,
        totalCategorizations: performanceReport.totalTransactions,
        cacheHitRate: cacheStats.hitRate,
        averageProcessingTimeMs: Math.round(performanceReport.averageLatency),
        categoryDistribution: {}, // TODO: Implement category distribution tracking
        errorRate: performanceReport.errorRate,
        aiApiCallsCount: performanceReport.costBreakdown.aiApiCalls,
        ruleBasedMatchesCount: performanceReport.totalTransactions - performanceReport.costBreakdown.aiApiCalls,
        timestamp: new Date().toISOString(),
        costBreakdown: {
          totalCost: performanceReport.totalCost,
          averageCostPerTransaction: performanceReport.averageCostPerTransaction,
          totalTokens: performanceReport.costBreakdown.totalTokens,
        },
        throughput: performanceReport.throughput,
        recommendations: await this.performanceMonitor.getOptimizationRecommendations()
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve statistics: ${error.message}`);
    }
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get service health status',
    description: 'Check the health and availability of the categorization service and its dependencies'
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    type: CategorizationHealthDto
  })
  async getHealthStatus(): Promise<CategorizationHealthDto> {
    try {
      // Check Redis connectivity
      let redisHealthy = true;
      try {
        await this.cacheService.getCachedCategory('health-check-test');
      } catch (error) {
        redisHealthy = false;
        this.logger.warn(`Redis health check failed: ${error.message}`);
      }

      // Check rule engine
      let ruleEngineHealthy = true;
      try {
        const testTransaction = {
          id: 'health-check',
          description: 'test transaction',
          amount: 10.00,
          date: new Date().toISOString()
        };
        await this.ruleBasedService.categorizeByRules(testTransaction);
      } catch (error) {
        ruleEngineHealthy = false;
        this.logger.warn(`Rule engine health check failed: ${error.message}`);
      }

      const overall = redisHealthy && ruleEngineHealthy;

      return {
        status: overall ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        components: {
          redis: redisHealthy ? 'healthy' : 'unhealthy',
          ruleEngine: ruleEngineHealthy ? 'healthy' : 'unhealthy',
          aiService: 'unknown' // Would need AI API health check
        },
        version: '1.0.0' // Could be injected from package.json
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        components: {
          redis: 'unknown',
          ruleEngine: 'unknown',
          aiService: 'unknown'
        },
        version: '1.0.0',
        error: error.message
      };
    }
  }

  @Get('cache/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Retrieve detailed cache performance metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hitRate: { type: 'number' },
        totalKeys: { type: 'number' },
        memoryUsage: { type: 'string' },
        lastCleanup: { type: 'string' }
      }
    }
  })
  async getCacheStats(@Req() req: any): Promise<{
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
    lastCleanup: string;
  }> {
    const userId = req.user?.id || 'anonymous';
    this.logger.log(`Cache stats request from user ${userId}`);

    try {
      const cacheStats = await this.performanceMonitor.getCacheStatistics();
      
      return {
        hitRate: cacheStats.hitRate,
        totalKeys: cacheStats.totalRequests, // Using total requests as proxy for keys
        memoryUsage: 'N/A', // Would need Redis INFO command integration
        lastCleanup: new Date().toISOString() // Would be tracked in application state
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve cache statistics: ${error.message}`);
    }
  }

  /**
   * Get comprehensive monitoring dashboard
   */
  @Get('monitoring/dashboard')
  @ApiOperation({ 
    summary: 'Get monitoring dashboard',
    description: 'Retrieve comprehensive monitoring dashboard with current metrics, alerts, and system health'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Monitoring dashboard data retrieved successfully'
  })
  async getMonitoringDashboard() {
    try {
      const dashboard = await this.monitoringService.getMonitoringDashboard();
      
      return {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting monitoring dashboard: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve monitoring dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get active alerts
   */
  @Get('monitoring/alerts')
  @ApiOperation({ 
    summary: 'Get active alerts',
    description: 'Retrieve all currently active alerts for the categorization system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active alerts retrieved successfully'
  })
  async getActiveAlerts() {
    try {
      const alerts = await this.alertingService.getActiveAlerts();
      
      return {
        success: true,
        data: {
          alerts,
          count: alerts.length,
          criticalCount: alerts.filter(a => a.severity === 'critical').length,
          highCount: alerts.filter(a => a.severity === 'high').length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting active alerts: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve active alerts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get alert history
   */
  @Get('monitoring/alerts/history')
  @ApiOperation({ 
    summary: 'Get alert history',
    description: 'Retrieve historical alerts for analysis and trending'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alert history retrieved successfully'
  })
  async getAlertHistory(@Query('limit') limit?: string) {
    try {
      const alertLimit = limit ? parseInt(limit, 10) : 100;
      const alerts = await this.alertingService.getAlertHistory(alertLimit);
      
      return {
        success: true,
        data: {
          alerts,
          count: alerts.length,
          limit: alertLimit,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting alert history: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve alert history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Resolve an alert
   */
  @Post('monitoring/alerts/:alertId/resolve')
  @ApiOperation({ 
    summary: 'Resolve alert',
    description: 'Manually resolve an active alert'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alert resolved successfully'
  })
  async resolveAlert(@Param('alertId') alertId: string) {
    try {
      const resolved = await this.alertingService.resolveAlert(alertId);
      
      if (!resolved) {
        throw new HttpException(
          'Alert not found or already resolved',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return {
        success: true,
        message: `Alert ${alertId} resolved successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error resolving alert ${alertId}: ${error.message}`);
      throw new HttpException(
        'Failed to resolve alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current alert thresholds
   */
  @Get('monitoring/thresholds')
  @ApiOperation({ 
    summary: 'Get alert thresholds',
    description: 'Retrieve current alert threshold configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alert thresholds retrieved successfully'
  })
  async getAlertThresholds() {
    try {
      const thresholds = this.alertingService.getThresholds();
      
      return {
        success: true,
        data: thresholds,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting alert thresholds: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve alert thresholds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Prometheus metrics
   */
  @Get('monitoring/metrics/prometheus')
  @ApiOperation({ 
    summary: 'Get Prometheus metrics',
    description: 'Retrieve metrics in Prometheus format for external monitoring'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Prometheus metrics retrieved successfully',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP categorization_accuracy_percentage Current categorization accuracy\n# TYPE categorization_accuracy_percentage gauge\ncategorization_accuracy_percentage 87.5'
        }
      }
    }
  })
  async getPrometheusMetrics(@Res() res) {
    try {
      const metrics = await this.monitoringService.getPrometheusMetrics();
      
      // Format as Prometheus metrics
      const prometheusFormat = this.formatPrometheusMetrics(metrics);
      
      res.set('Content-Type', 'text/plain');
      res.send(prometheusFormat);
    } catch (error) {
      this.logger.error(`Error getting Prometheus metrics: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve Prometheus metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get system health status
   */
  @Get('monitoring/health')
  @ApiOperation({ 
    summary: 'Get system health',
    description: 'Retrieve current system health status for all components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System health retrieved successfully'
  })
  async getSystemHealth() {
    try {
      const health = await this.monitoringService.checkSystemHealth();
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting system health: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve system health',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Trigger manual monitoring check
   */
  @Post('monitoring/check')
  @ApiOperation({ 
    summary: 'Trigger monitoring check',
    description: 'Manually trigger a monitoring check and alert evaluation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Monitoring check completed successfully'
  })
  async triggerMonitoringCheck() {
    try {
      await this.monitoringService.performScheduledMonitoring();
      
      return {
        success: true,
        message: 'Monitoring check completed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error triggering monitoring check: ${error.message}`);
      throw new HttpException(
        'Failed to trigger monitoring check',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== VALIDATION ENDPOINTS ====================

  @Post('validation/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Run end-to-end validation test',
    description: 'Execute comprehensive validation testing with synthetic Canadian transaction data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Validation completed successfully',
    schema: {
      type: 'object',
      properties: {
        overallAccuracy: { type: 'number' },
        totalTransactions: { type: 'number' },
        averageCostPerStatement: { type: 'number' },
        cacheHitRate: { type: 'number' },
        productionReady: { type: 'boolean' }
      }
    }
  })
  async runValidation(
    @Query('scenario') scenario: 'baseline' | 'cost' | 'edge' | 'full' = 'baseline',
    @Query('count') count?: string,
  ) {
    try {
      this.logger.log(`Starting validation scenario: ${scenario}`);
      
      if (scenario === 'full') {
        return await this.validationService.runFullValidationSuite();
      }
      
      // Single scenario validation
      const transactionCount = count ? parseInt(count) : 1000;
      let dataset;
      
      switch (scenario) {
        case 'baseline':
          dataset = this.validationService.generateSyntheticDataset(transactionCount);
          break;
        case 'cost':
          dataset = this.validationService.generateSyntheticDataset(transactionCount);
          break;
        case 'edge':
          dataset = this.validationService.generateEdgeCaseDataset();
          break;
        default:
          dataset = this.validationService.generateSyntheticDataset(transactionCount);
      }
      
      return await this.validationService.runValidation(dataset, scenario);
      
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Validation failed: ${error.message}`);
    }
  }

  @Get('validation/dataset/synthetic')
  @ApiOperation({ 
    summary: 'Generate synthetic test dataset',
    description: 'Create synthetic Canadian transaction data for testing and validation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Synthetic dataset generated successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          groundTruthCategory: { type: 'string' }
        }
      }
    }
  })
  async generateSyntheticDataset(
    @Query('count') count: string = '100',
  ) {
    try {
      const transactionCount = Math.min(parseInt(count), 10000); // Max 10k for API safety
      return this.validationService.generateSyntheticDataset(transactionCount);
    } catch (error) {
      this.logger.error(`Failed to generate synthetic dataset: ${error.message}`);
      throw new InternalServerErrorException(`Dataset generation failed: ${error.message}`);
    }
  }

  @Get('validation/dataset/edge-cases')
  @ApiOperation({ 
    summary: 'Generate edge case test dataset',
    description: 'Create edge case transaction data for robust testing'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Edge case dataset generated successfully'
  })
  async generateEdgeCaseDataset() {
    try {
      return this.validationService.generateEdgeCaseDataset();
    } catch (error) {
      this.logger.error(`Failed to generate edge case dataset: ${error.message}`);
      throw new InternalServerErrorException(`Edge case dataset generation failed: ${error.message}`);
    }
  }

  /**
   * Format metrics for Prometheus
   */
  private formatPrometheusMetrics(metrics: any): string {
    const lines: string[] = [];
    
    // Add help and type information for each metric
    const metricDefinitions = [
      { name: 'categorization_accuracy_percentage', help: 'Current categorization accuracy percentage', type: 'gauge' },
      { name: 'categorization_cost_per_statement_dollars', help: 'Cost per statement in dollars', type: 'gauge' },
      { name: 'categorization_error_rate_percentage', help: 'Error rate percentage', type: 'gauge' },
      { name: 'categorization_latency_milliseconds', help: 'Average latency in milliseconds', type: 'gauge' },
      { name: 'categorization_throughput_per_minute', help: 'Throughput per minute', type: 'gauge' },
      { name: 'categorization_cache_hit_rate_percentage', help: 'Cache hit rate percentage', type: 'gauge' },
      { name: 'categorization_active_alerts_count', help: 'Number of active alerts', type: 'gauge' },
      { name: 'categorization_ai_api_calls_total', help: 'Total AI API calls', type: 'counter' },
      { name: 'categorization_rule_based_hits_total', help: 'Total rule-based hits', type: 'counter' },
    ];
    
    for (const def of metricDefinitions) {
      lines.push(`# HELP ${def.name} ${def.help}`);
      lines.push(`# TYPE ${def.name} ${def.type}`);
      lines.push(`${def.name} ${metrics[def.name] || 0}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
} 