/**
 * Achievement Context
 * Provides achievement system state and functions throughout the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  Achievement,
  AchievementEvent,
  AchievementEventType,
  UserEngagement,
  StreakData,
  MonthlyReport,
  NotificationSettings,
  AchievementCategory,
} from '../types/achievements';
import AchievementService from '../services/achievements/AchievementService';
import EngagementTracker from '../services/achievements/EngagementTracker';

interface AchievementContextType {
  // State
  achievements: Achievement[];
  completedAchievements: Achievement[];
  userEngagement: UserEngagement | null;
  streakData: StreakData | null;
  notificationSettings: NotificationSettings | null;
  isLoading: boolean;

  // Achievement functions
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getAchievement: (id: string) => Achievement | undefined;
  refreshAchievements: () => Promise<void>;

  // Tracking functions
  initializeForUser: (userId: string) => Promise<void>;

  // Report functions
  generateMonthlyReport: (month: string) => MonthlyReport | null;
  getCurrentMonthEngagement: () => {
    appOpens: number;
    sessionTime: number;
    featuresUsed: Record<string, number>;
    currentStreak: number;
  };

  // Settings
  updateNotificationSettings: (
    settings: Partial<NotificationSettings>
  ) => Promise<void>;

  // Event handling
  onAchievementEvent: (
    callback: (event: AchievementEvent) => void
  ) => () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined
);

interface AchievementProviderProps {
  children: ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [completedAchievements, setCompletedAchievements] = useState<
    Achievement[]
  >([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(
    null
  );
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const achievementService = AchievementService.getInstance();
  const engagementTracker = EngagementTracker.getInstance();

  // Initialize achievement system
  useEffect(() => {
    let eventCleanup: (() => void) | null = null;

    const initializeAchievements = async () => {
      try {
        setIsLoading(true);
        await achievementService.loadAchievementData();
        await refreshAchievements();

        // Set up event listener for real-time updates
        eventCleanup = onAchievementEvent(event => {
          // Refresh achievements when events occur
          refreshAchievements();
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing achievements:', error);
        setIsLoading(false);
      }
    };

    initializeAchievements();

    return () => {
      if (eventCleanup) {
        eventCleanup();
      }
    };
  }, []);

  /**
   * Refresh achievement data from service
   */
  const refreshAchievements = useCallback(async () => {
    try {
      const allAchievements = achievementService.getAchievements();
      const completed = achievementService.getCompletedAchievements();
      const engagement = achievementService.getUserEngagement();
      const streak = achievementService.getStreakData();
      const notifications = achievementService.getNotificationSettings();

      setAchievements(allAchievements);
      setCompletedAchievements(completed);
      setUserEngagement(engagement);
      setStreakData(streak);
      setNotificationSettings(notifications);
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    }
  }, [achievementService]);

  /**
   * Initialize achievement system for a user
   */
  const initializeForUser = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true);
        await achievementService.initializeForUser(userId);
        await engagementTracker.initialize(userId);
        await refreshAchievements();
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing user achievements:', error);
        setIsLoading(false);
      }
    },
    [achievementService, engagementTracker, refreshAchievements]
  );

  /**
   * Get achievements by category
   */
  const getAchievementsByCategory = useCallback(
    (category: AchievementCategory) => {
      return achievementService.getAchievementsByCategory(category);
    },
    [achievementService]
  );

  /**
   * Get specific achievement by ID
   */
  const getAchievement = useCallback(
    (id: string) => {
      return achievements.find(a => a.id === id);
    },
    [achievements]
  );

  /**
   * Generate monthly report
   */
  const generateMonthlyReport = useCallback(
    (month: string) => {
      return achievementService.generateMonthlyReport(month);
    },
    [achievementService]
  );

  /**
   * Get current month engagement data
   */
  const getCurrentMonthEngagement = useCallback(() => {
    return engagementTracker.getCurrentMonthEngagement();
  }, [engagementTracker]);

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback(
    async (settings: Partial<NotificationSettings>) => {
      try {
        await achievementService.updateNotificationSettings(settings);
        await refreshAchievements();
      } catch (error) {
        console.error('Error updating notification settings:', error);
      }
    },
    [achievementService, refreshAchievements]
  );

  /**
   * Subscribe to achievement events
   */
  const onAchievementEvent = useCallback(
    (callback: (event: AchievementEvent) => void) => {
      achievementService.addEventListener(callback);

      return () => {
        achievementService.removeEventListener(callback);
      };
    },
    [achievementService]
  );

  const contextValue: AchievementContextType = {
    // State
    achievements,
    completedAchievements,
    userEngagement,
    streakData,
    notificationSettings,
    isLoading,

    // Achievement functions
    getAchievementsByCategory,
    getAchievement,
    refreshAchievements,

    // Tracking functions
    initializeForUser,

    // Report functions
    generateMonthlyReport,
    getCurrentMonthEngagement,

    // Settings
    updateNotificationSettings,

    // Event handling
    onAchievementEvent,
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
    </AchievementContext.Provider>
  );
}

/**
 * Hook to use achievement context
 */
export function useAchievements(): AchievementContextType {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error(
      'useAchievements must be used within an AchievementProvider'
    );
  }
  return context;
}

/**
 * Hook for achievement statistics
 */
export function useAchievementStats() {
  const { achievements, completedAchievements, streakData } = useAchievements();

  const stats = {
    totalAchievements: achievements.length,
    completedCount: completedAchievements.length,
    completionPercentage:
      achievements.length > 0
        ? (completedAchievements.length / achievements.length) * 100
        : 0,
    totalPoints: completedAchievements.reduce(
      (sum, achievement) => sum + achievement.points,
      0
    ),
    currentStreak: streakData?.currentStreak || 0,
    longestStreak: streakData?.longestStreak || 0,
    categoryProgress: {} as Record<
      AchievementCategory,
      { completed: number; total: number; percentage: number }
    >,
  };

  // Calculate category progress
  Object.values(AchievementCategory).forEach(category => {
    const categoryAchievements = achievements.filter(
      a => a.category === category
    );
    const categoryCompleted = completedAchievements.filter(
      a => a.category === category
    );

    stats.categoryProgress[category] = {
      completed: categoryCompleted.length,
      total: categoryAchievements.length,
      percentage:
        categoryAchievements.length > 0
          ? (categoryCompleted.length / categoryAchievements.length) * 100
          : 0,
    };
  });

  return stats;
}

/**
 * Hook for recent achievement activity
 */
export function useRecentAchievements(limit: number = 5) {
  const { completedAchievements } = useAchievements();

  const recentAchievements = completedAchievements
    .filter(a => a.completedAt)
    .sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);

  return recentAchievements;
}

/**
 * Hook for achievement notifications
 */
export function useAchievementNotifications() {
  const { onAchievementEvent } = useAchievements();
  const [recentEvents, setRecentEvents] = useState<AchievementEvent[]>([]);

  useEffect(() => {
    const cleanup = onAchievementEvent(event => {
      // Only track significant events for notifications
      if (
        [
          AchievementEventType.ACHIEVEMENT_COMPLETED,
          AchievementEventType.ACHIEVEMENT_UNLOCKED,
          AchievementEventType.MILESTONE_REACHED,
        ].includes(event.type)
      ) {
        setRecentEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
      }
    });

    return cleanup;
  }, [onAchievementEvent]);

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
  }, []);

  return {
    recentEvents,
    clearEvents,
  };
}

export default AchievementContext;
