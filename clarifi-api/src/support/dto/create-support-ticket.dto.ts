import { IsString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SupportSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SupportCategory {
  ACCOUNT_LOGIN = 'account-login',
  TRANSACTION_ISSUES = 'transaction-issues',
  CREDIT_CARD_MANAGEMENT = 'credit-card-management',
  PRIVACY_DATA = 'privacy-data',
  TECHNICAL_PROBLEMS = 'technical-problems',
  BILLING_SUBSCRIPTIONS = 'billing-subscriptions',
  FEATURE_REQUESTS = 'feature-requests',
  OTHER = 'other',
}

export class DeviceInfoDto {
  @ApiProperty({ description: 'Device platform (iOS/Android)' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ description: 'Device OS version' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ description: 'Device model' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'ClariFi app version' })
  @IsString()
  @IsNotEmpty()
  appVersion: string;
}

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Support ticket category', enum: SupportCategory })
  @IsEnum(SupportCategory)
  @IsNotEmpty()
  category: SupportCategory;

  @ApiProperty({ description: 'Ticket severity level', enum: SupportSeverity })
  @IsEnum(SupportSeverity)
  @IsNotEmpty()
  severity: SupportSeverity;

  @ApiProperty({ description: 'Ticket subject/title' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ description: 'Device information', type: DeviceInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @ApiProperty({ description: 'File attachment names', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentNames?: string[];
} 