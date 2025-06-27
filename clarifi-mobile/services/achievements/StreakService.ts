/**
 * Streak Service
 * Advanced streak tracking with freeze mechanisms and milestone management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StreakData,
  AchievementEvent,
  AchievementEventType,
} from '../../types/achievements';

export interface StreakMilestone {
  id: string;
  name: string;
  description: string;
  target: number;
  reward: {
    points: number;
    title: string;
    icon: string;
  };
  unlocked: boolean;
  completedAt?: Date;
}

export interface StreakFreeze {
  id: string;
  usedAt: Date;
  daysMissed: number;
  reason: 'manual' | 'automatic';
  expiresAt: Date;
}

export interface StreakAnalytics {
  weeklyPattern: number[]; // 7 days, 0-1 for each day of week
  monthlyConsistency: number; // 0-100 percentage
  bestStreakMonth: string; // YYYY-MM
  averageStreakLength: number;
  totalDaysActive: number;
  streakRestarts: number;
  freezesUsed: number;
  currentMonthProgress: {
    daysActive: number;
    possibleDays: number;
    percentage: number;
  };
}

export interface ExtendedStreakData extends StreakData {
  milestones: StreakMilestone[];
  freezes: StreakFreeze[];
  analytics: StreakAnalytics;
  lastCalculatedDate: Date;
  streakHistory: Array<{
    startDate: Date;
    endDate: Date;
    length: number;
    endReason: 'broken' | 'freeze_used' | 'ongoing';
  }>;
}

class StreakService {
  private static instance: StreakService;
  private streakData: ExtendedStreakData | null = null;
  private listeners: ((event: AchievementEvent) => void)[] = [];

  private readonly STORAGE_KEY = '@clarifi_streak_data';
  private readonly FREEZE_DURATION_DAYS = 7; // Freeze lasts 7 days
  private readonly MAX_FREEZES_PER_MONTH = 3;

  private readonly STREAK_MILESTONES: Omit<
    StreakMilestone,
    'unlocked' | 'completedAt'
  >[] = [
    {
      id: 'first_week',
      name: 'First Week',
      description: 'Complete your first 7-day streak',
      target: 7,
      reward: { points: 100, title: 'Week Warrior', icon: 'calendar-week' },
    },
    {
      id: 'two_weeks',
      name: 'Two Weeks Strong',
      description: 'Maintain a 14-day streak',
      target: 14,
      reward: { points: 200, title: 'Fortnight Fighter', icon: 'flame' },
    },
    {
      id: 'one_month',
      name: 'Monthly Master',
      description: 'Achieve a full 30-day streak',
      target: 30,
      reward: { points: 500, title: 'Month Champion', icon: 'trophy' },
    },
    {
      id: 'two_months',
      name: 'Consistency King',
      description: 'Maintain a 60-day streak',
      target: 60,
      reward: { points: 1000, title: 'Consistency King', icon: 'crown' },
    },
    {
      id: 'three_months',
      name: 'Quarter Master',
      description: 'Complete a 90-day streak',
      target: 90,
      reward: { points: 2000, title: 'Quarter Master', icon: 'medal' },
    },
    {
      id: 'half_year',
      name: 'Half Year Hero',
      description: 'Achieve an incredible 180-day streak',
      target: 180,
      reward: { points: 5000, title: 'Half Year Hero', icon: 'star' },
    },
    {
      id: 'full_year',
      name: 'Year Legend',
      description: 'Complete a legendary 365-day streak',
      target: 365,
      reward: { points: 10000, title: 'Year Legend', icon: 'diamond' },
    },
  ];

  private constructor() {}

  static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  /**
   * Initialize streak service
   */
  async initialize(): Promise<void> {
    await this.loadStreakData();
    if (!this.streakData) {
      this.streakData = this.createInitialStreakData();
      await this.saveStreakData();
    }
  }

  /**
   * Create initial streak data
   */
  private createInitialStreakData(): ExtendedStreakData {
    const now = new Date();
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: now,
      streakStartDate: now,
      freezesUsed: 0,
      maxFreezes: this.MAX_FREEZES_PER_MONTH,
      streakTarget: 30,
      milestones: this.STREAK_MILESTONES.map(m => ({
        ...m,
        unlocked: false,
      })),
      freezes: [],
      analytics: this.createInitialAnalytics(),
      lastCalculatedDate: now,
      streakHistory: [],
    };
  }

  /**
   * Create initial analytics
   */
  private createInitialAnalytics(): StreakAnalytics {
    return {
      weeklyPattern: [0, 0, 0, 0, 0, 0, 0],
      monthlyConsistency: 0,
      bestStreakMonth: this.getCurrentMonthString(),
      averageStreakLength: 0,
      totalDaysActive: 0,
      streakRestarts: 0,
      freezesUsed: 0,
      currentMonthProgress: {
        daysActive: 0,
        possibleDays: this.getDaysInCurrentMonth(),
        percentage: 0,
      },
    };
  }

  /**
   * Update streak on app open
   */
  async updateStreak(): Promise<void> {
    if (!this.streakData) {
      await this.initialize();
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveDay = new Date(
      this.streakData.lastActiveDate.getFullYear(),
      this.streakData.lastActiveDate.getMonth(),
      this.streakData.lastActiveDate.getDate()
    );

    // Skip if already counted today
    if (today.getTime() === lastActiveDay.getTime()) {
      return;
    }

    const daysDifference = Math.floor(
      (today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 1) {
      // Consecutive day - increment streak
      await this.incrementStreak(now);
    } else if (daysDifference > 1) {
      // Gap in streak - check for freeze or break
      await this.handleStreakGap(daysDifference, now);
    }

    // Update analytics
    await this.updateAnalytics(now);

    // Check milestones
    await this.checkMilestones();

    // Save data
    await this.saveStreakData();
  }

  /**
   * Increment streak
   */
  private async incrementStreak(date: Date): Promise<void> {
    if (!this.streakData) return;

    this.streakData.currentStreak += 1;
    this.streakData.longestStreak = Math.max(
      this.streakData.longestStreak,
      this.streakData.currentStreak
    );
    this.streakData.lastActiveDate = date;

    this.emitEvent({
      type: AchievementEventType.STREAK_UPDATED,
      timestamp: date,
      metadata: {
        newStreak: this.streakData.currentStreak,
        action: 'increment',
      },
    });
  }

  /**
   * Handle streak gap
   */
  private async handleStreakGap(daysMissed: number, date: Date): Promise<void> {
    if (!this.streakData) return;

    // Check if we can use a freeze
    if (await this.canUseStreakFreeze(daysMissed)) {
      await this.useStreakFreeze(daysMissed, date);
    } else {
      await this.breakStreak(date, daysMissed);
    }
  }

  /**
   * Check if streak freeze can be used
   */
  private async canUseStreakFreeze(daysMissed: number): Promise<boolean> {
    if (!this.streakData) return false;

    // Can only freeze gaps of 1-3 days
    if (daysMissed > 3) return false;

    // Check if user has freezes available this month
    const currentMonth = this.getCurrentMonthString();
    const monthlyFreezes = this.streakData.freezes.filter(
      f => f.usedAt.toISOString().substring(0, 7) === currentMonth
    );

    return monthlyFreezes.length < this.MAX_FREEZES_PER_MONTH;
  }

  /**
   * Use streak freeze
   */
  private async useStreakFreeze(daysMissed: number, date: Date): Promise<void> {
    if (!this.streakData) return;

    const freeze: StreakFreeze = {
      id: `freeze_${Date.now()}`,
      usedAt: date,
      daysMissed,
      reason: 'automatic',
      expiresAt: new Date(
        date.getTime() + this.FREEZE_DURATION_DAYS * 24 * 60 * 60 * 1000
      ),
    };

    this.streakData.freezes.push(freeze);
    this.streakData.freezesUsed += 1;
    this.streakData.lastActiveDate = date;

    this.emitEvent({
      type: AchievementEventType.STREAK_UPDATED,
      timestamp: date,
      metadata: {
        action: 'freeze_used',
        daysMissed,
        freezesRemaining:
          this.MAX_FREEZES_PER_MONTH - this.getMonthlyFreezesUsed(),
      },
    });
  }

  /**
   * Break streak
   */
  private async breakStreak(date: Date, daysMissed: number): Promise<void> {
    if (!this.streakData) return;

    // Add to history
    if (this.streakData.currentStreak > 0) {
      this.streakData.streakHistory.push({
        startDate: this.streakData.streakStartDate,
        endDate: this.streakData.lastActiveDate,
        length: this.streakData.currentStreak,
        endReason: 'broken',
      });
    }

    // Reset streak
    const oldStreak = this.streakData.currentStreak;
    this.streakData.currentStreak = 1; // Today counts as day 1
    this.streakData.streakStartDate = date;
    this.streakData.lastActiveDate = date;
    this.streakData.analytics.streakRestarts += 1;

    this.emitEvent({
      type: AchievementEventType.STREAK_UPDATED,
      timestamp: date,
      metadata: {
        action: 'broken',
        oldStreak,
        daysMissed,
      },
    });
  }

  /**
   * Update analytics
   */
  private async updateAnalytics(date: Date): Promise<void> {
    if (!this.streakData) return;

    const analytics = this.streakData.analytics;

    // Update weekly pattern
    const dayOfWeek = date.getDay();
    analytics.weeklyPattern[dayOfWeek] = Math.min(
      analytics.weeklyPattern[dayOfWeek] + 0.1,
      1
    );

    // Update total days active
    analytics.totalDaysActive += 1;

    // Update monthly consistency
    const currentMonth = this.getCurrentMonthString();
    const daysInMonth = this.getDaysInCurrentMonth();
    const activeDaysThisMonth = this.getActiveDaysInMonth(currentMonth);

    analytics.monthlyConsistency = (activeDaysThisMonth / daysInMonth) * 100;
    analytics.currentMonthProgress = {
      daysActive: activeDaysThisMonth,
      possibleDays: daysInMonth,
      percentage: (activeDaysThisMonth / daysInMonth) * 100,
    };

    // Update average streak length
    if (this.streakData.streakHistory.length > 0) {
      const totalLength = this.streakData.streakHistory.reduce(
        (sum, streak) => sum + streak.length,
        0
      );
      analytics.averageStreakLength =
        totalLength / this.streakData.streakHistory.length;
    }

    // Update best streak month
    if (
      this.streakData.currentStreak > this.getBestStreakForMonth(currentMonth)
    ) {
      analytics.bestStreakMonth = currentMonth;
    }
  }

  /**
   * Check and unlock milestones
   */
  private async checkMilestones(): Promise<void> {
    if (!this.streakData) return;

    for (const milestone of this.streakData.milestones) {
      if (
        !milestone.unlocked &&
        this.streakData.currentStreak >= milestone.target
      ) {
        milestone.unlocked = true;
        milestone.completedAt = new Date();

        this.emitEvent({
          type: AchievementEventType.MILESTONE_REACHED,
          timestamp: new Date(),
          metadata: {
            milestoneId: milestone.id,
            milestone: milestone.name,
            reward: milestone.reward,
          },
        });
      }
    }
  }

  /**
   * Manually use streak freeze
   */
  async useManualStreakFreeze(): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!this.streakData) {
      return { success: false, message: 'Streak service not initialized' };
    }

    if (!(await this.canUseStreakFreeze(1))) {
      return {
        success: false,
        message: 'No streak freezes available this month',
      };
    }

    const now = new Date();
    const freeze: StreakFreeze = {
      id: `freeze_${Date.now()}`,
      usedAt: now,
      daysMissed: 0,
      reason: 'manual',
      expiresAt: new Date(
        now.getTime() + this.FREEZE_DURATION_DAYS * 24 * 60 * 60 * 1000
      ),
    };

    this.streakData.freezes.push(freeze);
    this.streakData.freezesUsed += 1;

    await this.saveStreakData();

    return {
      success: true,
      message: `Streak freeze activated! You have ${this.MAX_FREEZES_PER_MONTH - this.getMonthlyFreezesUsed()} freezes remaining this month.`,
    };
  }

  /**
   * Get monthly freezes used
   */
  private getMonthlyFreezesUsed(): number {
    if (!this.streakData) return 0;

    const currentMonth = this.getCurrentMonthString();
    return this.streakData.freezes.filter(
      f => f.usedAt.toISOString().substring(0, 7) === currentMonth
    ).length;
  }

  /**
   * Get active days in month
   */
  private getActiveDaysInMonth(month: string): number {
    // This would need to be calculated based on actual activity data
    // For now, return current streak if it's this month
    if (month === this.getCurrentMonthString()) {
      return Math.min(
        this.streakData?.currentStreak || 0,
        this.getDaysInCurrentMonth()
      );
    }
    return 0;
  }

  /**
   * Get best streak for month
   */
  private getBestStreakForMonth(month: string): number {
    if (!this.streakData) return 0;

    // This would need to track historical data
    // For now, return current streak if it's this month
    if (month === this.getCurrentMonthString()) {
      return this.streakData.currentStreak;
    }
    return 0;
  }

  /**
   * Get current month string
   */
  private getCurrentMonthString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get days in current month
   */
  private getDaysInCurrentMonth(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  /**
   * Load streak data from AsyncStorage
   */
  private async loadStreakData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        this.streakData = {
          ...parsed,
          lastActiveDate: new Date(parsed.lastActiveDate),
          streakStartDate: new Date(parsed.streakStartDate),
          lastCalculatedDate: new Date(parsed.lastCalculatedDate),
          freezes: parsed.freezes.map((f: any) => ({
            ...f,
            usedAt: new Date(f.usedAt),
            expiresAt: new Date(f.expiresAt),
          })),
          streakHistory: parsed.streakHistory.map((h: any) => ({
            ...h,
            startDate: new Date(h.startDate),
            endDate: new Date(h.endDate),
          })),
          milestones: parsed.milestones.map((m: any) => ({
            ...m,
            completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
          })),
        };
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  }

  /**
   * Save streak data to AsyncStorage
   */
  private async saveStreakData(): Promise<void> {
    try {
      if (this.streakData) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.streakData)
        );
      }
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  }

  /**
   * Get streak data
   */
  getStreakData(): ExtendedStreakData | null {
    return this.streakData;
  }

  /**
   * Get streak milestones
   */
  getMilestones(): StreakMilestone[] {
    return this.streakData?.milestones || [];
  }

  /**
   * Get streak analytics
   */
  getAnalytics(): StreakAnalytics | null {
    return this.streakData?.analytics || null;
  }

  /**
   * Get available freezes
   */
  getAvailableFreezes(): number {
    return this.MAX_FREEZES_PER_MONTH - this.getMonthlyFreezesUsed();
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
   * Emit event
   */
  private emitEvent(event: AchievementEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Reset streak data (for testing)
   */
  async resetStreakData(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.streakData = null;
    await this.initialize();
  }
}

export default StreakService;
