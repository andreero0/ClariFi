/**
 * Notification Interaction Tracking Service
 * Monitors user interactions with notifications for analytics and optimization
 * Integrates with existing privacy-aware analytics infrastructure
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getObject, storeObject, STORAGE_KEYS } from '../storage/asyncStorage';
import PrivacyAwareAnalytics from '../analytics/PrivacyAwareAnalytics';
import { useAnalytics } from '../analytics/PostHogProvider';

export interface NotificationInteraction {
  id: string;
  notificationId: string;
  notificationType:
    | 'payment_due'
    | 'utilization_warning'
    | 'achievement_unlocked'
    | 'education_reminder'
    | 'test_notification';
  interactionType:
    | 'received'
    | 'opened'
    | 'dismissed'
    | 'action_clicked'
    | 'deep_link_followed';
  timestamp: string;
  cardId?: string;
  actionData?: any;
  responseTime?: number; // Time to interaction in milliseconds
  sessionContext?: {
    appState: 'foreground' | 'background' | 'inactive';
    deviceState: 'locked' | 'unlocked';
    batteryLevel?: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export interface NotificationAnalytics {
  totalNotifications: number;
  openRate: number;
  actionRate: number;
  averageResponseTime: number;
  bestPerformingTimes: string[];
  typePerformance: Record<
    string,
    {
      sent: number;
      opened: number;
      actionTaken: number;
      averageResponseTime: number;
    }
  >;
  lastCalculated: string;
}

/**
 * Notification Interaction Tracking Service
 */
class NotificationInteractionTracker {
  private static instance: NotificationInteractionTracker;
  private analyticsService: PrivacyAwareAnalytics;
  private interactions: NotificationInteraction[] = [];
  private isInitialized = false;
  private analyticsProvider: ReturnType<typeof useAnalytics> | null = null;

  static getInstance(): NotificationInteractionTracker {
    if (!NotificationInteractionTracker.instance) {
      NotificationInteractionTracker.instance =
        new NotificationInteractionTracker();
    }
    return NotificationInteractionTracker.instance;
  }

  constructor() {
    this.analyticsService = new PrivacyAwareAnalytics();
  }

  /**
   * Initialize the interaction tracker
   */
  async initialize(
    analyticsProvider?: ReturnType<typeof useAnalytics>
  ): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize analytics service
      if (analyticsProvider) {
        this.analyticsProvider = analyticsProvider;
        await this.analyticsService.initialize(analyticsProvider);
      }

      // Load existing interactions
      await this.loadInteractions();

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('[InteractionTracker] Service initialized successfully');
    } catch (error) {
      console.error('[InteractionTracker] Error initializing service:', error);
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Listen for notification received events
    Notifications.addNotificationReceivedListener(notification => {
      this.trackInteraction({
        notificationId: notification.request.identifier,
        interactionType: 'received',
        notificationType: this.extractNotificationType(notification),
        cardId: this.extractCardId(notification),
        sessionContext: this.getSessionContext(),
      });
    });

    // Listen for notification response events (user tapped notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      const receivedTime = this.findReceivedTime(
        response.notification.request.identifier
      );
      const responseTime = receivedTime ? Date.now() - receivedTime : undefined;

      this.trackInteraction({
        notificationId: response.notification.request.identifier,
        interactionType: 'opened',
        notificationType: this.extractNotificationType(response.notification),
        cardId: this.extractCardId(response.notification),
        responseTime,
        actionData: response.actionIdentifier
          ? {
              actionId: response.actionIdentifier,
              userText: response.userText,
            }
          : undefined,
        sessionContext: this.getSessionContext(),
      });

      // Track specific action if present
      if (response.actionIdentifier) {
        this.trackInteraction({
          notificationId: response.notification.request.identifier,
          interactionType: 'action_clicked',
          notificationType: this.extractNotificationType(response.notification),
          cardId: this.extractCardId(response.notification),
          actionData: {
            actionId: response.actionIdentifier,
            userText: response.userText,
          },
          sessionContext: this.getSessionContext(),
        });
      }
    });

    // Listen for notification dismissal (iOS only)
    if (Platform.OS === 'ios') {
      Notifications.addNotificationDismissedListener?.(notification => {
        this.trackInteraction({
          notificationId: notification.request.identifier,
          interactionType: 'dismissed',
          notificationType: this.extractNotificationType(notification),
          cardId: this.extractCardId(notification),
          sessionContext: this.getSessionContext(),
        });
      });
    }
  }

  /**
   * Track a notification interaction
   */
  async trackInteraction(
    interaction: Partial<NotificationInteraction>
  ): Promise<void> {
    try {
      const fullInteraction: NotificationInteraction = {
        id: `${interaction.notificationId}_${interaction.interactionType}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...(interaction as NotificationInteraction),
      };

      // Add to local storage
      this.interactions.push(fullInteraction);
      await this.saveInteractions();

      // Track analytics event
      await this.trackAnalyticsEvent(fullInteraction);

      // Clean up old interactions (keep last 1000)
      if (this.interactions.length > 1000) {
        this.interactions = this.interactions.slice(-1000);
        await this.saveInteractions();
      }

      console.log(
        '[InteractionTracker] Interaction tracked:',
        fullInteraction.interactionType
      );
    } catch (error) {
      console.error('[InteractionTracker] Error tracking interaction:', error);
    }
  }

  /**
   * Track deep link follow from notification
   */
  async trackDeepLinkFollow(
    notificationId: string,
    targetScreen: string,
    notificationType?: string
  ): Promise<void> {
    await this.trackInteraction({
      notificationId,
      interactionType: 'deep_link_followed',
      notificationType: (notificationType as any) || 'unknown',
      actionData: {
        targetScreen,
        timestamp: new Date().toISOString(),
      },
      sessionContext: this.getSessionContext(),
    });
  }

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(
    timeRange?: 'week' | 'month' | 'quarter'
  ): Promise<NotificationAnalytics> {
    try {
      const cutoffDate = this.getCutoffDate(timeRange);
      const relevantInteractions = this.interactions.filter(
        interaction => new Date(interaction.timestamp) >= cutoffDate
      );

      const totalNotifications = this.countUniqueNotifications(
        relevantInteractions,
        'received'
      );
      const openedNotifications = this.countUniqueNotifications(
        relevantInteractions,
        'opened'
      );
      const actionNotifications = this.countUniqueNotifications(
        relevantInteractions,
        'action_clicked'
      );

      const openRate =
        totalNotifications > 0
          ? (openedNotifications / totalNotifications) * 100
          : 0;
      const actionRate =
        openedNotifications > 0
          ? (actionNotifications / openedNotifications) * 100
          : 0;

      const responseTimes = relevantInteractions
        .filter(i => i.interactionType === 'opened' && i.responseTime)
        .map(i => i.responseTime!);
      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0;

      const typePerformance =
        this.calculateTypePerformance(relevantInteractions);
      const bestPerformingTimes =
        this.findBestPerformingTimes(relevantInteractions);

      return {
        totalNotifications,
        openRate,
        actionRate,
        averageResponseTime,
        bestPerformingTimes,
        typePerformance,
        lastCalculated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[InteractionTracker] Error calculating analytics:', error);
      throw error;
    }
  }

  /**
   * Get user engagement patterns
   */
  async getUserEngagementPatterns(): Promise<{
    preferredTimes: string[];
    responsiveNotificationTypes: string[];
    averageResponseTimeByType: Record<string, number>;
    engagementTrends: Array<{
      date: string;
      openRate: number;
      actionRate: number;
    }>;
  }> {
    const analytics = await this.getNotificationAnalytics('month');

    const responsiveTypes = Object.entries(analytics.typePerformance)
      .filter(([, performance]) => performance.opened / performance.sent > 0.3)
      .map(([type]) => type)
      .sort(
        (a, b) =>
          analytics.typePerformance[b].opened /
            analytics.typePerformance[b].sent -
          analytics.typePerformance[a].opened /
            analytics.typePerformance[a].sent
      );

    const averageResponseTimeByType = Object.fromEntries(
      Object.entries(analytics.typePerformance).map(([type, perf]) => [
        type,
        perf.averageResponseTime,
      ])
    );

    // Calculate weekly engagement trends
    const engagementTrends = this.calculateEngagementTrends();

    return {
      preferredTimes: analytics.bestPerformingTimes,
      responsiveNotificationTypes: responsiveTypes,
      averageResponseTimeByType,
      engagementTrends,
    };
  }

  /**
   * Export interaction data for analysis
   */
  async exportInteractionData(
    timeRange?: 'week' | 'month' | 'quarter'
  ): Promise<string> {
    try {
      const cutoffDate = this.getCutoffDate(timeRange);
      const relevantInteractions = this.interactions.filter(
        interaction => new Date(interaction.timestamp) >= cutoffDate
      );

      const analytics = await this.getNotificationAnalytics(timeRange);

      const exportData = {
        summary: analytics,
        interactions: relevantInteractions,
        exportDate: new Date().toISOString(),
        timeRange: timeRange || 'all',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[InteractionTracker] Error exporting data:', error);
      throw error;
    }
  }

  // Private helper methods

  private async loadInteractions(): Promise<void> {
    try {
      const stored = await getObject<NotificationInteraction[]>(
        'notification_interactions'
      );
      this.interactions = stored || [];
    } catch (error) {
      console.warn('[InteractionTracker] Could not load interactions:', error);
      this.interactions = [];
    }
  }

  private async saveInteractions(): Promise<void> {
    try {
      await storeObject('notification_interactions', this.interactions);
    } catch (error) {
      console.error('[InteractionTracker] Error saving interactions:', error);
    }
  }

  private async trackAnalyticsEvent(
    interaction: NotificationInteraction
  ): Promise<void> {
    const eventName = `notification_${interaction.interactionType}`;
    const properties = {
      notification_type: interaction.notificationType,
      notification_id: interaction.notificationId,
      card_id: interaction.cardId,
      response_time_ms: interaction.responseTime,
      app_state: interaction.sessionContext?.appState,
      time_of_day: interaction.sessionContext?.timeOfDay,
      platform: Platform.OS,
      has_action_data: !!interaction.actionData,
    };

    await this.analyticsService.track(eventName, properties);
  }

  private extractNotificationType(
    notification: Notifications.Notification
  ): NotificationInteraction['notificationType'] {
    const data = notification.request.content.data as any;
    return data?.type || 'unknown';
  }

  private extractCardId(
    notification: Notifications.Notification
  ): string | undefined {
    const data = notification.request.content.data as any;
    return data?.cardId;
  }

  private getSessionContext(): NotificationInteraction['sessionContext'] {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 6
        ? 'night'
        : hour < 12
          ? 'morning'
          : hour < 18
            ? 'afternoon'
            : 'evening';

    return {
      appState: 'foreground', // Would need app state listener for accuracy
      deviceState: 'unlocked', // Would need device state detection
      timeOfDay,
    };
  }

  private findReceivedTime(notificationId: string): number | undefined {
    const receivedInteraction = this.interactions.find(
      i =>
        i.notificationId === notificationId && i.interactionType === 'received'
    );
    return receivedInteraction
      ? new Date(receivedInteraction.timestamp).getTime()
      : undefined;
  }

  private getCutoffDate(timeRange?: 'week' | 'month' | 'quarter'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // Beginning of time
    }
  }

  private countUniqueNotifications(
    interactions: NotificationInteraction[],
    type: string
  ): number {
    const uniqueNotifications = new Set(
      interactions
        .filter(i => i.interactionType === type)
        .map(i => i.notificationId)
    );
    return uniqueNotifications.size;
  }

  private calculateTypePerformance(
    interactions: NotificationInteraction[]
  ): NotificationAnalytics['typePerformance'] {
    const types = [...new Set(interactions.map(i => i.notificationType))];
    const performance: NotificationAnalytics['typePerformance'] = {};

    for (const type of types) {
      const typeInteractions = interactions.filter(
        i => i.notificationType === type
      );
      const sent = this.countUniqueNotifications(typeInteractions, 'received');
      const opened = this.countUniqueNotifications(typeInteractions, 'opened');
      const actionTaken = this.countUniqueNotifications(
        typeInteractions,
        'action_clicked'
      );

      const responseTimes = typeInteractions
        .filter(i => i.interactionType === 'opened' && i.responseTime)
        .map(i => i.responseTime!);
      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0;

      performance[type] = { sent, opened, actionTaken, averageResponseTime };
    }

    return performance;
  }

  private findBestPerformingTimes(
    interactions: NotificationInteraction[]
  ): string[] {
    const timeSlots: Record<string, { sent: number; opened: number }> = {};

    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      const timeSlot = `${hour}:00`;

      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = { sent: 0, opened: 0 };
      }

      if (interaction.interactionType === 'received') {
        timeSlots[timeSlot].sent++;
      } else if (interaction.interactionType === 'opened') {
        timeSlots[timeSlot].opened++;
      }
    });

    return Object.entries(timeSlots)
      .filter(([, stats]) => stats.sent > 0)
      .map(([time, stats]) => ({ time, rate: stats.opened / stats.sent }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(item => item.time);
  }

  private calculateEngagementTrends(): Array<{
    date: string;
    openRate: number;
    actionRate: number;
  }> {
    const now = new Date();
    const trends: Array<{
      date: string;
      openRate: number;
      actionRate: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayInteractions = this.interactions.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp);
        return interactionDate >= dayStart && interactionDate <= dayEnd;
      });

      const sent = this.countUniqueNotifications(dayInteractions, 'received');
      const opened = this.countUniqueNotifications(dayInteractions, 'opened');
      const actionTaken = this.countUniqueNotifications(
        dayInteractions,
        'action_clicked'
      );

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        actionRate: opened > 0 ? (actionTaken / opened) * 100 : 0,
      });
    }

    return trends;
  }
}

// Export singleton instance
export default NotificationInteractionTracker.getInstance();

// Export utility functions
export const trackNotificationInteraction = async (
  interaction: Partial<NotificationInteraction>
): Promise<void> => {
  const tracker = NotificationInteractionTracker.getInstance();
  return tracker.trackInteraction(interaction);
};

export const getNotificationAnalytics = async (
  timeRange?: 'week' | 'month' | 'quarter'
): Promise<NotificationAnalytics> => {
  const tracker = NotificationInteractionTracker.getInstance();
  return tracker.getNotificationAnalytics(timeRange);
};

console.log('services/notifications/interactionTracker.ts loaded');
