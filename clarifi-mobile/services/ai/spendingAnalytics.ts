import { formatCurrency } from '../../utils/formatting/currency';

interface SpendingPattern {
  categoryId: string;
  categoryName: string;
  currentAmount: number;
  historicalAverage: number;
  standardDeviation: number;
  percentageChange: number;
  isUnusual: boolean;
  severity: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
}

interface UnusualSpendingAlert {
  id: string;
  type: 'spending_spike' | 'unusual_pattern' | 'budget_exceeded' | 'trend_change';
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionSuggestions: string[];
  detectedAt: Date;
  confidence: number;
}

interface HistoricalSpendingData {
  categoryId: string;
  monthlyAmounts: number[];
  averageAmount: number;
  standardDeviation: number;
}

interface CategorySpendingData {
  categoryId: string;
  categoryName: string;
  currentMonthAmount: number;
  previousMonthAmount: number;
  last6MonthsAmounts: number[];
  budget?: number;
  icon: string;
  color: string;
}

class SpendingAnalyticsService {
  private static instance: SpendingAnalyticsService;
  
  private constructor() {}

  public static getInstance(): SpendingAnalyticsService {
    if (!SpendingAnalyticsService.instance) {
      SpendingAnalyticsService.instance = new SpendingAnalyticsService();
    }
    return SpendingAnalyticsService.instance;
  }

  /**
   * PRD: AI-powered unusual spending detection
   * Analyzes spending patterns and identifies anomalies using statistical methods
   */
  public analyzeSpendingPatterns(data: CategorySpendingData[]): SpendingPattern[] {
    return data.map(category => {
      const historicalData = this.calculateHistoricalMetrics(category.last6MonthsAmounts);
      const percentageChange = this.calculatePercentageChange(
        category.currentMonthAmount,
        historicalData.average
      );
      
      const isUnusual = this.detectUnusualSpending(
        category.currentMonthAmount,
        historicalData.average,
        historicalData.standardDeviation
      );

      const severity = this.calculateSeverity(percentageChange, historicalData.standardDeviation);
      const trend = this.analyzeTrend(category.last6MonthsAmounts);

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        currentAmount: category.currentMonthAmount,
        historicalAverage: historicalData.average,
        standardDeviation: historicalData.standardDeviation,
        percentageChange,
        isUnusual,
        severity,
        trend,
      };
    });
  }

  /**
   * Generates unusual spending alerts based on pattern analysis
   */
  public generateUnusualSpendingAlerts(
    spendingPatterns: SpendingPattern[],
    categoryData: CategorySpendingData[]
  ): UnusualSpendingAlert[] {
    const alerts: UnusualSpendingAlert[] = [];

    spendingPatterns.forEach(pattern => {
      const category = categoryData.find(c => c.categoryId === pattern.categoryId);
      if (!category || !pattern.isUnusual) return;

      // Spending spike detection
      if (pattern.percentageChange > 40 && pattern.severity === 'high') {
        alerts.push({
          id: `spike_${pattern.categoryId}_${Date.now()}`,
          type: 'spending_spike',
          categoryId: pattern.categoryId,
          categoryName: pattern.categoryName,
          title: `${pattern.categoryName} spending up ${Math.round(pattern.percentageChange)}%`,
          description: `You spent ${formatCurrency(pattern.currentAmount - pattern.historicalAverage)} more than usual on ${pattern.categoryName.toLowerCase()} this month.`,
          severity: pattern.severity,
          actionSuggestions: this.generateActionSuggestions('spending_spike', pattern),
          detectedAt: new Date(),
          confidence: this.calculateConfidence(pattern),
        });
      }

      // Budget exceeded detection
      if (category.budget && pattern.currentAmount > category.budget) {
        const overagePercentage = ((pattern.currentAmount - category.budget) / category.budget) * 100;
        alerts.push({
          id: `budget_${pattern.categoryId}_${Date.now()}`,
          type: 'budget_exceeded',
          categoryId: pattern.categoryId,
          categoryName: pattern.categoryName,
          title: `${pattern.categoryName} budget exceeded`,
          description: `You've exceeded your ${pattern.categoryName.toLowerCase()} budget by ${formatCurrency(pattern.currentAmount - category.budget)} (${Math.round(overagePercentage)}%).`,
          severity: overagePercentage > 50 ? 'high' : overagePercentage > 20 ? 'medium' : 'low',
          actionSuggestions: this.generateActionSuggestions('budget_exceeded', pattern),
          detectedAt: new Date(),
          confidence: 0.95, // High confidence for budget exceeded
        });
      }

      // Unusual pattern detection
      if (pattern.trend === 'volatile' && pattern.standardDeviation > pattern.historicalAverage * 0.5) {
        alerts.push({
          id: `pattern_${pattern.categoryId}_${Date.now()}`,
          type: 'unusual_pattern',
          categoryId: pattern.categoryId,
          categoryName: pattern.categoryName,
          title: `Irregular ${pattern.categoryName.toLowerCase()} spending`,
          description: `Your ${pattern.categoryName.toLowerCase()} spending has been highly variable. Consider setting a consistent budget.`,
          severity: 'medium',
          actionSuggestions: this.generateActionSuggestions('unusual_pattern', pattern),
          detectedAt: new Date(),
          confidence: this.calculateConfidence(pattern),
        });
      }

      // Trend change detection
      if (pattern.trend === 'increasing' && pattern.percentageChange > 25) {
        alerts.push({
          id: `trend_${pattern.categoryId}_${Date.now()}`,
          type: 'trend_change',
          categoryId: pattern.categoryId,
          categoryName: pattern.categoryName,
          title: `${pattern.categoryName} costs trending upward`,
          description: `Your ${pattern.categoryName.toLowerCase()} spending has been consistently increasing over the past few months.`,
          severity: pattern.severity,
          actionSuggestions: this.generateActionSuggestions('trend_change', pattern),
          detectedAt: new Date(),
          confidence: this.calculateConfidence(pattern),
        });
      }
    });

    // Sort by severity and confidence
    return alerts
      .sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 5); // Limit to top 5 alerts
  }

  /**
   * Calculate historical metrics for a category
   */
  private calculateHistoricalMetrics(monthlyAmounts: number[]): {
    average: number;
    standardDeviation: number;
  } {
    if (monthlyAmounts.length === 0) {
      return { average: 0, standardDeviation: 0 };
    }

    const average = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
    
    const squaredDifferences = monthlyAmounts.map(amount => Math.pow(amount - average, 2));
    const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / monthlyAmounts.length;
    const standardDeviation = Math.sqrt(variance);

    return { average, standardDeviation };
  }

  /**
   * Calculate percentage change from historical average
   */
  private calculatePercentageChange(currentAmount: number, historicalAverage: number): number {
    if (historicalAverage === 0) return 0;
    return ((currentAmount - historicalAverage) / historicalAverage) * 100;
  }

  /**
   * Detect if spending is unusual using statistical analysis
   * Uses z-score method: values beyond 2 standard deviations are considered unusual
   */
  private detectUnusualSpending(
    currentAmount: number,
    historicalAverage: number,
    standardDeviation: number
  ): boolean {
    if (standardDeviation === 0) return false;
    
    const zScore = Math.abs(currentAmount - historicalAverage) / standardDeviation;
    return zScore > 2; // More than 2 standard deviations from mean
  }

  /**
   * Calculate severity based on percentage change and standard deviation
   */
  private calculateSeverity(
    percentageChange: number,
    standardDeviation: number
  ): 'low' | 'medium' | 'high' {
    const absChange = Math.abs(percentageChange);
    
    if (absChange > 75 || standardDeviation > 200) return 'high';
    if (absChange > 40 || standardDeviation > 100) return 'medium';
    return 'low';
  }

  /**
   * Analyze spending trend over time
   */
  private analyzeTrend(monthlyAmounts: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (monthlyAmounts.length < 3) return 'stable';

    // Calculate linear regression slope
    const n = monthlyAmounts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = monthlyAmounts.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * monthlyAmounts[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate volatility (coefficient of variation)
    const mean = sumY / n;
    const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Determine trend
    if (coefficientOfVariation > 0.4) return 'volatile';
    if (slope > mean * 0.05) return 'increasing'; // 5% of mean per month
    if (slope < -mean * 0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate confidence score for an alert
   */
  private calculateConfidence(pattern: SpendingPattern): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for larger deviations
    const zScore = Math.abs(pattern.currentAmount - pattern.historicalAverage) / 
                   (pattern.standardDeviation || 1);
    confidence += Math.min(zScore * 0.1, 0.4);

    // Higher confidence for consistent trends
    if (pattern.trend === 'increasing' || pattern.trend === 'decreasing') {
      confidence += 0.2;
    }

    // Lower confidence for volatile patterns
    if (pattern.trend === 'volatile') {
      confidence -= 0.1;
    }

    // Higher confidence for higher severity
    if (pattern.severity === 'high') confidence += 0.15;
    if (pattern.severity === 'medium') confidence += 0.1;

    return Math.min(Math.max(confidence, 0.1), 1.0); // Clamp between 0.1 and 1.0
  }

  /**
   * Generate actionable suggestions based on alert type and pattern
   */
  private generateActionSuggestions(
    alertType: UnusualSpendingAlert['type'],
    pattern: SpendingPattern
  ): string[] {
    const suggestions: string[] = [];

    switch (alertType) {
      case 'spending_spike':
        suggestions.push(`Review your ${pattern.categoryName.toLowerCase()} transactions for this month`);
        suggestions.push(`Set a monthly budget for ${pattern.categoryName.toLowerCase()}`);
        if (pattern.categoryName.toLowerCase().includes('dining') || pattern.categoryName.toLowerCase().includes('food')) {
          suggestions.push('Consider meal planning to reduce dining expenses');
          suggestions.push('Look for grocery deals and cook more meals at home');
        }
        suggestions.push('Enable spending alerts for this category');
        break;

      case 'budget_exceeded':
        suggestions.push('Review and adjust your budget for next month');
        suggestions.push('Identify which transactions pushed you over budget');
        suggestions.push('Set up notifications when approaching budget limits');
        suggestions.push('Consider using the envelope budgeting method');
        break;

      case 'unusual_pattern':
        suggestions.push(`Create a consistent monthly budget for ${pattern.categoryName.toLowerCase()}`);
        suggestions.push('Track your spending more frequently');
        suggestions.push('Set up automatic savings for this category');
        suggestions.push('Consider using weekly spending limits');
        break;

      case 'trend_change':
        suggestions.push('Investigate what\'s driving the increased spending');
        suggestions.push('Look for subscription services you might have forgotten');
        suggestions.push('Consider if this increase is temporary or permanent');
        suggestions.push('Adjust your overall budget to accommodate this trend');
        break;
    }

    return suggestions;
  }

  /**
   * Generate mock spending data for testing
   */
  public generateMockSpendingData(): CategorySpendingData[] {
    return [
      {
        categoryId: 'food-dining',
        categoryName: 'Food & Dining',
        currentMonthAmount: 650, // 33% higher than usual
        previousMonthAmount: 487,
        last6MonthsAmounts: [420, 380, 450, 490, 487, 520],
        budget: 500,
        icon: '🍔',
        color: '#FF6B6B',
      },
      {
        categoryId: 'transport',
        categoryName: 'Transport',
        currentMonthAmount: 320,
        previousMonthAmount: 299,
        last6MonthsAmounts: [280, 290, 310, 295, 299, 285],
        budget: 350,
        icon: '🚗',
        color: '#4ECDC4',
      },
      {
        categoryId: 'groceries',
        categoryName: 'Groceries',
        currentMonthAmount: 234,
        previousMonthAmount: 240,
        last6MonthsAmounts: [220, 235, 245, 230, 240, 238],
        budget: 300,
        icon: '🛒',
        color: '#45B7D1',
      },
      {
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        currentMonthAmount: 420, // Way over budget
        previousMonthAmount: 179,
        last6MonthsAmounts: [150, 160, 170, 165, 179, 155],
        budget: 200,
        icon: '🎬',
        color: '#96CEB4',
      },
      {
        categoryId: 'bills',
        categoryName: 'Bills',
        currentMonthAmount: 303,
        previousMonthAmount: 302,
        last6MonthsAmounts: [300, 305, 298, 302, 302, 301],
        icon: '📱',
        color: '#FECA57',
      },
    ];
  }
}

export default SpendingAnalyticsService;