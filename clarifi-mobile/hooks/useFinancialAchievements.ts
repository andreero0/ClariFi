/**
 * useFinancialAchievements Hook
 * React hooks for tracking financial achievements and milestones
 */

import { useState, useEffect, useCallback } from 'react';
import FinancialAchievementService, {
  FinancialProgress,
  FinancialGoal,
  BudgetPeriod,
  FinancialMilestone,
} from '../services/achievements/FinancialAchievementService';
import { AchievementCategory } from '../types/achievements';
import { useAchievements } from '../context/AchievementContext';

interface FinancialAchievementHookReturn {
  // Data
  financialProgress: FinancialProgress | null;
  financialStats: {
    totalSaved: number;
    totalDebtReduced: number;
    transactionsCategorized: number;
    budgetStreak: number;
    educationProgress: number;
    goalsCompleted: number;
  };
  isLoading: boolean;

  // Tracking functions
  trackTransactionCategorization: (
    transactionId: string,
    category: string,
    amount: number
  ) => Promise<void>;
  trackBudgetCreation: (
    budgetAmount: number,
    categories: Record<string, number>
  ) => Promise<void>;
  trackBudgetAdherence: (
    month: string,
    actualSpent: number,
    budgetedAmount: number
  ) => Promise<void>;
  trackSavingsProgress: (
    amount: number,
    goalType: 'general' | 'emergency' | 'specific'
  ) => Promise<void>;
  trackDebtReduction: (
    amountPaid: number,
    totalDebtReduced: number
  ) => Promise<void>;
  trackCreditCardAddition: (cardId: string, cardType: string) => Promise<void>;
  trackPaymentOptimization: (
    optimizationType: string,
    potentialSavings: number
  ) => Promise<void>;
  trackEducationProgress: (
    moduleId: string,
    totalModules: number
  ) => Promise<void>;

  // Utility functions
  refreshData: () => Promise<void>;
}

export function useFinancialAchievements(): FinancialAchievementHookReturn {
  const [financialProgress, setFinancialProgress] =
    useState<FinancialProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const financialService = FinancialAchievementService.getInstance();
  const { refreshAchievements } = useAchievements();

  // Initialize
  useEffect(() => {
    const initializeFinancialAchievements = async () => {
      try {
        setIsLoading(true);
        // Note: This would need user ID from auth context
        await financialService.initialize('current_user');
        await refreshData();
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing financial achievements:', error);
        setIsLoading(false);
      }
    };

    initializeFinancialAchievements();
  }, []);

  /**
   * Refresh financial data
   */
  const refreshData = useCallback(async () => {
    try {
      const progress = financialService.getFinancialProgress();
      setFinancialProgress(progress);
      // Also refresh main achievements to show updated progress
      await refreshAchievements();
    } catch (error) {
      console.error('Error refreshing financial data:', error);
    }
  }, [financialService, refreshAchievements]);

  /**
   * Track transaction categorization
   */
  const trackTransactionCategorization = useCallback(
    async (transactionId: string, category: string, amount: number) => {
      try {
        await financialService.trackTransactionCategorization(
          transactionId,
          category,
          amount
        );
        await refreshData();
      } catch (error) {
        console.error('Error tracking transaction categorization:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track budget creation
   */
  const trackBudgetCreation = useCallback(
    async (budgetAmount: number, categories: Record<string, number>) => {
      try {
        await financialService.trackBudgetCreation(budgetAmount, categories);
        await refreshData();
      } catch (error) {
        console.error('Error tracking budget creation:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track budget adherence
   */
  const trackBudgetAdherence = useCallback(
    async (month: string, actualSpent: number, budgetedAmount: number) => {
      try {
        await financialService.trackBudgetAdherence(
          month,
          actualSpent,
          budgetedAmount
        );
        await refreshData();
      } catch (error) {
        console.error('Error tracking budget adherence:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track savings progress
   */
  const trackSavingsProgress = useCallback(
    async (amount: number, goalType: 'general' | 'emergency' | 'specific') => {
      try {
        await financialService.trackSavingsProgress(amount, goalType);
        await refreshData();
      } catch (error) {
        console.error('Error tracking savings progress:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track debt reduction
   */
  const trackDebtReduction = useCallback(
    async (amountPaid: number, totalDebtReduced: number) => {
      try {
        await financialService.trackDebtReduction(amountPaid, totalDebtReduced);
        await refreshData();
      } catch (error) {
        console.error('Error tracking debt reduction:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track credit card addition
   */
  const trackCreditCardAddition = useCallback(
    async (cardId: string, cardType: string) => {
      try {
        await financialService.trackCreditCardAddition(cardId, cardType);
        await refreshData();
      } catch (error) {
        console.error('Error tracking credit card addition:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track payment optimization
   */
  const trackPaymentOptimization = useCallback(
    async (optimizationType: string, potentialSavings: number) => {
      try {
        await financialService.trackPaymentOptimization(
          optimizationType,
          potentialSavings
        );
        await refreshData();
      } catch (error) {
        console.error('Error tracking payment optimization:', error);
      }
    },
    [financialService, refreshData]
  );

  /**
   * Track education progress
   */
  const trackEducationProgress = useCallback(
    async (moduleId: string, totalModules: number) => {
      try {
        await financialService.trackEducationProgress(moduleId, totalModules);
        await refreshData();
      } catch (error) {
        console.error('Error tracking education progress:', error);
      }
    },
    [financialService, refreshData]
  );

  // Get financial statistics
  const financialStats = financialService.getFinancialStats();

  return {
    // Data
    financialProgress,
    financialStats,
    isLoading,

    // Tracking functions
    trackTransactionCategorization,
    trackBudgetCreation,
    trackBudgetAdherence,
    trackSavingsProgress,
    trackDebtReduction,
    trackCreditCardAddition,
    trackPaymentOptimization,
    trackEducationProgress,

    // Utility functions
    refreshData,
  };
}

/**
 * Hook for budget-specific achievements
 */
export function useBudgetAchievements() {
  const { financialProgress, trackBudgetCreation, trackBudgetAdherence } =
    useFinancialAchievements();
  const { getAchievementsByCategory } = useAchievements();

  const budgetAchievements = getAchievementsByCategory(
    AchievementCategory.BUDGETING
  );
  const budgetPeriods = financialProgress?.budgetPeriodsTracked || [];
  const consecutiveMonths = financialProgress?.consecutiveBudgetMonths || 0;

  // Calculate budget performance
  const budgetPerformance = {
    totalBudgets: budgetPeriods.length,
    successfulMonths: budgetPeriods.filter(p => p.withinBudget).length,
    consecutiveMonths,
    averageAdherence:
      budgetPeriods.length > 0
        ? (budgetPeriods.filter(p => p.withinBudget).length /
            budgetPeriods.length) *
          100
        : 0,
    currentMonthBudget: budgetPeriods.find(
      p => p.month === getCurrentMonthString()
    ),
    improvements: budgetPeriods.slice(-3).map(p => ({
      month: p.month,
      withinBudget: p.withinBudget,
      variance: p.withinBudget
        ? 0
        : ((p.actualSpent - p.budgetedAmount) / p.budgetedAmount) * 100,
    })),
  };

  return {
    budgetAchievements,
    budgetPeriods,
    consecutiveMonths,
    budgetPerformance,
    trackBudgetCreation,
    trackBudgetAdherence,
  };
}

/**
 * Hook for savings achievements
 */
export function useSavingsAchievements() {
  const { financialProgress, trackSavingsProgress } =
    useFinancialAchievements();
  const { getAchievementsByCategory } = useAchievements();

  const savingsAchievements = getAchievementsByCategory(
    AchievementCategory.FINANCIAL_HEALTH
  );
  const totalSaved = financialProgress?.totalAmountSaved || 0;
  const emergencyFund = financialProgress?.emergencyFundBuilt || 0;

  // Calculate savings milestones progress
  const savingsMilestones = [
    {
      name: 'First $100',
      target: 100,
      current: totalSaved,
      completed: totalSaved >= 100,
    },
    {
      name: 'Emergency Fund',
      target: 1000,
      current: emergencyFund,
      completed: emergencyFund >= 1000,
    },
    {
      name: 'Savings Champion',
      target: 5000,
      current: totalSaved,
      completed: totalSaved >= 5000,
    },
    {
      name: 'Wealth Builder',
      target: 10000,
      current: totalSaved,
      completed: totalSaved >= 10000,
    },
  ];

  return {
    savingsAchievements,
    totalSaved,
    emergencyFund,
    savingsMilestones,
    trackSavingsProgress,
    nextMilestone: savingsMilestones.find(m => !m.completed),
  };
}

/**
 * Hook for transaction achievements
 */
export function useTransactionAchievements() {
  const { financialProgress, trackTransactionCategorization } =
    useFinancialAchievements();
  const { getAchievementsByCategory } = useAchievements();

  const transactionAchievements = getAchievementsByCategory(
    AchievementCategory.TRANSACTIONS
  );
  const totalCategorized = financialProgress?.totalTransactionsCategorized || 0;

  // Calculate categorization milestones
  const categorizationMilestones = [
    {
      name: 'Category Starter',
      target: 10,
      current: totalCategorized,
      completed: totalCategorized >= 10,
    },
    {
      name: 'Organization Expert',
      target: 100,
      current: totalCategorized,
      completed: totalCategorized >= 100,
    },
    {
      name: 'Category Master',
      target: 500,
      current: totalCategorized,
      completed: totalCategorized >= 500,
    },
  ];

  return {
    transactionAchievements,
    totalCategorized,
    categorizationMilestones,
    trackTransactionCategorization,
    nextMilestone: categorizationMilestones.find(m => !m.completed),
    progress: categorizationMilestones.map(m => ({
      ...m,
      percentage: Math.min((m.current / m.target) * 100, 100),
    })),
  };
}

/**
 * Hook for credit management achievements
 */
export function useCreditAchievements() {
  const {
    financialProgress,
    trackDebtReduction,
    trackCreditCardAddition,
    trackPaymentOptimization,
  } = useFinancialAchievements();
  const { getAchievementsByCategory } = useAchievements();

  const creditAchievements = getAchievementsByCategory(
    AchievementCategory.CREDIT_MANAGEMENT
  );
  const totalDebtReduced = financialProgress?.totalDebtReduced || 0;

  // Calculate debt reduction milestones
  const debtMilestones = [
    {
      name: 'Debt Reducer',
      target: 1000,
      current: totalDebtReduced,
      completed: totalDebtReduced >= 1000,
    },
    {
      name: 'Debt Eliminator',
      target: 5000,
      current: totalDebtReduced,
      completed: totalDebtReduced >= 5000,
    },
  ];

  return {
    creditAchievements,
    totalDebtReduced,
    debtMilestones,
    trackDebtReduction,
    trackCreditCardAddition,
    trackPaymentOptimization,
    nextDebtMilestone: debtMilestones.find(m => !m.completed),
  };
}

/**
 * Hook for education achievements
 */
export function useEducationAchievements() {
  const { financialProgress, trackEducationProgress } =
    useFinancialAchievements();
  const { getAchievementsByCategory } = useAchievements();

  const educationAchievements = getAchievementsByCategory(
    AchievementCategory.EDUCATION
  );
  const educationData = financialProgress?.educationProgress || {
    modulesCompleted: 0,
    totalModules: 0,
    completionPercentage: 0,
  };

  // Calculate education milestones
  const educationMilestones = [
    {
      name: 'Learning Starter',
      target: 1,
      current: educationData.modulesCompleted,
      completed: educationData.modulesCompleted >= 1,
    },
    {
      name: 'Knowledge Seeker',
      target: 5,
      current: educationData.modulesCompleted,
      completed: educationData.modulesCompleted >= 5,
    },
    {
      name: 'Financial Scholar',
      target: 10,
      current: educationData.modulesCompleted,
      completed: educationData.modulesCompleted >= 10,
    },
    {
      name: 'Financial Expert',
      target: educationData.totalModules,
      current: educationData.modulesCompleted,
      completed: educationData.completionPercentage >= 100,
    },
  ];

  return {
    educationAchievements,
    educationData,
    educationMilestones,
    trackEducationProgress,
    nextEducationMilestone: educationMilestones.find(m => !m.completed),
    overallProgress: educationData.completionPercentage,
  };
}

/**
 * Hook for Canadian-specific financial achievements
 */
export function useCanadianFinancialAchievements() {
  const { getAchievements } = useAchievements();

  // Filter Canadian-specific achievements
  const canadianAchievements = getAchievements().filter(
    a => a.id.includes('tfsa') || a.id.includes('rrsp') || a.id.includes('resp')
  );

  const trackTFSAContribution = useCallback(async (amount: number) => {
    // Track TFSA contribution
    console.log('TFSA contribution tracked:', amount);
  }, []);

  const trackRRSPContribution = useCallback(async (amount: number) => {
    // Track RRSP contribution
    console.log('RRSP contribution tracked:', amount);
  }, []);

  const trackRESPContribution = useCallback(async (amount: number) => {
    // Track RESP contribution
    console.log('RESP contribution tracked:', amount);
  }, []);

  return {
    canadianAchievements,
    trackTFSAContribution,
    trackRRSPContribution,
    trackRESPContribution,
  };
}

/**
 * Utility function to get current month string
 */
function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default useFinancialAchievements;
