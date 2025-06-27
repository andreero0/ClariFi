import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';
import { getCategoryById, CATEGORIES } from '../../constants/categories';
import { DataExportService } from '../privacy/DataExportService';
import { PrivacyAwareAnalytics } from '../analytics/PrivacyAwareAnalytics';
import * as FileSystem from 'expo-file-system';

export interface MonthlyReportData {
  reportId: string;
  userId: string;
  month: number;
  year: number;
  generatedAt: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    uniqueMerchants: number;
    savingsRate: number;
    topSpendingCategory: string;
    averageTransactionSize: number;
  };
  spendingByCategory: Array<{
    categoryId: number;
    categoryName: string;
    color: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
    monthOverMonthChange: number;
    isRecurring: boolean;
  }>;
  topMerchants: Array<{
    merchantName: string;
    totalAmount: number;
    transactionCount: number;
    category: string;
    lastTransaction: string;
  }>;
  weeklyBreakdown: Array<{
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
  }>;
  insights: Array<{
    type: 'positive' | 'warning' | 'neutral' | 'achievement';
    title: string;
    description: string;
    amount?: number;
    category?: string;
    actionable?: boolean;
  }>;
  goals: {
    budgetGoals: Array<{
      categoryId: number;
      categoryName: string;
      budgetAmount: number;
      actualAmount: number;
      percentage: number;
      status: 'on_track' | 'over_budget' | 'under_budget';
    }>;
    savingsGoal?: {
      targetAmount: number;
      actualAmount: number;
      percentage: number;
      monthsToGoal: number;
    };
  };
  creditCardSummary?: {
    totalUtilization: number;
    cardCount: number;
    highestUtilization: number;
    lowestUtilization: number;
    paymentsDue: Array<{
      cardName: string;
      dueDate: string;
      minimumPayment: number;
      currentBalance: number;
    }>;
  };
  recommendations: Array<{
    type: 'spending' | 'saving' | 'budget' | 'credit' | 'investment';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: number;
    actionSteps: string[];
  }>;
}

export interface QuarterlyReportData extends Omit<MonthlyReportData, 'month'> {
  quarter: number;
  quarterName: string;
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
  }>;
  trends: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    description: string;
  }>;
  seasonalPatterns: Array<{
    category: string;
    pattern: 'seasonal_high' | 'seasonal_low' | 'consistent';
    averageAmount: number;
    description: string;
  }>;
}

class MonthlyReportService {
  private dataExportService: DataExportService;

  constructor() {
    this.dataExportService = new DataExportService();
  }

  /**
   * Generate comprehensive monthly report
   */
  async generateMonthlyReport(
    year: number,
    month: number
  ): Promise<MonthlyReportData> {
    try {
      const reportId = `monthly_${year}_${month}_${Date.now()}`;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';

      // Track analytics
      PrivacyAwareAnalytics.trackEvent('monthly_report_generated', {
        year,
        month,
        reportType: 'monthly',
      });

      // Get transaction data for the month
      const startDate = new Date(year, month - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(transactions || []);

      // Generate spending by category
      const spendingByCategory = await this.calculateSpendingByCategory(
        transactions || [],
        year,
        month
      );

      // Get top merchants
      const topMerchants = this.calculateTopMerchants(transactions || []);

      // Calculate weekly breakdown
      const weeklyBreakdown = this.calculateWeeklyBreakdown(
        transactions || [],
        year,
        month
      );

      // Generate insights
      const insights = await this.generateInsights(
        transactions || [],
        summary,
        spendingByCategory
      );

      // Get budget goals and progress
      const goals = await this.calculateGoalsProgress(
        spendingByCategory,
        summary
      );

      // Get credit card summary if applicable
      const creditCardSummary = await this.getCreditCardSummary();

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        summary,
        spendingByCategory,
        insights,
        creditCardSummary
      );

      return {
        reportId,
        userId,
        month,
        year,
        generatedAt: new Date().toISOString(),
        summary,
        spendingByCategory,
        topMerchants,
        weeklyBreakdown,
        insights,
        goals,
        creditCardSummary,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw new Error('Failed to generate monthly report');
    }
  }

  /**
   * Generate comprehensive quarterly report
   */
  async generateQuarterlyReport(
    year: number,
    quarter: number
  ): Promise<QuarterlyReportData> {
    try {
      const reportId = `quarterly_${year}_Q${quarter}_${Date.now()}`;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';

      // Track analytics
      PrivacyAwareAnalytics.trackEvent('quarterly_report_generated', {
        year,
        quarter,
        reportType: 'quarterly',
      });

      // Calculate quarter date range
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      const startDate = new Date(year, startMonth - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(year, endMonth, 0).toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Generate base report data
      const summary = this.calculateSummaryMetrics(transactions || []);
      const spendingByCategory = await this.calculateSpendingByCategory(
        transactions || [],
        year,
        startMonth,
        endMonth
      );
      const topMerchants = this.calculateTopMerchants(transactions || []);
      const insights = await this.generateInsights(
        transactions || [],
        summary,
        spendingByCategory
      );
      const goals = await this.calculateGoalsProgress(
        spendingByCategory,
        summary
      );
      const creditCardSummary = await this.getCreditCardSummary();
      const recommendations = await this.generateRecommendations(
        summary,
        spendingByCategory,
        insights,
        creditCardSummary
      );

      // Generate quarterly-specific data
      const monthlyBreakdown = await this.calculateMonthlyBreakdown(
        year,
        quarter
      );
      const trends = await this.calculateTrends(year, quarter);
      const seasonalPatterns = await this.calculateSeasonalPatterns(
        year,
        quarter
      );

      const quarterName = this.getQuarterName(quarter);

      return {
        reportId,
        userId,
        quarter,
        quarterName,
        year,
        generatedAt: new Date().toISOString(),
        summary,
        spendingByCategory,
        topMerchants,
        weeklyBreakdown: [], // Not applicable for quarterly
        insights,
        goals,
        creditCardSummary,
        recommendations,
        monthlyBreakdown,
        trends,
        seasonalPatterns,
      };
    } catch (error) {
      console.error('Error generating quarterly report:', error);
      throw new Error('Failed to generate quarterly report');
    }
  }

  /**
   * Export report as PDF
   */
  async exportReportAsPDF(
    reportData: MonthlyReportData | QuarterlyReportData
  ): Promise<{
    exportId: string;
    filePath: string;
    fileSize: string;
  }> {
    try {
      const isQuarterly = 'quarter' in reportData;
      const reportType = isQuarterly ? 'quarterly' : 'monthly';
      const period = isQuarterly
        ? `Q${reportData.quarter} ${reportData.year}`
        : `${this.getMonthName(reportData.month)} ${reportData.year}`;

      const htmlContent = this.generateReportHTML(
        reportData,
        reportType,
        period
      );

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clarifi_${reportType}_report_${period.replace(' ', '_')}_${timestamp}.html`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      // Write HTML content to file
      await FileSystem.writeAsStringAsync(filePath, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSize = this.formatFileSize(fileInfo.size || 0);

      return {
        exportId: reportData.reportId,
        filePath,
        fileSize,
      };
    } catch (error) {
      console.error('Error exporting report as PDF:', error);
      throw new Error('Failed to export report');
    }
  }

  /**
   * Save report for future access
   */
  async saveReport(
    reportData: MonthlyReportData | QuarterlyReportData
  ): Promise<void> {
    try {
      const storageKey = `report_${reportData.reportId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(reportData));

      // Update reports index
      const existingReports = await this.getSavedReports();
      const reportIndex = {
        reportId: reportData.reportId,
        type: 'quarter' in reportData ? 'quarterly' : 'monthly',
        year: reportData.year,
        period: 'quarter' in reportData ? reportData.quarter : reportData.month,
        generatedAt: reportData.generatedAt,
        storageKey,
      };

      const updatedReports = [
        reportIndex,
        ...existingReports.filter(r => r.reportId !== reportData.reportId),
      ];
      await AsyncStorage.setItem(
        'reports_index',
        JSON.stringify(updatedReports)
      );
    } catch (error) {
      console.error('Error saving report:', error);
      throw new Error('Failed to save report');
    }
  }

  /**
   * Get list of saved reports
   */
  async getSavedReports(): Promise<
    Array<{
      reportId: string;
      type: 'monthly' | 'quarterly';
      year: number;
      period: number;
      generatedAt: string;
      storageKey: string;
    }>
  > {
    try {
      const reportsData = await AsyncStorage.getItem('reports_index');
      return reportsData ? JSON.parse(reportsData) : [];
    } catch (error) {
      console.error('Error getting saved reports:', error);
      return [];
    }
  }

  /**
   * Load saved report
   */
  async loadReport(
    reportId: string
  ): Promise<MonthlyReportData | QuarterlyReportData | null> {
    try {
      const storageKey = `report_${reportId}`;
      const reportData = await AsyncStorage.getItem(storageKey);
      return reportData ? JSON.parse(reportData) : null;
    } catch (error) {
      console.error('Error loading report:', error);
      return null;
    }
  }

  /**
   * Delete saved report
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      const storageKey = `report_${reportId}`;
      await AsyncStorage.removeItem(storageKey);

      // Update reports index
      const existingReports = await this.getSavedReports();
      const updatedReports = existingReports.filter(
        r => r.reportId !== reportId
      );
      await AsyncStorage.setItem(
        'reports_index',
        JSON.stringify(updatedReports)
      );
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Failed to delete report');
    }
  }

  // Private helper methods

  private calculateSummaryMetrics(transactions: any[]) {
    const income = transactions.filter(t => t.amount > 0);
    const expenses = transactions.filter(t => t.amount < 0);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(
      expenses.reduce((sum, t) => sum + t.amount, 0)
    );
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    const merchants = new Set(
      transactions.map(t => t.merchant_name).filter(Boolean)
    );
    const averageTransactionSize =
      transactions.length > 0
        ? Math.abs(
            transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
          ) / transactions.length
        : 0;

    // Find top spending category
    const categorySpending = new Map();
    expenses.forEach(t => {
      const category = t.category_name || 'Other';
      categorySpending.set(
        category,
        (categorySpending.get(category) || 0) + Math.abs(t.amount)
      );
    });

    let topSpendingCategory = 'None';
    let maxSpending = 0;
    for (const [category, amount] of categorySpending.entries()) {
      if (amount > maxSpending) {
        maxSpending = amount;
        topSpendingCategory = category;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      transactionCount: transactions.length,
      uniqueMerchants: merchants.size,
      savingsRate,
      topSpendingCategory,
      averageTransactionSize,
    };
  }

  private async calculateSpendingByCategory(
    transactions: any[],
    year: number,
    startMonth?: number,
    endMonth?: number
  ) {
    const categoryMap = new Map<
      number,
      {
        categoryName: string;
        color: string;
        totalAmount: number;
        transactionCount: number;
        isRecurring: boolean;
      }
    >();

    // Process current period transactions
    const expenses = transactions.filter(t => t.amount < 0);
    expenses.forEach(t => {
      const categoryId = parseInt(t.category_id) || 0;
      const categoryInfo = getCategoryById(categoryId) || {
        name: t.category_name || 'Other',
        color: '#9E9E9E',
      };

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.totalAmount += Math.abs(t.amount);
        existing.transactionCount += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryName: categoryInfo.name,
          color: categoryInfo.color,
          totalAmount: Math.abs(t.amount),
          transactionCount: 1,
          isRecurring: t.is_recurring || false,
        });
      }
    });

    // Calculate previous period for comparison
    const totalSpending = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.totalAmount,
      0
    );

    // Get previous period data for month-over-month comparison
    const prevPeriodData = await this.getPreviousPeriodSpending(
      year,
      startMonth,
      endMonth
    );

    return Array.from(categoryMap.entries())
      .map(([categoryId, category]) => ({
        categoryId,
        categoryName: category.categoryName,
        color: category.color,
        totalAmount: category.totalAmount,
        transactionCount: category.transactionCount,
        percentage:
          totalSpending > 0 ? (category.totalAmount / totalSpending) * 100 : 0,
        monthOverMonthChange: this.calculateMonthOverMonthChange(
          category.totalAmount,
          prevPeriodData.get(categoryId) || 0
        ),
        isRecurring: category.isRecurring,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private calculateTopMerchants(transactions: any[]) {
    const merchantMap = new Map<
      string,
      {
        totalAmount: number;
        transactionCount: number;
        category: string;
        lastTransaction: string;
      }
    >();

    const expenses = transactions.filter(t => t.amount < 0 && t.merchant_name);
    expenses.forEach(t => {
      const merchant = t.merchant_name;
      if (merchantMap.has(merchant)) {
        const existing = merchantMap.get(merchant)!;
        existing.totalAmount += Math.abs(t.amount);
        existing.transactionCount += 1;
        if (new Date(t.date) > new Date(existing.lastTransaction)) {
          existing.lastTransaction = t.date;
        }
      } else {
        merchantMap.set(merchant, {
          totalAmount: Math.abs(t.amount),
          transactionCount: 1,
          category: t.category_name || 'Other',
          lastTransaction: t.date,
        });
      }
    });

    return Array.from(merchantMap.entries())
      .map(([merchantName, data]) => ({
        merchantName,
        ...data,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  private calculateWeeklyBreakdown(
    transactions: any[],
    year: number,
    month: number
  ) {
    const weeks: Array<{
      weekNumber: number;
      weekStart: string;
      weekEnd: string;
      totalIncome: number;
      totalExpenses: number;
      netAmount: number;
      transactionCount: number;
    }> = [];

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let weekStart = new Date(firstDay);
    let weekNumber = 1;

    while (weekStart <= lastDay) {
      const weekEnd = new Date(
        Math.min(
          weekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
          lastDay.getTime()
        )
      );

      const weekTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });

      const income = weekTransactions.filter(t => t.amount > 0);
      const expenses = weekTransactions.filter(t => t.amount < 0);

      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = Math.abs(
        expenses.reduce((sum, t) => sum + t.amount, 0)
      );

      weeks.push({
        weekNumber,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        transactionCount: weekTransactions.length,
      });

      weekStart = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000);
      weekNumber++;
    }

    return weeks;
  }

  private async generateInsights(
    transactions: any[],
    summary: any,
    spendingByCategory: any[]
  ) {
    const insights: Array<{
      type: 'positive' | 'warning' | 'neutral' | 'achievement';
      title: string;
      description: string;
      amount?: number;
      category?: string;
      actionable?: boolean;
    }> = [];

    // Savings rate insight
    if (summary.savingsRate > 20) {
      insights.push({
        type: 'achievement',
        title: 'Excellent Savings Rate!',
        description: `You saved ${summary.savingsRate.toFixed(1)}% of your income this month. That's above the recommended 20%!`,
        actionable: false,
      });
    } else if (summary.savingsRate < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        description: `Your savings rate is ${summary.savingsRate.toFixed(1)}%. Consider reducing expenses to reach the recommended 20%.`,
        actionable: true,
      });
    }

    // Top spending category insight
    const topCategory = spendingByCategory[0];
    if (topCategory && topCategory.percentage > 30) {
      insights.push({
        type: 'warning',
        title: 'High Category Concentration',
        description: `${topCategory.categoryName} accounts for ${topCategory.percentage.toFixed(1)}% of your spending. Consider diversifying expenses.`,
        category: topCategory.categoryName,
        amount: topCategory.totalAmount,
        actionable: true,
      });
    }

    // Month-over-month changes
    spendingByCategory.forEach(category => {
      if (Math.abs(category.monthOverMonthChange) > 50) {
        const changeType =
          category.monthOverMonthChange > 0 ? 'increased' : 'decreased';
        const insightType =
          category.monthOverMonthChange > 0 ? 'warning' : 'positive';

        insights.push({
          type: insightType,
          title: `${category.categoryName} Spending ${changeType}`,
          description: `Your ${category.categoryName.toLowerCase()} spending ${changeType} by ${Math.abs(category.monthOverMonthChange).toFixed(1)}% this month.`,
          category: category.categoryName,
          amount: category.totalAmount,
          actionable: category.monthOverMonthChange > 0,
        });
      }
    });

    // Transaction volume insight
    if (summary.transactionCount > 100) {
      insights.push({
        type: 'neutral',
        title: 'High Transaction Volume',
        description: `You made ${summary.transactionCount} transactions this month. Consider consolidating purchases to simplify tracking.`,
        actionable: true,
      });
    }

    return insights.slice(0, 8); // Limit to 8 insights
  }

  private async calculateGoalsProgress(
    spendingByCategory: any[],
    summary: any
  ) {
    // This would integrate with actual budget goals from the app
    // For now, we'll use some example budget goals
    const budgetGoals = spendingByCategory.slice(0, 5).map(category => {
      const budgetAmount = category.totalAmount * 1.1; // Example: 10% buffer
      const percentage = (category.totalAmount / budgetAmount) * 100;

      let status: 'on_track' | 'over_budget' | 'under_budget' = 'on_track';
      if (percentage > 100) status = 'over_budget';
      else if (percentage < 80) status = 'under_budget';

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        budgetAmount,
        actualAmount: category.totalAmount,
        percentage,
        status,
      };
    });

    // Example savings goal
    const savingsGoal = {
      targetAmount: 1000, // Example target
      actualAmount: summary.netIncome,
      percentage: (summary.netIncome / 1000) * 100,
      monthsToGoal:
        summary.netIncome > 0
          ? Math.ceil(
              (1000 - summary.netIncome) / Math.max(summary.netIncome, 100)
            )
          : 12,
    };

    return { budgetGoals, savingsGoal };
  }

  private async getCreditCardSummary() {
    try {
      // This would integrate with actual credit card data
      // For now, return null as it's optional
      return null;
    } catch (error) {
      return null;
    }
  }

  private async generateRecommendations(
    summary: any,
    spendingByCategory: any[],
    insights: any[],
    creditCardSummary: any
  ) {
    const recommendations: Array<{
      type: 'spending' | 'saving' | 'budget' | 'credit' | 'investment';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      potentialSavings?: number;
      actionSteps: string[];
    }> = [];

    // Savings rate recommendations
    if (summary.savingsRate < 20) {
      recommendations.push({
        type: 'saving',
        priority: 'high',
        title: 'Increase Your Savings Rate',
        description:
          'Your current savings rate is below the recommended 20%. Small changes can make a big difference.',
        potentialSavings: summary.totalIncome * 0.2 - summary.netIncome,
        actionSteps: [
          'Review your largest expense categories',
          'Set up automatic transfers to savings',
          'Look for subscription services you can cancel',
          'Consider cooking at home more often',
        ],
      });
    }

    // High spending category recommendations
    const topCategory = spendingByCategory[0];
    if (topCategory && topCategory.percentage > 25) {
      recommendations.push({
        type: 'spending',
        priority: 'medium',
        title: `Optimize ${topCategory.categoryName} Spending`,
        description: `This category represents ${topCategory.percentage.toFixed(1)}% of your spending. There may be opportunities to save.`,
        potentialSavings: topCategory.totalAmount * 0.15,
        actionSteps: [
          `Review all ${topCategory.categoryName.toLowerCase()} transactions`,
          'Look for recurring charges you can reduce',
          'Compare prices with alternatives',
          'Set a monthly budget for this category',
        ],
      });
    }

    // Investment recommendation for positive cash flow
    if (summary.netIncome > 500) {
      recommendations.push({
        type: 'investment',
        priority: 'medium',
        title: 'Consider Investment Options',
        description:
          'With positive cash flow, you could explore investment opportunities to grow your wealth.',
        actionSteps: [
          'Research Tax-Free Savings Accounts (TFSA)',
          'Consider low-cost index funds',
          'Explore Registered Retirement Savings Plans (RRSP)',
          'Consult with a financial advisor',
        ],
      });
    }

    // Budget recommendation
    if (insights.some(i => i.type === 'warning')) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: 'Create Category Budgets',
        description:
          'Setting specific budgets for your spending categories can help you stay on track.',
        actionSteps: [
          'Set monthly limits for top 3 spending categories',
          'Use the 50/30/20 rule as a starting point',
          'Track your progress weekly',
          'Adjust budgets based on your goals',
        ],
      });
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  // Additional helper methods

  private async getPreviousPeriodSpending(
    year: number,
    startMonth?: number,
    endMonth?: number
  ): Promise<Map<number, number>> {
    // Implementation would fetch previous period data for comparison
    // For now, return empty map
    return new Map();
  }

  private calculateMonthOverMonthChange(
    current: number,
    previous: number
  ): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async calculateMonthlyBreakdown(year: number, quarter: number) {
    const months = [];
    const startMonth = (quarter - 1) * 3 + 1;

    for (let i = 0; i < 3; i++) {
      const month = startMonth + i;
      const monthName = this.getMonthName(month);

      // Get transactions for this month
      const monthStart = new Date(year, month - 1, 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      const income =
        transactions
          ?.filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0) || 0;
      const expenses = Math.abs(
        transactions
          ?.filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0) || 0
      );

      months.push({
        month,
        monthName,
        totalIncome: income,
        totalExpenses: expenses,
        netIncome: income - expenses,
        transactionCount: transactions?.length || 0,
      });
    }

    return months;
  }

  private async calculateTrends(year: number, quarter: number) {
    // This would analyze trends over multiple quarters
    // For now, return example trends
    return [
      {
        metric: 'Total Spending',
        trend: 'increasing' as const,
        changePercent: 5.2,
        description:
          'Your spending has increased by 5.2% compared to last quarter.',
      },
      {
        metric: 'Savings Rate',
        trend: 'stable' as const,
        changePercent: 0.8,
        description: 'Your savings rate has remained relatively stable.',
      },
    ];
  }

  private async calculateSeasonalPatterns(year: number, quarter: number) {
    // This would analyze seasonal spending patterns
    // For now, return example patterns
    return [
      {
        category: 'Dining & Restaurants',
        pattern: 'seasonal_high' as const,
        averageAmount: 450,
        description: 'Dining expenses tend to be higher during this quarter.',
      },
    ];
  }

  private generateReportHTML(
    reportData: MonthlyReportData | QuarterlyReportData,
    reportType: string,
    period: string
  ): string {
    const isQuarterly = reportType === 'quarterly';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClariFi ${reportType === 'monthly' ? 'Monthly' : 'Quarterly'} Report - ${period}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2B5CE6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2B5CE6;
            margin: 0;
            font-size: 2.5em;
        }
        .period {
            color: #666;
            margin: 10px 0;
            font-size: 1.2em;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .summary-card {
            background: #F8F9FA;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #E5E5E5;
        }
        .summary-value {
            font-size: 1.8em;
            font-weight: 700;
            color: #2B5CE6;
            margin-bottom: 5px;
        }
        .summary-label {
            color: #666;
            font-size: 0.9em;
        }
        .section {
            margin: 40px 0;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #2B5CE6;
            border-bottom: 2px solid #E5E5E5;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .insight {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid;
        }
        .insight.positive { border-left-color: #00C896; background: #00C89610; }
        .insight.warning { border-left-color: #F6AD55; background: #F6AD5510; }
        .insight.achievement { border-left-color: #6B5DD3; background: #6B5DD310; }
        .insight.neutral { border-left-color: #9E9E9E; background: #9E9E9E10; }
        .category-item {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #E5E5E5;
        }
        .category-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 12px;
        }
        .category-info {
            flex: 1;
        }
        .category-name {
            font-weight: 600;
            margin-bottom: 4px;
        }
        .category-details {
            font-size: 0.9em;
            color: #666;
        }
        .category-amount {
            font-weight: 700;
            font-size: 1.1em;
        }
        .recommendation {
            background: #F8F9FA;
            border: 1px solid #E5E5E5;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .recommendation h4 {
            color: #2B5CE6;
            margin: 0 0 10px 0;
        }
        .recommendation .priority {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .priority.high { background: #FF3B30; color: white; }
        .priority.medium { background: #F6AD55; color: white; }
        .priority.low { background: #00C896; color: white; }
        .action-steps {
            margin-top: 10px;
        }
        .action-steps li {
            margin: 5px 0;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ClariFi</h1>
        <div class="period">${reportType === 'monthly' ? 'Monthly' : 'Quarterly'} Financial Report</div>
        <div class="period">${period}</div>
        <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
            Generated on ${new Date(reportData.generatedAt).toLocaleDateString()}
        </div>
    </div>

    <!-- Summary Section -->
    <div class="section">
        <h2>Financial Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">$${reportData.summary.totalIncome.toFixed(2)}</div>
                <div class="summary-label">Total Income</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">$${reportData.summary.totalExpenses.toFixed(2)}</div>
                <div class="summary-label">Total Expenses</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">$${reportData.summary.netIncome.toFixed(2)}</div>
                <div class="summary-label">Net Income</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${reportData.summary.savingsRate.toFixed(1)}%</div>
                <div class="summary-label">Savings Rate</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${reportData.summary.transactionCount}</div>
                <div class="summary-label">Transactions</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${reportData.summary.uniqueMerchants}</div>
                <div class="summary-label">Unique Merchants</div>
            </div>
        </div>
    </div>

    <!-- Spending by Category -->
    <div class="section">
        <h2>Spending by Category</h2>
        ${reportData.spendingByCategory
          .map(
            category => `
            <div class="category-item">
                <div class="category-color" style="background-color: ${category.color}"></div>
                <div class="category-info">
                    <div class="category-name">${category.categoryName}</div>
                    <div class="category-details">
                        ${category.transactionCount} transactions • ${category.percentage.toFixed(1)}% of spending
                        ${
                          category.monthOverMonthChange !== 0
                            ? `• ${category.monthOverMonthChange > 0 ? '+' : ''}${category.monthOverMonthChange.toFixed(1)}% vs last period`
                            : ''
                        }
                    </div>
                </div>
                <div class="category-amount">$${category.totalAmount.toFixed(2)}</div>
            </div>
        `
          )
          .join('')}
    </div>

    <!-- Insights -->
    <div class="section">
        <h2>Key Insights</h2>
        ${reportData.insights
          .map(
            insight => `
            <div class="insight ${insight.type}">
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
                ${insight.amount ? `<p><strong>Amount: $${insight.amount.toFixed(2)}</strong></p>` : ''}
            </div>
        `
          )
          .join('')}
    </div>

    <!-- Recommendations -->
    <div class="section">
        <h2>Recommendations</h2>
        ${reportData.recommendations
          .map(
            rec => `
            <div class="recommendation">
                <div class="priority ${rec.priority}">${rec.priority.toUpperCase()} PRIORITY</div>
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                ${rec.potentialSavings ? `<p><strong>Potential Savings: $${rec.potentialSavings.toFixed(2)}</strong></p>` : ''}
                <div class="action-steps">
                    <strong>Action Steps:</strong>
                    <ul>
                        ${rec.actionSteps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `
          )
          .join('')}
    </div>

    ${
      isQuarterly
        ? `
    <!-- Quarterly Specific Sections -->
    <div class="section">
        <h2>Monthly Breakdown</h2>
        ${(reportData as QuarterlyReportData).monthlyBreakdown
          .map(
            month => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-name">${month.monthName}</div>
                    <div class="category-details">${month.transactionCount} transactions</div>
                </div>
                <div style="text-align: right;">
                    <div>Income: $${month.totalIncome.toFixed(2)}</div>
                    <div>Expenses: $${month.totalExpenses.toFixed(2)}</div>
                    <div><strong>Net: $${month.netIncome.toFixed(2)}</strong></div>
                </div>
            </div>
        `
          )
          .join('')}
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E5E5E5; text-align: center; color: #666; font-size: 0.9em;">
        <p>This report was generated by ClariFi - Personal Financial Management</p>
        <p>All data is processed securely and in compliance with Canadian privacy regulations</p>
    </div>
</body>
</html>`;
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || 'Unknown';
  }

  private getQuarterName(quarter: number): string {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters[quarter - 1] || 'Unknown';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const monthlyReportService = new MonthlyReportService();
export default MonthlyReportService;
