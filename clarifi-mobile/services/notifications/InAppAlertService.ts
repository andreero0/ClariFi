import React from 'react';
import { AlertBannerData } from '../../components/notifications/InAppAlertBanner';
import { CreditCard } from '../../types/creditCard';

export class InAppAlertService {
  private static instance: InAppAlertService;
  private alertQueue: AlertBannerData[] = [];
  private currentAlert: AlertBannerData | null = null;
  private alertCallbacks: ((alert: AlertBannerData | null) => void)[] = [];

  static getInstance(): InAppAlertService {
    if (!InAppAlertService.instance) {
      InAppAlertService.instance = new InAppAlertService();
    }
    return InAppAlertService.instance;
  }

  /**
   * Subscribe to alert changes
   */
  subscribe(callback: (alert: AlertBannerData | null) => void): () => void {
    this.alertCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Show an alert banner
   */
  showAlert(alert: AlertBannerData): void {
    // Add to queue if there's already an alert showing
    if (this.currentAlert) {
      this.alertQueue.push(alert);
      return;
    }

    this.currentAlert = alert;
    this.notifySubscribers(alert);
  }

  /**
   * Show a credit utilization alert
   */
  showUtilizationAlert(
    card: CreditCard,
    utilizationPercentage: number,
    suggestedPayment: number,
    onQuickPayment?: () => void
  ): void {
    const priority = this.getUtilizationPriority(utilizationPercentage);
    const daysUntilStatement = this.calculateDaysUntilStatement(
      card.statementDate
    );

    const alert: AlertBannerData = {
      id: `utilization-${card.id}-${Date.now()}`,
      type: 'utilization',
      priority,
      title: 'Credit Utilization Alert',
      message: `${card.name}: ${utilizationPercentage.toFixed(0)}% utilized - Statement in ${daysUntilStatement} days`,
      cardName: card.name,
      cardColor: card.color,
      utilizationPercentage,
      suggestedPayment,
      actionText: 'Quick Payment',
      onAction: onQuickPayment,
      autoDismissMs: priority === 'critical' ? 12000 : 8000,
    };

    this.showAlert(alert);
  }

  /**
   * Show a payment reminder alert
   */
  showPaymentReminderAlert(
    card: CreditCard,
    daysUntilDue: number,
    onMakePayment?: () => void
  ): void {
    const priority =
      daysUntilDue <= 1 ? 'critical' : daysUntilDue <= 3 ? 'high' : 'medium';

    const alert: AlertBannerData = {
      id: `payment-${card.id}-${Date.now()}`,
      type: 'payment',
      priority,
      title: 'Payment Reminder',
      message:
        daysUntilDue === 0
          ? `${card.name} payment is due today!`
          : daysUntilDue < 0
            ? `${card.name} payment is ${Math.abs(daysUntilDue)} days overdue`
            : `${card.name} payment due in ${daysUntilDue} days`,
      cardName: card.name,
      cardColor: card.color,
      suggestedPayment: card.minimumPayment,
      actionText: 'Make Payment',
      onAction: onMakePayment,
      autoDismissMs: priority === 'critical' ? 15000 : 10000,
    };

    this.showAlert(alert);
  }

  /**
   * Show an achievement alert
   */
  showAchievementAlert(
    title: string,
    message: string,
    onViewDetails?: () => void
  ): void {
    const alert: AlertBannerData = {
      id: `achievement-${Date.now()}`,
      type: 'achievement',
      priority: 'low',
      title,
      message,
      actionText: 'View Details',
      onAction: onViewDetails,
      autoDismissMs: 6000,
    };

    this.showAlert(alert);
  }

  /**
   * Show an educational alert
   */
  showEducationAlert(
    title: string,
    message: string,
    onLearnMore?: () => void
  ): void {
    const alert: AlertBannerData = {
      id: `education-${Date.now()}`,
      type: 'education',
      priority: 'low',
      title,
      message,
      actionText: 'Learn More',
      onAction: onLearnMore,
      autoDismissMs: 10000,
    };

    this.showAlert(alert);
  }

  /**
   * Dismiss the current alert
   */
  dismissCurrentAlert(): void {
    this.currentAlert = null;
    this.notifySubscribers(null);

    // Show next alert in queue if any
    if (this.alertQueue.length > 0) {
      const nextAlert = this.alertQueue.shift();
      if (nextAlert) {
        setTimeout(() => {
          this.showAlert(nextAlert);
        }, 300); // Small delay between alerts
      }
    }
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.currentAlert = null;
    this.alertQueue = [];
    this.notifySubscribers(null);
  }

  /**
   * Get current alert
   */
  getCurrentAlert(): AlertBannerData | null {
    return this.currentAlert;
  }

  /**
   * Check if an alert should be shown based on user preferences
   */
  shouldShowAlert(
    type: AlertBannerData['type'],
    priority: AlertBannerData['priority'],
    cardId?: string
  ): boolean {
    // Check quiet hours
    if (this.isQuietHours() && priority !== 'critical') {
      return false;
    }

    // Check global notification settings
    // This would integrate with your notification preferences service
    return true;
  }

  private getUtilizationPriority(
    utilization: number
  ): AlertBannerData['priority'] {
    if (utilization >= 90) return 'critical';
    if (utilization >= 80) return 'high';
    if (utilization >= 60) return 'medium';
    return 'low';
  }

  private calculateDaysUntilStatement(statementDate: string): number {
    const statement = new Date(statementDate);
    const today = new Date();
    const diffTime = statement.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private isQuietHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();

    // Default quiet hours: 22:00 to 7:00
    // This would be configurable via user preferences
    const quietStart = 22;
    const quietEnd = 7;

    if (quietStart > quietEnd) {
      // Quiet hours span midnight
      return currentHour >= quietStart || currentHour < quietEnd;
    } else {
      return currentHour >= quietStart && currentHour < quietEnd;
    }
  }

  private notifySubscribers(alert: AlertBannerData | null): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }
}

// Export a singleton instance
export const inAppAlertService = InAppAlertService.getInstance();

// Hook for React components
export const useInAppAlerts = () => {
  const [currentAlert, setCurrentAlert] =
    React.useState<AlertBannerData | null>(inAppAlertService.getCurrentAlert());

  React.useEffect(() => {
    const unsubscribe = inAppAlertService.subscribe(setCurrentAlert);
    return unsubscribe;
  }, []);

  return {
    currentAlert,
    showUtilizationAlert:
      inAppAlertService.showUtilizationAlert.bind(inAppAlertService),
    showPaymentReminderAlert:
      inAppAlertService.showPaymentReminderAlert.bind(inAppAlertService),
    showAchievementAlert:
      inAppAlertService.showAchievementAlert.bind(inAppAlertService),
    showEducationAlert:
      inAppAlertService.showEducationAlert.bind(inAppAlertService),
    dismissCurrentAlert:
      inAppAlertService.dismissCurrentAlert.bind(inAppAlertService),
    clearAllAlerts: inAppAlertService.clearAllAlerts.bind(inAppAlertService),
  };
};
