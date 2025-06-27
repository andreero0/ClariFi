import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';
import { STORAGE_KEYS, getObject, setObject } from '../storage/asyncStorage';

export interface DataRetentionSettings {
  autoDeleteOldData: boolean;
  retentionPeriod: 'legal_minimum' | '1year' | '2years' | '5years';
  lastPurgeDate?: string;
  nextScheduledPurge?: string;
}

export interface DataRetentionPolicy {
  // Financial data retention minimums (Canadian regulations)
  financialRecords: number; // 7 years minimum for CRA
  transactionHistory: number; // 7 years minimum
  taxRelatedData: number; // 7 years minimum

  // User data retention based on preferences
  personalPreferences: number;
  analyticsData: number;
  communicationLogs: number;
  appUsageData: number;

  // Session and temporary data
  sessionData: number; // 30 days
  tempFiles: number; // 7 days
  cacheData: number; // 30 days
}

export interface PurgeReport {
  purgeDate: string;
  totalItemsDeleted: number;
  categoriesProcessed: string[];
  spaceFreed: number; // in bytes
  errors: string[];
  nextScheduledPurge: string;
}

export class DataRetentionService {
  private static instance: DataRetentionService;

  public static getInstance(): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService();
    }
    return DataRetentionService.instance;
  }

  private constructor() {}

  /**
   * Get current data retention settings
   */
  async getRetentionSettings(): Promise<DataRetentionSettings> {
    try {
      const settings = await getObject<DataRetentionSettings>(
        STORAGE_KEYS.DATA_RETENTION_SETTINGS
      );
      return (
        settings || {
          autoDeleteOldData: true,
          retentionPeriod: 'legal_minimum',
        }
      );
    } catch (error) {
      console.error('Error getting retention settings:', error);
      return {
        autoDeleteOldData: true,
        retentionPeriod: 'legal_minimum',
      };
    }
  }

  /**
   * Update data retention settings
   */
  async updateRetentionSettings(
    settings: Partial<DataRetentionSettings>
  ): Promise<void> {
    try {
      const currentSettings = await this.getRetentionSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      // Calculate next scheduled purge if auto-delete is enabled
      if (updatedSettings.autoDeleteOldData) {
        updatedSettings.nextScheduledPurge = this.calculateNextPurgeDate();
      }

      await setObject(STORAGE_KEYS.DATA_RETENTION_SETTINGS, updatedSettings);
      console.log('Data retention settings updated:', updatedSettings);
    } catch (error) {
      console.error('Error updating retention settings:', error);
      throw error;
    }
  }

  /**
   * Get data retention policy based on user settings and legal requirements
   */
  async getRetentionPolicy(): Promise<DataRetentionPolicy> {
    const settings = await this.getRetentionSettings();
    const userRetentionDays = this.getRetentionDaysFromPeriod(
      settings.retentionPeriod
    );

    return {
      // Legal minimums for financial data (cannot be overridden)
      financialRecords: 7 * 365, // 7 years
      transactionHistory: 7 * 365, // 7 years
      taxRelatedData: 7 * 365, // 7 years

      // User-configurable retention (respects user choice)
      personalPreferences: userRetentionDays,
      analyticsData: Math.min(userRetentionDays, 2 * 365), // Max 2 years for analytics
      communicationLogs: Math.min(userRetentionDays, 1 * 365), // Max 1 year for communication
      appUsageData: Math.min(userRetentionDays, 1 * 365), // Max 1 year for usage data

      // System data (fixed retention periods)
      sessionData: 30, // 30 days
      tempFiles: 7, // 7 days
      cacheData: 30, // 30 days
    };
  }

  /**
   * Perform manual data purge
   */
  async performManualPurge(): Promise<PurgeReport> {
    console.log('Starting manual data purge...');

    const settings = await this.getRetentionSettings();
    if (!settings.autoDeleteOldData) {
      throw new Error('Auto-delete is disabled. Manual purge not allowed.');
    }

    return await this.executePurge(true);
  }

  /**
   * Check if scheduled purge is due and execute if needed
   */
  async checkScheduledPurge(): Promise<PurgeReport | null> {
    const settings = await this.getRetentionSettings();

    if (!settings.autoDeleteOldData) {
      console.log('Auto-delete disabled, skipping scheduled purge');
      return null;
    }

    const now = new Date();
    const nextPurge = settings.nextScheduledPurge
      ? new Date(settings.nextScheduledPurge)
      : null;

    if (!nextPurge || now >= nextPurge) {
      console.log('Scheduled purge due, executing...');
      return await this.executePurge(false);
    }

    console.log('Scheduled purge not due yet');
    return null;
  }

  /**
   * Execute data purge process
   */
  private async executePurge(isManual: boolean = false): Promise<PurgeReport> {
    const purgeStartTime = Date.now();
    const purgeDate = new Date().toISOString();
    const report: PurgeReport = {
      purgeDate,
      totalItemsDeleted: 0,
      categoriesProcessed: [],
      spaceFreed: 0,
      errors: [],
      nextScheduledPurge: this.calculateNextPurgeDate(),
    };

    try {
      const policy = await this.getRetentionPolicy();

      // Purge different data categories
      await this.purgeAnalyticsData(policy, report);
      await this.purgeCommunicationLogs(policy, report);
      await this.purgeAppUsageData(policy, report);
      await this.purgeSessionData(policy, report);
      await this.purgeTempFiles(policy, report);
      await this.purgeCacheData(policy, report);

      // Note: Financial data is NOT purged as it must meet legal retention requirements

      // Update last purge date and next scheduled purge
      await this.updateRetentionSettings({
        lastPurgeDate: purgeDate,
        nextScheduledPurge: report.nextScheduledPurge,
      });

      // Add to purge history
      await this.addToPurgeHistory(report);

      console.log(
        `Data purge completed in ${Date.now() - purgeStartTime}ms:`,
        report
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      report.errors.push(errorMessage);
      console.error('Error during data purge:', error);
    }

    return report;
  }

  /**
   * Purge analytics data older than retention period
   */
  private async purgeAnalyticsData(
    policy: DataRetentionPolicy,
    report: PurgeReport
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.analyticsData);

      // Remove analytics data from AsyncStorage
      const analyticsKeys = [
        STORAGE_KEYS.AI_USAGE_STATS,
        'app_analytics',
        'performance_metrics',
        'usage_statistics',
      ];

      let deletedCount = 0;
      for (const key of analyticsKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            if (
              parsedData.timestamp &&
              new Date(parsedData.timestamp) < cutoffDate
            ) {
              await AsyncStorage.removeItem(key);
              deletedCount++;
            }
          }
        } catch (error) {
          console.warn(`Error processing analytics key ${key}:`, error);
        }
      }

      report.totalItemsDeleted += deletedCount;
      report.categoriesProcessed.push('Analytics Data');
    } catch (error) {
      report.errors.push(
        `Analytics data purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Purge communication logs older than retention period
   */
  private async purgeCommunicationLogs(
    policy: DataRetentionPolicy,
    report: PurgeReport
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.communicationLogs);

      // Remove old communication logs
      const communicationKeys = [
        'notification_history',
        'email_logs',
        'push_notification_logs',
      ];

      let deletedCount = 0;
      for (const key of communicationKeys) {
        try {
          const logs = await AsyncStorage.getItem(key);
          if (logs) {
            const parsedLogs = JSON.parse(logs);
            if (Array.isArray(parsedLogs)) {
              const filteredLogs = parsedLogs.filter((log: any) => {
                return !log.timestamp || new Date(log.timestamp) >= cutoffDate;
              });

              if (filteredLogs.length !== parsedLogs.length) {
                await AsyncStorage.setItem(key, JSON.stringify(filteredLogs));
                deletedCount += parsedLogs.length - filteredLogs.length;
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing communication logs ${key}:`, error);
        }
      }

      report.totalItemsDeleted += deletedCount;
      report.categoriesProcessed.push('Communication Logs');
    } catch (error) {
      report.errors.push(
        `Communication logs purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Purge app usage data older than retention period
   */
  private async purgeAppUsageData(
    policy: DataRetentionPolicy,
    report: PurgeReport
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.appUsageData);

      // Remove old app usage data
      const usageKeys = [
        'feature_usage_stats',
        'screen_visit_logs',
        'user_interaction_logs',
      ];

      let deletedCount = 0;
      for (const key of usageKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData)) {
              const filteredData = parsedData.filter((item: any) => {
                return (
                  !item.timestamp || new Date(item.timestamp) >= cutoffDate
                );
              });

              if (filteredData.length !== parsedData.length) {
                await AsyncStorage.setItem(key, JSON.stringify(filteredData));
                deletedCount += parsedData.length - filteredData.length;
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing usage data ${key}:`, error);
        }
      }

      report.totalItemsDeleted += deletedCount;
      report.categoriesProcessed.push('App Usage Data');
    } catch (error) {
      report.errors.push(
        `App usage data purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Purge session data older than retention period
   */
  private async purgeSessionData(
    policy: DataRetentionPolicy,
    report: PurgeReport
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.sessionData);

      // Remove old session data
      const sessionKeys = [
        'user_sessions',
        'login_history',
        'app_state_history',
      ];

      let deletedCount = 0;
      for (const key of sessionKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData)) {
              const filteredData = parsedData.filter((item: any) => {
                return (
                  !item.timestamp || new Date(item.timestamp) >= cutoffDate
                );
              });

              if (filteredData.length !== parsedData.length) {
                await AsyncStorage.setItem(key, JSON.stringify(filteredData));
                deletedCount += parsedData.length - filteredData.length;
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing session data ${key}:`, error);
        }
      }

      report.totalItemsDeleted += deletedCount;
      report.categoriesProcessed.push('Session Data');
    } catch (error) {
      report.errors.push(
        `Session data purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Purge temporary files older than retention period
   */
  private async purgeTempFiles(
    policy: DataRetentionPolicy,
    report: PurgeReport
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.tempFiles);

      // Clean up temp storage keys and potential file system cleanup
      const tempKeys = ['temp_uploads', 'temp_exports', 'temp_processing_data'];

      let deletedCount = 0;
      for (const key of tempKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            if (
              parsedData.timestamp &&
              new Date(parsedData.timestamp) < cutoffDate
            ) {
              await AsyncStorage.removeItem(key);
              deletedCount++;
            }
          }
        } catch (error) {
          console.warn(`Error processing temp data ${key}:`, error);
        }
      }

      report.totalItemsDeleted += deletedCount;
      report.categoriesProcessed.push('Temporary Files');
    } catch (error) {
      report.errors.push(
        `Temporary files purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Purge cache data older than retention period
   */
  private async purgeCacheData(
    policy: DataRetentionPolicy,
    report: PurgeReport
  ): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.cacheData);

      // Remove old cache data
      const cacheKeys = [
        'api_cache',
        'image_cache_metadata',
        'computation_cache',
      ];

      let deletedCount = 0;
      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            if (
              parsedData.timestamp &&
              new Date(parsedData.timestamp) < cutoffDate
            ) {
              await AsyncStorage.removeItem(key);
              deletedCount++;
            }
          }
        } catch (error) {
          console.warn(`Error processing cache data ${key}:`, error);
        }
      }

      report.totalItemsDeleted += deletedCount;
      report.categoriesProcessed.push('Cache Data');
    } catch (error) {
      report.errors.push(
        `Cache data purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get purge history
   */
  async getPurgeHistory(): Promise<PurgeReport[]> {
    try {
      const history = await getObject<PurgeReport[]>('data_purge_history');
      return history || [];
    } catch (error) {
      console.error('Error getting purge history:', error);
      return [];
    }
  }

  /**
   * Add purge report to history
   */
  private async addToPurgeHistory(report: PurgeReport): Promise<void> {
    try {
      const history = await this.getPurgeHistory();
      history.unshift(report); // Add to beginning

      // Keep only last 10 reports
      const trimmedHistory = history.slice(0, 10);

      await setObject('data_purge_history', trimmedHistory);
    } catch (error) {
      console.error('Error adding to purge history:', error);
    }
  }

  /**
   * Calculate next purge date (weekly)
   */
  private calculateNextPurgeDate(): string {
    const nextPurge = new Date();
    nextPurge.setDate(nextPurge.getDate() + 7); // Weekly purge
    return nextPurge.toISOString();
  }

  /**
   * Convert retention period to days
   */
  private getRetentionDaysFromPeriod(period: string): number {
    switch (period) {
      case 'legal_minimum':
        return 365; // 1 year minimum for user data
      case '1year':
        return 365;
      case '2years':
        return 2 * 365;
      case '5years':
        return 5 * 365;
      default:
        return 365; // Default to 1 year
    }
  }

  /**
   * Initialize data retention service
   */
  async initialize(): Promise<void> {
    try {
      // Check if initial setup is needed
      const settings = await this.getRetentionSettings();

      if (!settings.nextScheduledPurge) {
        await this.updateRetentionSettings({
          nextScheduledPurge: this.calculateNextPurgeDate(),
        });
      }

      console.log('DataRetentionService initialized');
    } catch (error) {
      console.error('Error initializing DataRetentionService:', error);
    }
  }
}

// Export singleton instance
export default DataRetentionService.getInstance();
