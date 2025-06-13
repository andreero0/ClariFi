import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { TextParserService } from '../services/text-parser.service';
import { BankStatementParserService } from '../services/bank-statement-parser.service';
import {
  TextParsingRequestDto,
  BankStatementParsingRequestDto,
  ReceiptParsingRequestDto,
  TextParsingResultDto
} from '../dto/text-parsing.dto';

@ApiTags('Text Parsing')
@Controller('ocr/text-parsing')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TextParsingController {
  private readonly logger = new Logger(TextParsingController.name);

  constructor(
    private readonly textParser: TextParserService,
    private readonly bankStatementParser: BankStatementParserService
  ) {}

  @Post('parse-general')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Parse general financial document text',
    description: 'Extract structured financial data from raw OCR text using general parsing algorithms'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Text successfully parsed',
    type: TextParsingResultDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Parsing failed'
  })
  async parseGeneralText(@Body() request: TextParsingRequestDto): Promise<TextParsingResultDto> {
    this.logger.log('Processing general text parsing request');
    
    try {
      const result = await this.textParser.parseText(request);
      
      this.logger.log(`General parsing completed: ${result.transactions.length} transactions, confidence: ${result.overallConfidence}`);
      return result;
      
    } catch (error) {
      this.logger.error('General text parsing failed', error.stack);
      throw error;
    }
  }

  @Post('parse-bank-statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Parse bank statement text with enhanced algorithms',
    description: 'Extract bank transactions and account information using bank-specific parsing patterns'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bank statement successfully parsed',
    type: TextParsingResultDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid bank statement data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Bank statement parsing failed'
  })
  async parseBankStatement(@Body() request: BankStatementParsingRequestDto): Promise<TextParsingResultDto> {
    this.logger.log(`Processing bank statement parsing request for ${request.bankName || 'auto-detected bank'}`);
    
    try {
      const result = await this.bankStatementParser.parseBankStatement(request);
      
      this.logger.log(`Bank statement parsing completed: ${result.transactions.length} transactions from ${request.bankName || 'detected bank'}`);
      return result;
      
    } catch (error) {
      this.logger.error('Bank statement parsing failed', error.stack);
      throw error;
    }
  }

  @Post('parse-receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Parse receipt text with receipt-specific algorithms',
    description: 'Extract receipt information including items, totals, and merchant details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Receipt successfully parsed',
    type: TextParsingResultDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid receipt data'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Receipt parsing failed'
  })
  async parseReceipt(@Body() request: ReceiptParsingRequestDto): Promise<TextParsingResultDto> {
    this.logger.log(`Processing receipt parsing request for ${request.merchantName || 'unknown merchant'}`);
    
    try {
      // Use general text parser with receipt-specific enhancements
      const baseRequest: TextParsingRequestDto = {
        rawText: request.rawText,
        expectedDocumentType: 'receipt' as any,
        languageHint: request.languageHint,
        includeRawText: request.includeRawText,
        strictMode: request.strictMode
      };
      
      const result = await this.textParser.parseText(baseRequest);
      
      // Apply receipt-specific enhancements
      const enhancedResult = this.enhanceReceiptParsing(result, request);
      
      this.logger.log(`Receipt parsing completed: ${enhancedResult.transactions.length} items from ${request.merchantName || 'detected merchant'}`);
      return enhancedResult;
      
    } catch (error) {
      this.logger.error('Receipt parsing failed', error.stack);
      throw error;
    }
  }

  @Post('validate-extraction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate extracted financial data',
    description: 'Perform validation checks on parsed financial data for accuracy and completeness'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Validation completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        issues: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              message: { type: 'string' },
              field: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async validateExtraction(@Body() result: TextParsingResultDto): Promise<{
    isValid: boolean;
    validationScore: number;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      field?: string;
    }>;
    recommendations: string[];
  }> {
    this.logger.log('Validating extracted financial data');
    
    try {
      const validation = this.performValidation(result);
      
      this.logger.log(`Validation completed: ${validation.isValid ? 'VALID' : 'INVALID'} (score: ${validation.validationScore})`);
      return validation;
      
    } catch (error) {
      this.logger.error('Validation failed', error.stack);
      throw error;
    }
  }

  private enhanceReceiptParsing(
    result: TextParsingResultDto, 
    request: ReceiptParsingRequestDto
  ): TextParsingResultDto {
    // Apply receipt-specific enhancements
    const enhanced = { ...result };

    // If merchant name provided, update account info
    if (request.merchantName) {
      enhanced.accountInfo = {
        ...enhanced.accountInfo,
        institutionName: request.merchantName
      };
    }

    // Validate against expected total if provided
    if (request.expectedTotal && enhanced.totalDebits) {
      const difference = Math.abs(enhanced.totalDebits.amount - request.expectedTotal);
      const tolerance = request.expectedTotal * 0.05; // 5% tolerance
      
      if (difference > tolerance) {
        enhanced.warnings.push(
          `Extracted total (${enhanced.totalDebits.amount}) differs significantly from expected (${request.expectedTotal})`
        );
      }
    }

    // Enhance transaction categorization for receipts
    enhanced.transactions = enhanced.transactions.map(transaction => {
      if (!transaction.suggestedCategory) {
        transaction.suggestedCategory = this.categorizeReceiptTransaction(
          transaction.description, 
          request.merchantName
        );
      }
      return transaction;
    });

    return enhanced;
  }

  private categorizeReceiptTransaction(description: string, merchantName?: string): string {
    const lowerDesc = description.toLowerCase();
    const lowerMerchant = merchantName?.toLowerCase() || '';

    // Merchant-based categorization
    if (lowerMerchant.includes('grocery') || lowerMerchant.includes('supermarket')) {
      return 'Groceries';
    }
    if (lowerMerchant.includes('gas') || lowerMerchant.includes('petro')) {
      return 'Gas/Transportation';
    }
    if (lowerMerchant.includes('restaurant') || lowerMerchant.includes('coffee')) {
      return 'Restaurants';
    }

    // Description-based categorization
    if (lowerDesc.includes('food') || lowerDesc.includes('grocery')) {
      return 'Groceries';
    }
    if (lowerDesc.includes('gas') || lowerDesc.includes('fuel')) {
      return 'Gas/Transportation';
    }
    if (lowerDesc.includes('coffee') || lowerDesc.includes('meal')) {
      return 'Restaurants';
    }

    return 'Shopping'; // Default category
  }

  private performValidation(result: TextParsingResultDto): {
    isValid: boolean;
    validationScore: number;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      field?: string;
    }>;
    recommendations: string[];
  } {
    const issues: any[] = [];
    const recommendations: string[] = [];
    let validationScore = 100;

    // Check for missing transactions
    if (result.transactions.length === 0) {
      issues.push({
        type: 'missing_data',
        severity: 'high',
        message: 'No transactions found in document',
        field: 'transactions'
      });
      validationScore -= 40;
    }

    // Check transaction confidence levels
    const lowConfidenceTransactions = result.transactions.filter(t => t.confidence < 60);
    if (lowConfidenceTransactions.length > 0) {
      issues.push({
        type: 'low_confidence',
        severity: 'medium',
        message: `${lowConfidenceTransactions.length} transactions have low confidence scores`,
        field: 'transactions'
      });
      validationScore -= lowConfidenceTransactions.length * 5;
    }

    // Check for missing dates
    const transactionsWithoutDates = result.transactions.filter(t => !t.date || t.date.confidence === 0);
    if (transactionsWithoutDates.length > 0) {
      issues.push({
        type: 'missing_dates',
        severity: 'medium',
        message: `${transactionsWithoutDates.length} transactions missing valid dates`,
        field: 'transactions'
      });
      validationScore -= transactionsWithoutDates.length * 3;
    }

    // Check balance consistency (if balances available)
    if (result.openingBalance && result.closingBalance && result.transactions.length > 0) {
      const calculatedBalance = this.calculateExpectedBalance(result);
      const difference = Math.abs(calculatedBalance - result.closingBalance.amount);
      const tolerance = result.closingBalance.amount * 0.01; // 1% tolerance

      if (difference > tolerance) {
        issues.push({
          type: 'balance_mismatch',
          severity: 'high',
          message: `Calculated balance (${calculatedBalance}) doesn't match closing balance (${result.closingBalance.amount})`,
          field: 'balances'
        });
        validationScore -= 20;
      }
    }

    // Generate recommendations
    if (issues.some(i => i.type === 'low_confidence')) {
      recommendations.push('Consider using higher quality source image for better OCR results');
    }
    if (issues.some(i => i.type === 'missing_dates')) {
      recommendations.push('Review document for date formatting inconsistencies');
    }
    if (result.overallConfidence === 'very_low' || result.overallConfidence === 'low') {
      recommendations.push('Manual review recommended due to low parsing confidence');
    }

    const isValid = validationScore >= 60 && !issues.some(i => i.severity === 'high');

    return {
      isValid,
      validationScore: Math.max(0, validationScore),
      issues,
      recommendations
    };
  }

  private calculateExpectedBalance(result: TextParsingResultDto): number {
    if (!result.openingBalance) return 0;

    let balance = result.openingBalance.amount;

    for (const transaction of result.transactions) {
      if (transaction.type === 'credit' || transaction.type === 'deposit') {
        balance += transaction.amount.amount;
      } else {
        balance -= transaction.amount.amount;
      }
    }

    return balance;
  }
} 