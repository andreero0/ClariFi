import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param,
  UseGuards,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { QAPromptOptimizationService, ABTestConfig } from './qa-prompt-optimization.service';
import { IsString, IsArray, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class StartABTestDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  promptVariants: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  trafficSplit: number[];

  @IsArray()
  @IsString({ each: true })
  testMetrics: string[];

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}

export class PromptTestRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  promptIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  testQueries?: string[];

  @IsOptional()
  @IsBoolean()
  includePerformanceAnalysis?: boolean;
}

@ApiTags('Q&A Testing & Optimization')
@Controller('qa/testing')
// @UseGuards(AdminGuard) // Would require admin authentication
export class QATestingController {
  private readonly logger = new Logger(QATestingController.name);

  constructor(
    private readonly promptOptimizationService: QAPromptOptimizationService
  ) {}

  @Post('prompt-performance')
  @ApiOperation({ 
    summary: 'Run comprehensive prompt performance test',
    description: 'Test all prompt templates against standard queries and analyze performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Prompt performance test results with recommendations' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Test execution failed' 
  })
  async runPromptPerformanceTest(@Body() requestDto?: PromptTestRequestDto) {
    try {
      this.logger.log('Starting prompt performance test');

      const testResults = await this.promptOptimizationService.runPromptPerformanceTest();

      return {
        success: true,
        message: 'Prompt performance test completed successfully',
        data: {
          testResults: testResults.overallResults,
          recommendations: testResults.recommendations,
          summary: testResults.summary,
          executedAt: new Date().toISOString(),
          testConfiguration: {
            totalPrompts: Object.keys(testResults.overallResults).length,
            totalQueries: Object.values(testResults.overallResults)[0]?.length || 0,
            customQueries: requestDto?.testQueries?.length || 0
          }
        }
      };

    } catch (error) {
      this.logger.error(`Prompt performance test failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to execute prompt performance test');
    }
  }

  @Post('ab-test/start')
  @ApiOperation({ 
    summary: 'Start A/B test for prompt variants',
    description: 'Initialize A/B testing for comparing prompt performance with traffic splitting'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'A/B test started successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid A/B test configuration' 
  })
  async startABTest(@Body() abTestDto: StartABTestDto) {
    try {
      this.logger.log(`Starting A/B test: ${abTestDto.name}`);

      // Validate traffic split
      const totalSplit = abTestDto.trafficSplit.reduce((sum, split) => sum + split, 0);
      if (Math.abs(totalSplit - 100) > 0.01) {
        throw new BadRequestException('Traffic split must sum to 100%');
      }

      if (abTestDto.promptVariants.length !== abTestDto.trafficSplit.length) {
        throw new BadRequestException('Number of prompt variants must match traffic split array length');
      }

      const testConfig: ABTestConfig = {
        id: `ab_test_${Date.now()}`,
        name: abTestDto.name,
        description: abTestDto.description,
        promptVariants: abTestDto.promptVariants,
        trafficSplit: abTestDto.trafficSplit,
        testMetrics: abTestDto.testMetrics,
        startDate: abTestDto.startDate,
        endDate: abTestDto.endDate,
        active: true
      };

      await this.promptOptimizationService.startABTest(testConfig);

      return {
        success: true,
        message: 'A/B test started successfully',
        data: {
          testId: testConfig.id,
          configuration: testConfig,
          startedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error(`Failed to start A/B test: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to start A/B test');
    }
  }

  @Get('ab-test/:testId/results')
  @ApiOperation({ 
    summary: 'Get A/B test results and analysis',
    description: 'Retrieve comprehensive results and statistical analysis for an A/B test'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'A/B test results retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'A/B test not found' 
  })
  async getABTestResults(@Param('testId') testId: string) {
    try {
      this.logger.debug(`Retrieving A/B test results for: ${testId}`);

      const testResults = await this.promptOptimizationService.getABTestResults(testId);

      return {
        success: true,
        message: 'A/B test results retrieved successfully',
        data: {
          testId,
          configuration: testResults.config,
          results: testResults.results,
          analysis: testResults.analysis,
          retrievedAt: new Date().toISOString(),
          summary: {
            totalVariants: testResults.config.promptVariants.length,
            hasWinner: !!testResults.analysis.winner,
            isStatisticallySignificant: testResults.analysis.statisticalSignificance,
            recommendationsCount: testResults.analysis.recommendations.length
          }
        }
      };

    } catch (error) {
      this.logger.error(`Failed to get A/B test results: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve A/B test results: ${error.message}`);
    }
  }

  @Get('optimization-metrics')
  @ApiOperation({ 
    summary: 'Get current prompt optimization metrics',
    description: 'Retrieve comprehensive metrics on prompt performance, cost efficiency, and quality'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Optimization metrics retrieved successfully' 
  })
  async getOptimizationMetrics() {
    try {
      this.logger.debug('Retrieving prompt optimization metrics');

      const metrics = await this.promptOptimizationService.getOptimizationMetrics();

      return {
        success: true,
        message: 'Optimization metrics retrieved successfully',
        data: {
          metrics,
          retrievedAt: new Date().toISOString(),
          summary: {
            totalTemplates: Object.keys(metrics.templatePerformance).length,
            activeABTests: metrics.activeTests.length,
            costEfficiencyRating: this.getCostEfficiencyRating(metrics.costEfficiency.averageCostPerQuery),
            qualityRating: this.getQualityRating(metrics.qualityMetrics.averageAccuracy),
            canadianOptimizationScore: (metrics.qualityMetrics.canadianContextScore * 100).toFixed(1) + '%'
          }
        }
      };

    } catch (error) {
      this.logger.error(`Failed to get optimization metrics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve optimization metrics');
    }
  }

  @Get('prompt-templates')
  @ApiOperation({ 
    summary: 'Get available prompt templates',
    description: 'Retrieve list of all available prompt templates with their configurations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Prompt templates retrieved successfully' 
  })
  async getPromptTemplates() {
    try {
      this.logger.debug('Retrieving available prompt templates');

      // This would come from the optimization service
      const templates = [
        {
          id: 'canadian_financial_v1',
          name: 'Canadian Financial Advisor - Concise',
          version: '1.0',
          maxTokens: 200,
          temperature: 0.3,
          canadianOptimized: true,
          targetAudience: 'general',
          status: 'active'
        },
        {
          id: 'canadian_financial_v2',
          name: 'Canadian Financial Advisor - Detailed',
          version: '2.0',
          maxTokens: 250,
          temperature: 0.2,
          canadianOptimized: true,
          targetAudience: 'general',
          status: 'active'
        },
        {
          id: 'newcomer_optimized_v1',
          name: 'Newcomer-Focused Financial Advisor',
          version: '1.0',
          maxTokens: 220,
          temperature: 0.3,
          canadianOptimized: true,
          targetAudience: 'newcomer',
          status: 'active'
        },
        {
          id: 'clarifi_focused_v1',
          name: 'ClariFi-Focused Financial Advisor',
          version: '1.0',
          maxTokens: 200,
          temperature: 0.3,
          canadianOptimized: true,
          targetAudience: 'general',
          status: 'active'
        }
      ];

      return {
        success: true,
        message: 'Prompt templates retrieved successfully',
        data: {
          templates,
          retrievedAt: new Date().toISOString(),
          summary: {
            totalTemplates: templates.length,
            activeTemplates: templates.filter(t => t.status === 'active').length,
            canadianOptimizedTemplates: templates.filter(t => t.canadianOptimized).length,
            averageMaxTokens: templates.reduce((sum, t) => sum + t.maxTokens, 0) / templates.length
          }
        }
      };

    } catch (error) {
      this.logger.error(`Failed to get prompt templates: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve prompt templates');
    }
  }

  @Post('benchmark')
  @ApiOperation({ 
    summary: 'Run optimization benchmark',
    description: 'Execute comprehensive benchmark test comparing all optimization strategies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Benchmark completed successfully' 
  })
  async runOptimizationBenchmark() {
    try {
      this.logger.log('Starting optimization benchmark');

      // Run comprehensive benchmark
      const startTime = Date.now();
      
      // Test prompt performance
      const promptResults = await this.promptOptimizationService.runPromptPerformanceTest();
      
      // Get current metrics
      const currentMetrics = await this.promptOptimizationService.getOptimizationMetrics();
      
      const executionTime = Date.now() - startTime;

      // Generate benchmark report
      const benchmarkReport = {
        executionTime,
        promptPerformance: {
          bestTemplate: promptResults.summary.bestPerforming,
          costEfficiency: promptResults.summary.mostCostEfficient,
          canadianOptimization: promptResults.summary.mostCanadianOptimized
        },
        currentMetrics: {
          averageCost: currentMetrics.costEfficiency.averageCostPerQuery,
          accuracy: currentMetrics.qualityMetrics.averageAccuracy,
          canadianContext: currentMetrics.qualityMetrics.canadianContextScore
        },
        recommendations: promptResults.recommendations,
        optimizationTargets: {
          costTarget: 0.005, // $0.005 per query target
          accuracyTarget: 0.90, // 90% accuracy target
          canadianContextTarget: 0.95 // 95% Canadian context target
        }
      };

      return {
        success: true,
        message: 'Optimization benchmark completed successfully',
        data: {
          benchmarkReport,
          executedAt: new Date().toISOString(),
          summary: {
            executionTimeMs: executionTime,
            meetsTargets: {
              cost: currentMetrics.costEfficiency.averageCostPerQuery <= 0.005,
              accuracy: currentMetrics.qualityMetrics.averageAccuracy >= 0.90,
              canadianContext: currentMetrics.qualityMetrics.canadianContextScore >= 0.95
            }
          }
        }
      };

    } catch (error) {
      this.logger.error(`Benchmark execution failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to execute optimization benchmark');
    }
  }

  // Helper methods

  private getCostEfficiencyRating(avgCost: number): string {
    if (avgCost <= 0.003) return 'Excellent';
    if (avgCost <= 0.005) return 'Good';
    if (avgCost <= 0.008) return 'Fair';
    return 'Needs Improvement';
  }

  private getQualityRating(accuracy: number): string {
    if (accuracy >= 0.90) return 'Excellent';
    if (accuracy >= 0.80) return 'Good';
    if (accuracy >= 0.70) return 'Fair';
    return 'Needs Improvement';
  }
} 