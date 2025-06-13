import { Injectable, Logger } from '@nestjs/common';
import { TextParserService } from './text-parser.service';
import {
  BankStatementParsingRequestDto,
  TextParsingResultDto,
  ExtractedTransactionDto,
  ExtractedAmountDto,
  TransactionType,
  DocumentType
} from '../dto/text-parsing.dto';

interface BankSpecificPatterns {
  transactionHeaders: RegExp[];
  balancePatterns: RegExp[];
  dateFormats: string[];
  institutionKeywords: string[];
}

@Injectable()
export class BankStatementParserService {
  private readonly logger = new Logger(BankStatementParserService.name);

  constructor(private readonly textParser: TextParserService) {}

  // Bank-specific parsing patterns
  private readonly bankPatterns: Record<string, BankSpecificPatterns> = {
    'RBC': {
      transactionHeaders: [/Date\s+Description\s+Withdrawals\s+Deposits\s+Balance/i],
      balancePatterns: [/Beginning Balance.*?(\$?[\d,]+\.?\d*)/i, /Ending Balance.*?(\$?[\d,]+\.?\d*)/i],
      dateFormats: ['MM/DD/YYYY'],
      institutionKeywords: ['Royal Bank', 'RBC']
    },
    'TD': {
      transactionHeaders: [/Date\s+Transaction Details\s+CAD\s+Balance/i],
      balancePatterns: [/Opening Balance.*?(\$?[\d,]+\.?\d*)/i, /Closing Balance.*?(\$?[\d,]+\.?\d*)/i],
      dateFormats: ['MMM DD, YYYY'],
      institutionKeywords: ['TD Bank', 'Toronto-Dominion']
    },
    'Scotia': {
      transactionHeaders: [/Date\s+Description\s+Debit\s+Credit\s+Balance/i],
      balancePatterns: [/Previous Balance.*?(\$?[\d,]+\.?\d*)/i, /Current Balance.*?(\$?[\d,]+\.?\d*)/i],
      dateFormats: ['DD/MM/YYYY'],
      institutionKeywords: ['Scotiabank', 'Scotia']
    },
    'BMO': {
      transactionHeaders: [/Date\s+Description\s+Amount\s+Balance/i],
      balancePatterns: [/Starting Balance.*?(\$?[\d,]+\.?\d*)/i, /Ending Balance.*?(\$?[\d,]+\.?\d*)/i],
      dateFormats: ['YYYY-MM-DD'],
      institutionKeywords: ['Bank of Montreal', 'BMO']
    },
    'CIBC': {
      transactionHeaders: [/Date\s+Description\s+Debits\s+Credits\s+Balance/i],
      balancePatterns: [/Previous Statement Balance.*?(\$?[\d,]+\.?\d*)/i, /Current Balance.*?(\$?[\d,]+\.?\d*)/i],
      dateFormats: ['DD-MMM-YYYY'],
      institutionKeywords: ['CIBC', 'Canadian Imperial Bank']
    }
  };

  async parseBankStatement(request: BankStatementParsingRequestDto): Promise<TextParsingResultDto> {
    this.logger.log(`Parsing bank statement for ${request.bankName || 'unknown bank'}`);

    try {
      // First, run the standard text parsing
      const baseResult = await this.textParser.parseText({
        ...request,
        expectedDocumentType: DocumentType.BANK_STATEMENT
      });

      // Detect bank if not provided
      const detectedBank = request.bankName || this.detectBank(request.rawText);
      
      // Apply bank-specific enhancements
      if (detectedBank && this.bankPatterns[detectedBank]) {
        return await this.enhanceWithBankSpecificParsing(baseResult, request.rawText, detectedBank);
      }

      // Apply general bank statement enhancements
      return await this.enhanceWithGeneralBankParsing(baseResult, request.rawText);

    } catch (error) {
      this.logger.error('Error during bank statement parsing', error.stack);
      throw new Error(`Bank statement parsing failed: ${error.message}`);
    }
  }

  private detectBank(text: string): string | null {
    const lowerText = text.toLowerCase();

    for (const [bankCode, patterns] of Object.entries(this.bankPatterns)) {
      for (const keyword of patterns.institutionKeywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          this.logger.log(`Detected bank: ${bankCode}`);
          return bankCode;
        }
      }
    }

    return null;
  }

  private async enhanceWithBankSpecificParsing(
    baseResult: TextParsingResultDto,
    rawText: string,
    bankCode: string
  ): Promise<TextParsingResultDto> {
    const patterns = this.bankPatterns[bankCode];
    
    // Enhanced transaction extraction with bank-specific patterns
    const enhancedTransactions = this.extractBankSpecificTransactions(rawText, patterns);
    
    // Enhanced balance extraction
    const enhancedBalances = this.extractBankSpecificBalances(rawText, patterns);
    
    // Merge results, preferring bank-specific extractions
    const result = {
      ...baseResult,
      transactions: enhancedTransactions.length > 0 ? enhancedTransactions : baseResult.transactions,
      openingBalance: enhancedBalances.opening || baseResult.openingBalance,
      closingBalance: enhancedBalances.closing || baseResult.closingBalance,
      accountInfo: {
        ...baseResult.accountInfo,
        institutionName: patterns.institutionKeywords[0]
      }
    };

    // Recalculate confidence with bank-specific boost
    result.metadata.qualityScore = Math.min(100, result.metadata.qualityScore + 10);

    this.logger.log(`Enhanced parsing for ${bankCode}: ${result.transactions.length} transactions`);
    return result;
  }

  private async enhanceWithGeneralBankParsing(
    baseResult: TextParsingResultDto,
    rawText: string
  ): Promise<TextParsingResultDto> {
    // Apply general bank statement enhancements
    const enhancedTransactions = this.enhanceTransactionTypes(baseResult.transactions);
    const categorizedTransactions = this.applyCategorySuggestions(enhancedTransactions);

    return {
      ...baseResult,
      transactions: categorizedTransactions
    };
  }

  private extractBankSpecificTransactions(rawText: string, patterns: BankSpecificPatterns): ExtractedTransactionDto[] {
    const transactions: ExtractedTransactionDto[] = [];
    const lines = rawText.split('\n');

    // Find transaction table start
    let transactionStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      for (const headerPattern of patterns.transactionHeaders) {
        if (headerPattern.test(lines[i])) {
          transactionStartIndex = i + 1;
          break;
        }
      }
      if (transactionStartIndex !== -1) break;
    }

    if (transactionStartIndex === -1) {
      this.logger.warn('Could not find transaction table header');
      return transactions;
    }

    // Parse transaction lines
    for (let i = transactionStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length < 10) continue; // Skip short lines
      
      // Stop if we hit a summary section
      if (line.toLowerCase().includes('summary') || 
          line.toLowerCase().includes('total') ||
          line.toLowerCase().includes('balance forward')) {
        break;
      }

      const transaction = this.parseBankTransactionLine(line, patterns);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  private parseBankTransactionLine(line: string, patterns: BankSpecificPatterns): ExtractedTransactionDto | null {
    try {
      // Split line into columns (assuming tab or multiple space separation)
      const columns = line.split(/\s{2,}|\t/).map(col => col.trim()).filter(col => col.length > 0);
      
      if (columns.length < 3) return null; // Need at least date, description, amount

      // Extract date (usually first column)
      const dateStr = columns[0];
      const date = this.parseBankDate(dateStr, patterns.dateFormats);
      if (!date) return null;

      // Extract description (usually second column, might span multiple)
      let description = columns[1];
      
      // Extract amounts (look for currency patterns in remaining columns)
      const amounts: number[] = [];
      const amountTexts: string[] = [];
      
      for (let i = 2; i < columns.length; i++) {
        const col = columns[i];
        const amountMatch = col.match(/(\$?[\d,]+\.?\d*)/);
        if (amountMatch) {
          const cleanAmount = amountMatch[1].replace(/[\$,]/g, '');
          const amount = parseFloat(cleanAmount);
          if (!isNaN(amount) && amount > 0) {
            amounts.push(amount);
            amountTexts.push(col);
          }
        }
      }

      if (amounts.length === 0) return null;

      // Determine transaction type and amount
      let transactionAmount = amounts[0];
      let transactionType = TransactionType.DEBIT;

      // Check for debit/credit columns
      if (amounts.length >= 2) {
        // Assume: [debit, credit] or [amount, balance]
        const lastCol = columns[columns.length - 1];
        const secondLastCol = columns[columns.length - 2];
        
        // If last column looks like balance, use second last as amount
        if (lastCol.includes('.') && amounts.length >= 2) {
          transactionAmount = amounts[amounts.length - 2];
          
          // Determine if it's in debit or credit column
          const debitPattern = /debit|withdrawal|out/i;
          const creditPattern = /credit|deposit|in/i;
          
          if (debitPattern.test(secondLastCol) || transactionAmount < 0) {
            transactionType = TransactionType.DEBIT;
          } else if (creditPattern.test(secondLastCol) || 
                    (description && (/deposit|transfer in|credit/i.test(description)))) {
            transactionType = TransactionType.CREDIT;
          }
        }
      }

      const extractedAmount: ExtractedAmountDto = {
        rawText: amountTexts[0] || transactionAmount.toString(),
        amount: Math.abs(transactionAmount),
        currency: 'CAD',
        confidence: 90
      };

      const transaction: ExtractedTransactionDto = {
        date,
        description: description.trim(),
        amount: extractedAmount,
        type: transactionType,
        confidence: 85
      };

      return transaction;

    } catch (error) {
      this.logger.debug(`Failed to parse bank transaction line: ${line}`);
      return null;
    }
  }

  private parseBankDate(dateStr: string, formats: string[]): any {
    // Try each format
    for (const format of formats) {
      try {
        let date: Date | null = null;

        if (format === 'MM/DD/YYYY') {
          const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          }
        } else if (format === 'DD/MM/YYYY') {
          const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          }
        } else if (format === 'YYYY-MM-DD') {
          const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (match) {
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          }
        } else if (format === 'MMM DD, YYYY') {
          const match = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})/);
          if (match) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === match[1].toLowerCase());
            if (monthIndex !== -1) {
              date = new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
            }
          }
        } else if (format === 'DD-MMM-YYYY') {
          const match = dateStr.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
          if (match) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === match[2].toLowerCase());
            if (monthIndex !== -1) {
              date = new Date(parseInt(match[3]), monthIndex, parseInt(match[1]));
            }
          }
        }

        if (date && !isNaN(date.getTime())) {
          return {
            rawText: dateStr,
            date,
            format,
            confidence: 95
          };
        }
      } catch (error) {
        continue; // Try next format
      }
    }

    return null;
  }

  private extractBankSpecificBalances(rawText: string, patterns: BankSpecificPatterns): {
    opening?: ExtractedAmountDto;
    closing?: ExtractedAmountDto;
  } {
    const balances: any = {};

    for (const pattern of patterns.balancePatterns) {
      const match = rawText.match(pattern);
      if (match) {
        const amountStr = match[1];
        const cleanAmount = amountStr.replace(/[\$,]/g, '');
        const amount = parseFloat(cleanAmount);

        if (!isNaN(amount)) {
          const extractedAmount: ExtractedAmountDto = {
            rawText: amountStr,
            amount,
            currency: 'CAD',
            confidence: 90
          };

          // Determine if it's opening or closing based on pattern text
          const patternText = pattern.source.toLowerCase();
          if (patternText.includes('beginning') || patternText.includes('opening') || patternText.includes('previous')) {
            balances.opening = extractedAmount;
          } else if (patternText.includes('ending') || patternText.includes('closing') || patternText.includes('current')) {
            balances.closing = extractedAmount;
          }
        }
      }
    }

    return balances;
  }

  private enhanceTransactionTypes(transactions: ExtractedTransactionDto[]): ExtractedTransactionDto[] {
    return transactions.map(transaction => {
      const description = transaction.description.toLowerCase();
      
      // More specific transaction type detection
      if (description.includes('etf') || description.includes('e-transfer')) {
        transaction.type = TransactionType.TRANSFER;
      } else if (description.includes('bill payment') || description.includes('preauth')) {
        transaction.type = TransactionType.PAYMENT;
      } else if (description.includes('interest') || description.includes('int earned')) {
        transaction.type = TransactionType.INTEREST;
      } else if (description.includes('fee') || description.includes('charge') || description.includes('nfs')) {
        transaction.type = TransactionType.FEE;
      } else if (description.includes('deposit') || description.includes('payroll')) {
        transaction.type = TransactionType.DEPOSIT;
      }

      return transaction;
    });
  }

  private applyCategorySuggestions(transactions: ExtractedTransactionDto[]): ExtractedTransactionDto[] {
    const categoryPatterns = {
      'Groceries': /grocery|supermarket|loblaws|metro|sobeys|food basics|walmart/i,
      'Gas/Transportation': /gas|petro|shell|esso|uber|taxi|transit|parking/i,
      'Restaurants': /restaurant|coffee|tim hortons|starbucks|mcdonalds|pizza/i,
      'Utilities': /hydro|electric|gas bill|water|internet|phone|bell|rogers/i,
      'Banking': /fee|interest|charge|nfs|service/i,
      'Shopping': /amazon|best buy|costco|canadian tire|mall/i,
      'Healthcare': /pharmacy|medical|doctor|dental|insurance/i,
      'Entertainment': /netflix|spotify|theater|movie|subscription/i
    };

    return transactions.map(transaction => {
      for (const [category, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(transaction.description)) {
          transaction.suggestedCategory = category;
          break;
        }
      }
      return transaction;
    });
  }
} 