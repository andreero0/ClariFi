/**
 * useStreakTracking Hook
 * React hook for accessing streak data and functionality
 */

import { useState, useEffect, useCallback } from 'react';
import StreakService, {
  ExtendedStreakData,
  StreakMilestone,
  StreakAnalytics,
  StreakFreeze,
} from '../services/achievements/StreakService';
import { AchievementEvent, AchievementEventType } from '../types/achievements';

interface StreakHookReturn {
  // Data
  streakData: ExtendedStreakData | null;
  currentStreak: number;
  longestStreak: number;
  streakTarget: number;
  milestones: StreakMilestone[];
  analytics: StreakAnalytics | null;
  availableFreezes: number;
  isLoading: boolean;

  // Actions
  updateStreak: () => Promise<void>;
  useManualFreeze: () => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;

  // Calculated values
  streakPercentage: number;
  nextMilestone: StreakMilestone | null;
  daysUntilNextMilestone: number;
  isOnStreak: boolean;
  consecutiveDaysThisMonth: number;
  monthlyProgress: {
    percentage: number;
    daysActive: number;
    possibleDays: number;
  };
}

export function useStreakTracking(): StreakHookReturn {
  const [streakData, setStreakData] = useState<ExtendedStreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const streakService = StreakService.getInstance();

  // Initialize and load data
  useEffect(() => {
    let eventCleanup: (() => void) | null = null;

    const initializeStreak = async () => {
      try {
        setIsLoading(true);
        await streakService.initialize();
        await refreshData();

        // Listen for streak events
        eventCleanup = addStreakEventListener(event => {
          // Refresh data when streak events occur
          refreshData();
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing streak tracking:', error);
        setIsLoading(false);
      }
    };

    initializeStreak();

    return () => {
      if (eventCleanup) {
        eventCleanup();
      }
    };
  }, []);

  /**
   * Refresh streak data
   */
  const refreshData = useCallback(async () => {
    try {
      const data = streakService.getStreakData();
      setStreakData(data);
    } catch (error) {
      console.error('Error refreshing streak data:', error);
    }
  }, [streakService]);

  /**
   * Update streak (call on app open)
   */
  const updateStreak = useCallback(async () => {
    try {
      await streakService.updateStreak();
      await refreshData();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [streakService, refreshData]);

  /**
   * Use manual streak freeze
   */
  const useManualFreeze = useCallback(async () => {
    try {
      const result = await streakService.useManualStreakFreeze();
      if (result.success) {
        await refreshData();
      }
      return result;
    } catch (error) {
      console.error('Error using manual freeze:', error);
      return { success: false, message: 'Error using streak freeze' };
    }
  }, [streakService, refreshData]);

  /**
   * Add streak event listener
   */
  const addStreakEventListener = useCallback(
    (callback: (event: AchievementEvent) => void) => {
      const filteredCallback = (event: AchievementEvent) => {
        // Only listen to streak-related events
        if (
          [
            AchievementEventType.STREAK_UPDATED,
            AchievementEventType.MILESTONE_REACHED,
          ].includes(event.type)
        ) {
          callback(event);
        }
      };

      streakService.addEventListener(filteredCallback);

      return () => {
        streakService.removeEventListener(filteredCallback);
      };
    },
    [streakService]
  );

  // Calculated values
  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const streakTarget = streakData?.streakTarget || 30;
  const milestones = streakData?.milestones || [];
  const analytics = streakData?.analytics || null;
  const availableFreezes = streakService.getAvailableFreezes();

  // Calculate streak percentage towards target
  const streakPercentage = Math.min((currentStreak / streakTarget) * 100, 100);

  // Find next milestone
  const nextMilestone =
    milestones
      .filter(m => !m.unlocked)
      .sort((a, b) => a.target - b.target)[0] || null;

  // Days until next milestone
  const daysUntilNextMilestone = nextMilestone
    ? Math.max(nextMilestone.target - currentStreak, 0)
    : 0;

  // Check if user is currently on a streak
  const isOnStreak = currentStreak > 0;

  // Get consecutive days this month
  const consecutiveDaysThisMonth =
    analytics?.currentMonthProgress?.daysActive || 0;

  // Monthly progress
  const monthlyProgress = {
    percentage: analytics?.currentMonthProgress?.percentage || 0,
    daysActive: analytics?.currentMonthProgress?.daysActive || 0,
    possibleDays: analytics?.currentMonthProgress?.possibleDays || 30,
  };

  return {
    // Data
    streakData,
    currentStreak,
    longestStreak,
    streakTarget,
    milestones,
    analytics,
    availableFreezes,
    isLoading,

    // Actions
    updateStreak,
    useManualFreeze,
    refreshData,

    // Calculated values
    streakPercentage,
    nextMilestone,
    daysUntilNextMilestone,
    isOnStreak,
    consecutiveDaysThisMonth,
    monthlyProgress,
  };
}

/**
 * Hook for streak statistics
 */
export function useStreakStats() {
  const { streakData, analytics, milestones } = useStreakTracking();

  const stats = {
    // Current status
    currentStreak: streakData?.currentStreak || 0,
    longestStreak: streakData?.longestStreak || 0,
    totalDaysActive: analytics?.totalDaysActive || 0,

    // Milestones
    totalMilestones: milestones.length,
    unlockedMilestones: milestones.filter(m => m.unlocked).length,
    milestoneCompletionRate:
      milestones.length > 0
        ? (milestones.filter(m => m.unlocked).length / milestones.length) * 100
        : 0,

    // Analytics
    monthlyConsistency: analytics?.monthlyConsistency || 0,
    averageStreakLength: analytics?.averageStreakLength || 0,
    streakRestarts: analytics?.streakRestarts || 0,
    freezesUsed: analytics?.freezesUsed || 0,

    // Weekly pattern (how consistent each day of week)
    weeklyPattern: analytics?.weeklyPattern || [0, 0, 0, 0, 0, 0, 0],
    bestDay: analytics?.weeklyPattern
      ? analytics.weeklyPattern.indexOf(Math.max(...analytics.weeklyPattern))
      : 0,
    worstDay: analytics?.weeklyPattern
      ? analytics.weeklyPattern.indexOf(Math.min(...analytics.weeklyPattern))
      : 0,
  };

  return stats;
}

/**
 * Hook for streak milestones
 */
export function useStreakMilestones() {
  const { milestones, currentStreak } = useStreakTracking();

  const categorizedMilestones = {
    completed: milestones.filter(m => m.unlocked),
    upcoming: milestones
      .filter(m => !m.unlocked)
      .sort((a, b) => a.target - b.target),
    next:
      milestones
        .filter(m => !m.unlocked)
        .sort((a, b) => a.target - b.target)[0] || null,
  };

  const progress = categorizedMilestones.next
    ? {
        current: currentStreak,
        target: categorizedMilestones.next.target,
        percentage: Math.min(
          (currentStreak / categorizedMilestones.next.target) * 100,
          100
        ),
        remaining: Math.max(
          categorizedMilestones.next.target - currentStreak,
          0
        ),
      }
    : null;

  return {
    ...categorizedMilestones,
    progress,
    totalPoints: categorizedMilestones.completed.reduce(
      (sum, m) => sum + m.reward.points,
      0
    ),
  };
}

/**
 * Hook for streak freeze management
 */
export function useStreakFreezes() {
  const { availableFreezes, useManualFreeze, streakData } = useStreakTracking();

  const freezeHistory = streakData?.freezes || [];
  const currentMonthFreezes = freezeHistory.filter(f => {
    const freezeMonth = f.usedAt.toISOString().substring(0, 7);
    const currentMonth = new Date().toISOString().substring(0, 7);
    return freezeMonth === currentMonth;
  });

  const canUseFreeze = availableFreezes > 0;
  const maxFreezes = 3; // From service

  return {
    availableFreezes,
    maxFreezes,
    canUseFreeze,
    freezeHistory,
    currentMonthFreezes,
    useFreeze: useManualFreeze,
    freezeUsageRate: currentMonthFreezes.length / maxFreezes,
  };
}

/**
 * Hook for streak visualization data
 */
export function useStreakVisualization() {
  const { streakData, analytics } = useStreakTracking();

  // Generate calendar data for current month
  const generateCalendarData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendarDays = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push({ day: null, active: false, isToday: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = day === now.getDate();
      const isActive = day <= now.getDate(); // Simplified - would need actual activity data

      calendarDays.push({
        day,
        active: isActive,
        isToday,
        date,
      });
    }

    return calendarDays;
  };

  // Generate streak chart data (last 30 days)
  const generateStreakChartData = () => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayValue = i < (streakData?.currentStreak || 0) ? 1 : 0;

      data.push({
        date: date.toISOString().split('T')[0],
        value: dayValue,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    return data;
  };

  return {
    calendarData: generateCalendarData(),
    chartData: generateStreakChartData(),
    weeklyPattern: analytics?.weeklyPattern || [0, 0, 0, 0, 0, 0, 0],
    consistencyScore: analytics?.monthlyConsistency || 0,
  };
}

export default useStreakTracking;
