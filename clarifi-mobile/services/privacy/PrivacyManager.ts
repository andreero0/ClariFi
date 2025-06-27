import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// PIPEDA-compliant privacy consent levels
export enum ConsentLevel {
  ESSENTIAL = 'essential', // Required for app functionality
  ANALYTICS = 'analytics', // Optional analytics and performance tracking
  PERSONALIZATION = 'personalization', // Optional personalization features
  MARKETING = 'marketing', // Optional marketing and promotional content
}

// Privacy settings interface
export interface PrivacySettings {
  consentGiven: boolean;
  consentDate: string;
  consentVersion: string;
  levels: Record<ConsentLevel, boolean>;
  dataRetentionAcknowledged: boolean;
  rightsAcknowledged: boolean;
  lastUpdated: string;
}

// Data processing purposes as per PIPEDA
export enum DataPurpose {
  APP_FUNCTIONALITY = 'app_functionality',
  PERFORMANCE_MONITORING = 'performance_monitoring',
  ERROR_TRACKING = 'error_tracking',
  FEATURE_USAGE = 'feature_usage',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
}

// Data retention periods per type
export const DATA_RETENTION_PERIODS = {
  [DataPurpose.APP_FUNCTIONALITY]: 365, // 1 year
  [DataPurpose.PERFORMANCE_MONITORING]: 90, // 3 months
  [DataPurpose.ERROR_TRACKING]: 180, // 6 months
  [DataPurpose.FEATURE_USAGE]: 730, // 2 years
  [DataPurpose.SECURITY]: 2555, // 7 years (as per financial regulations)
  [DataPurpose.COMPLIANCE]: 2555, // 7 years (as per financial regulations)
};

class PrivacyManager {
  private static instance: PrivacyManager;
  private readonly STORAGE_KEY = '@clarifi_privacy_settings';
  private readonly CONSENT_VERSION = '1.0.0';
  private currentSettings: PrivacySettings | null = null;

  private constructor() {}

  static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  /**
   * Initialize privacy manager and load existing settings
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.currentSettings = JSON.parse(stored);

        // Check if consent needs to be re-obtained (version change, expiry, etc.)
        if (this.needsConsentRefresh()) {
          await this.resetConsent();
        }
      }
    } catch (error) {
      console.error('Error initializing privacy manager:', error);
    }
  }

  /**
   * Get current privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings | null> {
    if (!this.currentSettings) {
      await this.initialize();
    }
    return this.currentSettings;
  }

  /**
   * Check if user has given consent for a specific level
   */
  async hasConsent(level: ConsentLevel): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    if (!settings || !settings.consentGiven) {
      return false;
    }

    // Essential consent is always required and granted when any consent is given
    if (level === ConsentLevel.ESSENTIAL) {
      return true;
    }

    return settings.levels[level] || false;
  }

  /**
   * Check if analytics tracking is allowed
   */
  async canTrackAnalytics(): Promise<boolean> {
    return await this.hasConsent(ConsentLevel.ANALYTICS);
  }

  /**
   * Check if error tracking is allowed
   */
  async canTrackErrors(): Promise<boolean> {
    // Error tracking is essential for security and app functionality
    return await this.hasConsent(ConsentLevel.ESSENTIAL);
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      const currentSettings = await this.getPrivacySettings();
      const updatedSettings: PrivacySettings = {
        ...this.getDefaultSettings(),
        ...currentSettings,
        ...settings,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(updatedSettings)
      );
      this.currentSettings = updatedSettings;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw new Error('Failed to update privacy settings');
    }
  }

  /**
   * Grant consent with specified levels
   */
  async grantConsent(levels: Record<ConsentLevel, boolean>): Promise<void> {
    await this.updatePrivacySettings({
      consentGiven: true,
      consentDate: new Date().toISOString(),
      consentVersion: this.CONSENT_VERSION,
      levels,
      dataRetentionAcknowledged: true,
      rightsAcknowledged: true,
    });
  }

  /**
   * Revoke all consent
   */
  async revokeConsent(): Promise<void> {
    await this.updatePrivacySettings({
      consentGiven: false,
      levels: {
        [ConsentLevel.ESSENTIAL]: false,
        [ConsentLevel.ANALYTICS]: false,
        [ConsentLevel.PERSONALIZATION]: false,
        [ConsentLevel.MARKETING]: false,
      },
    });
  }

  /**
   * Reset consent (for version updates or expiry)
   */
  async resetConsent(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.currentSettings = null;
  }

  /**
   * Get default privacy settings
   */
  private getDefaultSettings(): PrivacySettings {
    return {
      consentGiven: false,
      consentDate: '',
      consentVersion: this.CONSENT_VERSION,
      levels: {
        [ConsentLevel.ESSENTIAL]: false,
        [ConsentLevel.ANALYTICS]: false,
        [ConsentLevel.PERSONALIZATION]: false,
        [ConsentLevel.MARKETING]: false,
      },
      dataRetentionAcknowledged: false,
      rightsAcknowledged: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Check if consent needs to be refreshed
   */
  private needsConsentRefresh(): boolean {
    if (!this.currentSettings) return true;

    // Check if consent version has changed
    if (this.currentSettings.consentVersion !== this.CONSENT_VERSION) {
      return true;
    }

    // Check if consent is older than 1 year (PIPEDA best practice)
    const consentDate = new Date(this.currentSettings.consentDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (consentDate < oneYearAgo) {
      return true;
    }

    return false;
  }

  /**
   * Get data retention policy information
   */
  getDataRetentionInfo(): Record<
    DataPurpose,
    { purpose: string; retentionDays: number; description: string }
  > {
    return {
      [DataPurpose.APP_FUNCTIONALITY]: {
        purpose: 'App Functionality',
        retentionDays: DATA_RETENTION_PERIODS[DataPurpose.APP_FUNCTIONALITY],
        description:
          'Data necessary for the app to function properly, including user preferences and session information.',
      },
      [DataPurpose.PERFORMANCE_MONITORING]: {
        purpose: 'Performance Monitoring',
        retentionDays:
          DATA_RETENTION_PERIODS[DataPurpose.PERFORMANCE_MONITORING],
        description:
          'Anonymous performance data to improve app speed and reliability.',
      },
      [DataPurpose.ERROR_TRACKING]: {
        purpose: 'Error Tracking',
        retentionDays: DATA_RETENTION_PERIODS[DataPurpose.ERROR_TRACKING],
        description:
          'Error logs and crash reports to fix bugs and improve app stability.',
      },
      [DataPurpose.FEATURE_USAGE]: {
        purpose: 'Feature Usage Analytics',
        retentionDays: DATA_RETENTION_PERIODS[DataPurpose.FEATURE_USAGE],
        description:
          'Anonymous usage patterns to understand which features are most helpful.',
      },
      [DataPurpose.SECURITY]: {
        purpose: 'Security',
        retentionDays: DATA_RETENTION_PERIODS[DataPurpose.SECURITY],
        description:
          'Security-related data for fraud prevention and account protection.',
      },
      [DataPurpose.COMPLIANCE]: {
        purpose: 'Regulatory Compliance',
        retentionDays: DATA_RETENTION_PERIODS[DataPurpose.COMPLIANCE],
        description:
          'Data required for financial regulatory compliance and audit purposes.',
      },
    };
  }

  /**
   * Get user's privacy rights information
   */
  getPrivacyRights(): Array<{ right: string; description: string }> {
    return [
      {
        right: 'Right to Know',
        description:
          'You have the right to know what personal information we collect and how we use it.',
      },
      {
        right: 'Right to Access',
        description:
          'You can request a copy of the personal information we have about you.',
      },
      {
        right: 'Right to Correction',
        description:
          'You can request that we correct any inaccurate personal information.',
      },
      {
        right: 'Right to Withdraw Consent',
        description:
          'You can withdraw your consent for data processing at any time.',
      },
      {
        right: 'Right to Deletion',
        description:
          'You can request deletion of your personal information (subject to legal requirements).',
      },
      {
        right: 'Right to Portability',
        description:
          'You can request your personal information in a portable format.',
      },
    ];
  }

  /**
   * Sanitize data by removing PII before analytics collection
   */
  sanitizeAnalyticsData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };

    // Remove common PII fields
    const piiFields = [
      'email',
      'phone',
      'phoneNumber',
      'firstName',
      'lastName',
      'name',
      'address',
      'street',
      'city',
      'postalCode',
      'zipCode',
      'ssn',
      'sin',
      'creditCard',
      'bankAccount',
      'password',
      'token',
      'apiKey',
      'personalId',
      'socialInsurance',
      'dateOfBirth',
      'birthDate',
    ];

    piiFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    // Sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeAnalyticsData(sanitized[key]);
      }

      // Hash or remove sensitive-looking values
      if (typeof sanitized[key] === 'string') {
        // Remove email patterns
        if (sanitized[key].includes('@') && sanitized[key].includes('.')) {
          sanitized[key] = '[email_removed]';
        }
        // Remove phone number patterns
        if (/^\+?[\d\s\-\(\)]{10,}$/.test(sanitized[key])) {
          sanitized[key] = '[phone_removed]';
        }
      }
    });

    return sanitized;
  }

  /**
   * Show privacy consent dialog
   */
  async showConsentDialog(): Promise<boolean> {
    return new Promise(resolve => {
      Alert.alert(
        'Privacy & Data Collection',
        'ClariFi would like to collect analytics data to improve your experience. All data is processed according to PIPEDA and Canadian privacy laws.',
        [
          {
            text: 'Essential Only',
            onPress: async () => {
              await this.grantConsent({
                [ConsentLevel.ESSENTIAL]: true,
                [ConsentLevel.ANALYTICS]: false,
                [ConsentLevel.PERSONALIZATION]: false,
                [ConsentLevel.MARKETING]: false,
              });
              resolve(true);
            },
          },
          {
            text: 'Accept All',
            onPress: async () => {
              await this.grantConsent({
                [ConsentLevel.ESSENTIAL]: true,
                [ConsentLevel.ANALYTICS]: true,
                [ConsentLevel.PERSONALIZATION]: true,
                [ConsentLevel.MARKETING]: false,
              });
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }
}

export default PrivacyManager;
