import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsNumber, Min, Max } from 'class-validator';

export class QueryRequestDto {
  @ApiProperty({
    description: 'The financial question to ask',
    example: 'What is a good credit utilization ratio in Canada?',
    minLength: 5,
    maxLength: 500
  })
  @IsString()
  @MinLength(5, { message: 'Question must be at least 5 characters long' })
  @MaxLength(500, { message: 'Question must be less than 500 characters' })
  query: string;

  @ApiPropertyOptional({
    description: 'Additional context for the question',
    example: 'I have 3 credit cards and want to improve my credit score',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Context must be less than 200 characters' })
  context?: string;

  @ApiPropertyOptional({
    description: 'Maximum tokens for the response (for premium users)',
    example: 150,
    minimum: 50,
    maximum: 300
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  maxTokens?: number;
}

export class TokenUsageDto {
  @ApiProperty({ description: 'Input tokens used', example: 45 })
  input: number;

  @ApiProperty({ description: 'Output tokens generated', example: 78 })
  output: number;

  @ApiProperty({ description: 'Total tokens used', example: 123 })
  total: number;
}

export class QueryResponseDto {
  @ApiProperty({
    description: 'The AI-generated answer to the financial question',
    example: 'A good credit utilization ratio in Canada is generally below 30% of your available credit limit. For excellent credit scores, aim for under 10%. This applies to both individual cards and your overall credit utilization across all cards.'
  })
  answer: string;

  @ApiProperty({
    description: 'Whether the response came from cache',
    example: false
  })
  fromCache: boolean;

  @ApiProperty({
    description: 'The AI model used to generate the response',
    example: 'gpt-3.5-turbo'
  })
  model: string;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 1247
  })
  responseTime: number;

  @ApiProperty({
    description: 'Confidence score for the response (0-1)',
    example: 0.87
  })
  confidence: number;

  @ApiProperty({
    description: 'Source of the response',
    example: 'llm',
    enum: ['cache', 'llm']
  })
  source: 'cache' | 'llm';

  @ApiProperty({
    description: 'Cost of generating this response in USD',
    example: 0.0023
  })
  cost: number;

  @ApiPropertyOptional({
    description: 'Remaining queries for this user in the current period',
    example: 4
  })
  remainingQueries?: number;

  @ApiPropertyOptional({
    description: 'Token usage details',
    type: TokenUsageDto
  })
  usage?: {
    tokens: TokenUsageDto;
  };
}

export class CacheMetricsDto {
  @ApiProperty({ description: 'Cache hits', example: 157 })
  hits: number;

  @ApiProperty({ description: 'Cache misses', example: 12 })
  misses: number;

  @ApiProperty({ description: 'Cache hit rate (0-1)', example: 0.929 })
  hitRate: number;

  @ApiProperty({ description: 'Cost savings from cache in USD', example: 0.45 })
  costSavings: number;
}

export class ServiceHealthDto {
  @ApiProperty({
    description: 'Q&A service health information'
  })
  qa: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    configured: boolean;
    model: string;
    maxTokens: number;
  };

  @ApiProperty({
    description: 'Cache service health information'
  })
  cache: {
    status: string;
    redis: boolean;
    metrics: any;
  };

  @ApiProperty({
    description: 'Cost and performance metrics'
  })
  costs: {
    faqHitRate: number;
    llmHitRate: number;
    totalCostSavings: number;
  };

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2025-06-05T16:30:00.000Z'
  })
  timestamp: string;
}

export class MetricsResponseDto {
  @ApiProperty({
    description: 'FAQ cache performance metrics',
    type: CacheMetricsDto
  })
  faqCache: CacheMetricsDto;

  @ApiProperty({
    description: 'LLM cache performance metrics',
    type: CacheMetricsDto
  })
  llmCache: CacheMetricsDto;

  @ApiProperty({
    description: 'Total cost savings across all caching',
    example: 2.45
  })
  totalCostSavings: number;

  @ApiProperty({
    description: 'Summary analytics'
  })
  summary: {
    overallHitRate: number;
    projectedMonthlySavings: number;
    costEfficiencyRating: string;
  };

  @ApiProperty({
    description: 'Timestamp of metrics calculation',
    example: '2025-06-05T16:30:00.000Z'
  })
  timestamp: string;
}

export class FAQCategoryDto {
  @ApiProperty({ description: 'Category ID', example: 'credit-scores' })
  id: string;

  @ApiProperty({ description: 'Category title', example: 'Credit Scores' })
  title: string;

  @ApiProperty({ description: 'Category icon', example: 'credit-card' })
  icon: string;

  @ApiProperty({ 
    description: 'Category description', 
    example: 'Learn about credit scores, utilization, and improvement strategies' 
  })
  description: string;

  @ApiProperty({ description: 'Number of questions in category', example: 15 })
  questionCount: number;
}

export class CategoriesResponseDto {
  @ApiProperty({
    description: 'List of FAQ categories',
    type: [FAQCategoryDto]
  })
  categories: FAQCategoryDto[];

  @ApiProperty({
    description: 'Timestamp of response',
    example: '2025-06-05T16:30:00.000Z'
  })
  timestamp: string;
}

export class ClearCacheRequestDto {
  @ApiPropertyOptional({
    description: 'Cache pattern to clear (admin use)',
    example: 'qa:faq:*',
    default: 'qa:*'
  })
  @IsOptional()
  @IsString()
  pattern?: string;
}

export class ClearCacheResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({ 
    description: 'Operation message', 
    example: 'Cache cleared with pattern: qa:*' 
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp of operation',
    example: '2025-06-05T16:30:00.000Z'
  })
  timestamp: string;
} 