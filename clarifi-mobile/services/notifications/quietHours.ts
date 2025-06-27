import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuietHoursSettings {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface QuietHoursPreferences {
  global: QuietHoursSettings;
  allowCriticalOverride: boolean;
  allowHighPriorityOverride: boolean;
}

/**
 * Service for managing quiet hours functionality across the app
 * Based on ClariFi PRD Feature 5.5 - Proactive Credit Utilization Alerts
 */
export class QuietHoursService {
  private static instance: QuietHoursService;
  private preferences: QuietHoursPreferences | null = null;
  private readonly STORAGE_KEY = '@clarifi_quiet_hours_preferences';

  private constructor() {
    this.loadPreferences();
  }

  public static getInstance(): QuietHoursService {
    if (!QuietHoursService.instance) {
      QuietHoursService.instance = new QuietHoursService();
    }
    return QuietHoursService.instance;
  }

  /**
   * Check if current time is within quiet hours
   */
  public async isQuietHours(): Promise<boolean> {
    await this.ensurePreferencesLoaded();

    if (!this.preferences?.global.enabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();

    const { startHour, endHour } = this.preferences.global;

    if (startHour <= endHour) {
      // Normal range (e.g., 22:00 to 06:00 next day doesn't apply here)
      // This handles cases like 09:00 to 17:00
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Quiet hours span midnight (e.g., 22:00 to 06:00)
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Check if a notification should be sent based on priority and quiet hours
   */
  public async shouldSendNotification(
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> {
    const isQuiet = await this.isQuietHours();

    if (!isQuiet) {
      return true; // Not quiet hours, send notification
    }

    await this.ensurePreferencesLoaded();

    // Check priority overrides during quiet hours
    if (priority === 'critical' && this.preferences?.allowCriticalOverride) {
      return true;
    }

    if (priority === 'high' && this.preferences?.allowHighPriorityOverride) {
      return true;
    }

    // All other notifications are blocked during quiet hours
    return false;
  }

  /**
   * Get current quiet hours preferences
   */
  public async getPreferences(): Promise<QuietHoursPreferences> {
    await this.ensurePreferencesLoaded();
    return this.preferences || this.getDefaultPreferences();
  }

  /**
   * Update quiet hours preferences
   */
  public async updatePreferences(
    newPreferences: Partial<QuietHoursPreferences>
  ): Promise<void> {
    await this.ensurePreferencesLoaded();

    this.preferences = {
      ...this.getDefaultPreferences(),
      ...this.preferences,
      ...newPreferences,
    };

    await this.savePreferences();
  }

  /**
   * Get the default quiet hours preferences
   */
  private getDefaultPreferences(): QuietHoursPreferences {
    return {
      global: {
        enabled: true,
        startHour: 22, // 10:00 PM
        endHour: 7, // 7:00 AM
      },
      allowCriticalOverride: true, // Critical alerts always go through
      allowHighPriorityOverride: false, // High priority respects quiet hours by default
    };
  }

  /**
   * Ensure preferences are loaded from storage
   */
  private async ensurePreferencesLoaded(): Promise<void> {
    if (this.preferences === null) {
      await this.loadPreferences();
    }
  }

  /**
   * Load preferences from AsyncStorage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.preferences = this.validateAndMigratePreferences(parsed);
      } else {
        this.preferences = this.getDefaultPreferences();
        await this.savePreferences();
      }
    } catch (error) {
      console.error('[QuietHoursService] Error loading preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Save preferences to AsyncStorage
   */
  private async savePreferences(): Promise<void> {
    try {
      if (this.preferences) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.preferences)
        );
      }
    } catch (error) {
      console.error('[QuietHoursService] Error saving preferences:', error);
    }
  }

  /**
   * Validate and migrate preferences from storage
   */
  private validateAndMigratePreferences(data: any): QuietHoursPreferences {
    const defaults = this.getDefaultPreferences();

    // Ensure all required fields exist with proper types
    const validated: QuietHoursPreferences = {
      global: {
        enabled:
          typeof data.global?.enabled === 'boolean'
            ? data.global.enabled
            : defaults.global.enabled,
        startHour: this.validateHour(
          data.global?.startHour,
          defaults.global.startHour
        ),
        endHour: this.validateHour(
          data.global?.endHour,
          defaults.global.endHour
        ),
      },
      allowCriticalOverride:
        typeof data.allowCriticalOverride === 'boolean'
          ? data.allowCriticalOverride
          : defaults.allowCriticalOverride,
      allowHighPriorityOverride:
        typeof data.allowHighPriorityOverride === 'boolean'
          ? data.allowHighPriorityOverride
          : defaults.allowHighPriorityOverride,
    };

    return validated;
  }

  /**
   * Validate hour value (0-23)
   */
  private validateHour(hour: any, defaultHour: number): number {
    const parsed = parseInt(hour, 10);
    return isNaN(parsed) || parsed < 0 || parsed > 23 ? defaultHour : parsed;
  }

  /**
   * Check if a specific time is within quiet hours
   */
  public async isTimeInQuietHours(
    hour: number,
    minute: number = 0
  ): Promise<boolean> {
    await this.ensurePreferencesLoaded();

    if (!this.preferences?.global.enabled) {
      return false;
    }

    const timeInMinutes = hour * 60 + minute;
    const { startHour, endHour } = this.preferences.global;
    const startTime = startHour * 60;
    const endTime = endHour * 60;

    if (startTime <= endTime) {
      // Normal range within same day
      return timeInMinutes >= startTime && timeInMinutes < endTime;
    } else {
      // Quiet hours span midnight
      return timeInMinutes >= startTime || timeInMinutes < endTime;
    }
  }

  /**
   * Get the next time when quiet hours will start or end
   */
  public async getNextQuietHoursTransition(): Promise<{
    type: 'start' | 'end';
    time: Date;
  }> {
    await this.ensurePreferencesLoaded();

    const now = new Date();
    const isCurrentlyQuiet = await this.isQuietHours();

    if (!this.preferences?.global.enabled) {
      // If quiet hours are disabled, return a far future date for consistency
      const futureDate = new Date(now);
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      return { type: 'start', time: futureDate };
    }

    const { startHour, endHour } = this.preferences.global;

    if (isCurrentlyQuiet) {
      // Currently in quiet hours, return end time
      const endTime = new Date(now);
      endTime.setHours(endHour, 0, 0, 0);

      // If end time has passed today and we span midnight, it's tomorrow
      if (startHour > endHour && endTime <= now) {
        endTime.setDate(endTime.getDate() + 1);
      }

      return { type: 'end', time: endTime };
    } else {
      // Not in quiet hours, return start time
      const startTime = new Date(now);
      startTime.setHours(startHour, 0, 0, 0);

      // If start time has passed today, it's tomorrow
      if (startTime <= now) {
        startTime.setDate(startTime.getDate() + 1);
      }

      return { type: 'start', time: startTime };
    }
  }
}
