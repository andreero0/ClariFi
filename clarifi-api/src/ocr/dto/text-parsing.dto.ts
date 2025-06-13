import { IsString, IsNumber, IsDate, IsOptional, IsArray, IsEnum, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Enums for document types and confidence levels
export enum DocumentType {
  BANK_STATEMENT = 'bank_statement',
  CREDIT_CARD_STATEMENT = 'credit_card_statement',
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  FINANCIAL_SUMMARY = 'financial_summary',
  UNKNOWN = 'unknown'
}

export enum ConfidenceLevel {
  HIGH = 'high',        // 80-100%
  MEDIUM = 'medium',    // 60-79%
  LOW = 'low',          // 40-59%
  VERY_LOW = 'very_low' // 0-39%
}

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  FEE = 'fee',
  INTEREST = 'interest'
}

// Core data extraction classes
export class ExtractedAmountDto {
  @ApiProperty({ description: 'Raw amount text as found in document' })
  @IsString()
  rawText: string;

  @ApiProperty({ description: 'Parsed amount as number' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code (CAD, USD, etc.)' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Confidence score 0-100%', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @ApiProperty({ description: 'Position in original text' })
  @IsOptional()
  @IsNumber()
  position?: number;
}

export class ExtractedDateDto {
  @ApiProperty({ description: 'Raw date text as found in document' })
  @IsString()
  rawText: string;

  @ApiProperty({ description: 'Parsed date' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'Date format detected (MM/DD/YYYY, DD-MM-YYYY, etc.)' })
  @IsString()
  format: string;

  @ApiProperty({ description: 'Confidence score 0-100%', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;
}

export class ExtractedAccountInfoDto {
  @ApiProperty({ description: 'Account number (masked for security)' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ description: 'Bank or institution name' })
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiProperty({ description: 'Account type (checking, savings, credit, etc.)' })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiProperty({ description: 'Branch information' })
  @IsOptional()
  @IsString()
  branch?: string;
}

export class ExtractedTransactionDto {
  @ApiProperty({ description: 'Transaction date' })
  @ValidateNested()
  @Type(() => ExtractedDateDto)
  date: ExtractedDateDto;

  @ApiProperty({ description: 'Transaction description/memo' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Transaction amount' })
  @ValidateNested()
  @Type(() => ExtractedAmountDto)
  amount: ExtractedAmountDto;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Reference or confirmation number' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Merchant or payee name' })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiProperty({ description: 'Category suggested by parsing' })
  @IsOptional()
  @IsString()
  suggestedCategory?: string;

  @ApiProperty({ description: 'Running balance after transaction' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedAmountDto)
  runningBalance?: ExtractedAmountDto;

  @ApiProperty({ description: 'Overall confidence in transaction extraction', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;
}

export class ExtractedDocumentMetadataDto {
  @ApiProperty({ description: 'Document type detected', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Statement period start date' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedDateDto)
  periodStart?: ExtractedDateDto;

  @ApiProperty({ description: 'Statement period end date' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedDateDto)
  periodEnd?: ExtractedDateDto;

  @ApiProperty({ description: 'Document generation/issued date' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedDateDto)
  issuedDate?: ExtractedDateDto;

  @ApiProperty({ description: 'Number of pages processed' })
  @IsNumber()
  pageCount: number;

  @ApiProperty({ description: 'Language detected in document' })
  @IsString()
  language: string;

  @ApiProperty({ description: 'Overall document quality score', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore: number;
}

export class TextParsingResultDto {
  @ApiProperty({ description: 'Document metadata and classification' })
  @ValidateNested()
  @Type(() => ExtractedDocumentMetadataDto)
  metadata: ExtractedDocumentMetadataDto;

  @ApiProperty({ description: 'Account information extracted' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedAccountInfoDto)
  accountInfo?: ExtractedAccountInfoDto;

  @ApiProperty({ description: 'List of transactions found', type: [ExtractedTransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedTransactionDto)
  transactions: ExtractedTransactionDto[];

  @ApiProperty({ description: 'Opening balance for statement period' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedAmountDto)
  openingBalance?: ExtractedAmountDto;

  @ApiProperty({ description: 'Closing balance for statement period' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedAmountDto)
  closingBalance?: ExtractedAmountDto;

  @ApiProperty({ description: 'Total credits (deposits) in period' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedAmountDto)
  totalCredits?: ExtractedAmountDto;

  @ApiProperty({ description: 'Total debits (withdrawals) in period' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractedAmountDto)
  totalDebits?: ExtractedAmountDto;

  @ApiProperty({ description: 'Raw OCR text for debugging' })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiProperty({ description: 'Processing warnings and notes' })
  @IsArray()
  @IsString({ each: true })
  warnings: string[];

  @ApiProperty({ description: 'Overall parsing confidence level', enum: ConfidenceLevel })
  @IsEnum(ConfidenceLevel)
  overallConfidence: ConfidenceLevel;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  @IsNumber()
  processingTimeMs: number;
}

// Request DTOs
export class TextParsingRequestDto {
  @ApiProperty({ description: 'Raw OCR text to parse' })
  @IsString()
  rawText: string;

  @ApiProperty({ description: 'Expected document type (optional)', enum: DocumentType, required: false })
  @IsOptional()
  @IsEnum(DocumentType)
  expectedDocumentType?: DocumentType;

  @ApiProperty({ description: 'Language hint for parsing (en, fr, etc.)', required: false })
  @IsOptional()
  @IsString()
  languageHint?: string;

  @ApiProperty({ description: 'Include raw text in response for debugging', required: false })
  @IsOptional()
  @IsBoolean()
  includeRawText?: boolean;

  @ApiProperty({ description: 'Strict parsing mode (higher accuracy, may extract less)', required: false })
  @IsOptional()
  @IsBoolean()
  strictMode?: boolean;
}

export class BankStatementParsingRequestDto extends TextParsingRequestDto {
  @ApiProperty({ description: 'Bank name hint for better parsing', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Account type hint', required: false })
  @IsOptional()
  @IsString()
  accountType?: string;
}

export class ReceiptParsingRequestDto extends TextParsingRequestDto {
  @ApiProperty({ description: 'Merchant name hint', required: false })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiProperty({ description: 'Expected total amount hint for validation', required: false })
  @IsOptional()
  @IsNumber()
  expectedTotal?: number;
} 