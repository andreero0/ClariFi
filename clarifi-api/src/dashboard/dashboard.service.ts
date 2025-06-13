import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface FinancialSummary {
  income: number;
  expenses: number;
  savings: number;
  budget: number;
  period: 'current_month' | 'last_month' | 'last_30_days';
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  merchantName: string | null;
}

export interface BudgetComparison {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
  status: 'under' | 'over' | 'on_track';
  remainingAmount: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDate: string | null;
  status: string;
  description: string | null;
  iconName: string | null;
}

export interface DashboardInsight {
  id: string;
  type: 'spending_alert' | 'budget_warning' | 'goal_progress' | 'savings_opportunity';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  actionable: boolean;
  metadata?: any;
}

export interface DashboardData {
  summary: FinancialSummary;
  spendingByCategory: SpendingByCategory[];
  recentTransactions: RecentTransaction[];
  budgetComparisons: BudgetComparison[];
  financialGoals: FinancialGoal[];
  insights: DashboardInsight[];
  lastUpdated: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string, period: 'current_month' | 'last_month' | 'last_30_days' = 'current_month'): Promise<DashboardData> {
    const { startDate, endDate } = this.getDateRange(period);
    
    // Get all data in parallel for better performance
    const [
      summary,
      spendingByCategory,
      recentTransactions,
      budgetComparisons,
      financialGoals
    ] = await Promise.all([
      this.getFinancialSummary(userId, startDate, endDate, period),
      this.getSpendingByCategory(userId, startDate, endDate),
      this.getRecentTransactions(userId, 10),
      this.getBudgetComparisons(userId, startDate, endDate),
      this.getFinancialGoals(userId)
    ]);

    // Generate insights based on the data
    const insights = this.generateInsights(summary, spendingByCategory, budgetComparisons, financialGoals);

    return {
      summary,
      spendingByCategory,
      recentTransactions,
      budgetComparisons,
      financialGoals,
      insights,
      lastUpdated: new Date().toISOString()
    };
  }

  private getDateRange(period: 'current_month' | 'last_month' | 'last_30_days') {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
    }

    return { startDate, endDate };
  }

  private async getFinancialSummary(userId: string, startDate: Date, endDate: Date, period: 'current_month' | 'last_month' | 'last_30_days'): Promise<FinancialSummary> {
    // Get income (positive amounts)
    const incomeResult = await this.prisma.transactions.aggregate({
      where: {
        user_id: userId,
        date: { gte: startDate, lte: endDate },
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    });

    // Get expenses (negative amounts)
    const expensesResult = await this.prisma.transactions.aggregate({
      where: {
        user_id: userId,
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 }
      },
      _sum: { amount: true }
    });

    // Get total budget for the period
    let budgetDate: Date;
    if (period === 'last_30_days') {
      budgetDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else {
      budgetDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    }

    const budgetResult = await this.prisma.budgets.aggregate({
      where: {
        user_id: userId,
        budget_month: budgetDate
      },
      _sum: { amount: true }
    });

    const income = this.decimalToNumber(incomeResult._sum.amount) || 0;
    const expenses = Math.abs(this.decimalToNumber(expensesResult._sum.amount) || 0);
    const budget = this.decimalToNumber(budgetResult._sum.amount) || 0;
    const savings = income - expenses;

    return {
      income,
      expenses,
      savings,
      budget,
      period
    };
  }

  private async getSpendingByCategory(userId: string, startDate: Date, endDate: Date): Promise<SpendingByCategory[]> {
    const spending = await this.prisma.transactions.groupBy({
      by: ['category_id'],
      where: {
        user_id: userId,
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 } // Only expenses
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Get category details
    const categoryIds = spending.map(s => s.category_id).filter((id): id is string => Boolean(id));
    const categories = await this.prisma.categories.findMany({
      where: { id: { in: categoryIds } }
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Calculate total expenses for percentage calculation
    const totalExpenses = spending.reduce((sum, s) => sum + Math.abs(this.decimalToNumber(s._sum.amount) || 0), 0);

    // Get previous period data for trend calculation
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousPeriodEnd = startDate;

    const previousSpending = await this.prisma.transactions.groupBy({
      by: ['category_id'],
      where: {
        user_id: userId,
        date: { gte: previousPeriodStart, lte: previousPeriodEnd },
        amount: { lt: 0 }
      },
      _sum: { amount: true }
    });

    const previousSpendingMap = new Map(
      previousSpending.map(s => [s.category_id, Math.abs(this.decimalToNumber(s._sum.amount) || 0)])
    );

    return spending.map(s => {
      const amount = Math.abs(this.decimalToNumber(s._sum.amount) || 0);
      const category = categoryMap.get(s.category_id || '');
      const previousAmount = previousSpendingMap.get(s.category_id || '') || 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;
      
      if (previousAmount > 0) {
        const change = ((amount - previousAmount) / previousAmount) * 100;
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
        trendPercentage = Math.abs(change);
      } else if (amount > 0) {
        trend = 'up';
        trendPercentage = 100;
      }

      return {
        categoryId: s.category_id || 'uncategorized',
        categoryName: category?.name || 'Uncategorized',
        categoryIcon: category?.icon_name || null,
        categoryColor: category?.color_hex || null,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        transactionCount: s._count.id,
        trend,
        trendPercentage: Math.round(trendPercentage)
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  private async getRecentTransactions(userId: string, limit: number = 10): Promise<RecentTransaction[]> {
    const transactions = await this.prisma.transactions.findMany({
      where: { user_id: userId },
      include: {
        category: true,
        merchant: true
      },
      orderBy: { date: 'desc' },
      take: limit
    });

    return transactions.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      amount: this.decimalToNumber(t.amount),
      type: t.type,
      categoryName: t.category?.name || null,
      categoryIcon: t.category?.icon_name || null,
      categoryColor: t.category?.color_hex || null,
      merchantName: t.merchant?.display_name || null
    }));
  }

  private async getBudgetComparisons(userId: string, startDate: Date, endDate: Date): Promise<BudgetComparison[]> {
    const budgetMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    const budgets = await this.prisma.budgets.findMany({
      where: {
        user_id: userId,
        budget_month: budgetMonth
      },
      include: { category: true }
    });

    const comparisons: BudgetComparison[] = [];

    for (const budget of budgets) {
      const actualSpending = await this.prisma.transactions.aggregate({
        where: {
          user_id: userId,
          category_id: budget.category_id,
          date: { gte: startDate, lte: endDate },
          amount: { lt: 0 }
        },
        _sum: { amount: true }
      });

      const budgetAmount = this.decimalToNumber(budget.amount);
      const actualAmount = Math.abs(this.decimalToNumber(actualSpending._sum.amount) || 0);
      const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;
      
      let status: 'under' | 'over' | 'on_track' = 'under';
      if (percentage > 100) status = 'over';
      else if (percentage > 80) status = 'on_track';

      comparisons.push({
        categoryId: budget.category_id,
        categoryName: budget.category.name,
        budgetAmount,
        actualAmount,
        percentage: Math.round(percentage),
        status,
        remainingAmount: budgetAmount - actualAmount
      });
    }

    return comparisons.sort((a, b) => b.percentage - a.percentage);
  }

  private async getFinancialGoals(userId: string): Promise<FinancialGoal[]> {
    const goals = await this.prisma.financial_goals.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    return goals.map(g => {
      const targetAmount = this.decimalToNumber(g.target_amount);
      const currentAmount = this.decimalToNumber(g.current_amount);
      const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      return {
        id: g.id,
        name: g.name,
        targetAmount,
        currentAmount,
        percentage: Math.round(percentage),
        targetDate: g.target_date?.toISOString().split('T')[0] || null,
        status: g.status,
        description: g.description,
        iconName: g.icon_name
      };
    });
  }

  private generateInsights(
    summary: FinancialSummary,
    spending: SpendingByCategory[],
    budgets: BudgetComparison[],
    goals: FinancialGoal[]
  ): DashboardInsight[] {
    const insights: DashboardInsight[] = [];

    // Budget warnings
    const overBudgetCategories = budgets.filter(b => b.status === 'over');
    if (overBudgetCategories.length > 0) {
      insights.push({
        id: 'budget_exceeded',
        type: 'budget_warning',
        title: 'Budget Exceeded',
        description: `You've exceeded your budget in ${overBudgetCategories.length} categor${overBudgetCategories.length === 1 ? 'y' : 'ies'}`,
        severity: 'warning',
        actionable: true,
        metadata: { categories: overBudgetCategories.map(c => c.categoryName) }
      });
    }

    // Spending alerts
    const topSpendingCategory = spending[0];
    if (topSpendingCategory && topSpendingCategory.trend === 'up' && topSpendingCategory.trendPercentage > 20) {
      insights.push({
        id: 'spending_increase',
        type: 'spending_alert',
        title: 'Spending Increase',
        description: `Your ${topSpendingCategory.categoryName} spending increased by ${topSpendingCategory.trendPercentage}%`,
        severity: 'info',
        actionable: true,
        metadata: { category: topSpendingCategory.categoryName, increase: topSpendingCategory.trendPercentage }
      });
    }

    // Goal progress
    const nearGoals = goals.filter(g => g.percentage >= 80 && g.percentage < 100);
    if (nearGoals.length > 0) {
      insights.push({
        id: 'goal_progress',
        type: 'goal_progress',
        title: 'Goal Almost Reached',
        description: `You're ${nearGoals[0].percentage}% of the way to your ${nearGoals[0].name} goal!`,
        severity: 'success',
        actionable: false,
        metadata: { goalName: nearGoals[0].name, percentage: nearGoals[0].percentage }
      });
    }

    // Savings opportunity
    if (summary.savings > 0 && summary.income > 0) {
      const savingsRate = (summary.savings / summary.income) * 100;
      if (savingsRate > 20) {
        insights.push({
          id: 'savings_opportunity',
          type: 'savings_opportunity',
          title: 'Great Savings Rate',
          description: `You're saving ${Math.round(savingsRate)}% of your income this month!`,
          severity: 'success',
          actionable: false,
          metadata: { savingsRate: Math.round(savingsRate) }
        });
      }
    }

    return insights;
  }

  private decimalToNumber(decimal: Decimal | null): number {
    if (!decimal) return 0;
    return parseFloat(decimal.toString());
  }

  async getTransactionsByCategory(userId: string, categoryId: string, period: 'current_month' | 'last_month' | 'last_30_days' = 'current_month'): Promise<RecentTransaction[]> {
    const { startDate, endDate } = this.getDateRange(period);

    const transactions = await this.prisma.transactions.findMany({
      where: {
        user_id: userId,
        category_id: categoryId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        category: true,
        merchant: true
      },
      orderBy: { date: 'desc' }
    });

    return transactions.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      amount: this.decimalToNumber(t.amount),
      type: t.type,
      categoryName: t.category?.name || null,
      categoryIcon: t.category?.icon_name || null,
      categoryColor: t.category?.color_hex || null,
      merchantName: t.merchant?.display_name || null
    }));
  }

  async getSpendingTrends(userId: string, months: number = 6): Promise<Array<{month: string, totalSpending: number, categoryBreakdown: SpendingByCategory[]}>> {
    const trends: Array<{month: string, totalSpending: number, categoryBreakdown: SpendingByCategory[]}> = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const spendingByCategory = await this.getSpendingByCategory(userId, startDate, endDate);
      const totalSpending = spendingByCategory.reduce((sum, category) => sum + category.amount, 0);
      
      trends.push({
        month: startDate.toISOString().slice(0, 7), // YYYY-MM format
        totalSpending,
        categoryBreakdown: spendingByCategory
      });
    }

    return trends.reverse(); // Return oldest to newest
  }
}