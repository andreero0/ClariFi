import { Injectable, Logger } from '@nestjs/common';
import { TransactionForCategorizationDto } from './dto/transaction-for-categorization.dto';

interface RuleCategorizationResult {
  category: string;
  confidence: number;
  ruleType: 'merchant' | 'description' | 'amount' | 'compound';
  matchedPattern?: string;
}

@Injectable()
export class RuleBasedCategorizationService {
  private readonly logger = new Logger(RuleBasedCategorizationService.name);

  // High confidence merchant patterns (Canadian context)
  private readonly merchantPatterns = {
    'Groceries': {
      patterns: [
        /\b(loblaws|metro|sobeys|food basics|walmart|costco|no frills|fresh co|giant tiger)\b/i,
        /\b(iga|maxi|provigo|super c|loblaws city market)\b/i,
        /\b(farm boy|wholesome market|bulk barn|fortinos|zehrs)\b/i,
        /grocery|supermarket|food store/i
      ],
      confidence: 92
    },
    'Transportation': {
      patterns: [
        /\b(uber|lyft|taxi|cab)\b/i,
        /\b(ttc|oc transpo|go transit|via rail|bc transit|stm montreal)\b/i,
        /\b(parking|park[^a-z]|prkg)\b/i,
        /\b(gas station|petro|shell|esso|husky|pioneer)\b/i
      ],
      confidence: 90
    },
    'Dining Out': {
      patterns: [
        /\b(tim hortons|tims|starbucks|mcdonalds|subway|pizza)\b/i,
        /\b(burger king|kfc|wendy's|a&w|harvey's|swiss chalet)\b/i,
        /\b(restaurant|cafe|bistro|diner|fast food)\b/i,
        /\b(boston pizza|earls|montana's|kelsey's|white spot)\b/i
      ],
      confidence: 93
    },
    'Utilities': {
      patterns: [
        /\b(hydro|ontario hydro|bc hydro|sask power|nova scotia power)\b/i,
        /\b(enbridge|union gas|direct energy|just energy)\b/i,
        /\b(bell|rogers|telus|shaw|cogeco|videotron)\b/i,
        /\b(toronto water|water bill|waste management)\b/i
      ],
      confidence: 95
    },
    'Health & Wellness': {
      patterns: [
        /\b(shoppers drug mart|rexall|pharma plus|costco pharmacy)\b/i,
        /\b(pharmacy|medical|dental|doctor|clinic|hospital)\b/i,
        /\b(goodlife|anytime fitness|ymca|community centre)\b/i
      ],
      confidence: 88
    },
    'Shopping': {
      patterns: [
        /\b(amazon|best buy|canadian tire|home depot|lowes)\b/i,
        /\b(the bay|winners|marshalls|dollarama|dollar tree)\b/i,
        /\b(sport chek|sportchek|marks|old navy|gap)\b/i,
        /\b(indigo|chapters|staples|office depot)\b/i
      ],
      confidence: 87
    },
    'Entertainment': {
      patterns: [
        /\b(cineplex|landmark cinemas|netflix|spotify|apple music)\b/i,
        /\b(steam|xbox|playstation|nintendo|gaming)\b/i,
        /\b(theatre|concert|event|ticket|entertainment)\b/i
      ],
      confidence: 85
    }
  };

  // Medium confidence description patterns
  private readonly descriptionPatterns = {
    'Income': {
      patterns: [
        /\b(salary|payroll|employment|wages|pay.*deposit)\b/i,
        /\b(ei|employment insurance|cpp|pension|benefit)\b/i,
        /\b(refund|reimbursement|cashback|rebate)\b/i
      ],
      confidence: 78
    },
    'Transfers': {
      patterns: [
        /\b(e-transfer|interac|etransfer|transfer.*to|transfer.*from)\b/i,
        /\b(send money|receive money|p2p|peer.*peer)\b/i,
        /\b(deposit.*savings|withdraw.*savings)\b/i
      ],
      confidence: 80
    },
    'Services': {
      patterns: [
        /\b(fee|service charge|nfs|overdraft|interest)\b/i,
        /\b(banking|bank.*fee|maintenance|monthly.*fee)\b/i,
        /\b(lawyer|legal|accountant|professional.*service)\b/i,
        /\b(cleaning|repair|maintenance|service)\b/i
      ],
      confidence: 72
    },
    'Housing': {
      patterns: [
        /\b(rent|rental|mortgage|condo.*fee|property.*tax)\b/i,
        /\b(insurance|home.*insurance|tenant.*insurance)\b/i,
        /\b(property.*management|landlord)\b/i
      ],
      confidence: 85
    }
  };

  // Amount-based patterns with context
  private readonly amountPatterns = [
    {
      category: 'Dining Out',
      amountRange: { min: 3, max: 25 },
      timeContext: /morning|lunch|dinner/i,
      confidence: 55
    },
    {
      category: 'Transportation', 
      amountRange: { min: 3.35, max: 3.35 }, // TTC fare
      confidence: 80
    },
    {
      category: 'Transportation',
      amountRange: { min: 2, max: 15 },
      descriptionContext: /transit|bus|subway|metro/i,
      confidence: 70
    },
    {
      category: 'Transfers',
      roundAmount: true, // $100, $50, etc.
      amountRange: { min: 25, max: 10000 },
      confidence: 60
    }
  ];

  async categorizeByRules(transaction: TransactionForCategorizationDto): Promise<RuleCategorizationResult | null> {
    const { description, amount } = transaction;
    
    // Try merchant patterns first (highest confidence)
    const merchantResult = this.matchMerchantPatterns(description);
    if (merchantResult && merchantResult.confidence >= 85) {
      this.logger.debug(`High confidence merchant match: ${description} -> ${merchantResult.category} (${merchantResult.confidence}%)`);
      return merchantResult;
    }

    // Try description patterns
    const descriptionResult = this.matchDescriptionPatterns(description);
    if (descriptionResult && descriptionResult.confidence >= 70) {
      this.logger.debug(`Medium confidence description match: ${description} -> ${descriptionResult.category} (${descriptionResult.confidence}%)`);
      return descriptionResult;
    }

    // Try amount-based patterns (lowest confidence, used as tiebreaker)
    const amountResult = this.matchAmountPatterns(amount, description);
    if (amountResult && amountResult.confidence >= 50) {
      this.logger.debug(`Amount-based match: ${description} ($${amount}) -> ${amountResult.category} (${amountResult.confidence}%)`);
      return amountResult;
    }

    // Try compound rules (combine multiple weak signals)
    const compoundResult = this.matchCompoundPatterns(transaction);
    if (compoundResult) {
      this.logger.debug(`Compound pattern match: ${description} -> ${compoundResult.category} (${compoundResult.confidence}%)`);
      return compoundResult;
    }

    this.logger.debug(`No rule match found for: ${description}`);
    return null;
  }

  private matchMerchantPatterns(description: string): RuleCategorizationResult | null {
    for (const [category, config] of Object.entries(this.merchantPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(description)) {
          return {
            category,
            confidence: config.confidence,
            ruleType: 'merchant',
            matchedPattern: pattern.source
          };
        }
      }
    }
    return null;
  }

  private matchDescriptionPatterns(description: string): RuleCategorizationResult | null {
    for (const [category, config] of Object.entries(this.descriptionPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(description)) {
          return {
            category,
            confidence: config.confidence,
            ruleType: 'description',
            matchedPattern: pattern.source
          };
        }
      }
    }
    return null;
  }

  private matchAmountPatterns(amount: number, description: string): RuleCategorizationResult | null {
    for (const rule of this.amountPatterns) {
      let matches = true;

      // Check amount range
      if (rule.amountRange) {
        if (amount < rule.amountRange.min || amount > rule.amountRange.max) {
          matches = false;
        }
      }

      // Check if it's a round amount
      if (rule.roundAmount) {
        const isRound = amount % 25 === 0 || amount % 50 === 0 || amount % 100 === 0;
        if (!isRound) {
          matches = false;
        }
      }

      // Check description context
      if (rule.descriptionContext && !rule.descriptionContext.test(description)) {
        matches = false;
      }

      // Check time context (this would require additional transaction metadata in real implementation)
      if (rule.timeContext) {
        // For now, skip time-based matching as we don't have timestamp details
        // In future: could check transaction time if available
        matches = false;
      }

      if (matches) {
        return {
          category: rule.category,
          confidence: rule.confidence,
          ruleType: 'amount'
        };
      }
    }

    return null;
  }

  private matchCompoundPatterns(transaction: TransactionForCategorizationDto): RuleCategorizationResult | null {
    const { description, amount } = transaction;
    const lowerDesc = description.toLowerCase();

    // Compound rule examples:
    
    // Small amount + food keywords = likely Groceries/Dining
    if (amount <= 15 && (lowerDesc.includes('food') || lowerDesc.includes('snack') || lowerDesc.includes('drink'))) {
      return {
        category: amount <= 8 ? 'Dining Out' : 'Groceries',
        confidence: 65,
        ruleType: 'compound'
      };
    }

    // Large round amount + no merchant = likely Transfer
    if (amount >= 100 && amount % 50 === 0 && !this.hasKnownMerchantPattern(description)) {
      return {
        category: 'Transfers',
        confidence: 68,
        ruleType: 'compound'
      };
    }

    // Negative amount + specific keywords = likely Income/Refund  
    if (amount < 0) {
      if (lowerDesc.includes('deposit') || lowerDesc.includes('credit') || lowerDesc.includes('refund')) {
        return {
          category: 'Income',
          confidence: 75,
          ruleType: 'compound'
        };
      }
    }

    // Very small amounts with fee keywords = Services
    if (amount <= 5 && (lowerDesc.includes('fee') || lowerDesc.includes('charge'))) {
      return {
        category: 'Services',
        confidence: 70,
        ruleType: 'compound'
      };
    }

    return null;
  }

  private hasKnownMerchantPattern(description: string): boolean {
    for (const config of Object.values(this.merchantPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(description)) {
          return true;
        }
      }
    }
    return false;
  }

  // Utility method to get rule coverage statistics (for monitoring/improvement)
  async analyzeRuleCoverage(transactions: TransactionForCategorizationDto[]): Promise<{
    totalTransactions: number;
    ruleMatches: number;
    coverageByType: Record<string, number>;
    coverageByCategory: Record<string, number>;
  }> {
    const stats = {
      totalTransactions: transactions.length,
      ruleMatches: 0,
      coverageByType: { merchant: 0, description: 0, amount: 0, compound: 0 },
      coverageByCategory: {}
    };

    for (const transaction of transactions) {
      const result = await this.categorizeByRules(transaction);
      if (result) {
        stats.ruleMatches++;
        stats.coverageByType[result.ruleType]++;
        
        if (!stats.coverageByCategory[result.category]) {
          stats.coverageByCategory[result.category] = 0;
        }
        stats.coverageByCategory[result.category]++;
      }
    }

    return stats;
  }
} 