/**
 * useNotifications Hook
 * React hooks for managing motivational notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import MotivationalNotificationService, {
  NotificationPreferences,
} from '../services/notifications/MotivationalNotificationService';

interface NotificationHookReturn {
  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (
    newPreferences: Partial<NotificationPreferences>
  ) => Promise<void>;

  // Controls
  requestPermissions: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;

  // State
  isInitialized: boolean;
  hasPermissions: boolean;
  isLoading: boolean;

  // Notification handlers
  handleNotificationReceived: (
    notification: Notifications.Notification
  ) => void;
  handleNotificationResponse: (
    response: Notifications.NotificationResponse
  ) => void;
}

export function useNotifications(): NotificationHookReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    streakReminders: true,
    achievementProgress: true,
    milestoneAlerts: true,
    weeklyReports: true,
    dailyReminder: false,
    reminderTime: '09:00',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
    achievementCelebrations: true,
    progressMilestones: true,
    nearMissAlerts: true,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notificationService = MotivationalNotificationService.getInstance();

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setIsLoading(true);

        // Initialize the service
        await notificationService.initialize();

        // Load current preferences
        const currentPreferences = notificationService.getPreferences();
        setPreferences(currentPreferences);

        // Check permissions
        const { status } = await Notifications.getPermissionsAsync();
        setHasPermissions(status === 'granted');

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Handle app state changes for notification scheduling
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isInitialized) {
        // App became active, refresh notification status
        checkPermissions();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [isInitialized]);

  /**
   * Check current notification permissions
   */
  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermissions(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermissions(granted);

      if (granted && preferences.enabled) {
        // Re-initialize to set up notifications now that we have permissions
        await notificationService.initialize();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, [preferences.enabled, notificationService]);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        const updatedPreferences = { ...preferences, ...newPreferences };
        setPreferences(updatedPreferences);

        await notificationService.updatePreferences(newPreferences);

        // If notifications were just enabled, check permissions
        if (newPreferences.enabled && !hasPermissions) {
          await requestPermissions();
        }
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    },
    [preferences, hasPermissions, notificationService, requestPermissions]
  );

  /**
   * Send test notification
   */
  const sendTestNotification = useCallback(async () => {
    try {
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('Notification permissions not granted');
        }
      }

      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, [hasPermissions, requestPermissions, notificationService]);

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = useCallback(async () => {
    try {
      await notificationService.cancelAllScheduledNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }, [notificationService]);

  /**
   * Handle notification received while app is open
   */
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      console.log('Notification received:', notification);

      // Handle different notification types
      const notificationType = notification.request.content.data?.type;

      switch (notificationType) {
        case 'achievement_celebration':
          // Could trigger in-app celebration animation
          console.log('Achievement celebration notification');
          break;

        case 'streak_milestone':
          // Could trigger streak milestone popup
          console.log('Streak milestone notification');
          break;

        case 'progress_milestone':
          // Could show progress update
          console.log('Progress milestone notification');
          break;

        default:
          console.log('General notification received');
      }
    },
    []
  );

  /**
   * Handle notification response (user tapped notification)
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      console.log('Notification response:', response);

      const notificationType = response.notification.request.content.data?.type;
      const achievementId =
        response.notification.request.content.data?.achievementId;

      switch (notificationType) {
        case 'achievement_celebration':
          // Navigate to achievement detail
          if (achievementId) {
            console.log('Navigate to achievement:', achievementId);
            // Could use navigation service here
          }
          break;

        case 'streak_reminder':
          // Navigate to main dashboard
          console.log('Navigate to dashboard for streak check-in');
          break;

        case 'weekly_report':
          // Navigate to reports screen
          console.log('Navigate to weekly report');
          break;

        case 'daily_reminder':
          // Navigate to main dashboard
          console.log('Navigate to daily check-in');
          break;

        default:
          console.log('Navigate to main app');
      }
    },
    []
  );

  return {
    // Preferences
    preferences,
    updatePreferences,

    // Controls
    requestPermissions,
    sendTestNotification,
    cancelAllNotifications,

    // State
    isInitialized,
    hasPermissions,
    isLoading,

    // Handlers
    handleNotificationReceived,
    handleNotificationResponse,
  };
}

/**
 * Hook for notification settings management
 */
export function useNotificationSettings() {
  const {
    preferences,
    updatePreferences,
    hasPermissions,
    requestPermissions,
    sendTestNotification,
  } = useNotifications();

  /**
   * Toggle a specific notification type
   */
  const toggleNotificationType = useCallback(
    async (type: keyof NotificationPreferences, value: boolean) => {
      await updatePreferences({ [type]: value });
    },
    [updatePreferences]
  );

  /**
   * Update reminder time
   */
  const updateReminderTime = useCallback(
    async (time: string) => {
      await updatePreferences({ reminderTime: time });
    },
    [updatePreferences]
  );

  /**
   * Update quiet hours
   */
  const updateQuietHours = useCallback(
    async (quietHours: { enabled: boolean; start: string; end: string }) => {
      await updatePreferences({ quietHours });
    },
    [updatePreferences]
  );

  /**
   * Enable all notifications
   */
  const enableAllNotifications = useCallback(async () => {
    await updatePreferences({
      enabled: true,
      streakReminders: true,
      achievementProgress: true,
      milestoneAlerts: true,
      weeklyReports: true,
      achievementCelebrations: true,
      progressMilestones: true,
      nearMissAlerts: true,
    });
  }, [updatePreferences]);

  /**
   * Disable all notifications
   */
  const disableAllNotifications = useCallback(async () => {
    await updatePreferences({
      enabled: false,
      streakReminders: false,
      achievementProgress: false,
      milestoneAlerts: false,
      weeklyReports: false,
      dailyReminder: false,
      achievementCelebrations: false,
      progressMilestones: false,
      nearMissAlerts: false,
    });
  }, [updatePreferences]);

  /**
   * Test notification with permission check
   */
  const testNotificationWithPermission = useCallback(async () => {
    try {
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error(
            'Please enable notifications in your device settings to test notifications.'
          );
        }
      }

      await sendTestNotification();
      return { success: true, message: 'Test notification sent!' };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send test notification',
      };
    }
  }, [hasPermissions, requestPermissions, sendTestNotification]);

  return {
    // Current settings
    preferences,
    hasPermissions,

    // Setting controls
    toggleNotificationType,
    updateReminderTime,
    updateQuietHours,
    enableAllNotifications,
    disableAllNotifications,

    // Permission & testing
    requestPermissions,
    testNotificationWithPermission,

    // Computed values
    isEnabled: preferences.enabled,
    hasAnyEnabled:
      preferences.streakReminders ||
      preferences.achievementProgress ||
      preferences.milestoneAlerts ||
      preferences.weeklyReports ||
      preferences.dailyReminder,
  };
}

/**
 * Hook for notification analytics and insights
 */
export function useNotificationInsights() {
  const { preferences } = useNotifications();

  // Calculate notification frequency
  const getNotificationFrequency = useCallback(() => {
    let dailyCount = 0;
    let weeklyCount = 0;

    if (preferences.enabled) {
      if (preferences.dailyReminder) dailyCount += 1;
      if (preferences.streakReminders) dailyCount += 1; // Max 1 per day
      if (preferences.achievementProgress) dailyCount += 2; // Estimated
      if (preferences.progressMilestones) dailyCount += 1; // Estimated
      if (preferences.weeklyReports) weeklyCount += 1;
    }

    return {
      daily: dailyCount,
      weekly: weeklyCount,
      total: dailyCount * 7 + weeklyCount,
    };
  }, [preferences]);

  // Get notification recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (!preferences.enabled) {
      recommendations.push(
        'Enable notifications to stay motivated and track your progress'
      );
    } else {
      if (!preferences.streakReminders) {
        recommendations.push('Enable streak reminders to maintain consistency');
      }
      if (!preferences.achievementCelebrations) {
        recommendations.push(
          'Enable achievement celebrations to celebrate your wins'
        );
      }
      if (!preferences.quietHours.enabled) {
        recommendations.push(
          'Set quiet hours to avoid late night notifications'
        );
      }
      if (preferences.dailyReminder && preferences.reminderTime === '09:00') {
        recommendations.push(
          'Consider adjusting your daily reminder time to fit your schedule'
        );
      }
    }

    return recommendations;
  }, [preferences]);

  return {
    frequency: getNotificationFrequency(),
    recommendations: getRecommendations(),
    isOptimallyConfigured:
      preferences.enabled &&
      preferences.streakReminders &&
      preferences.achievementCelebrations &&
      preferences.quietHours.enabled,
  };
}

export default useNotifications;
