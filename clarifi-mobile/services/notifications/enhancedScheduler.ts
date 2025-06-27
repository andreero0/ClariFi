/**
 * Enhanced notification scheduler that integrates per-card notification preferences
 * Acts as a wrapper around the existing scheduler with card-specific logic
 */

import {
  CreditCard,
  NotificationPreferences,
  UtilizationSettings,
} from '../storage/dataModels';
import { cardNotificationPreferences } from './cardNotificationPreferences';
import * as BaseScheduler from './scheduler';

/**
 * Enhanced payment reminder scheduling with per-card preferences
 */
export const schedulePaymentReminderWithCardPreferences = async (
  card: CreditCard,
  globalPreferences: NotificationPreferences
): Promise<{ success: boolean; reason?: string; scheduled: number }> => {
  try {
    // Get card-specific preferences
    const cardPreferences =
      await cardNotificationPreferences.getCardPreferences(card.id);

    // Check if payment reminders are enabled for this card
    if (
      !cardPreferences.enabled ||
      !cardPreferences.payment_reminders?.enabled
    ) {
      console.log(
        `[EnhancedScheduler] Payment reminders disabled for card ${card.nickname}`
      );
      return {
        success: false,
        reason: 'disabled_by_card_preferences',
        scheduled: 0,
      };
    }

    // Check current time against card's quiet hours preference
    const currentHour = new Date().getHours();
    const shouldSend = await cardNotificationPreferences.shouldSendNotification(
      card.id,
      'payment',
      'high', // Payment reminders are high priority
      currentHour
    );

    if (!shouldSend) {
      console.log(
        `[EnhancedScheduler] Payment reminder blocked by quiet hours for card ${card.nickname}`
      );
      return { success: false, reason: 'blocked_by_quiet_hours', scheduled: 0 };
    }

    // Create hybrid preferences combining global and card-specific settings
    const hybridPreferences = createHybridPreferences(
      globalPreferences,
      cardPreferences
    );

    // Schedule the notification using the base scheduler
    const result = await BaseScheduler.schedulePaymentReminder(
      card,
      hybridPreferences
    );

    // Track per-card scheduling metrics
    await trackCardNotificationScheduled(card.id, 'payment', result);

    return {
      success: result.notificationId !== null,
      reason: result.notificationId
        ? 'scheduled_successfully'
        : 'scheduling_failed',
      scheduled: result.scheduledCount,
    };
  } catch (error) {
    console.error(
      `[EnhancedScheduler] Error scheduling payment reminder for card ${card.nickname}:`,
      error
    );
    return { success: false, reason: 'error', scheduled: 0 };
  }
};

/**
 * Enhanced utilization alert scheduling with per-card preferences
 */
export const scheduleUtilizationAlertWithCardPreferences = async (
  card: CreditCard,
  utilizationSettings: UtilizationSettings,
  globalPreferences: NotificationPreferences,
  currentTransactions?: any[]
): Promise<{ success: boolean; reason?: string; scheduled: number }> => {
  try {
    // Get card-specific preferences
    const cardPreferences =
      await cardNotificationPreferences.getCardPreferences(card.id);

    // Check if utilization alerts are enabled for this card
    if (
      !cardPreferences.enabled ||
      !cardPreferences.utilization_alerts?.enabled
    ) {
      console.log(
        `[EnhancedScheduler] Utilization alerts disabled for card ${card.nickname}`
      );
      return {
        success: false,
        reason: 'disabled_by_card_preferences',
        scheduled: 0,
      };
    }

    // Use card-specific utilization threshold if set
    const utilizationThreshold =
      cardPreferences.utilization_alerts.threshold ||
      utilizationSettings.alert_individual_card_threshold;

    // Calculate current utilization
    const currentUtilization = (card.current_balance / card.credit_limit) * 100;

    // Check if we need to alert based on card-specific threshold
    if (currentUtilization < utilizationThreshold) {
      console.log(
        `[EnhancedScheduler] Utilization ${currentUtilization.toFixed(1)}% below card threshold ${utilizationThreshold}% for ${card.nickname}`
      );
      return { success: false, reason: 'below_threshold', scheduled: 0 };
    }

    // Determine priority based on utilization level
    const priority =
      currentUtilization >= 90
        ? 'critical'
        : currentUtilization >= 80
          ? 'high'
          : 'medium';

    // Check current time against card's quiet hours preference
    const currentHour = new Date().getHours();
    const shouldSend = await cardNotificationPreferences.shouldSendNotification(
      card.id,
      'utilization',
      priority,
      currentHour
    );

    if (!shouldSend) {
      console.log(
        `[EnhancedScheduler] Utilization alert blocked by quiet hours for card ${card.nickname}`
      );
      return { success: false, reason: 'blocked_by_quiet_hours', scheduled: 0 };
    }

    // Create enhanced utilization settings with card-specific threshold
    const enhancedUtilizationSettings = {
      ...utilizationSettings,
      alert_individual_card_threshold: utilizationThreshold,
    };

    // Create hybrid preferences combining global and card-specific settings
    const hybridPreferences = createHybridPreferences(
      globalPreferences,
      cardPreferences
    );

    // Schedule the notification using the base scheduler
    const result = await BaseScheduler.scheduleUtilizationAlert(
      card,
      enhancedUtilizationSettings,
      hybridPreferences,
      currentTransactions
    );

    // Track per-card scheduling metrics
    await trackCardNotificationScheduled(card.id, 'utilization', result);

    return {
      success: result.notificationId !== null,
      reason: result.notificationId
        ? 'scheduled_successfully'
        : 'scheduling_failed',
      scheduled: result.scheduledCount,
    };
  } catch (error) {
    console.error(
      `[EnhancedScheduler] Error scheduling utilization alert for card ${card.nickname}:`,
      error
    );
    return { success: false, reason: 'error', scheduled: 0 };
  }
};

/**
 * Batch schedule notifications for multiple cards with per-card preferences
 */
export const batchScheduleWithCardPreferences = async (
  cards: CreditCard[],
  utilizationSettings: UtilizationSettings,
  globalPreferences: NotificationPreferences
): Promise<{
  totalCards: number;
  successfulPayments: number;
  successfulUtilization: number;
  skippedCards: string[];
  errors: string[];
}> => {
  const results = {
    totalCards: cards.length,
    successfulPayments: 0,
    successfulUtilization: 0,
    skippedCards: [] as string[],
    errors: [] as string[],
  };

  for (const card of cards) {
    try {
      // Schedule payment reminder
      const paymentResult = await schedulePaymentReminderWithCardPreferences(
        card,
        globalPreferences
      );
      if (paymentResult.success) {
        results.successfulPayments++;
      } else if (paymentResult.reason === 'disabled_by_card_preferences') {
        results.skippedCards.push(`${card.nickname} (payment disabled)`);
      }

      // Schedule utilization alert
      const utilizationResult =
        await scheduleUtilizationAlertWithCardPreferences(
          card,
          utilizationSettings,
          globalPreferences
        );
      if (utilizationResult.success) {
        results.successfulUtilization++;
      } else if (utilizationResult.reason === 'disabled_by_card_preferences') {
        results.skippedCards.push(`${card.nickname} (utilization disabled)`);
      }
    } catch (error) {
      console.error(
        `[EnhancedScheduler] Error processing card ${card.nickname}:`,
        error
      );
      results.errors.push(`${card.nickname}: ${error}`);
    }
  }

  console.log(
    `[EnhancedScheduler] Batch scheduling complete: ${results.successfulPayments} payment reminders, ${results.successfulUtilization} utilization alerts scheduled`
  );

  return results;
};

/**
 * Create hybrid preferences combining global and card-specific settings
 */
function createHybridPreferences(
  globalPreferences: NotificationPreferences,
  cardPreferences: any // CardNotificationPreferences
): NotificationPreferences {
  return {
    enabled: cardPreferences.enabled && globalPreferences.enabled,
    quiet_hours: cardPreferences.quiet_hours?.enabled
      ? {
          start_hour: cardPreferences.quiet_hours.start_hour,
          end_hour: cardPreferences.quiet_hours.end_hour,
        }
      : globalPreferences.quiet_hours,
    preferred_time_hour: globalPreferences.preferred_time_hour,
    days_before_statement_alert:
      cardPreferences.payment_reminders?.days_before?.[0] ||
      globalPreferences.days_before_statement_alert,
    min_utilization_for_alert:
      cardPreferences.utilization_alerts?.threshold ||
      globalPreferences.min_utilization_for_alert,
  };
}

/**
 * Track card-specific notification scheduling for analytics
 */
async function trackCardNotificationScheduled(
  cardId: string,
  notificationType: 'payment' | 'utilization',
  result: any
): Promise<void> {
  try {
    // Store metrics for per-card notification analytics
    const metrics = {
      cardId,
      notificationType,
      success: result.notificationId !== null,
      scheduledCount: result.scheduledCount,
      reliability: result.reliability,
      timestamp: new Date().toISOString(),
    };

    // This could integrate with the existing analytics system
    console.log(
      '[EnhancedScheduler] Tracked notification scheduling:',
      metrics
    );
  } catch (error) {
    console.error(
      '[EnhancedScheduler] Error tracking notification metrics:',
      error
    );
  }
}

/**
 * Get card notification summary for display
 */
export const getCardNotificationSummary = async (
  cardId: string
): Promise<{
  enabled: boolean;
  paymentReminders: boolean;
  utilizationAlerts: boolean;
  quietHours: string;
  lastScheduled?: string;
}> => {
  try {
    const preferences =
      await cardNotificationPreferences.getCardPreferences(cardId);
    const description =
      await cardNotificationPreferences.getPreferencesDescription(cardId);

    return {
      enabled: preferences.enabled,
      paymentReminders: preferences.payment_reminders?.enabled || false,
      utilizationAlerts: preferences.utilization_alerts?.enabled || false,
      quietHours: preferences.quiet_hours?.enabled
        ? `${preferences.quiet_hours.start_hour}:00-${preferences.quiet_hours.end_hour}:00`
        : 'Global settings',
      lastScheduled: undefined, // Could be implemented with scheduling history
    };
  } catch (error) {
    console.error(
      '[EnhancedScheduler] Error getting card notification summary:',
      error
    );
    return {
      enabled: false,
      paymentReminders: false,
      utilizationAlerts: false,
      quietHours: 'Error loading',
    };
  }
};

/**
 * Quick toggle for card notifications
 */
export const toggleCardNotifications = async (
  cardId: string,
  enabled: boolean
): Promise<{ success: boolean; newSettings?: any }> => {
  try {
    await cardNotificationPreferences.updateCardPreferences(cardId, {
      enabled,
    });

    if (!enabled) {
      // Cancel all existing notifications for this card
      await BaseScheduler.cancelAllNotificationsForCard(cardId);
    }

    const newSettings =
      await cardNotificationPreferences.getCardPreferences(cardId);

    return { success: true, newSettings };
  } catch (error) {
    console.error(
      `[EnhancedScheduler] Error toggling notifications for card ${cardId}:`,
      error
    );
    return { success: false };
  }
};

export const scheduleWithCardPreferences = async (
  card: CreditCard,
  globalPreferences: NotificationPreferences
): Promise<{ success: boolean; reason?: string }> => {
  try {
    const cardPreferences =
      await cardNotificationPreferences.getCardPreferences(card.id);

    if (!cardPreferences.enabled) {
      return { success: false, reason: 'disabled_by_card_preferences' };
    }

    const shouldSend = await cardNotificationPreferences.shouldSendNotification(
      card.id,
      'payment',
      'high',
      new Date().getHours()
    );

    return {
      success: shouldSend,
      reason: shouldSend ? 'scheduled' : 'blocked_by_quiet_hours',
    };
  } catch (error) {
    console.error('Error in enhanced scheduler:', error);
    return { success: false, reason: 'error' };
  }
};
