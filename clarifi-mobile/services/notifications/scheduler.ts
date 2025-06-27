/**
 * Manages the scheduling of local notifications for various app events like
 * payment reminders, utilization alerts, achievements, etc.
 * Primarily uses Expo's Notifications API with robust reliability features.
 */

// For React Native, local notifications are often handled with 'expo-notifications'
// You would need to install it: npx expo install expo-notifications

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  CreditCard,
  NotificationPreferences,
  ScheduledNotification,
  UtilizationSettings,
} from '../storage/dataModels';
import {
  getNextStatementDate,
  calculateUtilization,
  daysUntilNextStatement,
} from '../../utils/calculations/utilization';
import {
  getString,
  storeObject,
  getObject,
  STORAGE_KEYS,
} from '../storage/asyncStorage';
import { cardNotificationPreferences } from './cardNotificationPreferences';
import { CardNotificationPreferences } from '../storage/dataModels';

// Configure notification handling with reliability optimizations
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Enhanced notification scheduling with reliability features
 */
interface SchedulingResult {
  notificationId: string | null;
  scheduledCount: number;
  fallbackScheduled: boolean;
  reliability: 'high' | 'medium' | 'low';
}

interface NotificationTiming {
  primary: Date;
  fallback1: Date;
  fallback2: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Request notification permissions with enhanced error handling
 */
async function requestPermissionsAsync(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn(
        '[Notifications] Failed to get push token for push notification!'
      );
      // Store permission denial for analytics
      await storeNotificationMetrics('permission_denied');
      return false;
    }

    // Store successful permission grant
    await storeNotificationMetrics('permission_granted');
    return true;
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    await storeNotificationMetrics('permission_error');
    return false;
  }
}

/**
 * Store notification metrics for reliability tracking
 */
async function storeNotificationMetrics(
  event: string,
  data?: any
): Promise<void> {
  try {
    const metrics = (await getObject<any>(STORAGE_KEYS.ANALYTICS_EVENTS)) || [];
    metrics.push({
      event: `notification_${event}`,
      timestamp: new Date().toISOString(),
      data,
    });
    // Keep last 1000 events only
    const trimmedMetrics = metrics.slice(-1000);
    await storeObject(STORAGE_KEYS.ANALYTICS_EVENTS, trimmedMetrics);
  } catch (error) {
    console.error('[Notifications] Error storing metrics:', error);
  }
}

/**
 * Get scheduled notifications with enhanced tracking
 */
async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
  try {
    const existing = await getObject<ScheduledNotification[]>(
      STORAGE_KEYS.NOTIFICATION_SCHEDULE
    );
    return existing || [];
  } catch (error) {
    console.error(
      '[Notifications] Error loading scheduled notifications:',
      error
    );
    return [];
  }
}

/**
 * Save scheduled notifications with backup
 */
async function saveScheduledNotifications(
  notifications: ScheduledNotification[]
): Promise<void> {
  try {
    await storeObject(STORAGE_KEYS.NOTIFICATION_SCHEDULE, notifications);
    // Create backup for recovery
    const backup = {
      notifications,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    await storeObject(`${STORAGE_KEYS.NOTIFICATION_SCHEDULE}_backup`, backup);
  } catch (error) {
    console.error(
      '[Notifications] Error saving scheduled notifications:',
      error
    );
    throw error;
  }
}

/**
 * Create a properly formatted notification trigger
 */
function createNotificationTrigger(date: Date) {
  return { date };
}

/**
 * Enhanced quiet hours filtering with critical alert override support
 */
function applyQuietHoursFilter(
  notificationDate: Date,
  quietHours: { start_hour: number; end_hour: number },
  priority: 'critical' | 'high' | 'medium' | 'low'
): Date {
  const resultDate = new Date(notificationDate);
  const currentHour = resultDate.getHours();

  // Critical alerts override quiet hours
  if (priority === 'critical') {
    console.log(
      '[Notifications] Critical alert scheduled during quiet hours - override applied'
    );
    return resultDate;
  }

  const { start_hour, end_hour } = quietHours;

  // Handle same-day quiet hours (e.g., 22:00 to 06:00)
  const isQuietTime =
    start_hour > end_hour
      ? currentHour >= start_hour || currentHour <= end_hour // Overnight quiet hours
      : currentHour >= start_hour && currentHour <= end_hour; // Same-day quiet hours

  if (isQuietTime) {
    // Move notification to after quiet hours
    const wakeHour = (end_hour + 1) % 24;

    // If quiet hours end tomorrow, move to next day
    if (start_hour > end_hour && currentHour >= start_hour) {
      resultDate.setDate(resultDate.getDate() + 1);
    }

    resultDate.setHours(wakeHour, 0, 0, 0);
    console.log(
      `[Notifications] Moved notification from ${notificationDate.toLocaleTimeString()} to ${resultDate.toLocaleTimeString()} due to quiet hours`
    );
  }

  return resultDate;
}

/**
 * Validate quiet hours configuration
 */
function validateQuietHours(quietHours: {
  start_hour: number;
  end_hour: number;
}): boolean {
  const { start_hour, end_hour } = quietHours;

  // Validate hour ranges
  if (start_hour < 0 || start_hour > 23 || end_hour < 0 || end_hour > 23) {
    console.warn(
      '[Notifications] Invalid quiet hours: hours must be between 0-23'
    );
    return false;
  }

  // Allow overnight quiet hours (start > end is valid)
  return true;
}

/**
 * Get user-friendly quiet hours description
 */
function getQuietHoursDescription(quietHours: {
  start_hour: number;
  end_hour: number;
}): string {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const startTime = formatHour(quietHours.start_hour);
  const endTime = formatHour(quietHours.end_hour);

  return `${startTime} to ${endTime}`;
}

/**
 * Calculate optimal notification timing based on credit cycles
 */
function calculateOptimalTiming(
  card: CreditCard,
  preferences: NotificationPreferences,
  alertType: 'utilization' | 'payment'
): NotificationTiming {
  const nextStatement = getNextStatementDate(card);
  const daysUntilStatement = daysUntilNextStatement(card);

  let primaryOffset: number;
  let priority: 'critical' | 'high' | 'medium' | 'low';

  if (alertType === 'utilization') {
    // Utilization alerts: Earlier in cycle for max impact
    if (daysUntilStatement <= 7) {
      primaryOffset = 1; // Very soon - critical timing
      priority = 'critical';
    } else if (daysUntilStatement <= 14) {
      primaryOffset = 3; // Medium urgency
      priority = 'high';
    } else {
      primaryOffset = 7; // Early in cycle
      priority = 'medium';
    }
  } else {
    // Payment reminders: Based on user preference
    primaryOffset = preferences.days_before_statement_alert || 3;
    priority = primaryOffset <= 2 ? 'critical' : 'high';
  }

  const primary = new Date(nextStatement);
  primary.setDate(primary.getDate() - primaryOffset);

  // Set optimal time of day
  const preferredHour = preferences.preferred_time_hour ?? 10; // Default 10 AM
  primary.setHours(preferredHour, 0, 0, 0);

  // Apply quiet hours with enhanced logic
  if (preferences.quiet_hours) {
    primary = applyQuietHoursFilter(primary, preferences.quiet_hours, priority);
  }

  // Create fallback times for reliability
  const fallback1 = new Date(primary);
  fallback1.setHours(fallback1.getHours() + 2); // 2 hours later

  const fallback2 = new Date(primary);
  fallback2.setHours(fallback2.getHours() + 6); // 6 hours later

  return { primary, fallback1, fallback2, priority };
}

/**
 * Enhanced payment reminder scheduling with reliability features
 */
export const schedulePaymentReminder = async (
  card: CreditCard,
  preferences: NotificationPreferences
): Promise<SchedulingResult> => {
  // Get card-specific preferences
  const cardPreferences = await cardNotificationPreferences.getCardPreferences(
    card.id
  );

  // Check if notifications are enabled for this card and type
  const shouldSend = await cardNotificationPreferences.shouldSendNotification(
    card.id,
    'payment',
    'high', // Payment reminders are high priority
    new Date().getHours()
  );

  if (!shouldSend) {
    console.log(
      `[Notifications] Payment reminders disabled for card ${card.nickname}`
    );
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }
  if (!preferences.enabled) {
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  const hasPermission = await requestPermissionsAsync();
  if (!hasPermission) {
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  const timing = calculateOptimalTiming(card, preferences, 'payment');

  if (timing.primary < new Date()) {
    console.log(
      `[Notifications] Payment reminder date for card ${card.nickname} is in the past.`
    );
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  const content = {
    title: `💳 Payment Reminder: ${card.nickname}`,
    body: `Your statement for ${card.nickname} (ending ${card.last_four}) is due soon. Current balance: $${card.current_balance.toFixed(2)}. Statement on ${timing.primary.toLocaleDateString()}.`,
    data: {
      type: 'payment_due',
      cardId: card.id,
      screen: 'Cards',
      priority: timing.priority,
      timing: 'primary',
    },
  };

  let scheduledCount = 0;
  let primaryNotificationId: string | null = null;
  let fallbackScheduled = false;

  try {
    // Schedule primary notification
    primaryNotificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { date: timing.primary },
    });
    scheduledCount++;

    console.log(
      `[Notifications] Primary payment reminder scheduled for ${card.nickname} on ${timing.primary}: ${primaryNotificationId}`
    );

    // Schedule fallback notifications for high/critical priority
    if (timing.priority === 'critical' || timing.priority === 'high') {
      try {
        const fallbackContent = {
          ...content,
          title: `⚠️ Urgent: ${content.title}`,
          data: { ...content.data, timing: 'fallback1' },
        };

        await Notifications.scheduleNotificationAsync({
          content: fallbackContent,
          trigger: { type: 'date', date: timing.fallback1 },
        });
        scheduledCount++;
        fallbackScheduled = true;

        console.log(
          `[Notifications] Fallback payment reminder scheduled for ${card.nickname} on ${timing.fallback1}`
        );
      } catch (fallbackError) {
        console.warn(
          '[Notifications] Failed to schedule fallback notification:',
          fallbackError
        );
      }
    }

    // Store scheduled notification with enhanced metadata
    const scheduled: ScheduledNotification = {
      id: primaryNotificationId,
      card_id: card.id,
      type: 'payment_due',
      scheduled_for: timing.primary.toISOString(),
      content,
      local_notification_trigger_id: primaryNotificationId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const allScheduled = await getScheduledNotifications();
    await saveScheduledNotifications([...allScheduled, scheduled]);

    // Store success metrics
    await storeNotificationMetrics('payment_reminder_scheduled', {
      cardId: card.id,
      scheduledCount,
      fallbackScheduled,
      priority: timing.priority,
    });

    const reliability =
      scheduledCount >= 2 ? 'high' : scheduledCount === 1 ? 'medium' : 'low';
    return {
      notificationId: primaryNotificationId,
      scheduledCount,
      fallbackScheduled,
      reliability,
    };
  } catch (error) {
    console.error('[Notifications] Error scheduling payment reminder:', error);
    await storeNotificationMetrics('payment_reminder_error', {
      cardId: card.id,
      error: error.message,
    });
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }
};

/**
 * Enhanced utilization alert scheduling with smart timing
 */
export const scheduleUtilizationAlert = async (
  card: CreditCard,
  utilizationSettings: UtilizationSettings,
  preferences: NotificationPreferences,
  currentTransactions?: any[]
): Promise<SchedulingResult> => {
  if (!preferences.enabled) {
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  const hasPermission = await requestPermissionsAsync();
  if (!hasPermission) {
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  const currentUtil = calculateUtilization(
    card.current_balance,
    card.credit_limit
  );
  const threshold = utilizationSettings.alert_individual_card_threshold || 70;

  if (currentUtil < threshold) {
    console.log(
      `[Notifications] Utilization ${currentUtil.toFixed(1)}% below threshold ${threshold}% for card ${card.nickname}`
    );
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  const timing = calculateOptimalTiming(card, preferences, 'utilization');

  if (timing.primary < new Date()) {
    console.log(
      `[Notifications] Utilization alert date for card ${card.nickname} is in the past.`
    );
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }

  // Enhanced content with actionable suggestions
  const urgencyLevel =
    currentUtil >= 90
      ? '🚨 Critical'
      : currentUtil >= 80
        ? '⚠️ High'
        : '📈 Elevated';
  const optimizationTip =
    currentUtil >= 90
      ? 'Make an immediate payment to avoid credit score impact.'
      : currentUtil >= 80
        ? 'Consider making a payment to optimize your credit score.'
        : 'Monitor and plan a payment to maintain good utilization.';

  const content = {
    title: `${urgencyLevel} Utilization: ${card.nickname}`,
    body: `Your utilization for ${card.nickname} is ${currentUtil.toFixed(0)}%. ${optimizationTip} Limit: $${card.credit_limit}, Balance: $${card.current_balance.toFixed(2)}.`,
    data: {
      type: 'utilization_warning',
      cardId: card.id,
      screen: 'Cards',
      utilization: currentUtil,
      priority: timing.priority,
      timing: 'primary',
    },
  };

  let scheduledCount = 0;
  let primaryNotificationId: string | null = null;
  let fallbackScheduled = false;

  try {
    // Schedule primary notification
    primaryNotificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { date: timing.primary },
    });
    scheduledCount++;

    console.log(
      `[Notifications] Primary utilization alert scheduled for ${card.nickname} on ${timing.primary}: ${primaryNotificationId}`
    );

    // Schedule additional notifications for critical utilization (>90%)
    if (currentUtil >= 90) {
      try {
        // Immediate alert for critical utilization
        const immediateContent = {
          ...content,
          title: `🚨 URGENT: Critical Utilization - ${card.nickname}`,
          body: `IMMEDIATE ACTION NEEDED: ${card.nickname} utilization is ${currentUtil.toFixed(0)}%. Make a payment now to prevent credit score damage.`,
          data: { ...content.data, timing: 'immediate' },
        };

        const immediateTime = new Date();
        immediateTime.setMinutes(immediateTime.getMinutes() + 5); // 5 minutes from now

        await Notifications.scheduleNotificationAsync({
          content: immediateContent,
          trigger: { date: immediateTime },
        });
        scheduledCount++;
        fallbackScheduled = true;

        console.log(
          `[Notifications] Immediate critical utilization alert scheduled for ${card.nickname}`
        );
      } catch (fallbackError) {
        console.warn(
          '[Notifications] Failed to schedule immediate critical alert:',
          fallbackError
        );
      }
    }

    // Store scheduled notification
    const scheduled: ScheduledNotification = {
      id: primaryNotificationId,
      card_id: card.id,
      type: 'utilization_warning',
      scheduled_for: timing.primary.toISOString(),
      content,
      local_notification_trigger_id: primaryNotificationId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const allScheduled = await getScheduledNotifications();
    await saveScheduledNotifications([...allScheduled, scheduled]);

    // Store success metrics
    await storeNotificationMetrics('utilization_alert_scheduled', {
      cardId: card.id,
      utilization: currentUtil,
      threshold,
      scheduledCount,
      fallbackScheduled,
      priority: timing.priority,
    });

    const reliability =
      scheduledCount >= 2 ? 'high' : scheduledCount === 1 ? 'medium' : 'low';
    return {
      notificationId: primaryNotificationId,
      scheduledCount,
      fallbackScheduled,
      reliability,
    };
  } catch (error) {
    console.error('[Notifications] Error scheduling utilization alert:', error);
    await storeNotificationMetrics('utilization_alert_error', {
      cardId: card.id,
      error: error.message,
    });
    return {
      notificationId: null,
      scheduledCount: 0,
      fallbackScheduled: false,
      reliability: 'low',
    };
  }
};

export const cancelNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`[Notifications] Cancelled notification: ${notificationId}`);
    const allScheduled = await getScheduledNotifications();
    await saveScheduledNotifications(
      allScheduled.filter(
        n =>
          n.id !== notificationId ||
          n.local_notification_trigger_id !== notificationId
      )
    );
  } catch (error) {
    console.error('[Notifications] Error cancelling notification:', error);
  }
};

export const cancelAllNotificationsForCard = async (
  cardId: string
): Promise<void> => {
  const allScheduled = await getScheduledNotifications();
  const cardNotifications = allScheduled.filter(
    n => n.card_id === cardId && n.local_notification_trigger_id
  );
  for (const notification of cardNotifications) {
    if (notification.local_notification_trigger_id) {
      await cancelNotification(notification.local_notification_trigger_id);
    }
  }
  await saveScheduledNotifications(
    allScheduled.filter(n => n.card_id !== cardId)
  );
  console.log(
    `[Notifications] All notifications for card ${cardId} cancelled.`
  );
};

export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await saveScheduledNotifications([]);
    console.log('[Notifications] All scheduled notifications cancelled.');
  } catch (error) {
    console.error('[Notifications] Error cancelling all notifications:', error);
  }
};

// Call this on app start to request permissions and handle any initial setup
export const initializeNotifications = async () => {
  const permissionGranted = await requestPermissionsAsync();
  if (Platform.OS === 'android') {
    // Required for Android
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  console.log(
    '[Notifications] Service initialized. Permission granted:',
    permissionGranted
  );
  // Potentially re-schedule notifications if needed after an app update or reboot
  // This would require storing scheduled notification details persistently
};

// Placeholder content
export const placeholderNotificationScheduler = () => {
  console.log(
    "Notification scheduling service placeholder. Install 'expo-notifications' to implement."
  );
};

console.log('services/notifications/scheduler.ts loaded (placeholder)');

export {}; // Ensures this is treated as a module
