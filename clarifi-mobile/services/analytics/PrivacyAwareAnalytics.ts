import PrivacyManager, { ConsentLevel } from '../privacy/PrivacyManager';
import { useAnalytics } from './PostHogProvider';

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  userProperties?: Record<string, any>;
}

interface PrivacyAwareAnalyticsInterface {
  track: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  identify: (
    userId: string,
    userProperties?: Record<string, any>
  ) => Promise<void>;
  reset: () => Promise<void>;
  setUserProperty: (property: string, value: any) => Promise<void>;
  isAnalyticsEnabled: () => Promise<boolean>;
}

class PrivacyAwareAnalytics implements PrivacyAwareAnalyticsInterface {
  private privacyManager: PrivacyManager;
  private analyticsProvider: ReturnType<typeof useAnalytics> | null = null;
  private pendingEvents: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.privacyManager = PrivacyManager.getInstance();
  }

  /**
   * Initialize privacy-aware analytics
   */
  async initialize(
    analyticsProvider: ReturnType<typeof useAnalytics>
  ): Promise<void> {
    this.analyticsProvider = analyticsProvider;
    this.isInitialized = true;

    // Initialize privacy manager
    await this.privacyManager.initialize();

    // Process any pending events if consent is available
    if (await this.privacyManager.canTrackAnalytics()) {
      await this.processPendingEvents();
    }
  }

  /**
   * Track an analytics event with privacy compliance
   */
  async track(
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      // Check if analytics tracking is allowed
      if (!(await this.privacyManager.canTrackAnalytics())) {
        // Store event for later if user grants consent
        this.pendingEvents.push({ eventName, properties });
        return;
      }

      if (!this.analyticsProvider) {
        console.warn('Analytics provider not initialized');
        return;
      }

      // Sanitize properties to remove PII
      const sanitizedProperties = properties
        ? this.privacyManager.sanitizeAnalyticsData(properties)
        : {};

      // Add privacy compliance metadata
      const enhancedProperties = {
        ...sanitizedProperties,
        // Metadata for privacy compliance
        privacy_compliant: true,
        consent_version: (await this.privacyManager.getPrivacySettings())
          ?.consentVersion,
        data_collection_purpose: 'analytics',
        // Timestamp for data retention
        collected_at: new Date().toISOString(),
      };

      // Track the event
      this.analyticsProvider.track(eventName, enhancedProperties);

      // Log for debugging in development
      if (__DEV__) {
        console.log(
          'Privacy-aware analytics event:',
          eventName,
          enhancedProperties
        );
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Identify user with privacy compliance
   */
  async identify(
    userId: string,
    userProperties?: Record<string, any>
  ): Promise<void> {
    try {
      if (!(await this.privacyManager.canTrackAnalytics())) {
        this.pendingEvents.push({
          eventName: 'identify',
          properties: { userId },
          userProperties,
        });
        return;
      }

      if (!this.analyticsProvider) {
        console.warn('Analytics provider not initialized');
        return;
      }

      // Sanitize user properties
      const sanitizedProperties = userProperties
        ? this.privacyManager.sanitizeAnalyticsData(userProperties)
        : {};

      // Hash the user ID for privacy (use consistent hashing)
      const hashedUserId = await this.hashUserId(userId);

      // Add privacy compliance metadata
      const enhancedProperties = {
        ...sanitizedProperties,
        privacy_compliant: true,
        consent_given: true,
        consent_date: (await this.privacyManager.getPrivacySettings())
          ?.consentDate,
        identified_at: new Date().toISOString(),
      };

      this.analyticsProvider.identify(hashedUserId, enhancedProperties);
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  }

  /**
   * Reset analytics data (for privacy compliance)
   */
  async reset(): Promise<void> {
    try {
      if (this.analyticsProvider) {
        this.analyticsProvider.reset();
      }

      // Clear pending events
      this.pendingEvents = [];

      if (__DEV__) {
        console.log('Analytics data reset for privacy compliance');
      }
    } catch (error) {
      console.error('Error resetting analytics:', error);
    }
  }

  /**
   * Set user property with privacy compliance
   */
  async setUserProperty(property: string, value: any): Promise<void> {
    try {
      if (!(await this.privacyManager.canTrackAnalytics())) {
        return;
      }

      if (!this.analyticsProvider) {
        console.warn('Analytics provider not initialized');
        return;
      }

      // Sanitize the property value
      const sanitizedValue = this.privacyManager.sanitizeAnalyticsData({
        [property]: value,
      })[property];

      this.analyticsProvider.setUserProperty(property, sanitizedValue);
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  /**
   * Check if analytics tracking is enabled
   */
  async isAnalyticsEnabled(): Promise<boolean> {
    return await this.privacyManager.canTrackAnalytics();
  }

  /**
   * Process pending events when consent is granted
   */
  private async processPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const event of events) {
      if (event.eventName === 'identify' && event.userProperties) {
        await this.identify(event.properties?.userId, event.userProperties);
      } else {
        await this.track(event.eventName, event.properties);
      }
    }

    if (__DEV__) {
      console.log(`Processed ${events.length} pending analytics events`);
    }
  }

  /**
   * Hash user ID for privacy compliance
   */
  private async hashUserId(userId: string): Promise<string> {
    // Simple hash function for user ID privacy
    // In production, consider using a more robust hashing algorithm
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get privacy compliance status
   */
  async getPrivacyStatus(): Promise<{
    analyticsEnabled: boolean;
    consentGiven: boolean;
    consentDate?: string;
    dataRetentionAcknowledged: boolean;
  }> {
    const settings = await this.privacyManager.getPrivacySettings();

    return {
      analyticsEnabled: await this.privacyManager.canTrackAnalytics(),
      consentGiven: settings?.consentGiven || false,
      consentDate: settings?.consentDate,
      dataRetentionAcknowledged: settings?.dataRetentionAcknowledged || false,
    };
  }

  /**
   * Request consent from user
   */
  async requestConsent(): Promise<boolean> {
    const consentGiven = await this.privacyManager.showConsentDialog();

    if (consentGiven && (await this.privacyManager.canTrackAnalytics())) {
      // Process any pending events
      await this.processPendingEvents();
    }

    return consentGiven;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    levels: Record<ConsentLevel, boolean>
  ): Promise<void> {
    await this.privacyManager.grantConsent(levels);

    // If analytics was enabled, process pending events
    if (levels[ConsentLevel.ANALYTICS]) {
      await this.processPendingEvents();
    } else {
      // If analytics was disabled, reset and clear pending events
      await this.reset();
    }
  }

  /**
   * Export user data for privacy requests
   */
  async exportUserData(): Promise<{
    consentSettings: any;
    pendingEvents: AnalyticsEvent[];
    privacyStatus: any;
  }> {
    return {
      consentSettings: await this.privacyManager.getPrivacySettings(),
      pendingEvents: this.pendingEvents,
      privacyStatus: await this.getPrivacyStatus(),
    };
  }

  /**
   * Delete user data for privacy requests
   */
  async deleteUserData(): Promise<void> {
    // Reset analytics
    await this.reset();

    // Revoke consent
    await this.privacyManager.revokeConsent();

    // Clear pending events
    this.pendingEvents = [];

    if (__DEV__) {
      console.log('User data deleted for privacy compliance');
    }
  }
}

export default PrivacyAwareAnalytics;
