/**
 * Achievement Service
 * Core service for managing achievements, progress tracking, and user engagement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  AchievementType,
  AchievementStatus,
  AchievementCategory,
  AchievementTier,
  UserEngagement,
  ProgressTracker,
  StreakData,
  MonthlyStats,
  AchievementStorage,
  AchievementEvent,
  AchievementEventType,
  TrackedFeature,
  NotificationSettings,
  MonthlyReport,
} from '../../types/achievements';

class AchievementService {
  private static instance: AchievementService;
  private achievements: Achievement[] = [];
  private userEngagement: UserEngagement | null = null;
  private progressTrackers: ProgressTracker[] = [];
  private streakData: StreakData | null = null;
  private notificationSettings: NotificationSettings | null = null;
  private listeners: ((event: AchievementEvent) => void)[] = [];

  // Storage keys
  private readonly STORAGE_KEY = '@clarifi_achievements';
  private readonly VERSION = '1.0.0';

  private constructor() {
    this.initializeAchievements();
  }

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Initialize the achievement system with predefined achievements
   */
  private initializeAchievements(): void {
    this.achievements = [
      // Streak Achievements
      {
        id: 'streak_3_days',
        title: 'Getting Started',
        description: 'Open ClariFi for 3 consecutive days',
        icon: 'calendar-check',
        type: AchievementType.STREAK,
        category: AchievementCategory.CONSISTENCY,
        tier: AchievementTier.BRONZE,
        points: 50,
        requirements: [
          {
            id: 'streak_req',
            description: 'Daily app opens',
            target: 3,
            current: 0,
            unit: 'days',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'streak_7_days',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'flame',
        type: AchievementType.STREAK,
        category: AchievementCategory.CONSISTENCY,
        tier: AchievementTier.SILVER,
        points: 100,
        requirements: [
          {
            id: 'streak_req',
            description: 'Daily app opens',
            target: 7,
            current: 0,
            unit: 'days',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'streak_30_days',
        title: 'Monthly Master',
        description: 'Complete a 30-day streak',
        icon: 'trophy',
        type: AchievementType.STREAK,
        category: AchievementCategory.CONSISTENCY,
        tier: AchievementTier.GOLD,
        points: 300,
        requirements: [
          {
            id: 'streak_req',
            description: 'Daily app opens',
            target: 30,
            current: 0,
            unit: 'days',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },

      // Transaction Achievements
      {
        id: 'first_categorization',
        title: 'Category Creator',
        description: 'Categorize your first transaction',
        icon: 'tag',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.TRANSACTIONS,
        tier: AchievementTier.BRONZE,
        points: 25,
        requirements: [
          {
            id: 'categorize_req',
            description: 'Transactions categorized',
            target: 1,
            current: 0,
            unit: 'transactions',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'transaction_organizer',
        title: 'Transaction Organizer',
        description: 'Categorize 50 transactions',
        icon: 'folder-organize',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.TRANSACTIONS,
        tier: AchievementTier.SILVER,
        points: 150,
        requirements: [
          {
            id: 'categorize_req',
            description: 'Transactions categorized',
            target: 50,
            current: 0,
            unit: 'transactions',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },

      // Budget Achievements
      {
        id: 'first_budget',
        title: 'Budget Beginner',
        description: 'Create your first budget',
        icon: 'calculator',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.BUDGETING,
        tier: AchievementTier.BRONZE,
        points: 75,
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
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'budget_master',
        title: 'Budget Master',
        description: 'Stay within budget for 3 consecutive months',
        icon: 'target',
        type: AchievementType.FINANCIAL_GOAL,
        category: AchievementCategory.BUDGETING,
        tier: AchievementTier.GOLD,
        points: 250,
        requirements: [
          {
            id: 'budget_adherence_req',
            description: 'Months within budget',
            target: 3,
            current: 0,
            unit: 'months',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },

      // Credit Management Achievements
      {
        id: 'first_credit_card',
        title: 'Credit Tracker',
        description: 'Add your first credit card',
        icon: 'credit-card',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.CREDIT_MANAGEMENT,
        tier: AchievementTier.BRONZE,
        points: 50,
        requirements: [
          {
            id: 'credit_card_req',
            description: 'Credit cards added',
            target: 1,
            current: 0,
            unit: 'cards',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'payment_optimizer',
        title: 'Payment Optimizer',
        description: 'Use the payment optimizer 10 times',
        icon: 'optimize',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.CREDIT_MANAGEMENT,
        tier: AchievementTier.SILVER,
        points: 125,
        requirements: [
          {
            id: 'optimizer_req',
            description: 'Optimizer uses',
            target: 10,
            current: 0,
            unit: 'uses',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },

      // Education Achievements
      {
        id: 'first_lesson',
        title: 'Eager Learner',
        description: 'Complete your first education module',
        icon: 'book-open',
        type: AchievementType.EDUCATION,
        category: AchievementCategory.EDUCATION,
        tier: AchievementTier.BRONZE,
        points: 75,
        requirements: [
          {
            id: 'education_req',
            description: 'Modules completed',
            target: 1,
            current: 0,
            unit: 'modules',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'education_graduate',
        title: 'Financial Graduate',
        description: 'Complete all education modules',
        icon: 'graduation-cap',
        type: AchievementType.EDUCATION,
        category: AchievementCategory.EDUCATION,
        tier: AchievementTier.PLATINUM,
        points: 500,
        requirements: [
          {
            id: 'education_complete_req',
            description: 'All modules completed',
            target: 100, // Will be updated based on actual module count
            current: 0,
            unit: 'percent',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },

      // Engagement Achievements
      {
        id: 'data_explorer',
        title: 'Data Explorer',
        description: 'Export your data for the first time',
        icon: 'download',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.FINANCIAL_HEALTH,
        tier: AchievementTier.BRONZE,
        points: 50,
        requirements: [
          {
            id: 'export_req',
            description: 'Data exports',
            target: 1,
            current: 0,
            unit: 'exports',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },
      {
        id: 'qa_curious',
        title: 'Curious Mind',
        description: 'Ask 25 questions in the Q&A system',
        icon: 'help-circle',
        type: AchievementType.FEATURE_USAGE,
        category: AchievementCategory.EDUCATION,
        tier: AchievementTier.SILVER,
        points: 100,
        requirements: [
          {
            id: 'qa_req',
            description: 'Questions asked',
            target: 25,
            current: 0,
            unit: 'questions',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
      },

      // Secret Achievement
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Use the app after midnight 5 times',
        icon: 'moon',
        type: AchievementType.ENGAGEMENT,
        category: AchievementCategory.CONSISTENCY,
        tier: AchievementTier.SILVER,
        points: 100,
        requirements: [
          {
            id: 'night_req',
            description: 'Late night sessions',
            target: 5,
            current: 0,
            unit: 'sessions',
            completed: false,
          },
        ],
        status: AchievementStatus.LOCKED,
        progress: 0,
        isSecret: true,
      },
    ];
  }

  /**
   * Initialize user engagement data
   */
  private initializeUserEngagement(userId: string): UserEngagement {
    const now = new Date();
    return {
      userId,
      lastActiveDate: now,
      currentStreak: 0,
      longestStreak: 0,
      totalAppOpens: 0,
      totalSessionTime: 0,
      featuresUsed: {},
      lastStreakUpdate: now,
      streakFreezeUsed: false,
      monthlyStats: [],
    };
  }

  /**
   * Initialize streak data
   */
  private initializeStreakData(): StreakData {
    const now = new Date();
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: now,
      streakStartDate: now,
      freezesUsed: 0,
      maxFreezes: 3, // Allow 3 streak freezes per month
      streakTarget: 30,
    };
  }

  /**
   * Initialize notification settings
   */
  private initializeNotificationSettings(): NotificationSettings {
    return {
      streakReminders: true,
      achievementProgress: true,
      milestones: true,
      monthlyReports: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    };
  }

  /**
   * Load achievement data from AsyncStorage
   */
  async loadAchievementData(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const data: AchievementStorage = JSON.parse(storedData);

        // Merge stored achievements with new ones (for app updates)
        this.mergeAchievements(data.achievements);
        this.userEngagement = data.userEngagement;
        this.progressTrackers = data.progressTrackers || [];
        this.streakData = data.streakData;
        this.notificationSettings = data.notificationSettings;

        // Handle data migration if needed
        if (data.version !== this.VERSION) {
          await this.migrateData(data);
        }
      }
    } catch (error) {
      console.error('Error loading achievement data:', error);
    }
  }

  /**
   * Save achievement data to AsyncStorage
   */
  private async saveAchievementData(): Promise<void> {
    try {
      const data: AchievementStorage = {
        achievements: this.achievements,
        userEngagement: this.userEngagement!,
        progressTrackers: this.progressTrackers,
        streakData: this.streakData!,
        notificationSettings: this.notificationSettings!,
        lastSyncDate: new Date(),
        version: this.VERSION,
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving achievement data:', error);
    }
  }

  /**
   * Merge stored achievements with new achievements (for app updates)
   */
  private mergeAchievements(storedAchievements: Achievement[]): void {
    const mergedAchievements: Achievement[] = [];

    for (const newAchievement of this.achievements) {
      const storedAchievement = storedAchievements.find(
        a => a.id === newAchievement.id
      );
      if (storedAchievement) {
        // Use stored progress and status, but update other properties
        mergedAchievements.push({
          ...newAchievement,
          status: storedAchievement.status,
          progress: storedAchievement.progress,
          completedAt: storedAchievement.completedAt,
          unlockedAt: storedAchievement.unlockedAt,
          requirements: storedAchievement.requirements,
        });
      } else {
        mergedAchievements.push(newAchievement);
      }
    }

    this.achievements = mergedAchievements;
  }

  /**
   * Handle data migration between versions
   */
  private async migrateData(oldData: AchievementStorage): Promise<void> {
    // Future data migration logic
    console.log(
      'Migrating achievement data from version:',
      oldData.version,
      'to:',
      this.VERSION
    );
    await this.saveAchievementData();
  }

  /**
   * Initialize the achievement system for a user
   */
  async initializeForUser(userId: string): Promise<void> {
    await this.loadAchievementData();

    if (!this.userEngagement) {
      this.userEngagement = this.initializeUserEngagement(userId);
    }

    if (!this.streakData) {
      this.streakData = this.initializeStreakData();
    }

    if (!this.notificationSettings) {
      this.notificationSettings = this.initializeNotificationSettings();
    }

    await this.saveAchievementData();
  }

  /**
   * Track feature usage
   */
  async trackFeature(
    feature: TrackedFeature,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.userEngagement) return;

    // Update feature usage count
    this.userEngagement.featuresUsed[feature] =
      (this.userEngagement.featuresUsed[feature] || 0) + 1;

    // Handle app open tracking
    if (feature === TrackedFeature.APP_OPEN) {
      await this.handleAppOpen();
    }

    // Update achievement progress based on feature usage
    await this.updateAchievementProgress(feature, metadata);

    await this.saveAchievementData();
  }

  /**
   * Handle app open event for streak tracking
   */
  private async handleAppOpen(): Promise<void> {
    if (!this.userEngagement || !this.streakData) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveDay = new Date(
      this.userEngagement.lastActiveDate.getFullYear(),
      this.userEngagement.lastActiveDate.getMonth(),
      this.userEngagement.lastActiveDate.getDate()
    );

    this.userEngagement.totalAppOpens += 1;
    this.userEngagement.lastActiveDate = now;

    // Check if this is a new day
    if (today.getTime() !== lastActiveDay.getTime()) {
      const daysDifference = Math.floor(
        (today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference === 1) {
        // Consecutive day - increment streak
        this.streakData.currentStreak += 1;
        this.streakData.longestStreak = Math.max(
          this.streakData.longestStreak,
          this.streakData.currentStreak
        );
      } else if (daysDifference > 1) {
        // Streak broken - reset unless using freeze
        if (
          this.streakData.freezesUsed < this.streakData.maxFreezes &&
          daysDifference <= 3
        ) {
          // Use streak freeze (only for 1-3 day gaps)
          this.streakData.freezesUsed += 1;
          this.emitEvent({
            type: AchievementEventType.STREAK_UPDATED,
            timestamp: now,
            metadata: { streakFreezeUsed: true, daysMissed: daysDifference },
          });
        } else {
          // Reset streak
          this.streakData.currentStreak = 1;
          this.streakData.streakStartDate = now;
        }
      }
      // If daysDifference === 0, it's the same day, no streak update needed

      this.streakData.lastActiveDate = now;
      this.userEngagement.lastStreakUpdate = now;

      // Update streak achievements
      await this.updateStreakAchievements();
    }

    // Check for night owl achievement (after midnight)
    if (now.getHours() >= 0 && now.getHours() < 6) {
      await this.updateAchievementProgress(TrackedFeature.APP_OPEN, {
        isNightTime: true,
      });
    }
  }

  /**
   * Update achievement progress based on feature usage
   */
  private async updateAchievementProgress(
    feature: TrackedFeature,
    metadata?: Record<string, any>
  ): Promise<void> {
    for (const achievement of this.achievements) {
      let shouldUpdate = false;
      let progressIncrement = 0;

      // Check if this feature affects this achievement
      switch (achievement.id) {
        case 'first_categorization':
        case 'transaction_organizer':
          if (feature === TrackedFeature.TRANSACTION_CATEGORIZE) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'first_budget':
          if (feature === TrackedFeature.BUDGET_CREATE) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'first_credit_card':
          if (feature === TrackedFeature.CREDIT_CARD_ADD) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'payment_optimizer':
          if (feature === TrackedFeature.PAYMENT_OPTIMIZE) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'first_lesson':
        case 'education_graduate':
          if (feature === TrackedFeature.EDUCATION_MODULE_COMPLETE) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'data_explorer':
          if (feature === TrackedFeature.EXPORT_DATA) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'qa_curious':
          if (feature === TrackedFeature.QA_QUESTION_ASK) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;

        case 'night_owl':
          if (feature === TrackedFeature.APP_OPEN && metadata?.isNightTime) {
            shouldUpdate = true;
            progressIncrement = 1;
          }
          break;
      }

      if (shouldUpdate) {
        await this.incrementAchievementProgress(
          achievement.id,
          progressIncrement
        );
      }
    }
  }

  /**
   * Update streak-based achievements
   */
  private async updateStreakAchievements(): Promise<void> {
    if (!this.streakData) return;

    const streakAchievements = this.achievements.filter(
      a => a.type === AchievementType.STREAK
    );

    for (const achievement of streakAchievements) {
      const targetStreak = achievement.requirements[0]?.target || 0;
      const currentProgress = Math.min(
        (this.streakData.currentStreak / targetStreak) * 100,
        100
      );

      if (achievement.progress !== currentProgress) {
        achievement.progress = currentProgress;
        achievement.requirements[0].current = this.streakData.currentStreak;

        if (
          currentProgress >= 100 &&
          achievement.status !== AchievementStatus.COMPLETED
        ) {
          await this.completeAchievement(achievement.id);
        } else if (
          achievement.status === AchievementStatus.LOCKED &&
          currentProgress > 0
        ) {
          achievement.status = AchievementStatus.IN_PROGRESS;
          achievement.unlockedAt = new Date();
        }

        this.emitEvent({
          type: AchievementEventType.PROGRESS_UPDATE,
          achievementId: achievement.id,
          progress: currentProgress,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Increment achievement progress
   */
  async incrementAchievementProgress(
    achievementId: string,
    increment: number
  ): Promise<void> {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.status === AchievementStatus.COMPLETED)
      return;

    // Update requirement progress
    const requirement = achievement.requirements[0];
    if (requirement) {
      requirement.current = Math.min(
        requirement.current + increment,
        requirement.target
      );
      achievement.progress = Math.min(
        (requirement.current / requirement.target) * 100,
        100
      );

      if (requirement.current >= requirement.target) {
        requirement.completed = true;
        await this.completeAchievement(achievementId);
      } else if (achievement.status === AchievementStatus.LOCKED) {
        achievement.status = AchievementStatus.IN_PROGRESS;
        achievement.unlockedAt = new Date();

        this.emitEvent({
          type: AchievementEventType.ACHIEVEMENT_UNLOCKED,
          achievementId,
          timestamp: new Date(),
        });
      }

      this.emitEvent({
        type: AchievementEventType.PROGRESS_UPDATE,
        achievementId,
        progress: achievement.progress,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Complete an achievement
   */
  async completeAchievement(achievementId: string): Promise<void> {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.status === AchievementStatus.COMPLETED)
      return;

    achievement.status = AchievementStatus.COMPLETED;
    achievement.completedAt = new Date();
    achievement.progress = 100;

    // Mark all requirements as completed
    achievement.requirements.forEach(req => {
      req.completed = true;
      req.current = req.target;
    });

    this.emitEvent({
      type: AchievementEventType.ACHIEVEMENT_COMPLETED,
      achievementId,
      timestamp: new Date(),
    });

    await this.saveAchievementData();
  }

  /**
   * Get all achievements
   */
  getAchievements(): Achievement[] {
    return this.achievements.filter(
      a => !a.isSecret || a.status !== AchievementStatus.LOCKED
    );
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAchievements().filter(a => a.category === category);
  }

  /**
   * Get completed achievements
   */
  getCompletedAchievements(): Achievement[] {
    return this.achievements.filter(
      a => a.status === AchievementStatus.COMPLETED
    );
  }

  /**
   * Get user engagement data
   */
  getUserEngagement(): UserEngagement | null {
    return this.userEngagement;
  }

  /**
   * Get streak data
   */
  getStreakData(): StreakData | null {
    return this.streakData;
  }

  /**
   * Generate monthly report
   */
  generateMonthlyReport(month: string): MonthlyReport | null {
    if (!this.userEngagement) return null;

    const monthlyStats = this.userEngagement.monthlyStats.find(
      m => m.month === month
    );
    const previousMonth = this.getPreviousMonth(month);
    const previousStats = this.userEngagement.monthlyStats.find(
      m => m.month === previousMonth
    );

    if (!monthlyStats) return null;

    const monthAchievements = this.achievements.filter(
      a =>
        a.completedAt && a.completedAt.toISOString().substring(0, 7) === month
    );

    return {
      month,
      summary: {
        totalAppOpens: monthlyStats.appOpens,
        totalSessionTime: monthlyStats.sessionTime,
        streakDays: monthlyStats.streakDays,
        achievementsEarned: monthlyStats.achievementsEarned.length,
        newFeaturesUsed: Object.keys(monthlyStats.featuresUsed).length,
      },
      achievements: monthAchievements,
      topFeatures: Object.entries(monthlyStats.featuresUsed)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([feature, usage]) => ({ feature, usage })),
      streakAnalysis: {
        bestStreak: this.streakData?.longestStreak || 0,
        consistencyScore: this.calculateConsistencyScore(monthlyStats.appOpens),
      },
      goals: {
        completed: monthlyStats.financialGoalsMet,
        inProgress: 0, // Can be calculated based on active goals
      },
      comparison: {
        vs_previous_month: {
          app_opens: previousStats
            ? ((monthlyStats.appOpens - previousStats.appOpens) /
                previousStats.appOpens) *
              100
            : 0,
          session_time: previousStats
            ? ((monthlyStats.sessionTime - previousStats.sessionTime) /
                previousStats.sessionTime) *
              100
            : 0,
          achievements: previousStats
            ? monthlyStats.achievementsEarned.length -
              previousStats.achievementsEarned.length
            : 0,
        },
      },
    };
  }

  /**
   * Calculate consistency score based on app opens
   */
  private calculateConsistencyScore(appOpens: number): number {
    // Assume 30 days in a month, perfect score is daily usage
    const maxPossibleOpens = 30;
    return Math.min((appOpens / maxPossibleOpens) * 100, 100);
  }

  /**
   * Get previous month string
   */
  private getPreviousMonth(month: string): string {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 2); // -2 because month is 0-indexed and we want previous
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: AchievementEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: AchievementEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Emit achievement event
   */
  private emitEvent(event: AchievementEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): NotificationSettings | null {
    return this.notificationSettings;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    if (!this.notificationSettings) return;

    this.notificationSettings = { ...this.notificationSettings, ...settings };
    await this.saveAchievementData();
  }

  /**
   * Reset all achievement data (for testing or user request)
   */
  async resetAchievements(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.achievements = [];
    this.userEngagement = null;
    this.progressTrackers = [];
    this.streakData = null;
    this.notificationSettings = null;
    this.initializeAchievements();
  }
}

export default AchievementService;
