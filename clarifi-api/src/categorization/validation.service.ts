import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategorizationService } from './categorization.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { TransactionForCategorizationDto } from './dto/categorization.dto';

export interface ValidationTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  groundTruthCategory: string;
  source: 'real' | 'synthetic' | 'edge_case';
}

export interface ValidationResult {
  transactionId: string;
  predictedCategory: string;
  actualCategory: string;
  confidence: number;
  isCorrect: boolean;
  processingTimeMs: number;
  costUSD: number;
  source: 'rule' | 'ai' | 'cache';
}

export interface ValidationReport {
  overallAccuracy: number;
  totalTransactions: number;
  correctPredictions: number;
  totalCostUSD: number;
  averageCostPerTransaction: number;
  averageCostPerStatement: number; // Assuming ~50 transactions per statement
  averageProcessingTimeMs: number;
  cacheHitRate: number;
  categoryBreakdown: {
    [category: string]: {
      accuracy: number;
      totalTransactions: number;
      correctPredictions: number;
    };
  };
  sourceBreakdown: {
    rule: { count: number; accuracy: number; avgCost: number };
    ai: { count: number; accuracy: number; avgCost: number };
    cache: { count: number; accuracy: number; avgCost: number };
  };
  performanceMetrics: {
    throughputPerMinute: number;
    errorRate: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
  };
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    private readonly categorizationService: CategorizationService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate synthetic Canadian transaction dataset for testing
   */
  generateSyntheticDataset(count: number): ValidationTransaction[] {
    const canadianMerchants = [
      // Groceries
      { name: 'LOBLAWS SUPERSTORE #123', category: 'Groceries', amounts: [25.50, 45.67, 78.32] },
      { name: 'METRO GROCERY STORE', category: 'Groceries', amounts: [15.24, 32.18, 56.90] },
      { name: 'SOBEYS URBAN FRESH', category: 'Groceries', amounts: [20.75, 48.33, 65.21] },
      { name: 'WALMART SUPERCENTER', category: 'Groceries', amounts: [35.44, 67.89, 89.12] },
      { name: 'COSTCO WHOLESALE', category: 'Groceries', amounts: [125.67, 234.78, 345.89] },
      
      // Dining Out
      { name: 'TIM HORTONS #456', category: 'Dining Out', amounts: [4.25, 8.50, 12.75] },
      { name: 'STARBUCKS COFFEE', category: 'Dining Out', amounts: [5.65, 11.30, 16.95] },
      { name: 'MCDONALDS RESTAURANT', category: 'Dining Out', amounts: [8.99, 15.25, 22.50] },
      { name: 'BOSTON PIZZA', category: 'Dining Out', amounts: [45.67, 78.90, 125.45] },
      { name: 'SWISS CHALET', category: 'Dining Out', amounts: [25.99, 48.75, 65.20] },
      
      // Transportation
      { name: 'TTC PRESTO RELOAD', category: 'Transportation', amounts: [20.00, 40.00, 60.00] },
      { name: 'UBER TRIP FARE', category: 'Transportation', amounts: [12.45, 25.67, 45.89] },
      { name: 'PETRO CANADA GAS', category: 'Transportation', amounts: [45.67, 78.90, 125.34] },
      { name: 'GO TRANSIT MONTHLY', category: 'Transportation', amounts: [150.00, 165.50, 180.75] },
      { name: 'TORONTO PARKING AUTH', category: 'Transportation', amounts: [8.00, 15.00, 25.00] },
      
      // Utilities
      { name: 'HYDRO ONE NETWORKS', category: 'Utilities', amounts: [75.45, 125.67, 189.23] },
      { name: 'BELL CANADA MONTHLY', category: 'Utilities', amounts: [85.99, 105.75, 125.50] },
      { name: 'ROGERS COMMUNICATIONS', category: 'Utilities', amounts: [95.25, 115.80, 135.99] },
      { name: 'ENBRIDGE GAS BILL', category: 'Utilities', amounts: [125.45, 234.67, 345.89] },
      
      // Health & Wellness
      { name: 'SHOPPERS DRUG MART', category: 'Health & Wellness', amounts: [15.67, 32.45, 67.89] },
      { name: 'REXALL PHARMACY', category: 'Health & Wellness', amounts: [12.34, 28.90, 45.67] },
      { name: 'GOODLIFE FITNESS', category: 'Health & Wellness', amounts: [45.99, 89.99, 125.99] },
      
      // Shopping
      { name: 'AMAZON.CA PURCHASE', category: 'Shopping', amounts: [25.99, 67.45, 125.67] },
      { name: 'CANADIAN TIRE STORE', category: 'Shopping', amounts: [35.67, 78.90, 156.78] },
      { name: 'BEST BUY CANADA', category: 'Shopping', amounts: [99.99, 299.99, 599.99] },
      
      // Entertainment
      { name: 'CINEPLEX ENTERTAINMENT', category: 'Entertainment', amounts: [15.99, 31.98, 47.97] },
      { name: 'SPOTIFY PREMIUM', category: 'Entertainment', amounts: [9.99, 14.99, 19.99] },
      { name: 'NETFLIX SUBSCRIPTION', category: 'Entertainment', amounts: [16.49, 20.99, 24.99] },
    ];

    const transactions: ValidationTransaction[] = [];
    
    for (let i = 0; i < count; i++) {
      const merchant = canadianMerchants[Math.floor(Math.random() * canadianMerchants.length)];
      const amount = merchant.amounts[Math.floor(Math.random() * merchant.amounts.length)];
      const randomVariation = Math.floor(Math.random() * 100);
      
      // Add some variation to merchant names
      let description = merchant.name;
      if (randomVariation < 20) {
        description += ` TORONTO ON`;
      } else if (randomVariation < 40) {
        description += ` #${Math.floor(Math.random() * 999) + 100}`;
      }
      
      transactions.push({
        id: `synthetic-${i + 1}`,
        description,
        amount: Number((amount + (Math.random() - 0.5) * 5).toFixed(2)),
        date: this.generateRandomDate().toISOString(),
        groundTruthCategory: merchant.category,
        source: 'synthetic',
      });
    }

    return transactions;
  }

  /**
   * Generate edge case transactions for robust testing
   */
  generateEdgeCaseDataset(): ValidationTransaction[] {
    return [
      {
        id: 'edge-1',
        description: 'UNKNOWN MERCHANT XYZ',
        amount: 25.99,
        date: new Date().toISOString(),
        groundTruthCategory: 'Other',
        source: 'edge_case',
      },
      {
        id: 'edge-2',
        description: 'REFUND - TIM HORTONS',
        amount: -4.25,
        date: new Date().toISOString(),
        groundTruthCategory: 'Dining Out',
        source: 'edge_case',
      },
      {
        id: 'edge-3',
        description: '1234567890 ABCDEFGHIJ', // Cryptic description
        amount: 100.00,
        date: new Date().toISOString(),
        groundTruthCategory: 'Other',
        source: 'edge_case',
      },
      {
        id: 'edge-4',
        description: 'PAYPAL *AMAZONCAFR', // International variant
        amount: 45.67,
        date: new Date().toISOString(),
        groundTruthCategory: 'Shopping',
        source: 'edge_case',
      },
      {
        id: 'edge-5',
        description: 'E-TRANSFER DEPOSIT',
        amount: 500.00,
        date: new Date().toISOString(),
        groundTruthCategory: 'Transfers',
        source: 'edge_case',
      },
    ];
  }

  /**
   * Run comprehensive validation on a dataset
   */
  async runValidation(
    testDataset: ValidationTransaction[],
    scenarioName: string,
  ): Promise<ValidationReport> {
    this.logger.log(`Starting validation scenario: ${scenarioName} with ${testDataset.length} transactions`);
    
    const results: ValidationResult[] = [];
    const startTime = Date.now();
    let errors = 0;
    
    // Track cache stats before validation
    const initialCacheStats = await this.performanceMonitor.getCacheStatistics();
    
    for (const testTransaction of testDataset) {
      try {
        const transactionStartTime = Date.now();
        
        // Convert to DTO format
        const transactionDto: TransactionForCategorizationDto = {
          id: testTransaction.id,
          description: testTransaction.description,
          amount: testTransaction.amount,
          date: testTransaction.date,
        };
        
        // Categorize the transaction
        const categorizedResults = await this.categorizationService.categorizeTransactions([transactionDto]);
        
        const processingTime = Date.now() - transactionStartTime;
        
        if (categorizedResults.length === 0) {
          this.logger.warn(`No result returned for transaction ${testTransaction.id}`);
          errors++;
          continue;
        }
        
        const result = categorizedResults[0];
        
        // Calculate cost (simplified - actual cost would come from performance monitor)
        const estimatedCost = this.calculateEstimatedCost('ai', result.confidence || 0.5);
        
        results.push({
          transactionId: testTransaction.id,
          predictedCategory: result.category,
          actualCategory: testTransaction.groundTruthCategory,
          confidence: result.confidence || 0.5,
          isCorrect: result.category === testTransaction.groundTruthCategory,
          processingTimeMs: processingTime,
          costUSD: estimatedCost,
          source: this.determineSource(result),
        });
        
      } catch (error) {
        this.logger.error(`Error processing transaction ${testTransaction.id}: ${error.message}`);
        errors++;
      }
    }
    
    const totalTime = Date.now() - startTime;
    const finalCacheStats = await this.performanceMonitor.getCacheStatistics();
    
    // Generate comprehensive report
    const report = this.generateValidationReport(results, totalTime, errors, initialCacheStats, finalCacheStats);
    
    this.logger.log(`Validation completed: ${report.overallAccuracy.toFixed(2)}% accuracy, $${report.averageCostPerStatement.toFixed(4)} per statement`);
    
    return report;
  }

  /**
   * Run all validation scenarios
   */
  async runFullValidationSuite(): Promise<{
    baselineAccuracy: ValidationReport;
    costEfficiency: ValidationReport;
    edgeCases: ValidationReport;
    summary: {
      overallAccuracy: number;
      averageCost: number;
      productionReady: boolean;
      recommendations: string[];
    };
  }> {
    this.logger.log('Starting full validation suite...');
    
    // Scenario A: Baseline Accuracy Test
    const baselineDataset = this.generateSyntheticDataset(5000);
    const baselineAccuracy = await this.runValidation(baselineDataset, 'Baseline Accuracy');
    
    // Scenario B: Cost Efficiency Test
    const costDataset = this.generateSyntheticDataset(10000);
    const costEfficiency = await this.runValidation(costDataset, 'Cost Efficiency');
    
    // Scenario C: Edge Cases Test
    const edgeCaseDataset = this.generateEdgeCaseDataset();
    const edgeCases = await this.runValidation(edgeCaseDataset, 'Edge Cases');
    
    // Generate summary and recommendations
    const overallAccuracy = (baselineAccuracy.overallAccuracy + costEfficiency.overallAccuracy) / 2;
    const averageCost = (baselineAccuracy.averageCostPerStatement + costEfficiency.averageCostPerStatement) / 2;
    
    const productionReady = 
      overallAccuracy >= 85 && 
      averageCost <= 0.10 &&
      baselineAccuracy.performanceMetrics.errorRate <= 1;
    
    const recommendations: string[] = [];
    if (overallAccuracy < 85) {
      recommendations.push('Improve categorization accuracy through enhanced rules or prompt engineering');
    }
    if (averageCost > 0.10) {
      recommendations.push('Optimize costs through improved caching or reduced token usage');
    }
    if (baselineAccuracy.performanceMetrics.errorRate > 1) {
      recommendations.push('Reduce error rate through improved error handling and validation');
    }
    if (baselineAccuracy.cacheHitRate < 30) {
      recommendations.push('Improve cache hit rate through better key generation or longer TTL');
    }
    
    return {
      baselineAccuracy,
      costEfficiency,
      edgeCases,
      summary: {
        overallAccuracy,
        averageCost,
        productionReady,
        recommendations,
      },
    };
  }

  private generateRandomDate(): Date {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private calculateEstimatedCost(source: string, confidence: number): number {
    // Simplified cost calculation
    if (source === 'cache') return 0.0001; // Minimal cache cost
    if (source === 'rule') return 0.0005; // Rule processing cost
    return 0.002; // AI API call cost (simplified)
  }

  private determineSource(result: any): 'rule' | 'ai' | 'cache' {
    // This would be enhanced to actually track the source from the categorization service
    if (result.confidence >= 90) return 'rule';
    if (result.confidence >= 70) return 'ai';
    return 'cache';
  }

  private generateValidationReport(
    results: ValidationResult[],
    totalTimeMs: number,
    errors: number,
    initialCacheStats: any,
    finalCacheStats: any,
  ): ValidationReport {
    const totalTransactions = results.length;
    const correctPredictions = results.filter(r => r.isCorrect).length;
    const overallAccuracy = (correctPredictions / totalTransactions) * 100;
    
    const totalCost = results.reduce((sum, r) => sum + r.costUSD, 0);
    const averageCostPerTransaction = totalCost / totalTransactions;
    const averageCostPerStatement = averageCostPerTransaction * 50; // Assuming 50 transactions per statement
    
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0) / totalTransactions;
    
    // Calculate cache hit rate
    const cacheHits = finalCacheStats.hitCount - initialCacheStats.hitCount;
    const totalRequests = finalCacheStats.totalRequests - initialCacheStats.totalRequests;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    // Category breakdown
    const categoryBreakdown: ValidationReport['categoryBreakdown'] = {};
    const categories = [...new Set(results.map(r => r.actualCategory))];
    
    for (const category of categories) {
      const categoryResults = results.filter(r => r.actualCategory === category);
      const categoryCorrect = categoryResults.filter(r => r.isCorrect).length;
      
      categoryBreakdown[category] = {
        accuracy: (categoryCorrect / categoryResults.length) * 100,
        totalTransactions: categoryResults.length,
        correctPredictions: categoryCorrect,
      };
    }
    
    // Source breakdown
    const sourceBreakdown: ValidationReport['sourceBreakdown'] = {
      rule: { count: 0, accuracy: 0, avgCost: 0 },
      ai: { count: 0, accuracy: 0, avgCost: 0 },
      cache: { count: 0, accuracy: 0, avgCost: 0 },
    };
    
    for (const source of ['rule', 'ai', 'cache'] as const) {
      const sourceResults = results.filter(r => r.source === source);
      if (sourceResults.length > 0) {
        const sourceCorrect = sourceResults.filter(r => r.isCorrect).length;
        sourceBreakdown[source] = {
          count: sourceResults.length,
          accuracy: (sourceCorrect / sourceResults.length) * 100,
          avgCost: sourceResults.reduce((sum, r) => sum + r.costUSD, 0) / sourceResults.length,
        };
      }
    }
    
    // Performance metrics
    const processingTimes = results.map(r => r.processingTimeMs).sort((a, b) => a - b);
    const p95Index = Math.floor(processingTimes.length * 0.95);
    const p99Index = Math.floor(processingTimes.length * 0.99);
    
    return {
      overallAccuracy,
      totalTransactions,
      correctPredictions,
      totalCostUSD: totalCost,
      averageCostPerTransaction,
      averageCostPerStatement,
      averageProcessingTimeMs: averageProcessingTime,
      cacheHitRate,
      categoryBreakdown,
      sourceBreakdown,
      performanceMetrics: {
        throughputPerMinute: (totalTransactions / (totalTimeMs / 60000)),
        errorRate: (errors / (totalTransactions + errors)) * 100,
        p95LatencyMs: processingTimes[p95Index] || 0,
        p99LatencyMs: processingTimes[p99Index] || 0,
      },
    };
  }
} 