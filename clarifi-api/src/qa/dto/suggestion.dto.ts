import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';

export enum SuggestionReason {
  POPULAR = 'popular',
  RELATED = 'related',
  CATEGORY_FOLLOW_UP = 'category_follow_up',
  PERSONALIZED = 'personalized',
  SEASONAL = 'seasonal'
}

export class SuggestedQuestionDto {
  @ApiProperty({ description: 'Unique identifier for the suggestion' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The suggested question text' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Category of the question' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Priority score (0-1)', minimum: 0, maximum: 1 })
  @IsNumber()
  priority: number;

  @ApiProperty({ enum: SuggestionReason, description: 'Reason for suggestion' })
  @IsEnum(SuggestionReason)
  reason: SuggestionReason;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: {
    relatedFaqId?: string;
    seasonalWeight?: number;
    popularityScore?: number;
  };
}

export class GetSuggestionsRequestDto {
  @ApiProperty({ description: 'Current conversation category', required: false })
  @IsOptional()
  @IsString()
  currentCategory?: string;

  @ApiProperty({ description: 'Last answer provided', required: false })
  @IsOptional()
  @IsString()
  lastAnswer?: string;

  @ApiProperty({ description: 'Maximum number of suggestions to return', default: 6 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ description: 'User context for personalization', required: false })
  @IsOptional()
  @IsString()
  userContext?: string;
}

export class TrackSuggestionClickDto {
  @ApiProperty({ description: 'ID of the clicked suggestion' })
  @IsString()
  suggestionId: string;

  @ApiProperty({ description: 'The question text that was clicked' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Category of the question' })
  @IsString()
  category: string;

  @ApiProperty({ enum: SuggestionReason, description: 'Reason for the suggestion' })
  @IsEnum(SuggestionReason)
  reason: SuggestionReason;

  @ApiProperty({ description: 'Whether the suggestion led to a successful answer', required: false })
  @IsOptional()
  @IsBoolean()
  successfulAnswer?: boolean;

  @ApiProperty({ description: 'User satisfaction with the suggestion (1-5)', required: false })
  @IsOptional()
  @IsNumber()
  userRating?: number;
}

export class SuggestionMetricsDto {
  @ApiProperty({ description: 'Total number of suggestions shown' })
  @IsNumber()
  totalSuggestions: number;

  @ApiProperty({ description: 'Total number of clicks on suggestions' })
  @IsNumber()
  totalClicks: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  @IsNumber()
  clickThroughRate: number;

  @ApiProperty({ description: 'Popular questions with click counts' })
  @IsArray()
  popularQuestions: Array<{ question: string; clicks: number; category: string }>;

  @ApiProperty({ description: 'Performance by category' })
  @IsArray()
  categoryPerformance: Array<{ 
    category: string; 
    ctr: number; 
    totalShown: number; 
    totalClicks: number;
  }>;

  @ApiProperty({ description: 'Performance by reason type' })
  @IsArray()
  reasonPerformance: Array<{
    reason: SuggestionReason;
    ctr: number;
    totalShown: number;
    totalClicks: number;
  }>;

  @ApiProperty({ description: 'Timestamp of last update' })
  @IsNumber()
  lastUpdated: number;
}

export class GetSuggestionsResponseDto {
  @ApiProperty({ description: 'Success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [SuggestedQuestionDto], description: 'Array of suggested questions' })
  @IsArray()
  suggestions: SuggestedQuestionDto[];

  @ApiProperty({ description: 'Context used for suggestions', required: false })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({ description: 'Error message if request failed', required: false })
  @IsOptional()
  @IsString()
  error?: string;
}

export class TrackSuggestionResponseDto {
  @ApiProperty({ description: 'Success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Message about the tracking result' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Updated metrics after tracking', required: false })
  @IsOptional()
  metrics?: Partial<SuggestionMetricsDto>;

  @ApiProperty({ description: 'Error message if tracking failed', required: false })
  @IsOptional()
  @IsString()
  error?: string;
} 