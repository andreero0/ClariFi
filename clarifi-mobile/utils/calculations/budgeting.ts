/**
 * Contains utility functions for budget calculations, such as determining spending by category,
 * budget adherence, savings rate, and identifying unusual spending patterns.
 * Relevant for Feature 3: Instant Budget Dashboard & Insights.
 */

import {
  Transaction,
  Budget,
  MonthlySummary,
  Insight,
  TransactionsForMonth,
} from '../../services/storage/dataModels';

/**
 * Calculates total spending for each category from a list of transactions.
 * @param transactions Array of Transaction objects.
 * @returns An object mapping category_id to total spending in that category.
 */
export const calculateSpendingByCategory = (
  transactions: Transaction[]
): { [category_id: string]: number } => {
  return transactions.reduce(
    (acc, transaction) => {
      if (transaction.amount < 0) {
        // Assuming expenses are negative, income positive
        const category = transaction.category_id || 'uncategorized';
        acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    },
    {} as { [key: string]: number }
  );
};

/**
 * Calculates total income from a list of transactions.
 * @param transactions Array of Transaction objects.
 * @returns Total income.
 */
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, transaction) => {
    if (transaction.amount > 0) {
      sum += transaction.amount;
    }
    return sum;
  }, 0);
};

/**
 * Calculates total expenses from a list of transactions.
 * @param transactions Array of Transaction objects.
 * @returns Total expenses (as a positive number).
 */
export const calculateTotalExpenses = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, transaction) => {
    if (transaction.amount < 0) {
      sum += Math.abs(transaction.amount);
    }
    return sum;
  }, 0);
};

/**
 * Calculates the savings rate.
 * @param totalIncome Total income.
 * @param totalExpenses Total expenses.
 * @returns Savings rate percentage (e.g., 15 for 15%). Can be negative.
 */
export const calculateSavingsRate = (
  totalIncome: number,
  totalExpenses: number
): number => {
  if (totalIncome <= 0) {
    return 0; // Or handle as appropriate if no income
  }
  return ((totalIncome - totalExpenses) / totalIncome) * 100;
};

/**
 * Compares actual spending against budgets for each category.
 * @param spendingByCategory Object mapping category_id to actual spending.
 * @param budgets Array of Budget objects.
 * @returns Object mapping category_id to variance (budget - actual). Positive means under budget.
 */
export const calculateBudgetVariance = (
  spendingByCategory: { [category_id: string]: number },
  budgets: Budget[]
): {
  [category_id: string]: {
    budget: number;
    spent: number;
    variance: number;
    percentUsed: number;
  };
} => {
  const varianceResult: {
    [key: string]: {
      budget: number;
      spent: number;
      variance: number;
      percentUsed: number;
    };
  } = {};
  budgets.forEach(budget => {
    const spent = spendingByCategory[budget.category_id] || 0;
    varianceResult[budget.category_id] = {
      budget: budget.amount,
      spent,
      variance: budget.amount - spent,
      percentUsed:
        budget.amount > 0 ? (spent / budget.amount) * 100 : spent > 0 ? 100 : 0,
    };
  });
  return varianceResult;
};

/**
 * Identifies unusual spending based on historical averages (simplified for MVP).
 * @param currentMonthSpending Object mapping category_id to current month's spending.
 * @param historicalAverageSpending Object mapping category_id to historical average spending.
 * @param thresholdFactor Factor by which spending must exceed average to be unusual (e.g., 1.5 for 50% higher).
 * @returns Array of Insight objects for unusual spending.
 */
export const detectUnusualSpending = (
  currentMonthSpending: { [category_id: string]: number },
  historicalAverageSpending: {
    [category_id: string]: { average: number; count: number };
  }, // count is num of data points
  thresholdFactor: number = 1.5
): Insight[] => {
  const insights: Insight[] = [];
  for (const categoryId in currentMonthSpending) {
    if (
      historicalAverageSpending[categoryId] &&
      historicalAverageSpending[categoryId].count > 1
    ) {
      // Need some history
      const currentSpend = currentMonthSpending[categoryId];
      const avgSpend = historicalAverageSpending[categoryId].average;
      if (currentSpend > avgSpend * thresholdFactor) {
        insights.push({
          id: `unusual_${categoryId}_${new Date().toISOString()}`,
          type: 'unusual_spend',
          priority: 2,
          message: `Spending in ${categoryId} ($${currentSpend.toFixed(2)}) is significantly higher than your average of $${avgSpend.toFixed(2)}. `,
          action_data: { category_id: categoryId, currentSpend, avgSpend },
          created_at: new Date().toISOString(),
        });
      }
    }
  }
  return insights;
};

/**
 * Generates a summary for a given month's transactions.
 * @param transactions Transactions for the month.
 * @param budgets Optional budgets for variance calculation.
 * @param historicalData Optional historical data for trend/unusual spend detection.
 * @returns A MonthlySummary object.
 */
export const generateMonthlySummary = (
  transactions: Transaction[],
  budgets?: Budget[]
  // historicalAverageSpending?: { [category_id: string]: { average: number; count: number } }
): MonthlySummary => {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const spendingByCategory = calculateSpendingByCategory(transactions);

  const byDay: { [day_of_month: number]: number } = {};
  transactions.forEach(t => {
    if (t.amount < 0) {
      const day = new Date(t.date).getDate();
      byDay[day] = (byDay[day] || 0) + Math.abs(t.amount);
    }
  });

  const topMerchantsList = transactions
    .filter(t => t.amount < 0 && t.merchant_name)
    .reduce(
      (acc, t) => {
        const existing = acc.find(m => m.name === t.merchant_name!);
        if (existing) {
          existing.amount += Math.abs(t.amount);
          existing.count += 1;
        } else {
          acc.push({
            name: t.merchant_name!,
            amount: Math.abs(t.amount),
            count: 1,
          });
        }
        return acc;
      },
      [] as Array<{ name: string; amount: number; count: number }>
    )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const insights: Insight[] = [];
  // Example: Add a simple budget warning insight
  if (budgets) {
    const variance = calculateBudgetVariance(spendingByCategory, budgets);
    for (const catId in variance) {
      if (variance[catId].percentUsed > 100) {
        insights.push({
          id: `budget_over_${catId}_${new Date().toISOString()}`,
          type: 'budget_warning',
          priority: 1,
          message: `You are over budget in ${catId} by $${Math.abs(variance[catId].variance).toFixed(2)}. `,
          created_at: new Date().toISOString(),
          action_data: { category_id: catId },
        });
      }
    }
  }
  // if (historicalAverageSpending) {
  //   insights.push(...detectUnusualSpending(spendingByCategory, historicalAverageSpending));
  // }

  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    by_category: spendingByCategory,
    by_day: byDay,
    top_merchants: topMerchantsList,
    insights_generated: insights,
  };
};

/**
 * Bundles transactions with their summary for a given month.
 * @param YYYY_MM The month in YYYY-MM format (used as a key or identifier).
 * @param transactions The transactions for that month.
 * @param budgets Optional budgets for the month.
 * @returns A TransactionsForMonth object.
 */
export const packageTransactionsForMonth = (
  // YYYY_MM: string, // This might be handled by the calling storage function
  transactions: Transaction[],
  budgets?: Budget[]
  // historicalAverageSpending?: { [category_id: string]: { average: number; count: number } }
): TransactionsForMonth => {
  const summary = generateMonthlySummary(
    transactions,
    budgets /*, historicalAverageSpending */
  );
  return {
    items: transactions,
    summary: summary,
    // version: 1 // Example versioning
  };
};

console.log('utils/calculations/budgeting.ts loaded');

export {}; // Ensures this is treated as a module
