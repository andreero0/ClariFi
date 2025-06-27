/**
 * Financial Achievement Service
 * Specialized service for tracking financial milestones and behaviors
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  AchievementType,
  AchievementStatus,
  AchievementCategory,
  AchievementTier,
  AchievementEvent,
  AchievementEventType,
} from '../../types/achievements';
import AchievementService from './AchievementService';

export interface FinancialGoal {
  id: string;
  type:
    | 'budget_adherence'
    | 'savings_target'
    | 'debt_reduction'
    | 'spending_limit'
    | 'emergency_fund';
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  category?: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface BudgetPeriod {
  id: string;
  month: string; // YYYY-MM
  budgetedAmount: number;
  actualSpent: number;
  withinBudget: boolean;
  overageAmount?: number;
  categories: Record<
    string,
    {
      budgeted: number;
      actual: number;
      withinBudget: boolean;
    }
  >;
}

export interface FinancialMilestone {
  id: string;
  name: string;
  description: string;
  type:
    | 'amount_saved'
    | 'debt_paid'
    | 'budget_streak'
    | 'categories_organized'
    | 'net_worth';
  target: number;
  current: number;
  unit: string;
  achievedAt?: Date;
}

export interface FinancialProgress {
  userId: string;
  totalTransactionsCategorized: number;
  budgetPeriodsTracked: BudgetPeriod[];
  consecutiveBudgetMonths: number;
  totalAmountSaved: number;
  totalDebtReduced: number;
  emergencyFundBuilt: number;
  financialGoals: FinancialGoal[];
  milestones: FinancialMilestone[];
  educationProgress: {
    modulesCompleted: number;
    totalModules: number;
    completionPercentage: number;
  };
  lastUpdated: Date;
}

class FinancialAchievementService {
  private static instance: FinancialAchievementService;
  private achievementService: AchievementService;
  private financialProgress: FinancialProgress | null = null;
  private listeners: ((event: AchievementEvent) => void)[] = [];

  private readonly STORAGE_KEY = '@clarifi_financial_progress';
  private readonly FINANCIAL_ACHIEVEMENTS: Partial<Achievement>[] = [
    // Budget Achievements
    {
      id: 'budget_creator',
      title: 'Budget Creator',
      description: 'Create your first monthly budget',
      icon: 'calculator',
      type: AchievementType.MILESTONE,
      category: AchievementCategory.BUDGETING,
      tier: AchievementTier.BRONZE,
      points: 100,
      requirements: [
        {
          id: 'budget_req',
          description: 'Budgets created',
          target: 1,
          current: 0,
          unit: 'budgets',
          completed: false,
        },
      ],
    },
    {
      id: 'budget_follower',
      title: 'Budget Follower',
      description: 'Stay within your budget for 3 consecutive months',
      icon: 'target',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.BUDGETING,
      tier: AchievementTier.SILVER,
      points: 300,
      requirements: [
        {
          id: 'budget_adherence_req',
          description: 'Consecutive months within budget',
          target: 3,
          current: 0,
          unit: 'months',
          completed: false,
        },
      ],
    },
    {
      id: 'budget_master',
      title: 'Budget Master',
      description: 'Maintain budget discipline for 6 months',
      icon: 'trophy',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.BUDGETING,
      tier: AchievementTier.GOLD,
      points: 600,
      requirements: [
        {
          id: 'budget_mastery_req',
          description: 'Consecutive months within budget',
          target: 6,
          current: 0,
          unit: 'months',
          completed: false,
        },
      ],
    },
    {
      id: 'budget_legend',
      title: 'Budget Legend',
      description: 'Achieve perfect budget adherence for a full year',
      icon: 'diamond',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.BUDGETING,
      tier: AchievementTier.PLATINUM,
      points: 1500,
      requirements: [
        {
          id: 'budget_legend_req',
          description: 'Consecutive months within budget',
          target: 12,
          current: 0,
          unit: 'months',
          completed: false,
        },
      ],
    },

    // Transaction Categorization Achievements
    {
      id: 'category_starter',
      title: 'Category Starter',
      description: 'Categorize your first 10 transactions',
      icon: 'tag',
      type: AchievementType.FEATURE_USAGE,
      category: AchievementCategory.TRANSACTIONS,
      tier: AchievementTier.BRONZE,
      points: 50,
      requirements: [
        {
          id: 'categorize_req',
          description: 'Transactions categorized',
          target: 10,
          current: 0,
          unit: 'transactions',
          completed: false,
        },
      ],
    },
    {
      id: 'organization_expert',
      title: 'Organization Expert',
      description: 'Categorize 100 transactions',
      icon: 'folder-organized',
      type: AchievementType.FEATURE_USAGE,
      category: AchievementCategory.TRANSACTIONS,
      tier: AchievementTier.SILVER,
      points: 200,
      requirements: [
        {
          id: 'categorize_expert_req',
          description: 'Transactions categorized',
          target: 100,
          current: 0,
          unit: 'transactions',
          completed: false,
        },
      ],
    },
    {
      id: 'category_master',
      title: 'Category Master',
      description: 'Categorize 500 transactions',
      icon: 'archive',
      type: AchievementType.FEATURE_USAGE,
      category: AchievementCategory.TRANSACTIONS,
      tier: AchievementTier.GOLD,
      points: 500,
      requirements: [
        {
          id: 'categorize_master_req',
          description: 'Transactions categorized',
          target: 500,
          current: 0,
          unit: 'transactions',
          completed: false,
        },
      ],
    },

    // Savings Achievements
    {
      id: 'first_saver',
      title: 'First Saver',
      description: 'Save your first $100',
      icon: 'piggy-bank',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.FINANCIAL_HEALTH,
      tier: AchievementTier.BRONZE,
      points: 75,
      requirements: [
        {
          id: 'savings_req',
          description: 'Amount saved',
          target: 100,
          current: 0,
          unit: 'dollars',
          completed: false,
        },
      ],
    },
    {
      id: 'emergency_builder',
      title: 'Emergency Builder',
      description: 'Build a $1,000 emergency fund',
      icon: 'shield-check',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.FINANCIAL_HEALTH,
      tier: AchievementTier.SILVER,
      points: 300,
      requirements: [
        {
          id: 'emergency_req',
          description: 'Emergency fund amount',
          target: 1000,
          current: 0,
          unit: 'dollars',
          completed: false,
        },
      ],
    },
    {
      id: 'savings_champion',
      title: 'Savings Champion',
      description: 'Accumulate $5,000 in savings',
      icon: 'vault',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.FINANCIAL_HEALTH,
      tier: AchievementTier.GOLD,
      points: 750,
      requirements: [
        {
          id: 'savings_champion_req',
          description: 'Total savings amount',
          target: 5000,
          current: 0,
          unit: 'dollars',
          completed: false,
        },
      ],
    },
    {
      id: 'wealth_builder',
      title: 'Wealth Builder',
      description: 'Reach $10,000 in total savings',
      icon: 'trending-up',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.FINANCIAL_HEALTH,
      tier: AchievementTier.PLATINUM,
      points: 1500,
      requirements: [
        {
          id: 'wealth_req',
          description: 'Total savings amount',
          target: 10000,
          current: 0,
          unit: 'dollars',
          completed: false,
        },
      ],
    },

    // Credit Management Achievements
    {
      id: 'credit_tracker',
      title: 'Credit Tracker',
      description: 'Add your first credit card to track',
      icon: 'credit-card',
      type: AchievementType.FEATURE_USAGE,
      category: AchievementCategory.CREDIT_MANAGEMENT,
      tier: AchievementTier.BRONZE,
      points: 50,
      requirements: [
        {
          id: 'credit_add_req',
          description: 'Credit cards added',
          target: 1,
          current: 0,
          unit: 'cards',
          completed: false,
        },
      ],
    },
    {
      id: 'debt_reducer',
      title: 'Debt Reducer',
      description: 'Pay down $1,000 in credit card debt',
      icon: 'trending-down',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.CREDIT_MANAGEMENT,
      tier: AchievementTier.SILVER,
      points: 400,
      requirements: [
        {
          id: 'debt_reduction_req',
          description: 'Debt reduced',
          target: 1000,
          current: 0,
          unit: 'dollars',
          completed: false,
        },
      ],
    },
    {
      id: 'debt_eliminator',
      title: 'Debt Eliminator',
      description: 'Pay off $5,000 in total debt',
      icon: 'check-circle',
      type: AchievementType.FINANCIAL_GOAL,
      category: AchievementCategory.CREDIT_MANAGEMENT,
      tier: AchievementTier.GOLD,
      points: 1000,
      requirements: [
        {
          id: 'debt_elimination_req',
          description: 'Total debt eliminated',
          target: 5000,
          current: 0,
          unit: 'dollars',
          completed: false,
        },
      ],
    },
    {
      id: 'payment_optimizer',
      title: 'Payment Optimizer',
      description: 'Use payment optimization 25 times',
      icon: 'settings',
      type: AchievementType.FEATURE_USAGE,
      category: AchievementCategory.CREDIT_MANAGEMENT,
      tier: AchievementTier.SILVER,
      points: 200,
      requirements: [
        {
          id: 'optimization_req',
          description: 'Optimizations performed',
          target: 25,
          current: 0,
          unit: 'uses',
          completed: false,
        },
      ],
    },

    // Education Achievements
    {
      id: 'learning_starter',
      title: 'Learning Starter',
      description: 'Complete your first financial education module',
      icon: 'book-open',
      type: AchievementType.EDUCATION,
      category: AchievementCategory.EDUCATION,
      tier: AchievementTier.BRONZE,
      points: 75,
      requirements: [
        {
          id: 'education_start_req',
          description: 'Modules completed',
          target: 1,
          current: 0,
          unit: 'modules',
          completed: false,
        },
      ],
    },
    {
      id: 'knowledge_seeker',
      title: 'Knowledge Seeker',
      description: 'Complete 5 financial education modules',
      icon: 'lightbulb',
      type: AchievementType.EDUCATION,
      category: AchievementCategory.EDUCATION,
      tier: AchievementTier.SILVER,
      points: 250,
      requirements: [
        {
          id: 'education_seeker_req',
          description: 'Modules completed',
          target: 5,
          current: 0,
          unit: 'modules',
          completed: false,
        },
      ],
    },
    {
      id: 'financial_scholar',
      title: 'Financial Scholar',
      description: 'Complete 10 financial education modules',
      icon: 'graduation-cap',
      type: AchievementType.EDUCATION,
      category: AchievementCategory.EDUCATION,
      tier: AchievementTier.GOLD,
      points: 500,
      requirements: [
        {
          id: 'education_scholar_req',
          description: 'Modules completed',
          target: 10,
          current: 0,
          unit: 'modules',
          completed: false,
        },
      ],
    },
    {
      id: 'financial_expert',
      title: 'Financial Expert',
      description: 'Complete all available financial education modules',
      icon: 'award',
      type: AchievementType.EDUCATION,
      category: AchievementCategory.EDUCATION,
      tier: AchievementTier.PLATINUM,
      points: 1000,
      requirements: [
        {
          id: 'education_expert_req',
          description: 'All modules completed',
          target: 100,
          current: 0,
          unit: 'percent',
          completed: false,
        },
      ],
    },

    // Special Canadian Financial Achievements
    {
      id: 'tfsa_contributor',
      title: 'TFSA Contributor',
      description: 'Set up tracking for TFSA contributions',
      icon: 'maple-leaf',
      type: AchievementType.MILESTONE,
      category: AchievementCategory.FINANCIAL_HEALTH,
      tier: AchievementTier.SILVER,
      points: 200,
      requirements: [
        {
          id: 'tfsa_req',
          description: 'TFSA accounts tracked',
          target: 1,
          current: 0,
          unit: 'accounts',
          completed: false,
        },
      ],
    },
    {
      id: 'rrsp_planner',
      title: 'RRSP Planner',
      description: 'Set up retirement planning with RRSP tracking',
      icon: 'calendar-clock',
      type: AchievementType.MILESTONE,
      category: AchievementCategory.FINANCIAL_HEALTH,
      tier: AchievementTier.GOLD,
      points: 400,
      requirements: [
        {
          id: 'rrsp_req',
          description: 'RRSP planning setup',
          target: 1,
          current: 0,
          unit: 'plans',
          completed: false,
        },
      ],
    },
  ];

  private constructor() {
    this.achievementService = AchievementService.getInstance();
  }

  static getInstance(): FinancialAchievementService {
    if (!FinancialAchievementService.instance) {
      FinancialAchievementService.instance = new FinancialAchievementService();
    }
    return FinancialAchievementService.instance;
  }

  /**
   * Initialize financial achievement system
   */
  async initialize(userId: string): Promise<void> {
    await this.loadFinancialProgress();

    if (!this.financialProgress) {
      this.financialProgress = this.createInitialProgress(userId);
      await this.saveFinancialProgress();
    }

    // Register financial achievements with main service
    await this.registerFinancialAchievements();
  }

  /**
   * Create initial financial progress
   */
  private createInitialProgress(userId: string): FinancialProgress {
    return {
      userId,
      totalTransactionsCategorized: 0,
      budgetPeriodsTracked: [],
      consecutiveBudgetMonths: 0,
      totalAmountSaved: 0,
      totalDebtReduced: 0,
      emergencyFundBuilt: 0,
      financialGoals: [],
      milestones: [],
      educationProgress: {
        modulesCompleted: 0,
        totalModules: 0,
        completionPercentage: 0,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Register financial achievements with main achievement service
   */
  private async registerFinancialAchievements(): Promise<void> {
    // Add financial achievements to main service if not already present
    const existingAchievements = this.achievementService.getAchievements();

    for (const newAchievement of this.FINANCIAL_ACHIEVEMENTS) {
      const exists = existingAchievements.find(a => a.id === newAchievement.id);
      if (!exists && newAchievement.id) {
        // This would require modifying AchievementService to support dynamic achievement addition
        // For now, these achievements are already included in the initial achievement set
      }
    }
  }

  /**
   * Track transaction categorization
   */
  async trackTransactionCategorization(
    transactionId: string,
    category: string,
    amount: number
  ): Promise<void> {
    if (!this.financialProgress) return;

    this.financialProgress.totalTransactionsCategorized += 1;
    this.financialProgress.lastUpdated = new Date();

    // Update relevant achievements
    await this.updateCategorizationAchievements();
    await this.saveFinancialProgress();
  }

  /**
   * Track budget creation
   */
  async trackBudgetCreation(
    budgetAmount: number,
    categories: Record<string, number>
  ): Promise<void> {
    if (!this.financialProgress) return;

    const currentMonth = this.getCurrentMonthString();

    // Check if budget already exists for this month
    const existingBudget = this.financialProgress.budgetPeriodsTracked.find(
      b => b.month === currentMonth
    );

    if (!existingBudget) {
      const newBudgetPeriod: BudgetPeriod = {
        id: `budget_${currentMonth}`,
        month: currentMonth,
        budgetedAmount: budgetAmount,
        actualSpent: 0,
        withinBudget: true,
        categories: Object.entries(categories).reduce(
          (acc, [cat, amount]) => {
            acc[cat] = { budgeted: amount, actual: 0, withinBudget: true };
            return acc;
          },
          {} as Record<
            string,
            { budgeted: number; actual: number; withinBudget: boolean }
          >
        ),
      };

      this.financialProgress.budgetPeriodsTracked.push(newBudgetPeriod);
    }

    await this.updateBudgetAchievements();
    await this.saveFinancialProgress();
  }

  /**
   * Track budget adherence
   */
  async trackBudgetAdherence(
    month: string,
    actualSpent: number,
    budgetedAmount: number
  ): Promise<void> {
    if (!this.financialProgress) return;

    const budgetPeriod = this.financialProgress.budgetPeriodsTracked.find(
      b => b.month === month
    );

    if (budgetPeriod) {
      budgetPeriod.actualSpent = actualSpent;
      budgetPeriod.withinBudget = actualSpent <= budgetedAmount;

      if (!budgetPeriod.withinBudget) {
        budgetPeriod.overageAmount = actualSpent - budgetedAmount;
      }

      // Update consecutive months
      this.updateConsecutiveBudgetMonths();
      await this.updateBudgetAchievements();
      await this.saveFinancialProgress();
    }
  }

  /**
   * Track savings goal progress
   */
  async trackSavingsProgress(
    amount: number,
    goalType: 'general' | 'emergency' | 'specific'
  ): Promise<void> {
    if (!this.financialProgress) return;

    if (goalType === 'emergency') {
      this.financialProgress.emergencyFundBuilt = Math.max(
        this.financialProgress.emergencyFundBuilt,
        amount
      );
    } else {
      this.financialProgress.totalAmountSaved = Math.max(
        this.financialProgress.totalAmountSaved,
        amount
      );
    }

    await this.updateSavingsAchievements();
    await this.saveFinancialProgress();
  }

  /**
   * Track debt reduction
   */
  async trackDebtReduction(
    amountPaid: number,
    totalDebtReduced: number
  ): Promise<void> {
    if (!this.financialProgress) return;

    this.financialProgress.totalDebtReduced = totalDebtReduced;

    await this.updateDebtAchievements();
    await this.saveFinancialProgress();
  }

  /**
   * Track credit card addition
   */
  async trackCreditCardAddition(
    cardId: string,
    cardType: string
  ): Promise<void> {
    // This would trigger the credit_tracker achievement
    await this.achievementService.trackFeature('credit_card_add' as any, {
      cardId,
      cardType,
    });
  }

  /**
   * Track payment optimization usage
   */
  async trackPaymentOptimization(
    optimizationType: string,
    potentialSavings: number
  ): Promise<void> {
    // This would update the payment_optimizer achievement
    await this.achievementService.trackFeature('payment_optimize' as any, {
      optimizationType,
      potentialSavings,
    });
  }

  /**
   * Track education module completion
   */
  async trackEducationProgress(
    moduleId: string,
    totalModules: number
  ): Promise<void> {
    if (!this.financialProgress) return;

    this.financialProgress.educationProgress.modulesCompleted += 1;
    this.financialProgress.educationProgress.totalModules = totalModules;
    this.financialProgress.educationProgress.completionPercentage =
      (this.financialProgress.educationProgress.modulesCompleted /
        totalModules) *
      100;

    await this.updateEducationAchievements();
    await this.saveFinancialProgress();
  }

  /**
   * Update categorization achievements
   */
  private async updateCategorizationAchievements(): Promise<void> {
    const count = this.financialProgress?.totalTransactionsCategorized || 0;

    // Update category_starter (10 transactions)
    if (count >= 10) {
      await this.achievementService.completeAchievement('category_starter');
    }

    // Update organization_expert (100 transactions)
    if (count >= 100) {
      await this.achievementService.completeAchievement('organization_expert');
    }

    // Update category_master (500 transactions)
    if (count >= 500) {
      await this.achievementService.completeAchievement('category_master');
    }
  }

  /**
   * Update budget achievements
   */
  private async updateBudgetAchievements(): Promise<void> {
    const consecutiveMonths =
      this.financialProgress?.consecutiveBudgetMonths || 0;
    const budgetCount =
      this.financialProgress?.budgetPeriodsTracked.length || 0;

    // Budget creator (1 budget)
    if (budgetCount >= 1) {
      await this.achievementService.completeAchievement('budget_creator');
    }

    // Budget follower (3 consecutive months)
    if (consecutiveMonths >= 3) {
      await this.achievementService.completeAchievement('budget_follower');
    }

    // Budget master (6 consecutive months)
    if (consecutiveMonths >= 6) {
      await this.achievementService.completeAchievement('budget_master');
    }

    // Budget legend (12 consecutive months)
    if (consecutiveMonths >= 12) {
      await this.achievementService.completeAchievement('budget_legend');
    }
  }

  /**
   * Update savings achievements
   */
  private async updateSavingsAchievements(): Promise<void> {
    const totalSaved = this.financialProgress?.totalAmountSaved || 0;
    const emergencyFund = this.financialProgress?.emergencyFundBuilt || 0;

    // First saver ($100)
    if (totalSaved >= 100) {
      await this.achievementService.completeAchievement('first_saver');
    }

    // Emergency builder ($1,000)
    if (emergencyFund >= 1000) {
      await this.achievementService.completeAchievement('emergency_builder');
    }

    // Savings champion ($5,000)
    if (totalSaved >= 5000) {
      await this.achievementService.completeAchievement('savings_champion');
    }

    // Wealth builder ($10,000)
    if (totalSaved >= 10000) {
      await this.achievementService.completeAchievement('wealth_builder');
    }
  }

  /**
   * Update debt achievements
   */
  private async updateDebtAchievements(): Promise<void> {
    const debtReduced = this.financialProgress?.totalDebtReduced || 0;

    // Debt reducer ($1,000)
    if (debtReduced >= 1000) {
      await this.achievementService.completeAchievement('debt_reducer');
    }

    // Debt eliminator ($5,000)
    if (debtReduced >= 5000) {
      await this.achievementService.completeAchievement('debt_eliminator');
    }
  }

  /**
   * Update education achievements
   */
  private async updateEducationAchievements(): Promise<void> {
    const completed =
      this.financialProgress?.educationProgress.modulesCompleted || 0;
    const percentage =
      this.financialProgress?.educationProgress.completionPercentage || 0;

    // Learning starter (1 module)
    if (completed >= 1) {
      await this.achievementService.completeAchievement('learning_starter');
    }

    // Knowledge seeker (5 modules)
    if (completed >= 5) {
      await this.achievementService.completeAchievement('knowledge_seeker');
    }

    // Financial scholar (10 modules)
    if (completed >= 10) {
      await this.achievementService.completeAchievement('financial_scholar');
    }

    // Financial expert (100% completion)
    if (percentage >= 100) {
      await this.achievementService.completeAchievement('financial_expert');
    }
  }

  /**
   * Update consecutive budget months
   */
  private updateConsecutiveBudgetMonths(): void {
    if (!this.financialProgress) return;

    const periods = this.financialProgress.budgetPeriodsTracked.sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    let consecutive = 0;
    for (let i = periods.length - 1; i >= 0; i--) {
      if (periods[i].withinBudget) {
        consecutive++;
      } else {
        break;
      }
    }

    this.financialProgress.consecutiveBudgetMonths = consecutive;
  }

  /**
   * Get current month string
   */
  private getCurrentMonthString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Load financial progress from AsyncStorage
   */
  private async loadFinancialProgress(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.financialProgress = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
    } catch (error) {
      console.error('Error loading financial progress:', error);
    }
  }

  /**
   * Save financial progress to AsyncStorage
   */
  private async saveFinancialProgress(): Promise<void> {
    try {
      if (this.financialProgress) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.financialProgress)
        );
      }
    } catch (error) {
      console.error('Error saving financial progress:', error);
    }
  }

  /**
   * Get financial progress
   */
  getFinancialProgress(): FinancialProgress | null {
    return this.financialProgress;
  }

  /**
   * Get financial statistics
   */
  getFinancialStats(): {
    totalSaved: number;
    totalDebtReduced: number;
    transactionsCategorized: number;
    budgetStreak: number;
    educationProgress: number;
    goalsCompleted: number;
  } {
    if (!this.financialProgress) {
      return {
        totalSaved: 0,
        totalDebtReduced: 0,
        transactionsCategorized: 0,
        budgetStreak: 0,
        educationProgress: 0,
        goalsCompleted: 0,
      };
    }

    return {
      totalSaved: this.financialProgress.totalAmountSaved,
      totalDebtReduced: this.financialProgress.totalDebtReduced,
      transactionsCategorized:
        this.financialProgress.totalTransactionsCategorized,
      budgetStreak: this.financialProgress.consecutiveBudgetMonths,
      educationProgress:
        this.financialProgress.educationProgress.completionPercentage,
      goalsCompleted: this.financialProgress.financialGoals.filter(
        g => g.status === 'completed'
      ).length,
    };
  }

  /**
   * Reset financial progress (for testing)
   */
  async resetFinancialProgress(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.financialProgress = null;
  }
}

export default FinancialAchievementService;
