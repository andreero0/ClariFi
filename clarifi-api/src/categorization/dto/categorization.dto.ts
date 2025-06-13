import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEmail, IsDateString, IsBoolean, IsEnum, Min, Max, IsNotEmpty, IsInt, IsPositive, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategorizedTransactionDto } from './categorized-transaction.dto';

// Re-export existing DTOs
export { CategorizedTransactionDto } from './categorized-transaction.dto';
export { OpenAICategorizationRequestDto } from './openai-categorization-request.dto';

// Transaction input DTO
export class TransactionForCategorizationDto {
  @ApiProperty({
    description: 'Unique transaction identifier',
    example: 'txn_12345'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Transaction description/merchant name',
    example: 'STARBUCKS COFFEE CO #12345'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Transaction amount (positive for expenses, negative for income)',
    example: 4.75
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Transaction date in ISO 8601 format',
    example: '2024-06-04T10:30:00.000Z'
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Optional merchant/payee name if different from description',
    example: 'Starbucks'
  })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiPropertyOptional({
    description: 'User ID for the transaction',
    example: 'user_12345'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Merchant ID for categorization',
    example: 'merchant_12345'
  })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the transaction',
    example: { location: 'Downtown Branch', cardType: 'credit' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// Batch processing DTOs
export class BatchCategorizationRequestDto {
  @ApiProperty({
    description: 'Array of transactions to categorize',
    type: [TransactionForCategorizationDto],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionForCategorizationDto)
  transactions: TransactionForCategorizationDto[];

  @ApiPropertyOptional({
    description: 'Optional batch processing options',
    example: { skipCache: false, forceRules: false }
  })
  @IsOptional()
  options?: {
    skipCache?: boolean;
    forceRules?: boolean;
    enableParallelProcessing?: boolean;
  };
}

export class BatchCategorizationMetadataDto {
  @ApiProperty({
    description: 'Total number of transactions in the batch',
    example: 25
  })
  totalTransactions: number;

  @ApiProperty({
    description: 'Number of successfully categorized transactions',
    example: 23
  })
  successfulCategorizations: number;

  @ApiProperty({
    description: 'Number of failed categorizations',
    example: 2
  })
  failedCategorizations: number;

  @ApiProperty({
    description: 'Total processing time in milliseconds',
    example: 1250
  })
  processingTimeMs: number;

  @ApiProperty({
    description: 'Average processing time per transaction in milliseconds',
    example: 50
  })
  averageTimePerTransaction: number;
}

export class BatchCategorizationResponseDto {
  @ApiProperty({
    description: 'Array of categorized transactions',
    type: [CategorizedTransactionDto]
  })
  results: CategorizedTransactionDto[];

  @ApiProperty({
    description: 'Batch processing metadata',
    type: BatchCategorizationMetadataDto
  })
  metadata: BatchCategorizationMetadataDto;
}

// User feedback DTO
export class UserCategoryFeedbackDto {
  @ApiProperty({
    description: 'ID of the transaction being corrected',
    example: 'txn_12345'
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'The corrected category',
    example: 'Dining Out'
  })
  @IsString()
  correctedCategory: string;

  @ApiProperty({
    description: 'Merchant pattern to cache for future categorizations',
    example: 'starbucks coffee'
  })
  @IsString()
  merchantPattern: string;

  @ApiPropertyOptional({
    description: 'Optional reason for the correction',
    example: 'This is actually a coffee shop, not groceries'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'User confidence in the correction (1-10)',
    example: 9,
    minimum: 1,
    maximum: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  userConfidence?: number;
}

// Category validation DTO
export class CategoryValidationDto {
  @ApiProperty({
    description: 'Category name to validate',
    example: 'Dining Out'
  })
  @IsString()
  category: string;
}

// Statistics DTOs
export class CategoryStatsDto {
  @ApiProperty({
    description: 'Time period for the statistics',
    example: 'day',
    enum: ['hour', 'day', 'week', 'month']
  })
  period: string;

  @ApiProperty({
    description: 'Total number of categorizations performed',
    example: 1250
  })
  totalCategorizations: number;

  @ApiProperty({
    description: 'Cache hit rate as a decimal (0.0 to 1.0)',
    example: 0.35,
    minimum: 0,
    maximum: 1
  })
  cacheHitRate: number;

  @ApiProperty({
    description: 'Average processing time per transaction in milliseconds',
    example: 45
  })
  averageProcessingTimeMs: number;

  @ApiProperty({
    description: 'Distribution of transactions by category',
    example: { 'Dining Out': 25, 'Groceries': 30, 'Transportation': 15 }
  })
  categoryDistribution: Record<string, number>;

  @ApiProperty({
    description: 'Error rate as a decimal (0.0 to 1.0)',
    example: 0.02,
    minimum: 0,
    maximum: 1
  })
  errorRate: number;

  @ApiProperty({
    description: 'Number of AI API calls made',
    example: 850
  })
  aiApiCallsCount: number;

  @ApiProperty({
    description: 'Number of rule-based matches',
    example: 400
  })
  ruleBasedMatchesCount: number;

  @ApiProperty({
    description: 'Timestamp when stats were generated',
    example: '2024-06-04T10:30:00.000Z'
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Cost breakdown for AI API usage',
    example: {
      totalCost: 0.0245,
      averageCostPerTransaction: 0.0000196,
      totalTokens: 12500
    }
  })
  @IsOptional()
  costBreakdown?: {
    totalCost: number;
    averageCostPerTransaction: number;
    totalTokens: number;
  };

  @ApiPropertyOptional({
    description: 'Throughput in transactions per second',
    example: 16.7
  })
  @IsOptional()
  throughput?: number;

  @ApiPropertyOptional({
    description: 'Performance optimization recommendations',
    example: ['Consider increasing cache TTL to improve hit rate', 'Batch size could be optimized for better throughput']
  })
  @IsOptional()
  recommendations?: string[];
}

// Health check DTOs
export class CategorizationHealthComponentDto {
  @ApiProperty({
    description: 'Component health status',
    example: 'healthy',
    enum: ['healthy', 'unhealthy', 'unknown']
  })
  status: 'healthy' | 'unhealthy' | 'unknown';

  @ApiPropertyOptional({
    description: 'Optional additional information about the component',
    example: 'Redis connection pool: 5/10 connections active'
  })
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({
    description: 'Last check timestamp',
    example: '2024-06-04T10:30:00.000Z'
  })
  @IsOptional()
  lastChecked?: string;
}

export class CategorizationHealthDto {
  @ApiProperty({
    description: 'Overall service health status',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy']
  })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({
    description: 'Timestamp when health check was performed',
    example: '2024-06-04T10:30:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Health status of individual components',
    example: {
      redis: 'healthy',
      ruleEngine: 'healthy',
      aiService: 'unknown'
    }
  })
  components: Record<string, string>;

  @ApiProperty({
    description: 'Service version',
    example: '1.0.0'
  })
  version: string;

  @ApiPropertyOptional({
    description: 'Error message if service is unhealthy',
    example: 'Redis connection failed'
  })
  @IsOptional()
  error?: string;
}

// Performance monitoring DTOs
export class PerformanceMetricsDto {
  @ApiProperty({
    description: 'Response time percentiles in milliseconds',
    example: { p50: 45, p95: 120, p99: 250 }
  })
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };

  @ApiProperty({
    description: 'Throughput metrics',
    example: { requestsPerSecond: 15.5, transactionsPerMinute: 850 }
  })
  throughput: {
    requestsPerSecond: number;
    transactionsPerMinute: number;
  };

  @ApiProperty({
    description: 'Resource utilization metrics',
    example: { cpuUsagePercent: 25.5, memoryUsageMB: 128 }
  })
  resourceUtilization: {
    cpuUsagePercent: number;
    memoryUsageMB: number;
  };
}

// Cache statistics DTO
export class CacheStatisticsDto {
  @ApiProperty({
    description: 'Cache hit rate as a decimal',
    example: 0.35
  })
  hitRate: number;

  @ApiProperty({
    description: 'Total number of cached keys',
    example: 1250
  })
  totalKeys: number;

  @ApiProperty({
    description: 'Memory usage of the cache',
    example: '2.5MB'
  })
  memoryUsage: string;

  @ApiProperty({
    description: 'Timestamp of last cache cleanup',
    example: '2024-06-04T08:00:00.000Z'
  })
  lastCleanup: string;

  @ApiPropertyOptional({
    description: 'Cache eviction statistics',
    example: { evictionsLast24h: 45, oldestKeyAge: '7d' }
  })
  @IsOptional()
  evictionStats?: {
    evictionsLast24h: number;
    oldestKeyAge: string;
  };
}

// Feedback DTOs
export class UserFeedbackDto {
  @ApiProperty({ description: 'User ID providing the feedback' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Transaction ID being corrected' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Corrected category ID' })
  @IsString()
  @IsNotEmpty()
  correctedCategoryId: string;

  @ApiProperty({ 
    description: 'Type of feedback', 
    enum: ['category_correction', 'merchant_correction', 'validation'],
    required: false 
  })
  @IsOptional()
  @IsString()
  feedbackType?: string;

  @ApiProperty({ 
    description: 'User confidence in their correction (1-5)', 
    minimum: 1, 
    maximum: 5,
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  confidenceRating?: number;

  @ApiProperty({ description: 'Optional notes about the correction', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ 
    description: 'Source of the feedback', 
    enum: ['manual', 'suggestion_accepted', 'suggestion_rejected'],
    required: false 
  })
  @IsOptional()
  @IsString()
  source?: string;
}

export class BulkFeedbackDto {
  @ApiProperty({ description: 'Array of user feedback items', type: [UserFeedbackDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserFeedbackDto)
  feedbacks: UserFeedbackDto[];
}

export class FeedbackHistoryDto {
  @ApiProperty({ description: 'Feedback record ID' })
  id: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Transaction description' })
  transactionDescription: string;

  @ApiProperty({ description: 'Transaction amount' })
  transactionAmount: number;

  @ApiProperty({ description: 'Transaction date' })
  transactionDate: Date;

  @ApiProperty({ description: 'Original category before correction', required: false })
  originalCategory?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Corrected category' })
  correctedCategory: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Type of feedback' })
  feedbackType: string;

  @ApiProperty({ description: 'User confidence rating', required: false })
  confidenceRating?: number;

  @ApiProperty({ description: 'User notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Feedback source' })
  source: string;

  @ApiProperty({ description: 'When feedback was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Whether feedback has been processed for learning' })
  isProcessed: boolean;
}

export class FeedbackAnalyticsDto {
  @ApiProperty({ description: 'Analysis period type' })
  period: 'weekly' | 'monthly' | 'quarterly';

  @ApiProperty({ description: 'Start date of analysis period' })
  startDate: Date;

  @ApiProperty({ description: 'End date of analysis period' })
  endDate: Date;

  @ApiProperty({ description: 'Total number of corrections in period' })
  totalCorrections: number;

  @ApiProperty({ description: 'Average user confidence rating' })
  averageConfidence: number;

  @ApiProperty({ description: 'Breakdown of corrections by type' })
  correctionsByType: Record<string, number>;

  @ApiProperty({ description: 'Breakdown of corrections by source' })
  correctionsBySource: Record<string, number>;

  @ApiProperty({ description: 'Top 5 most corrected categories' })
  topCorrectedCategories: Array<{
    categoryId: string;
    categoryName: string;
    correctionCount: number;
  }>;
}

export class FeedbackStatsDto {
  @ApiProperty({ description: 'Total feedback records' })
  totalFeedback: number;

  @ApiProperty({ description: 'Feedback received in last 24 hours' })
  feedbackLast24h: number;

  @ApiProperty({ description: 'Feedback received in last 7 days' })
  feedbackLast7days: number;

  @ApiProperty({ description: 'Average confidence rating across all feedback' })
  averageConfidence: number;

  @ApiProperty({ description: 'Processing statistics' })
  processingStats: {
    processed: number;
    pending: number;
  };
}

export class BulkFeedbackResponseDto {
  @ApiProperty({ description: 'Number of feedback items processed successfully' })
  processed: number;

  @ApiProperty({ description: 'Number of feedback items that failed to process' })
  failed: number;
}

// Monitoring and Alerting DTOs
export class AlertDto {
  @ApiProperty({ description: 'Unique alert identifier' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ 
    description: 'Type of alert', 
    enum: ['accuracy', 'cost', 'error_rate', 'latency', 'throughput'] 
  })
  @IsString()
  @IsNotEmpty()
  type: 'accuracy' | 'cost' | 'error_rate' | 'latency' | 'throughput';

  @ApiProperty({ 
    description: 'Alert severity level', 
    enum: ['low', 'medium', 'high', 'critical'] 
  })
  @IsString()
  @IsNotEmpty()
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Alert message describing the issue' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Current metric value that triggered the alert' })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ description: 'Threshold value that was exceeded' })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Timestamp when alert was created' })
  @IsDateString()
  timestamp: Date;

  @ApiProperty({ description: 'Whether the alert has been resolved' })
  @IsBoolean()
  resolved: boolean;

  @ApiProperty({ description: 'Timestamp when alert was resolved', required: false })
  @IsOptional()
  @IsDateString()
  resolvedAt?: Date;
}

export class AlertThresholdsDto {
  @ApiProperty({ description: 'Accuracy threshold percentage (default: 85)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracyThreshold: number;

  @ApiProperty({ description: 'Cost per statement threshold in dollars (default: 0.10)' })
  @IsNumber()
  @Min(0)
  costPerStatementThreshold: number;

  @ApiProperty({ description: 'Error rate threshold percentage (default: 1)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  errorRateThreshold: number;

  @ApiProperty({ description: 'Latency threshold in milliseconds (default: 500)' })
  @IsNumber()
  @Min(0)
  latencyThreshold: number;

  @ApiProperty({ description: 'Throughput threshold per minute (default: 1000)' })
  @IsNumber()
  @Min(0)
  throughputThreshold: number;
}

export class SystemHealthDto {
  @ApiProperty({ description: 'Redis service health status' })
  @IsBoolean()
  redis: boolean;

  @ApiProperty({ description: 'Database service health status' })
  @IsBoolean()
  database: boolean;

  @ApiProperty({ description: 'AI service health status' })
  @IsBoolean()
  aiService: boolean;

  @ApiProperty({ 
    description: 'Overall system health status', 
    enum: ['healthy', 'degraded', 'unhealthy'] 
  })
  @IsString()
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export class PerformanceTrendsDto {
  @ApiProperty({ description: 'Accuracy trend data points', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  accuracy: number[];

  @ApiProperty({ description: 'Cost trend data points', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  cost: number[];

  @ApiProperty({ description: 'Latency trend data points', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  latency: number[];

  @ApiProperty({ description: 'Throughput trend data points', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  throughput: number[];

  @ApiProperty({ description: 'Timestamps for trend data points', type: [Date] })
  @IsArray()
  @IsDateString({}, { each: true })
  timestamps: Date[];
}

export class CurrentMetricsDto {
  @ApiProperty({ description: 'Current categorization accuracy percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy: number;

  @ApiProperty({ description: 'Current cost per statement in dollars' })
  @IsNumber()
  @Min(0)
  costPerStatement: number;

  @ApiProperty({ description: 'Current error rate percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  errorRate: number;

  @ApiProperty({ description: 'Current average latency in milliseconds' })
  @IsNumber()
  @Min(0)
  averageLatency: number;

  @ApiProperty({ description: 'Current throughput per minute' })
  @IsNumber()
  @Min(0)
  throughput: number;

  @ApiProperty({ description: 'Timestamp of metrics collection' })
  @IsDateString()
  timestamp: Date;
}

export class MonitoringDashboardDto {
  @ApiProperty({ description: 'Current performance metrics', type: CurrentMetricsDto })
  @ValidateNested()
  @Type(() => CurrentMetricsDto)
  currentMetrics: CurrentMetricsDto;

  @ApiProperty({ description: 'Active alerts', type: [AlertDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlertDto)
  activeAlerts: AlertDto[];

  @ApiProperty({ description: 'System health status', type: SystemHealthDto })
  @ValidateNested()
  @Type(() => SystemHealthDto)
  systemHealth: SystemHealthDto;

  @ApiProperty({ description: 'Performance trends', type: PerformanceTrendsDto })
  @ValidateNested()
  @Type(() => PerformanceTrendsDto)
  performanceTrends: PerformanceTrendsDto;

  @ApiProperty({ description: 'System recommendations', type: [String] })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];
}

export class ActiveAlertsResponseDto {
  @ApiProperty({ description: 'List of active alerts', type: [AlertDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlertDto)
  alerts: AlertDto[];

  @ApiProperty({ description: 'Total number of active alerts' })
  @IsNumber()
  count: number;

  @ApiProperty({ description: 'Number of critical alerts' })
  @IsNumber()
  criticalCount: number;

  @ApiProperty({ description: 'Number of high severity alerts' })
  @IsNumber()
  highCount: number;
} 