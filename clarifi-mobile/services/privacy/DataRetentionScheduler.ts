import { AppState } from 'react-native';
import DataRetentionService, { PurgeReport } from './DataRetentionService';

export interface SchedulerConfig {
  checkInterval: number; // Interval in milliseconds to check for scheduled purges
  maxMissedChecks: number; // Maximum number of missed checks before forcing a purge
  backgroundPurge: boolean; // Whether to allow purging in background
}

export class DataRetentionScheduler {
  private static instance: DataRetentionScheduler;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private config: SchedulerConfig = {
    checkInterval: 60 * 60 * 1000, // Check every hour
    maxMissedChecks: 24, // Force purge after 24 missed checks (24 hours)
    backgroundPurge: false, // Disabled by default for better UX
  };

  public static getInstance(): DataRetentionScheduler {
    if (!DataRetentionScheduler.instance) {
      DataRetentionScheduler.instance = new DataRetentionScheduler();
    }
    return DataRetentionScheduler.instance;
  }

  private constructor() {}

  /**
   * Start the data retention scheduler
   */
  start(config?: Partial<SchedulerConfig>): void {
    if (this.isRunning) {
      console.log('DataRetentionScheduler is already running');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('Starting DataRetentionScheduler with config:', this.config);

    this.isRunning = true;
    this.setupPeriodicCheck();
    this.setupAppStateListener();
  }

  /**
   * Stop the data retention scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping DataRetentionScheduler');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Check if scheduled purge is due and execute if needed
   */
  async checkAndExecutePurge(): Promise<PurgeReport | null> {
    try {
      console.log('Checking for scheduled data purge...');
      return await DataRetentionService.checkScheduledPurge();
    } catch (error) {
      console.error('Error during scheduled purge check:', error);
      return null;
    }
  }

  /**
   * Perform immediate manual purge
   */
  async performManualPurge(): Promise<PurgeReport | null> {
    try {
      console.log('Performing manual data purge...');
      return await DataRetentionService.performManualPurge();
    } catch (error) {
      console.error('Error during manual purge:', error);
      throw error;
    }
  }

  /**
   * Setup periodic purge checking
   */
  private setupPeriodicCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        try {
          const report = await this.checkAndExecutePurge();
          if (report) {
            console.log('Scheduled purge executed:', {
              itemsDeleted: report.totalItemsDeleted,
              categories: report.categoriesProcessed,
              nextPurge: report.nextScheduledPurge,
            });

            // Optional: Notify user about successful purge
            this.notifyPurgeCompleted(report);
          }
        } catch (error) {
          console.error('Error in periodic purge check:', error);
        }
      }
    }, this.config.checkInterval);
  }

  /**
   * Setup app state listener for opportunistic purging
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active' && this.isRunning) {
          // App became active - good opportunity to check for purges
          console.log('App became active, checking for scheduled purges...');

          try {
            const report = await this.checkAndExecutePurge();
            if (report) {
              console.log('Opportunistic purge executed on app activation');
            }
          } catch (error) {
            console.error('Error in opportunistic purge check:', error);
          }
        }
      }
    );
  }

  /**
   * Notify user about completed purge (optional)
   */
  private notifyPurgeCompleted(report: PurgeReport): void {
    // This could integrate with the notification service
    // For now, just log the success
    if (report.totalItemsDeleted > 0) {
      console.log(
        `✅ Data cleanup completed: ${report.totalItemsDeleted} items removed from ${report.categoriesProcessed.join(', ')}`
      );
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    config: SchedulerConfig;
    nextCheck?: Date;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      nextCheck: this.intervalId
        ? new Date(Date.now() + this.config.checkInterval)
        : undefined,
    };
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.isRunning) {
      // Restart with new config
      this.stop();
      this.start();
    }
  }

  /**
   * Get purge history
   */
  async getPurgeHistory(): Promise<PurgeReport[]> {
    return await DataRetentionService.getPurgeHistory();
  }

  /**
   * Initialize the scheduler with the data retention service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize the data retention service first
      await DataRetentionService.initialize();

      // Start the scheduler with default config
      this.start();

      console.log('DataRetentionScheduler initialized and started');
    } catch (error) {
      console.error('Error initializing DataRetentionScheduler:', error);
    }
  }

  /**
   * Get data retention policy for display
   */
  async getRetentionPolicy() {
    return await DataRetentionService.getRetentionPolicy();
  }

  /**
   * Get retention settings for display
   */
  async getRetentionSettings() {
    return await DataRetentionService.getRetentionSettings();
  }
}

// Export singleton instance
export default DataRetentionScheduler.getInstance();
