import {
  Achievement,
  AchievementStatus,
  AchievementCategory,
} from '../../types/achievements';

export interface MonthlyProgressData {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
  achievementsEarned: Achievement[];
  totalPointsEarned: number;
  streaksData: {
    averageStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    streakBreaks: number;
  };
  financialMetrics: {
    totalSaved: number;
    budgetCompliance: number; // percentage
    transactionsTracked: number;
    savingsGoalProgress: number; // percentage
  };
  educationProgress: {
    modulesCompleted: number;
    timeSpentLearning: number; // minutes
    topicsExplored: string[];
  };
  categoryBreakdown: {
    [category in AchievementCategory]: {
      achievementsEarned: number;
      pointsEarned: number;
      progress: number; // percentage
    };
  };
  comparisonToPrevious: {
    achievementsDelta: number;
    pointsDelta: number;
    savingsDelta: number;
    streakDelta: number;
    improvementAreas: string[];
    strongAreas: string[];
  };
  personalizedInsights: {
    achievements: string[];
    recommendations: string[];
    motivationalMessages: string[];
    upcomingGoals: string[];
  };
}

export interface MonthlyReportFilters {
  includeComparisons?: boolean;
  includeRecommendations?: boolean;
  focusAreas?: AchievementCategory[];
  dateRange?: {
    start: string; // YYYY-MM
    end: string; // YYYY-MM
  };
}

export class MonthlyReportsService {
  private static readonly MONTHS = [
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

  /**
   * Generate comprehensive monthly progress report
   */
  static async generateMonthlyReport(
    month: string, // YYYY-MM format
    achievements: Achievement[],
    streakData: any,
    financialStats: any,
    educationData?: any,
    previousMonthData?: MonthlyProgressData
  ): Promise<MonthlyProgressData> {
    const [year, monthNumber] = month.split('-').map(Number);
    const monthName = this.MONTHS[monthNumber - 1];

    // Filter achievements earned in this month
    const achievementsEarned = achievements.filter(
      achievement =>
        achievement.status === AchievementStatus.COMPLETED &&
        this.isAchievementFromMonth(achievement, month)
    );

    // Calculate basic metrics
    const totalPointsEarned = achievementsEarned.reduce(
      (sum, ach) => sum + ach.points,
      0
    );

    // Generate streak analytics
    const streaksData = this.calculateStreakMetrics(streakData, month);

    // Calculate financial metrics
    const financialMetrics = this.calculateFinancialMetrics(
      financialStats,
      month
    );

    // Calculate education progress
    const educationProgress = this.calculateEducationProgress(
      educationData,
      month
    );

    // Generate category breakdown
    const categoryBreakdown = this.generateCategoryBreakdown(
      achievementsEarned,
      achievements
    );

    // Compare with previous month
    const comparisonToPrevious = previousMonthData
      ? this.generateComparison(
          {
            totalPointsEarned,
            achievementsEarned: achievementsEarned.length,
            streaksData,
            financialMetrics,
          },
          previousMonthData
        )
      : this.getDefaultComparison();

    // Generate personalized insights
    const personalizedInsights = this.generatePersonalizedInsights(
      achievementsEarned,
      categoryBreakdown,
      comparisonToPrevious,
      streaksData,
      financialMetrics
    );

    return {
      month,
      year,
      monthName,
      achievementsEarned,
      totalPointsEarned,
      streaksData,
      financialMetrics,
      educationProgress,
      categoryBreakdown,
      comparisonToPrevious,
      personalizedInsights,
    };
  }

  /**
   * Get current month report
   */
  static async getCurrentMonthReport(
    achievements: Achievement[],
    streakData: any,
    financialStats: any
  ): Promise<MonthlyProgressData> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get previous month for comparison
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const previousMonthData = await this.generateMonthlyReport(
      previousMonth,
      achievements,
      streakData,
      financialStats
    );

    return this.generateMonthlyReport(
      currentMonth,
      achievements,
      streakData,
      financialStats,
      undefined,
      previousMonthData
    );
  }

  /**
   * Calculate improvement percentage between two values
   */
  static calculateImprovementPercentage(
    current: number,
    previous: number
  ): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Check if achievement was earned in specific month
   */
  private static isAchievementFromMonth(
    achievement: Achievement,
    month: string
  ): boolean {
    // This would need actual completion date from the achievement
    // For now, assuming all completed achievements are from current month
    // In a real implementation, achievements would have completedDate field
    return true;
  }

  /**
   * Calculate streak metrics for the month
   */
  private static calculateStreakMetrics(
    streakData: any,
    month: string
  ): MonthlyProgressData['streaksData'] {
    // This would calculate based on actual daily streak data for the month
    return {
      averageStreak: streakData?.currentStreak || 0,
      longestStreak: streakData?.bestStreak || 0,
      totalActiveDays: Math.min(streakData?.currentStreak || 0, 31),
      streakBreaks: 0, // Would calculate from historical data
    };
  }

  /**
   * Calculate financial metrics for the month
   */
  private static calculateFinancialMetrics(
    financialStats: any,
    month: string
  ): MonthlyProgressData['financialMetrics'] {
    return {
      totalSaved: financialStats?.totalSaved || 0,
      budgetCompliance: financialStats?.budgetCompliance || 0,
      transactionsTracked: financialStats?.transactionsTracked || 0,
      savingsGoalProgress: financialStats?.savingsGoalProgress || 0,
    };
  }

  /**
   * Calculate education progress for the month
   */
  private static calculateEducationProgress(
    educationData: any,
    month: string
  ): MonthlyProgressData['educationProgress'] {
    return {
      modulesCompleted: educationData?.modulesCompleted || 0,
      timeSpentLearning: educationData?.timeSpentLearning || 0,
      topicsExplored: educationData?.topicsExplored || [],
    };
  }

  /**
   * Generate category breakdown from achievements
   */
  private static generateCategoryBreakdown(
    monthlyAchievements: Achievement[],
    allAchievements: Achievement[]
  ): MonthlyProgressData['categoryBreakdown'] {
    const categories = Object.values(AchievementCategory);
    const breakdown = {} as MonthlyProgressData['categoryBreakdown'];

    categories.forEach(category => {
      const categoryMonthlyAchievements = monthlyAchievements.filter(
        a => a.category === category
      );
      const categoryAllAchievements = allAchievements.filter(
        a => a.category === category
      );
      const categoryCompletedAchievements = categoryAllAchievements.filter(
        a => a.status === AchievementStatus.COMPLETED
      );

      breakdown[category] = {
        achievementsEarned: categoryMonthlyAchievements.length,
        pointsEarned: categoryMonthlyAchievements.reduce(
          (sum, a) => sum + a.points,
          0
        ),
        progress:
          categoryAllAchievements.length > 0
            ? (categoryCompletedAchievements.length /
                categoryAllAchievements.length) *
              100
            : 0,
      };
    });

    return breakdown;
  }

  /**
   * Generate comparison with previous month
   */
  private static generateComparison(
    currentData: {
      totalPointsEarned: number;
      achievementsEarned: number;
      streaksData: MonthlyProgressData['streaksData'];
      financialMetrics: MonthlyProgressData['financialMetrics'];
    },
    previousData: MonthlyProgressData
  ): MonthlyProgressData['comparisonToPrevious'] {
    const achievementsDelta =
      currentData.achievementsEarned - previousData.achievementsEarned.length;
    const pointsDelta =
      currentData.totalPointsEarned - previousData.totalPointsEarned;
    const savingsDelta =
      currentData.financialMetrics.totalSaved -
      previousData.financialMetrics.totalSaved;
    const streakDelta =
      currentData.streaksData.averageStreak -
      previousData.streaksData.averageStreak;

    const improvementAreas = [];
    const strongAreas = [];

    if (achievementsDelta > 0) strongAreas.push('Achievement Completion');
    else if (achievementsDelta < 0)
      improvementAreas.push('Achievement Completion');

    if (pointsDelta > 0) strongAreas.push('Points Earned');
    else if (pointsDelta < 0) improvementAreas.push('Points Earned');

    if (savingsDelta > 0) strongAreas.push('Savings Growth');
    else if (savingsDelta < 0) improvementAreas.push('Savings Tracking');

    if (streakDelta > 0) strongAreas.push('Consistency');
    else if (streakDelta < 0) improvementAreas.push('Daily Engagement');

    return {
      achievementsDelta,
      pointsDelta,
      savingsDelta,
      streakDelta,
      improvementAreas,
      strongAreas,
    };
  }

  /**
   * Get default comparison for first month
   */
  private static getDefaultComparison(): MonthlyProgressData['comparisonToPrevious'] {
    return {
      achievementsDelta: 0,
      pointsDelta: 0,
      savingsDelta: 0,
      streakDelta: 0,
      improvementAreas: [],
      strongAreas: ['Getting Started'],
    };
  }

  /**
   * Generate personalized insights and recommendations
   */
  private static generatePersonalizedInsights(
    achievementsEarned: Achievement[],
    categoryBreakdown: MonthlyProgressData['categoryBreakdown'],
    comparison: MonthlyProgressData['comparisonToPrevious'],
    streaksData: MonthlyProgressData['streaksData'],
    financialMetrics: MonthlyProgressData['financialMetrics']
  ): MonthlyProgressData['personalizedInsights'] {
    const achievements = [];
    const recommendations = [];
    const motivationalMessages = [];
    const upcomingGoals = [];

    // Generate achievement insights
    if (achievementsEarned.length > 0) {
      achievements.push(
        `Unlocked ${achievementsEarned.length} achievement${achievementsEarned.length > 1 ? 's' : ''} this month!`
      );
    }

    if (comparison.achievementsDelta > 0) {
      achievements.push(
        `${comparison.achievementsDelta} more achievements than last month!`
      );
    }

    if (streaksData.totalActiveDays >= 20) {
      achievements.push('Excellent consistency with 20+ active days!');
    }

    // Generate recommendations
    const strongestCategory = this.getStrongestCategory(categoryBreakdown);
    const weakestCategory = this.getWeakestCategory(categoryBreakdown);

    if (weakestCategory) {
      recommendations.push(
        `Focus on ${this.getCategoryDisplayName(weakestCategory)} to improve your overall progress.`
      );
    }

    if (streaksData.totalActiveDays < 15) {
      recommendations.push(
        'Try to maintain daily engagement to build stronger habits.'
      );
    }

    if (financialMetrics.budgetCompliance < 80) {
      recommendations.push(
        'Consider reviewing your budget categories for better tracking accuracy.'
      );
    }

    // Generate motivational messages
    if (comparison.strongAreas.length > 0) {
      motivationalMessages.push(
        `You're excelling in: ${comparison.strongAreas.join(', ')}!`
      );
    }

    motivationalMessages.push(
      'Every step forward is progress worth celebrating!'
    );

    if (achievementsEarned.length >= 3) {
      motivationalMessages.push('You are building incredible momentum!');
    }

    // Generate upcoming goals
    upcomingGoals.push('Complete your next achievement milestone');
    upcomingGoals.push('Maintain your daily engagement streak');

    if (strongestCategory) {
      upcomingGoals.push(
        `Continue your success in ${this.getCategoryDisplayName(strongestCategory)}`
      );
    }

    return {
      achievements,
      recommendations,
      motivationalMessages,
      upcomingGoals,
    };
  }

  /**
   * Get strongest performing category
   */
  private static getStrongestCategory(
    categoryBreakdown: MonthlyProgressData['categoryBreakdown']
  ): AchievementCategory | null {
    let maxProgress = 0;
    let strongestCategory: AchievementCategory | null = null;

    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.progress > maxProgress) {
        maxProgress = data.progress;
        strongestCategory = category as AchievementCategory;
      }
    });

    return strongestCategory;
  }

  /**
   * Get weakest performing category
   */
  private static getWeakestCategory(
    categoryBreakdown: MonthlyProgressData['categoryBreakdown']
  ): AchievementCategory | null {
    let minProgress = 100;
    let weakestCategory: AchievementCategory | null = null;

    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.progress < minProgress && data.progress > 0) {
        minProgress = data.progress;
        weakestCategory = category as AchievementCategory;
      }
    });

    return weakestCategory;
  }

  /**
   * Get display name for category
   */
  private static getCategoryDisplayName(category: AchievementCategory): string {
    const displayNames = {
      [AchievementCategory.CONSISTENCY]: 'Daily Habits',
      [AchievementCategory.BUDGETING]: 'Budget Management',
      [AchievementCategory.TRANSACTIONS]: 'Spending Tracking',
      [AchievementCategory.FINANCIAL_HEALTH]: 'Financial Health',
      [AchievementCategory.EDUCATION]: 'Financial Learning',
      [AchievementCategory.CREDIT_MANAGEMENT]: 'Credit Building',
    };

    return displayNames[category] || category;
  }
}

export default MonthlyReportsService;
