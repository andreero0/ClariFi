import { CreditCard, CardNotificationPreferences } from '../storage/dataModels';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/asyncStorage';

/**
 * Service for managing per-card notification preferences
 * Provides CRUD operations, validation, and default value management
 */
export class CardNotificationPreferencesService {
  private static instance: CardNotificationPreferencesService;
  private readonly STORAGE_KEY = 'card_notification_preferences';

  public static getInstance(): CardNotificationPreferencesService {
    if (!CardNotificationPreferencesService.instance) {
      CardNotificationPreferencesService.instance =
        new CardNotificationPreferencesService();
    }
    return CardNotificationPreferencesService.instance;
  }

  /**
   * Get default notification preferences for a new card
   */
  public getDefaultPreferences(): CardNotificationPreferences {
    return {
      enabled: true,
      utilization_alerts: {
        enabled: true,
        threshold: 70, // 70% default threshold
        custom_thresholds: [50, 70, 90], // Multiple alert thresholds
      },
      payment_reminders: {
        enabled: true,
        days_before: [7, 3, 1], // Weekly, 3-day, and 1-day reminders
        due_date_reminder: true,
        overdue_alerts: true,
      },
      quiet_hours: {
        enabled: false, // Use global quiet hours by default
        start_hour: 22, // 10 PM
        end_hour: 7, // 7 AM
      },
      notification_channels: {
        push: true, // Mobile push notifications enabled
        email: false, // Server-side email disabled by default
        sms: false, // Server-side SMS disabled by default
      },
      priority_overrides: {
        critical_bypass_quiet_hours: true, // Critical alerts always go through
        high_priority_bypass_quiet_hours: false, // High priority respects quiet hours
      },
      optimization_suggestions: {
        enabled: true,
        frequency: 'weekly', // Weekly optimization suggestions
      },
      achievement_notifications: {
        enabled: true,
        types: [
          'payment_streak',
          'utilization_improvement',
          'spending_reduction',
        ],
      },
    };
  }

  /**
   * Get notification preferences for a specific card
   */
  public async getCardPreferences(
    cardId: string
  ): Promise<CardNotificationPreferences> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!storedData) {
        return this.getDefaultPreferences();
      }

      const allPreferences: { [cardId: string]: CardNotificationPreferences } =
        JSON.parse(storedData);
      return allPreferences[cardId] || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting card notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update notification preferences for a specific card
   */
  public async updateCardPreferences(
    cardId: string,
    preferences: Partial<CardNotificationPreferences>
  ): Promise<void> {
    try {
      // Get current preferences
      const currentPreferences = await this.getCardPreferences(cardId);

      // Merge with new preferences
      const updatedPreferences = this.mergePreferences(
        currentPreferences,
        preferences
      );

      // Validate the preferences
      const validatedPreferences = this.validatePreferences(updatedPreferences);

      // Get all stored preferences
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const allPreferences: { [cardId: string]: CardNotificationPreferences } =
        storedData ? JSON.parse(storedData) : {};

      // Update for this card
      allPreferences[cardId] = validatedPreferences;

      // Save back to storage
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(allPreferences)
      );

      console.log(`Updated notification preferences for card ${cardId}`);
    } catch (error) {
      console.error('Error updating card notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get preferences for all cards
   */
  public async getAllCardPreferences(): Promise<{
    [cardId: string]: CardNotificationPreferences;
  }> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting all card notification preferences:', error);
      return {};
    }
  }

  /**
   * Remove preferences for a specific card (e.g., when card is deleted)
   */
  public async removeCardPreferences(cardId: string): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return;

      const allPreferences: { [cardId: string]: CardNotificationPreferences } =
        JSON.parse(storedData);
      delete allPreferences[cardId];

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(allPreferences)
      );
      console.log(`Removed notification preferences for card ${cardId}`);
    } catch (error) {
      console.error('Error removing card notification preferences:', error);
      throw error;
    }
  }

  /**
   * Reset preferences for a card to defaults
   */
  public async resetCardPreferences(cardId: string): Promise<void> {
    await this.updateCardPreferences(cardId, this.getDefaultPreferences());
  }

  /**
   * Check if card has custom preferences (different from defaults)
   */
  public async hasCustomPreferences(cardId: string): Promise<boolean> {
    const preferences = await this.getCardPreferences(cardId);
    const defaults = this.getDefaultPreferences();

    return JSON.stringify(preferences) !== JSON.stringify(defaults);
  }

  /**
   * Export card preferences (for backup/sync)
   */
  public async exportPreferences(): Promise<{
    [cardId: string]: CardNotificationPreferences;
  }> {
    return await this.getAllCardPreferences();
  }

  /**
   * Import card preferences (for restore/sync)
   */
  public async importPreferences(preferences: {
    [cardId: string]: CardNotificationPreferences;
  }): Promise<void> {
    try {
      // Validate all preferences before importing
      const validatedPreferences: {
        [cardId: string]: CardNotificationPreferences;
      } = {};

      for (const [cardId, prefs] of Object.entries(preferences)) {
        validatedPreferences[cardId] = this.validatePreferences(prefs);
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(validatedPreferences)
      );
      console.log('Successfully imported card notification preferences');
    } catch (error) {
      console.error('Error importing card notification preferences:', error);
      throw error;
    }
  }

  /**
   * Deep merge preferences, preserving nested structure
   */
  private mergePreferences(
    current: CardNotificationPreferences,
    updates: Partial<CardNotificationPreferences>
  ): CardNotificationPreferences {
    const merged = { ...current };

    (Object.keys(updates) as Array<keyof CardNotificationPreferences>).forEach(
      key => {
        const updateValue = updates[key];
        if (updateValue !== undefined) {
          const currentValue = merged[key];

          if (
            typeof updateValue === 'object' &&
            updateValue !== null &&
            !Array.isArray(updateValue) &&
            typeof currentValue === 'object' &&
            currentValue !== null &&
            !Array.isArray(currentValue)
          ) {
            // Deep merge objects - use type assertion after validation
            (merged as any)[key] = {
              ...(currentValue as any),
              ...(updateValue as any),
            };
          } else {
            // Direct assignment for primitives and arrays
            (merged as any)[key] = updateValue;
          }
        }
      }
    );

    return merged;
  }

  /**
   * Validate and sanitize preferences
   */
  private validatePreferences(
    preferences: CardNotificationPreferences
  ): CardNotificationPreferences {
    const validated = { ...preferences };

    // Validate utilization alerts
    if (validated.utilization_alerts) {
      if (
        validated.utilization_alerts.threshold < 1 ||
        validated.utilization_alerts.threshold > 100
      ) {
        validated.utilization_alerts.threshold = 70; // Reset to default
      }

      if (validated.utilization_alerts.custom_thresholds) {
        validated.utilization_alerts.custom_thresholds =
          validated.utilization_alerts.custom_thresholds
            .filter(threshold => threshold >= 1 && threshold <= 100)
            .sort((a, b) => a - b); // Sort ascending
      }
    }

    // Validate payment reminders
    if (validated.payment_reminders?.days_before) {
      validated.payment_reminders.days_before =
        validated.payment_reminders.days_before
          .filter(days => days >= 0 && days <= 30) // Reasonable range
          .sort((a, b) => b - a); // Sort descending (furthest first)
    }

    // Validate quiet hours
    if (validated.quiet_hours) {
      if (
        validated.quiet_hours.start_hour < 0 ||
        validated.quiet_hours.start_hour > 23
      ) {
        validated.quiet_hours.start_hour = 22;
      }
      if (
        validated.quiet_hours.end_hour < 0 ||
        validated.quiet_hours.end_hour > 23
      ) {
        validated.quiet_hours.end_hour = 7;
      }
    }

    // Validate optimization frequency
    if (validated.optimization_suggestions?.frequency) {
      const validFrequencies = ['daily', 'weekly', 'monthly'];
      if (
        !validFrequencies.includes(validated.optimization_suggestions.frequency)
      ) {
        validated.optimization_suggestions.frequency = 'weekly';
      }
    }

    // Validate achievement types
    if (validated.achievement_notifications?.types) {
      const validTypes = [
        'payment_streak',
        'utilization_improvement',
        'spending_reduction',
      ];
      validated.achievement_notifications.types =
        validated.achievement_notifications.types.filter(type =>
          validTypes.includes(type)
        );
    }

    return validated;
  }

  /**
   * Check if a notification should be sent based on card preferences
   */
  public async shouldSendNotification(
    cardId: string,
    notificationType:
      | 'utilization'
      | 'payment'
      | 'optimization'
      | 'achievement',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    currentHour?: number
  ): Promise<boolean> {
    const preferences = await this.getCardPreferences(cardId);

    // Check if notifications are globally disabled for this card
    if (!preferences.enabled) {
      return false;
    }

    // Check type-specific settings
    switch (notificationType) {
      case 'utilization':
        if (!preferences.utilization_alerts?.enabled) return false;
        break;
      case 'payment':
        if (!preferences.payment_reminders?.enabled) return false;
        break;
      case 'optimization':
        if (!preferences.optimization_suggestions?.enabled) return false;
        break;
      case 'achievement':
        if (!preferences.achievement_notifications?.enabled) return false;
        break;
    }

    // Check quiet hours if current hour is provided
    if (currentHour !== undefined && preferences.quiet_hours?.enabled) {
      const isQuietHours = this.isWithinQuietHours(
        currentHour,
        preferences.quiet_hours.start_hour,
        preferences.quiet_hours.end_hour
      );

      if (isQuietHours) {
        // Check if priority overrides quiet hours
        if (
          priority === 'critical' &&
          preferences.priority_overrides?.critical_bypass_quiet_hours
        ) {
          return true;
        }
        if (
          priority === 'high' &&
          preferences.priority_overrides?.high_priority_bypass_quiet_hours
        ) {
          return true;
        }
        // Lower priority notifications respect quiet hours
        if (priority === 'low' || priority === 'medium') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isWithinQuietHours(
    currentHour: number,
    startHour: number,
    endHour: number
  ): boolean {
    if (startHour <= endHour) {
      // Same day quiet hours (e.g., 14:00 to 16:00)
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 07:00)
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Get user-friendly description of current preferences
   */
  public async getPreferencesDescription(cardId: string): Promise<string> {
    const preferences = await this.getCardPreferences(cardId);

    if (!preferences.enabled) {
      return 'All notifications disabled';
    }

    const descriptions: string[] = [];

    if (preferences.utilization_alerts?.enabled) {
      descriptions.push(
        `Utilization alerts at ${preferences.utilization_alerts.threshold}%`
      );
    }

    if (
      preferences.payment_reminders?.enabled &&
      preferences.payment_reminders.days_before.length > 0
    ) {
      const days = preferences.payment_reminders.days_before.join(', ');
      descriptions.push(`Payment reminders ${days} days before due`);
    }

    if (preferences.quiet_hours?.enabled) {
      descriptions.push(
        `Quiet hours ${preferences.quiet_hours.start_hour}:00-${preferences.quiet_hours.end_hour}:00`
      );
    }

    return descriptions.length > 0
      ? descriptions.join(' • ')
      : 'Default settings';
  }
}

export const cardNotificationPreferences =
  CardNotificationPreferencesService.getInstance();
