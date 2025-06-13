import { Injectable, Logger } from '@nestjs/common';
import {
  TextParsingResultDto,
  ExtractedAmountDto,
  ExtractedDateDto,
  ExtractedTransactionDto,
  ExtractedDocumentMetadataDto,
  ExtractedAccountInfoDto,
  DocumentType,
  ConfidenceLevel,
  TransactionType,
  TextParsingRequestDto
} from '../dto/text-parsing.dto';

@Injectable()
export class TextParserService {
  private readonly logger = new Logger(TextParserService.name);

  constructor() {
    this.logger.log('TextParserService initialized');
  }

  // Regex patterns for various data extraction
  private readonly patterns = {
    // Amount patterns - handle multiple currencies and formats
    amount: [
      /(?:CAD|USD|\$|C\$)\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/gi,
      /([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)\s*(?:CAD|USD|\$|C\$)/gi,
      /([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/g
    ],
    
    // Date patterns - various formats common in financial documents
    date: [
      // MM/DD/YYYY, MM-DD-YYYY
      /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](20\d{2})\b/g,
      // DD/MM/YYYY, DD-MM-YYYY
      /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2})\b/g,
      // YYYY-MM-DD
      /\b(20\d{2})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/g,
      // Month DD, YYYY
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),\s*(20\d{2})\b/gi,
      // DD Month YYYY
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})\b/gi
    ],
    
    // Account number patterns
    accountNumber: [
      /(?:Account|Acc|A\/C)[#\s]*:?\s*([0-9]{3,16})/gi,
      /([0-9]{3,4}[-\s]*[0-9]{3,4}[-\s]*[0-9]{3,8})/g
    ],
    
    // Transaction reference patterns
    reference: [
      /(?:Ref|Reference|Trans|Transaction)[#\s]*:?\s*([A-Z0-9]{6,20})/gi,
      /([A-Z0-9]{8,16})/g
    ],
    
    // Bank/Institution patterns
    institution: [
      /(?:Royal Bank|RBC|TD Bank|Scotia|Scotiabank|BMO|CIBC|Credit Union)/gi,
      /(?:Visa|MasterCard|American Express|Amex)/gi
    ]
  };

  // Month name mappings
  private readonly monthMap = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };

  async parseText(request: TextParsingRequestDto): Promise<TextParsingResultDto> {
    const startTime = Date.now();
    this.logger.log('Starting text parsing process');

    try {
      // Clean and normalize the input text
      const cleanedText = this.cleanText(request.rawText);
      
      // Detect document type
      const documentType = request.expectedDocumentType || this.detectDocumentType(cleanedText);
      
      // Extract metadata
      const metadata = this.extractDocumentMetadata(cleanedText, documentType);
      
      // Extract account information
      const accountInfo = this.extractAccountInfo(cleanedText);
      
      // Extract transactions
      const transactions = this.extractTransactions(cleanedText, request.strictMode);
      
      // Extract balances
      const balances = this.extractBalances(cleanedText);
      
      // Calculate confidence and generate warnings
      const { overallConfidence, warnings } = this.assessQuality(cleanedText, transactions, metadata);
      
      const result: TextParsingResultDto = {
        metadata,
        accountInfo,
        transactions,
        openingBalance: balances.opening,
        closingBalance: balances.closing,
        totalCredits: balances.totalCredits,
        totalDebits: balances.totalDebits,
        rawText: request.includeRawText ? request.rawText : undefined,
        warnings,
        overallConfidence,
        processingTimeMs: Date.now() - startTime
      };

      this.logger.log(`Text parsing completed in ${result.processingTimeMs}ms with ${transactions.length} transactions`);
      return result;

    } catch (error) {
      this.logger.error('Error during text parsing', error.stack);
      throw new Error(`Text parsing failed: ${error.message}`);
    }
  }

  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove special characters that might interfere
      .replace(/[^\w\s\.\,\-\$\(\)\[\]\/\\:;@]/g, ' ')
      .trim();
  }

  private detectDocumentType(text: string): DocumentType {
    const lowerText = text.toLowerCase();
    
    // Check for bank statement indicators
    if (lowerText.includes('bank statement') || 
        lowerText.includes('account statement') ||
        lowerText.includes('checking account') ||
        lowerText.includes('savings account')) {
      return DocumentType.BANK_STATEMENT;
    }
    
    // Check for credit card statement indicators
    if (lowerText.includes('credit card') ||
        lowerText.includes('visa') ||
        lowerText.includes('mastercard') ||
        lowerText.includes('statement of account')) {
      return DocumentType.CREDIT_CARD_STATEMENT;
    }
    
    // Check for receipt indicators
    if (lowerText.includes('receipt') ||
        lowerText.includes('total:') ||
        lowerText.includes('subtotal:') ||
        lowerText.includes('tax:')) {
      return DocumentType.RECEIPT;
    }
    
    // Check for invoice indicators
    if (lowerText.includes('invoice') ||
        lowerText.includes('bill to:') ||
        lowerText.includes('invoice number')) {
      return DocumentType.INVOICE;
    }
    
    return DocumentType.UNKNOWN;
  }

  private extractDocumentMetadata(text: string, documentType: DocumentType): ExtractedDocumentMetadataDto {
    // Detect language (basic implementation)
    const language = this.detectLanguage(text);
    
    // Extract dates from document
    const dates = this.extractDates(text);
    
    // Estimate quality based on text characteristics
    const qualityScore = this.calculateTextQuality(text);
    
    return {
      documentType,
      periodStart: dates.length > 0 ? dates[0] : undefined,
      periodEnd: dates.length > 1 ? dates[dates.length - 1] : undefined,
      issuedDate: dates.length > 0 ? dates[0] : undefined,
      pageCount: 1, // For now, assume single page
      language,
      qualityScore
    };
  }

  private detectLanguage(text: string): string {
    const frenchWords = ['banque', 'compte', 'solde', 'débit', 'crédit', 'transaction'];
    const englishWords = ['bank', 'account', 'balance', 'debit', 'credit', 'transaction'];
    
    const lowerText = text.toLowerCase();
    const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    
    return frenchCount > englishCount ? 'fr' : 'en';
  }

  private calculateTextQuality(text: string): number {
    let score = 100;
    
    // Penalize for too much noise
    const noiseRatio = (text.match(/[^a-zA-Z0-9\s\.\,\-\$]/g) || []).length / text.length;
    score -= noiseRatio * 50;
    
    // Penalize for very short text
    if (text.length < 100) score -= 30;
    
    // Penalize for excessive repeated characters
    const repeatedChars = text.match(/(.)\1{5,}/g);
    if (repeatedChars) score -= repeatedChars.length * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private extractAccountInfo(text: string): ExtractedAccountInfoDto {
    const accountInfo: ExtractedAccountInfoDto = {};
    
    // Extract account number
    for (const pattern of this.patterns.accountNumber) {
      const match = pattern.exec(text);
      if (match) {
        // Mask all but last 4 digits for security
        const accountNum = match[1].replace(/\D/g, '');
        accountInfo.accountNumber = accountNum.length > 4 
          ? '*'.repeat(accountNum.length - 4) + accountNum.slice(-4)
          : accountNum;
        break;
      }
    }
    
    // Extract institution name
    for (const pattern of this.patterns.institution) {
      const match = pattern.exec(text);
      if (match) {
        accountInfo.institutionName = match[0];
        break;
      }
    }
    
    return accountInfo;
  }

  private extractDates(text: string): ExtractedDateDto[] {
    const dates: ExtractedDateDto[] = [];
    
    for (const pattern of this.patterns.date) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extractedDate = this.parseDate(match[0], match);
        if (extractedDate) {
          dates.push(extractedDate);
        }
      }
    }
    
    // Sort dates chronologically
    return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private parseDate(rawText: string, match: RegExpExecArray): ExtractedDateDto | null {
    try {
      let date: Date | undefined;
      let format: string | undefined;
      
      // Determine format and parse accordingly
      if (match[0].includes('/') || match[0].includes('-')) {
        if (match[1] && match[2] && match[3]) {
          // Check if it's MM/DD/YYYY or DD/MM/YYYY format
          const num1 = parseInt(match[1]);
          const num2 = parseInt(match[2]);
          const year = parseInt(match[3]);
          
          if (num1 > 12) {
            // Must be DD/MM/YYYY
            date = new Date(year, num2 - 1, num1);
            format = 'DD/MM/YYYY';
          } else if (num2 > 12) {
            // Must be MM/DD/YYYY
            date = new Date(year, num1 - 1, num2);
            format = 'MM/DD/YYYY';
          } else {
            // Ambiguous - assume MM/DD/YYYY (North American default)
            date = new Date(year, num1 - 1, num2);
            format = 'MM/DD/YYYY';
          }
        }
      } else if (rawText.includes(',')) {
        // Month DD, YYYY format
        const monthName = match[1].toLowerCase();
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        const month = this.monthMap[monthName] || this.monthMap[monthName.slice(0, 3)];
        
        if (month) {
          date = new Date(year, month - 1, day);
          format = 'Month DD, YYYY';
        }
      }
      
      if (date && format && !isNaN(date.getTime())) {
        return {
          rawText,
          date,
          format,
          confidence: 85 // Base confidence for pattern matching
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to parse date: ${rawText}`);
    }
    
    return null;
  }

  private extractAmounts(text: string): ExtractedAmountDto[] {
    const amounts: ExtractedAmountDto[] = [];
    
    for (const pattern of this.patterns.amount) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const amountText = match[0];
        const numericPart = match[1] || match[0];
        
        // Clean up the numeric part
        const cleanAmount = numericPart.replace(/[^\d.-]/g, '');
        const amount = parseFloat(cleanAmount);
        
        if (!isNaN(amount) && amount > 0) {
          // Detect currency
          let currency = 'CAD'; // Default
          if (amountText.includes('USD')) currency = 'USD';
          else if (amountText.includes('$') && !amountText.includes('C$')) currency = 'USD';
          
          amounts.push({
            rawText: amountText,
            amount,
            currency,
            confidence: 80,
            position: match.index
          });
        }
      }
    }
    
    return amounts;
  }

  private extractTransactions(text: string, strictMode = false): ExtractedTransactionDto[] {
    const transactions: ExtractedTransactionDto[] = [];
    const lines = text.split('\n');
    
    // Look for transaction-like patterns in each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length < 10) continue; // Skip very short lines
      
      const transaction = this.parseTransactionLine(line, strictMode);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }

  private parseTransactionLine(line: string, strictMode: boolean): ExtractedTransactionDto | null {
    try {
      // Extract date from line
      const dates = this.extractDates(line);
      if (dates.length === 0 && strictMode) return null;
      
      // Extract amounts from line
      const amounts = this.extractAmounts(line);
      if (amounts.length === 0) return null;
      
      // Determine transaction type based on context
      const type = this.determineTransactionType(line);
      
      // Extract description (remove date and amount patterns)
      let description = line;
      dates.forEach(date => {
        description = description.replace(date.rawText, '').trim();
      });
      amounts.forEach(amount => {
        description = description.replace(amount.rawText, '').trim();
      });
      
      // Clean up description
      description = description.replace(/\s+/g, ' ').trim();
      if (description.length < 3) return null; // Must have meaningful description
      
      const transaction: ExtractedTransactionDto = {
        date: dates[0] || {
          rawText: '',
          date: new Date(),
          format: 'unknown',
          confidence: 0
        },
        description,
        amount: amounts[0],
        type,
        confidence: this.calculateTransactionConfidence(dates[0], amounts[0], description)
      };
      
      return transaction;
      
    } catch (error) {
      this.logger.debug(`Failed to parse transaction line: ${line}`);
      return null;
    }
  }

  private determineTransactionType(line: string): TransactionType {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('deposit') || lowerLine.includes('credit')) {
      return TransactionType.DEPOSIT;
    }
    if (lowerLine.includes('withdrawal') || lowerLine.includes('debit')) {
      return TransactionType.WITHDRAWAL;
    }
    if (lowerLine.includes('transfer')) {
      return TransactionType.TRANSFER;
    }
    if (lowerLine.includes('payment')) {
      return TransactionType.PAYMENT;
    }
    if (lowerLine.includes('fee') || lowerLine.includes('charge')) {
      return TransactionType.FEE;
    }
    if (lowerLine.includes('interest')) {
      return TransactionType.INTEREST;
    }
    
    // Default to debit for most transactions
    return TransactionType.DEBIT;
  }

  private calculateTransactionConfidence(date?: ExtractedDateDto, amount?: ExtractedAmountDto, description?: string): number {
    let confidence = 0;
    
    if (date && date.confidence > 0) confidence += 30;
    if (amount && amount.confidence > 0) confidence += 40;
    if (description && description.length > 5) confidence += 20;
    if (description && description.length > 15) confidence += 10;
    
    return Math.min(100, confidence);
  }

  private extractBalances(text: string): {
    opening?: ExtractedAmountDto;
    closing?: ExtractedAmountDto;
    totalCredits?: ExtractedAmountDto;
    totalDebits?: ExtractedAmountDto;
  } {
    const balances: any = {};
    const lowerText = text.toLowerCase();
    
    // Look for balance keywords and extract nearby amounts
    const balancePatterns = [
      { keyword: 'opening balance', key: 'opening' },
      { keyword: 'closing balance', key: 'closing' },
      { keyword: 'beginning balance', key: 'opening' },
      { keyword: 'ending balance', key: 'closing' },
      { keyword: 'total credits', key: 'totalCredits' },
      { keyword: 'total debits', key: 'totalDebits' }
    ];
    
    for (const pattern of balancePatterns) {
      const index = lowerText.indexOf(pattern.keyword);
      if (index !== -1) {
        // Extract text around the keyword
        const contextText = text.slice(Math.max(0, index - 50), index + 100);
        const amounts = this.extractAmounts(contextText);
        
        if (amounts.length > 0) {
          balances[pattern.key] = amounts[0];
        }
      }
    }
    
    return balances;
  }

  private assessQuality(text: string, transactions: ExtractedTransactionDto[], metadata: ExtractedDocumentMetadataDto): {
    overallConfidence: ConfidenceLevel;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let confidenceScore = metadata.qualityScore;
    
    // Assess transaction quality
    if (transactions.length === 0) {
      warnings.push('No transactions found in document');
      confidenceScore -= 30;
    } else {
      const avgTransactionConfidence = transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length;
      confidenceScore = (confidenceScore + avgTransactionConfidence) / 2;
      
      if (avgTransactionConfidence < 60) {
        warnings.push('Low confidence in transaction extraction');
      }
    }
    
    // Check for incomplete data
    const transactionsWithoutDates = transactions.filter(t => t.date.confidence === 0).length;
    if (transactionsWithoutDates > 0) {
      warnings.push(`${transactionsWithoutDates} transactions missing valid dates`);
      confidenceScore -= 10;
    }
    
    // Determine overall confidence level
    let overallConfidence: ConfidenceLevel;
    if (confidenceScore >= 80) overallConfidence = ConfidenceLevel.HIGH;
    else if (confidenceScore >= 60) overallConfidence = ConfidenceLevel.MEDIUM;
    else if (confidenceScore >= 40) overallConfidence = ConfidenceLevel.LOW;
    else overallConfidence = ConfidenceLevel.VERY_LOW;
    
    return { overallConfidence, warnings };
  }
} 