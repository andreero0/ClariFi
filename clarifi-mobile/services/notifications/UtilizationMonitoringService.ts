import { CreditCard } from '../../types/creditCard';
import { inAppAlertService } from './InAppAlertService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MONITORING_SETTINGS_KEY = '@clarifi_utilization_monitoring';
const ALERT_HISTORY_KEY = '@clarifi_alert_history';

interface MonitoringSettings {
  isEnabled: boolean;
  thresholdPercentage: number;
  daysBeforeStatement: number;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  alertFrequency: 'once' | 'daily' | 'threshold';
  lastAlertTimes: { [cardId: string]: number };
}

interface AlertRecord {
  id: string;
  cardId: string;
  utilizationPercentage: number;
  timestamp: number;
  type: 'utilization' | 'payment' | 'reminder';
  wasActionTaken: boolean;
}

interface NavigationIntent {
  pathname: string;
  params: Record<string, string>;
}

export class UtilizationMonitoringService {
  private static instance: UtilizationMonitoringService;
  private navigationIntent: NavigationIntent | null = null;
  private navigationCallbacks: ((intent: NavigationIntent | null) => void)[] =
    [];

  static getInstance(): UtilizationMonitoringService {
    if (!UtilizationMonitoringService.instance) {
      UtilizationMonitoringService.instance =
        new UtilizationMonitoringService();
    }
    return UtilizationMonitoringService.instance;
  }

  /**
   * Check utilization for all cards and trigger alerts if needed
   */
  async checkUtilizationAlerts(cards: CreditCard[]): Promise<void> {
    try {
      const settings = await this.getMonitoringSettings();

      if (!settings.isEnabled) {
        return;
      }

      const now = Date.now();

      for (const card of cards) {
        const utilizationPercentage = this.calculateUtilization(card);

        // Skip if utilization is below threshold
        if (utilizationPercentage < settings.thresholdPercentage) {
          continue;
        }

        // Check if we should show an alert based on frequency settings
        const shouldShowAlert = await this.shouldShowAlert(
          card.id,
          utilizationPercentage,
          settings,
          now
        );

        if (shouldShowAlert) {
          await this.triggerUtilizationAlert(
            card,
            utilizationPercentage,
            settings
          );
        }
      }
    } catch (error) {
      console.error('Error checking utilization alerts:', error);
    }
  }

  /**
   * Check for upcoming payment due dates and trigger alerts
   */
  async checkPaymentReminders(cards: CreditCard[]): Promise<void> {
    try {
      const settings = await this.getMonitoringSettings();

      if (!settings.isEnabled) {
        return;
      }

      const now = new Date();

      for (const card of cards) {
        const dueDate = new Date(card.paymentDueDate);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Alert if payment is due within the configured days or is overdue
        if (
          daysUntilDue <= settings.daysBeforeStatement &&
          daysUntilDue >= -1
        ) {
          await this.triggerPaymentReminderAlert(card, daysUntilDue);
        }
      }
    } catch (error) {
      console.error('Error checking payment reminders:', error);
    }
  }

  /**
   * Trigger a utilization alert for a specific card
   */
  private async triggerUtilizationAlert(
    card: CreditCard,
    utilizationPercentage: number,
    settings: MonitoringSettings
  ): Promise<void> {
    const suggestedPayment = this.calculateSuggestedPayment(card, 30); // Target 30% utilization

    // Update last alert time
    settings.lastAlertTimes[card.id] = Date.now();
    await this.saveMonitoringSettings(settings);

    // Show in-app alert
    inAppAlertService.showUtilizationAlert(
      card,
      utilizationPercentage,
      suggestedPayment,
      () => {
        // Quick payment action
        this.handleQuickPaymentAction(card, suggestedPayment);
      }
    );

    // Record alert in history
    await this.recordAlert({
      id: `alert_${Date.now()}_${card.id}`,
      cardId: card.id,
      utilizationPercentage,
      timestamp: Date.now(),
      type: 'utilization',
      wasActionTaken: false,
    });
  }

  /**
   * Trigger a payment reminder alert
   */
  private async triggerPaymentReminderAlert(
    card: CreditCard,
    daysUntilDue: number
  ): Promise<void> {
    inAppAlertService.showPaymentReminderAlert(card, daysUntilDue, () => {
      this.handleMakePaymentAction(card);
    });

    // Record alert in history
    await this.recordAlert({
      id: `reminder_${Date.now()}_${card.id}`,
      cardId: card.id,
      utilizationPercentage: this.calculateUtilization(card),
      timestamp: Date.now(),
      type: 'payment',
      wasActionTaken: false,
    });
  }

  /**
   * Handle quick payment action from alert
   */
  private handleQuickPaymentAction(
    card: CreditCard,
    suggestedAmount: number
  ): void {
    // Store navigation intent in global state for router to pick up
    this.setNavigationIntent({
      pathname: '/modals/quick-payment',
      params: {
        cardId: card.id,
        suggestedAmount: suggestedAmount.toString(),
        utilizationTarget: '30',
      },
    });

    console.log(
      `Quick payment triggered for ${card.name}: $${suggestedAmount}`
    );
  }

  /**
   * Handle make payment action from reminder
   */
  private handleMakePaymentAction(card: CreditCard): void {
    console.log(`Payment reminder action for ${card.name}`);

    // Navigate to payment form or card detail
    // router.push({
    //   pathname: '/modals/credit-card-detail',
    //   params: { cardId: card.id },
    // });
  }

  /**
   * Calculate utilization percentage for a card
   */
  private calculateUtilization(card: CreditCard): number {
    if (card.creditLimit <= 0) return 0;
    return (card.currentBalance / card.creditLimit) * 100;
  }

  /**
   * Calculate suggested payment to reach target utilization
   */
  private calculateSuggestedPayment(
    card: CreditCard,
    targetUtilization: number
  ): number {
    const targetBalance = (card.creditLimit * targetUtilization) / 100;
    return Math.max(0, card.currentBalance - targetBalance);
  }

  /**
   * Check if we should show an alert based on frequency settings
   */
  private async shouldShowAlert(
    cardId: string,
    utilizationPercentage: number,
    settings: MonitoringSettings,
    currentTime: number
  ): Promise<boolean> {
    const lastAlertTime = settings.lastAlertTimes[cardId] || 0;
    const timeSinceLastAlert = currentTime - lastAlertTime;

    switch (settings.alertFrequency) {
      case 'once':
        // Only alert once per day
        return timeSinceLastAlert > 24 * 60 * 60 * 1000;

      case 'daily':
        // Alert daily if still above threshold
        return timeSinceLastAlert > 24 * 60 * 60 * 1000;

      case 'threshold':
        // Alert every time threshold is crossed
        return timeSinceLastAlert > 60 * 60 * 1000; // At least 1 hour between alerts

      default:
        return true;
    }
  }

  /**
   * Get monitoring settings from storage
   */
  async getMonitoringSettings(): Promise<MonitoringSettings> {
    try {
      const stored = await AsyncStorage.getItem(MONITORING_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading monitoring settings:', error);
    }

    // Return default settings
    return {
      isEnabled: true,
      thresholdPercentage: 70,
      daysBeforeStatement: 3,
      quietHoursEnabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 7,
      alertFrequency: 'once',
      lastAlertTimes: {},
    };
  }

  /**
   * Save monitoring settings to storage
   */
  async saveMonitoringSettings(settings: MonitoringSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        MONITORING_SETTINGS_KEY,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving monitoring settings:', error);
    }
  }

  /**
   * Record an alert in history
   */
  private async recordAlert(alert: AlertRecord): Promise<void> {
    try {
      const existingHistory = await AsyncStorage.getItem(ALERT_HISTORY_KEY);
      const history: AlertRecord[] = existingHistory
        ? JSON.parse(existingHistory)
        : [];

      history.push(alert);

      // Keep only last 100 alerts
      const trimmedHistory = history.slice(-100);

      await AsyncStorage.setItem(
        ALERT_HISTORY_KEY,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error('Error recording alert:', error);
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(): Promise<AlertRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(ALERT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading alert history:', error);
      return [];
    }
  }

  /**
   * Mark an alert as having action taken
   */
  async markAlertActionTaken(alertId: string): Promise<void> {
    try {
      const history = await this.getAlertHistory();
      const updatedHistory = history.map(alert =>
        alert.id === alertId ? { ...alert, wasActionTaken: true } : alert
      );

      await AsyncStorage.setItem(
        ALERT_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error('Error marking alert action taken:', error);
    }
  }

  /**
   * Set navigation intent for components to handle
   */
  private setNavigationIntent(intent: NavigationIntent): void {
    this.navigationIntent = intent;
    this.notifyNavigationCallbacks(intent);
  }

  /**
   * Subscribe to navigation intents
   */
  subscribeToNavigation(
    callback: (intent: NavigationIntent | null) => void
  ): () => void {
    this.navigationCallbacks.push(callback);

    return () => {
      const index = this.navigationCallbacks.indexOf(callback);
      if (index > -1) {
        this.navigationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clear navigation intent
   */
  clearNavigationIntent(): void {
    this.navigationIntent = null;
    this.notifyNavigationCallbacks(null);
  }

  /**
   * Get current navigation intent
   */
  getNavigationIntent(): NavigationIntent | null {
    return this.navigationIntent;
  }

  private notifyNavigationCallbacks(intent: NavigationIntent | null): void {
    this.navigationCallbacks.forEach(callback => {
      try {
        callback(intent);
      } catch (error) {
        console.error('Error in navigation callback:', error);
      }
    });
  }

  /**
   * Demo function to trigger test alerts
   */
  async triggerTestAlert(cards: CreditCard[]): Promise<void> {
    if (cards.length === 0) return;

    const testCard = cards[0];
    const utilizationPercentage = this.calculateUtilization(testCard);
    const suggestedPayment = this.calculateSuggestedPayment(testCard, 30);

    inAppAlertService.showUtilizationAlert(
      testCard,
      utilizationPercentage,
      suggestedPayment,
      () => {
        this.handleQuickPaymentAction(testCard, suggestedPayment);
      }
    );
  }
}

// Export singleton instance
export const utilizationMonitoringService =
  UtilizationMonitoringService.getInstance();
