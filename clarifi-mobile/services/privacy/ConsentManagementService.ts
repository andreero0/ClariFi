import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';
import { STORAGE_KEYS, getObject, setObject } from '../storage/asyncStorage';

export interface ConsentRecord {
  id: string;
  userId?: string;
  consentType: ConsentType;
  granted: boolean;
  version: string;
  timestamp: string;
  expiryDate?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  ipAddress?: string;
  userAgent?: string;
  legalBasis: LegalBasis;
  metadata?: Record<string, any>;
}

export interface ConsentHistory {
  consentType: ConsentType;
  records: ConsentRecord[];
  currentStatus: boolean;
  lastUpdated: string;
  effectiveDate: string;
}

export enum ConsentType {
  // Essential consents (cannot be withdrawn)
  ESSENTIAL_SERVICES = 'essential_services',
  LEGAL_COMPLIANCE = 'legal_compliance',
  SECURITY_MONITORING = 'security_monitoring',

  // Optional consents (can be withdrawn)
  ANALYTICS_TRACKING = 'analytics_tracking',
  PERFORMANCE_MONITORING = 'performance_monitoring',
  PERSONALIZATION = 'personalization',
  MARKETING_COMMUNICATIONS = 'marketing_communications',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  CRASH_REPORTING = 'crash_reporting',
  FEATURE_USAGE_TRACKING = 'feature_usage_tracking',

  // Data retention consents
  EXTENDED_DATA_RETENTION = 'extended_data_retention',
  AUTO_DATA_DELETION = 'auto_data_deletion',

  // Communication consents
  EDUCATIONAL_CONTENT = 'educational_content',
  PRODUCT_UPDATES = 'product_updates',
  SURVEY_PARTICIPATION = 'survey_participation',
}

export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}

export interface ConsentConfiguration {
  type: ConsentType;
  name: string;
  description: string;
  legalBasis: LegalBasis;
  isRequired: boolean;
  canWithdraw: boolean;
  expiryMonths?: number;
  category: 'essential' | 'functional' | 'analytics' | 'marketing';
  relatedTypes?: ConsentType[];
}

export interface ConsentBundle {
  id: string;
  name: string;
  description: string;
  consentTypes: ConsentType[];
  allRequired: boolean;
}

export class ConsentManagementService {
  private static instance: ConsentManagementService;
  private readonly CONSENT_VERSION = '2.0.0';
  private readonly CONSENT_RECORDS_KEY = 'consent_records';
  private readonly CONSENT_HISTORY_KEY = 'consent_history';

  public static getInstance(): ConsentManagementService {
    if (!ConsentManagementService.instance) {
      ConsentManagementService.instance = new ConsentManagementService();
    }
    return ConsentManagementService.instance;
  }

  private constructor() {}

  /**
   * Initialize consent management service
   */
  async initialize(): Promise<void> {
    try {
      // Migrate from old privacy manager if needed
      await this.migrateFromLegacyConsents();

      // Check for expired consents
      await this.processExpiredConsents();

      console.log('ConsentManagementService initialized');
    } catch (error) {
      console.error('Error initializing ConsentManagementService:', error);
    }
  }

  /**
   * Get all consent configurations
   */
  getConsentConfigurations(): ConsentConfiguration[] {
    return [
      // Essential consents
      {
        type: ConsentType.ESSENTIAL_SERVICES,
        name: 'Essential Services',
        description:
          'Required for core app functionality, security, and account management',
        legalBasis: LegalBasis.CONTRACT,
        isRequired: true,
        canWithdraw: false,
        category: 'essential',
      },
      {
        type: ConsentType.LEGAL_COMPLIANCE,
        name: 'Legal Compliance',
        description:
          'Required to comply with Canadian financial regulations and PIPEDA',
        legalBasis: LegalBasis.LEGAL_OBLIGATION,
        isRequired: true,
        canWithdraw: false,
        category: 'essential',
      },
      {
        type: ConsentType.SECURITY_MONITORING,
        name: 'Security Monitoring',
        description:
          'Monitor for fraud, security threats, and account protection',
        legalBasis: LegalBasis.LEGITIMATE_INTERESTS,
        isRequired: true,
        canWithdraw: false,
        category: 'essential',
      },

      // Functional consents
      {
        type: ConsentType.CRASH_REPORTING,
        name: 'Crash Reporting',
        description:
          'Automatically report app crashes to help us fix bugs quickly',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 24,
        category: 'functional',
      },
      {
        type: ConsentType.PERFORMANCE_MONITORING,
        name: 'Performance Monitoring',
        description:
          'Track app performance to improve loading times and responsiveness',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 12,
        category: 'functional',
      },
      {
        type: ConsentType.PERSONALIZATION,
        name: 'Personalization',
        description:
          'Customize features and recommendations based on your usage patterns',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 24,
        category: 'functional',
      },

      // Analytics consents
      {
        type: ConsentType.ANALYTICS_TRACKING,
        name: 'Analytics Tracking',
        description:
          'Anonymous usage analytics to understand how features are used',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 12,
        category: 'analytics',
      },
      {
        type: ConsentType.FEATURE_USAGE_TRACKING,
        name: 'Feature Usage Tracking',
        description:
          'Track which features you use most to prioritize improvements',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 12,
        category: 'analytics',
      },

      // Marketing consents
      {
        type: ConsentType.MARKETING_COMMUNICATIONS,
        name: 'Marketing Communications',
        description:
          'Receive promotional content, tips, and product announcements',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 12,
        category: 'marketing',
      },
      {
        type: ConsentType.EDUCATIONAL_CONTENT,
        name: 'Educational Content',
        description:
          'Receive financial tips, budgeting advice, and educational resources',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 24,
        category: 'marketing',
      },
      {
        type: ConsentType.PRODUCT_UPDATES,
        name: 'Product Updates',
        description:
          'Get notified about new features and important app changes',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 24,
        category: 'marketing',
      },
      {
        type: ConsentType.SURVEY_PARTICIPATION,
        name: 'Survey Participation',
        description: 'Participate in user research and feedback surveys',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 12,
        category: 'marketing',
      },

      // Data processing consents
      {
        type: ConsentType.THIRD_PARTY_SHARING,
        name: 'Third-Party Data Sharing',
        description:
          'Share anonymized data with trusted partners for service improvement',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 12,
        category: 'analytics',
      },
      {
        type: ConsentType.EXTENDED_DATA_RETENTION,
        name: 'Extended Data Retention',
        description:
          'Keep your data longer than the legal minimum for better insights',
        legalBasis: LegalBasis.CONSENT,
        isRequired: false,
        canWithdraw: true,
        expiryMonths: 36,
        category: 'functional',
      },
    ];
  }

  /**
   * Get consent bundles for easier management
   */
  getConsentBundles(): ConsentBundle[] {
    return [
      {
        id: 'essential',
        name: 'Essential Services',
        description: 'Required for app functionality and legal compliance',
        consentTypes: [
          ConsentType.ESSENTIAL_SERVICES,
          ConsentType.LEGAL_COMPLIANCE,
          ConsentType.SECURITY_MONITORING,
        ],
        allRequired: true,
      },
      {
        id: 'app_improvement',
        name: 'App Improvement',
        description:
          'Help us improve the app with crash reports and performance data',
        consentTypes: [
          ConsentType.CRASH_REPORTING,
          ConsentType.PERFORMANCE_MONITORING,
        ],
        allRequired: false,
      },
      {
        id: 'analytics',
        name: 'Analytics & Insights',
        description: 'Anonymous usage analytics and feature tracking',
        consentTypes: [
          ConsentType.ANALYTICS_TRACKING,
          ConsentType.FEATURE_USAGE_TRACKING,
        ],
        allRequired: false,
      },
      {
        id: 'personalization',
        name: 'Personalization',
        description: 'Customize your experience based on your preferences',
        consentTypes: [ConsentType.PERSONALIZATION],
        allRequired: false,
      },
      {
        id: 'communications',
        name: 'Communications',
        description: 'Receive updates, tips, and educational content',
        consentTypes: [
          ConsentType.MARKETING_COMMUNICATIONS,
          ConsentType.EDUCATIONAL_CONTENT,
          ConsentType.PRODUCT_UPDATES,
          ConsentType.SURVEY_PARTICIPATION,
        ],
        allRequired: false,
      },
    ];
  }

  /**
   * Grant consent for specific types
   */
  async grantConsent(
    consentTypes: ConsentType[],
    metadata?: Record<string, any>
  ): Promise<ConsentRecord[]> {
    const records: ConsentRecord[] = [];
    const timestamp = new Date().toISOString();

    for (const consentType of consentTypes) {
      const config = this.getConsentConfigurations().find(
        c => c.type === consentType
      );
      if (!config) {
        throw new Error(`Unknown consent type: ${consentType}`);
      }

      const expiryDate = config.expiryMonths
        ? new Date(
            Date.now() + config.expiryMonths * 30 * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined;

      const record: ConsentRecord = {
        id: this.generateConsentId(),
        consentType,
        granted: true,
        version: this.CONSENT_VERSION,
        timestamp,
        expiryDate,
        legalBasis: config.legalBasis,
        metadata,
      };

      records.push(record);
      await this.storeConsentRecord(record);
    }

    return records;
  }

  /**
   * Withdraw consent for specific types
   */
  async withdrawConsent(
    consentTypes: ConsentType[],
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<ConsentRecord[]> {
    const records: ConsentRecord[] = [];
    const timestamp = new Date().toISOString();

    for (const consentType of consentTypes) {
      const config = this.getConsentConfigurations().find(
        c => c.type === consentType
      );
      if (!config) {
        throw new Error(`Unknown consent type: ${consentType}`);
      }

      if (!config.canWithdraw) {
        throw new Error(`Consent type ${consentType} cannot be withdrawn`);
      }

      const record: ConsentRecord = {
        id: this.generateConsentId(),
        consentType,
        granted: false,
        version: this.CONSENT_VERSION,
        timestamp,
        withdrawnAt: timestamp,
        withdrawalReason: reason,
        legalBasis: config.legalBasis,
        metadata,
      };

      records.push(record);
      await this.storeConsentRecord(record);
    }

    return records;
  }

  /**
   * Check if consent is granted for a specific type
   */
  async hasConsent(consentType: ConsentType): Promise<boolean> {
    try {
      const history = await this.getConsentHistory(consentType);
      if (!history || history.records.length === 0) {
        return false;
      }

      // Check if current consent is valid and not expired
      const latestRecord = history.records[0]; // Records are sorted by timestamp desc

      if (!latestRecord.granted) {
        return false;
      }

      if (
        latestRecord.expiryDate &&
        new Date(latestRecord.expiryDate) < new Date()
      ) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error checking consent for ${consentType}:`, error);
      return false;
    }
  }

  /**
   * Get consent status for multiple types
   */
  async getConsentStatus(
    consentTypes: ConsentType[]
  ): Promise<Record<ConsentType, boolean>> {
    const status: Record<ConsentType, boolean> = {} as Record<
      ConsentType,
      boolean
    >;

    for (const type of consentTypes) {
      status[type] = await this.hasConsent(type);
    }

    return status;
  }

  /**
   * Get consent history for a specific type
   */
  async getConsentHistory(
    consentType: ConsentType
  ): Promise<ConsentHistory | null> {
    try {
      const allHistory = await getObject<Record<ConsentType, ConsentHistory>>(
        this.CONSENT_HISTORY_KEY
      );
      return allHistory?.[consentType] || null;
    } catch (error) {
      console.error(`Error getting consent history for ${consentType}:`, error);
      return null;
    }
  }

  /**
   * Get all consent records for audit purposes
   */
  async getAllConsentRecords(): Promise<ConsentRecord[]> {
    try {
      const records = await getObject<ConsentRecord[]>(
        this.CONSENT_RECORDS_KEY
      );
      return records || [];
    } catch (error) {
      console.error('Error getting all consent records:', error);
      return [];
    }
  }

  /**
   * Export consent data for user download
   */
  async exportConsentData(): Promise<{
    consentHistory: Record<ConsentType, ConsentHistory>;
    allRecords: ConsentRecord[];
    configurations: ConsentConfiguration[];
    exportDate: string;
  }> {
    const allHistory: Record<ConsentType, ConsentHistory> = {};
    const consentTypes = this.getConsentConfigurations().map(c => c.type);

    for (const type of consentTypes) {
      const history = await this.getConsentHistory(type);
      if (history) {
        allHistory[type] = history;
      }
    }

    return {
      consentHistory: allHistory,
      allRecords: await this.getAllConsentRecords(),
      configurations: this.getConsentConfigurations(),
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * Store a consent record
   */
  private async storeConsentRecord(record: ConsentRecord): Promise<void> {
    try {
      // Store in all records list
      const allRecords = await this.getAllConsentRecords();
      allRecords.unshift(record); // Add to beginning

      // Keep only last 100 records per consent type to manage storage
      const recordsForType = allRecords.filter(
        r => r.consentType === record.consentType
      );
      const otherRecords = allRecords.filter(
        r => r.consentType !== record.consentType
      );
      const trimmedRecordsForType = recordsForType.slice(0, 100);

      await setObject(this.CONSENT_RECORDS_KEY, [
        ...trimmedRecordsForType,
        ...otherRecords,
      ]);

      // Update consent history
      await this.updateConsentHistory(record);
    } catch (error) {
      console.error('Error storing consent record:', error);
      throw error;
    }
  }

  /**
   * Update consent history for a type
   */
  private async updateConsentHistory(record: ConsentRecord): Promise<void> {
    try {
      const allHistory =
        (await getObject<Record<ConsentType, ConsentHistory>>(
          this.CONSENT_HISTORY_KEY
        )) || {};

      const existingHistory = allHistory[record.consentType];
      const records = existingHistory ? [...existingHistory.records] : [];

      records.unshift(record); // Add to beginning
      records.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const history: ConsentHistory = {
        consentType: record.consentType,
        records: records.slice(0, 50), // Keep last 50 records
        currentStatus:
          record.granted &&
          (!record.expiryDate || new Date(record.expiryDate) > new Date()),
        lastUpdated: record.timestamp,
        effectiveDate: record.granted
          ? record.timestamp
          : existingHistory?.effectiveDate || record.timestamp,
      };

      allHistory[record.consentType] = history;
      await setObject(this.CONSENT_HISTORY_KEY, allHistory);
    } catch (error) {
      console.error('Error updating consent history:', error);
      throw error;
    }
  }

  /**
   * Process expired consents
   */
  private async processExpiredConsents(): Promise<void> {
    try {
      const configs = this.getConsentConfigurations();
      const now = new Date();

      for (const config of configs) {
        if (!config.expiryMonths) continue;

        const hasValidConsent = await this.hasConsent(config.type);
        if (!hasValidConsent) {
          const history = await this.getConsentHistory(config.type);
          if (history && history.records.length > 0) {
            const latestRecord = history.records[0];
            if (
              latestRecord.granted &&
              latestRecord.expiryDate &&
              new Date(latestRecord.expiryDate) < now
            ) {
              console.log(
                `Consent expired for ${config.type}, marking as withdrawn`
              );
              await this.withdrawConsent([config.type], 'Consent expired');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing expired consents:', error);
    }
  }

  /**
   * Migrate from legacy privacy manager consents
   */
  private async migrateFromLegacyConsents(): Promise<void> {
    // This would migrate from the old PrivacyManager format
    // Implementation would depend on the existing data structure
    console.log('Checking for legacy consent migration...');
  }

  /**
   * Generate unique consent ID
   */
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export default ConsentManagementService.getInstance();
