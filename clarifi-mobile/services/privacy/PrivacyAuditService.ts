import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';

export interface PrivacyAuditEvent {
  id: string;
  userId: string;
  action: PrivacyAction;
  resource: string;
  metadata: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  complianceNote?: string;
}

export enum PrivacyAction {
  // Data Export Actions
  EXPORT_REQUEST = 'export_request',
  EXPORT_GENERATED = 'export_generated',
  EXPORT_DOWNLOADED = 'export_downloaded',
  EXPORT_FAILED = 'export_failed',

  // Consent Management
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  CONSENT_UPDATED = 'consent_updated',
  CONSENT_VIEWED = 'consent_viewed',

  // Data Access
  DATA_ACCESSED = 'data_accessed',
  PROFILE_VIEWED = 'profile_viewed',
  SETTINGS_CHANGED = 'settings_changed',

  // Privacy Controls
  PRIVACY_SETTINGS_VIEWED = 'privacy_settings_viewed',
  PRIVACY_SETTINGS_UPDATED = 'privacy_settings_updated',
  DATA_DELETION_REQUEST = 'data_deletion_request',
  DATA_PORTABILITY_REQUEST = 'data_portability_request',

  // Authentication & Security
  LOGIN_ATTEMPT = 'login_attempt',
  LOGOUT = 'logout',
  BIOMETRIC_ENABLED = 'biometric_enabled',
  BIOMETRIC_DISABLED = 'biometric_disabled',

  // File Security
  FILE_ENCRYPTED = 'file_encrypted',
  FILE_DECRYPTED = 'file_decrypted',
  SECURE_DELETE = 'secure_delete',
  TOKEN_GENERATED = 'token_generated',
  TOKEN_REVOKED = 'token_revoked',

  // System Events
  PRIVACY_POLICY_VIEWED = 'privacy_policy_viewed',
  TERMS_VIEWED = 'terms_viewed',
  COMPLIANCE_CHECK = 'compliance_check',
}

export interface AuditSummary {
  totalEvents: number;
  eventsByAction: Record<PrivacyAction, number>;
  lastActivity: Date;
  complianceScore: number;
  riskEvents: PrivacyAuditEvent[];
}

export class PrivacyAuditService {
  private static readonly STORAGE_KEY = 'privacy_audit_log';
  private static readonly MAX_LOCAL_EVENTS = 1000;
  private static readonly RISK_ACTIONS = [
    PrivacyAction.EXPORT_FAILED,
    PrivacyAction.DATA_DELETION_REQUEST,
    PrivacyAction.CONSENT_WITHDRAWN,
  ];

  /**
   * Log a privacy-related action
   */
  static async logEvent(
    userId: string,
    action: PrivacyAction,
    resource: string,
    metadata: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const event: PrivacyAuditEvent = {
        id: this.generateEventId(),
        userId,
        action,
        resource,
        metadata: {
          ...metadata,
          appVersion: '1.0.0', // Get from app config
          platform: 'mobile',
        },
        timestamp: new Date(),
        success,
        errorMessage,
        complianceNote: this.getComplianceNote(action),
      };

      // Add to local storage
      await this.storeEventLocally(event);

      // Send to backend for centralized logging (if online)
      await this.sendToBackend(event);

      console.log(
        `Privacy audit: ${action} for user ${userId} - ${success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      console.error('Failed to log privacy audit event:', error);
      // Don't throw - audit logging failures shouldn't break user experience
    }
  }

  /**
   * Log data export events with specific metadata
   */
  static async logDataExport(
    userId: string,
    format: 'csv' | 'json' | 'pdf',
    options: any,
    result: { success: boolean; fileSize?: string; error?: string }
  ): Promise<void> {
    const action = result.success
      ? PrivacyAction.EXPORT_GENERATED
      : PrivacyAction.EXPORT_FAILED;

    await this.logEvent(
      userId,
      action,
      `data_export_${format}`,
      {
        format,
        includePersonalInfo: options.includePersonalInfo,
        includeTransactions: options.includeTransactions,
        dateRange: options.dateRange,
        fileSize: result.fileSize,
        estimatedRecords: this.estimateRecordCount(options),
      },
      result.success,
      result.error
    );
  }

  /**
   * Log consent changes with detailed tracking
   */
  static async logConsentChange(
    userId: string,
    consentType: string,
    action: 'granted' | 'withdrawn' | 'updated',
    previousValue?: boolean,
    newValue?: boolean
  ): Promise<void> {
    const auditAction =
      action === 'granted'
        ? PrivacyAction.CONSENT_GRANTED
        : action === 'withdrawn'
          ? PrivacyAction.CONSENT_WITHDRAWN
          : PrivacyAction.CONSENT_UPDATED;

    await this.logEvent(userId, auditAction, `consent_${consentType}`, {
      consentType,
      previousValue,
      newValue,
      changeType: action,
      legalBasis: this.getLegalBasis(consentType),
    });
  }

  /**
   * Log file security operations
   */
  static async logFileOperation(
    userId: string,
    operation: 'encrypt' | 'decrypt' | 'delete' | 'download',
    fileId: string,
    result: { success: boolean; error?: string }
  ): Promise<void> {
    const actionMap = {
      encrypt: PrivacyAction.FILE_ENCRYPTED,
      decrypt: PrivacyAction.FILE_DECRYPTED,
      delete: PrivacyAction.SECURE_DELETE,
      download: PrivacyAction.EXPORT_DOWNLOADED,
    };

    await this.logEvent(
      userId,
      actionMap[operation],
      `file_${fileId}`,
      {
        operation,
        fileId,
        securityLevel: 'high',
      },
      result.success,
      result.error
    );
  }

  /**
   * Get audit summary for a user
   */
  static async getAuditSummary(userId: string): Promise<AuditSummary> {
    try {
      const events = await this.getUserEvents(userId);

      const eventsByAction = {} as Record<PrivacyAction, number>;
      Object.values(PrivacyAction).forEach(action => {
        eventsByAction[action] = events.filter(e => e.action === action).length;
      });

      const riskEvents = events.filter(
        e => this.RISK_ACTIONS.includes(e.action) || !e.success
      );

      const complianceScore = this.calculateComplianceScore(events);
      const lastActivity =
        events.length > 0
          ? new Date(Math.max(...events.map(e => e.timestamp.getTime())))
          : new Date();

      return {
        totalEvents: events.length,
        eventsByAction,
        lastActivity,
        complianceScore,
        riskEvents: riskEvents.slice(0, 10), // Latest 10 risk events
      };
    } catch (error) {
      console.error('Failed to generate audit summary:', error);
      return {
        totalEvents: 0,
        eventsByAction: {} as Record<PrivacyAction, number>,
        lastActivity: new Date(),
        complianceScore: 0,
        riskEvents: [],
      };
    }
  }

  /**
   * Export audit log for compliance purposes
   */
  static async exportAuditLog(userId: string): Promise<string> {
    try {
      const events = await this.getUserEvents(userId);

      const exportData = {
        user: userId,
        exportDate: new Date().toISOString(),
        totalEvents: events.length,
        complianceFramework: 'PIPEDA',
        events: events.map(event => ({
          ...event,
          timestamp: event.timestamp.toISOString(),
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export audit log:', error);
      throw new Error('Unable to export audit log');
    }
  }

  /**
   * Clean up old audit events (retain for compliance period)
   */
  static async cleanupOldEvents(retentionDays: number = 2555): Promise<number> {
    // 7 years default
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const allEvents = await this.getAllEvents();
      const eventsToKeep = allEvents.filter(
        event => new Date(event.timestamp) > cutoffDate
      );

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(eventsToKeep)
      );

      const deletedCount = allEvents.length - eventsToKeep.length;

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old audit events`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old audit events:', error);
      return 0;
    }
  }

  /**
   * Store event in local storage
   */
  private static async storeEventLocally(
    event: PrivacyAuditEvent
  ): Promise<void> {
    try {
      const existingEvents = await this.getAllEvents();
      const updatedEvents = [...existingEvents, event];

      // Keep only the most recent events to avoid storage bloat
      if (updatedEvents.length > this.MAX_LOCAL_EVENTS) {
        updatedEvents.splice(0, updatedEvents.length - this.MAX_LOCAL_EVENTS);
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(updatedEvents)
      );
    } catch (error) {
      console.error('Failed to store audit event locally:', error);
    }
  }

  /**
   * Send event to backend for centralized logging
   */
  private static async sendToBackend(event: PrivacyAuditEvent): Promise<void> {
    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return; // Skip backend logging if not authenticated
      }

      // Send to backend audit endpoint (implement as needed)
      // For now, just log to Supabase if available
      const { error } = await supabase.from('privacy_audit_log').insert([
        {
          user_id: event.userId,
          action: event.action,
          resource: event.resource,
          metadata: event.metadata,
          timestamp: event.timestamp.toISOString(),
          success: event.success,
          error_message: event.errorMessage,
          compliance_note: event.complianceNote,
        },
      ]);

      if (error) {
        console.warn('Failed to send audit event to backend:', error);
      }
    } catch (error) {
      console.warn('Backend audit logging failed:', error);
      // Continue - local logging is sufficient for basic compliance
    }
  }

  /**
   * Get all events from local storage
   */
  private static async getAllEvents(): Promise<PrivacyAuditEvent[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const events = JSON.parse(data);
      return events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get audit events:', error);
      return [];
    }
  }

  /**
   * Get events for a specific user
   */
  private static async getUserEvents(
    userId: string
  ): Promise<PrivacyAuditEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.userId === userId);
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get compliance note for action
   */
  private static getComplianceNote(action: PrivacyAction): string {
    const notes: Record<PrivacyAction, string> = {
      [PrivacyAction.EXPORT_REQUEST]:
        'PIPEDA Article 8.5 - Right to access personal information',
      [PrivacyAction.EXPORT_GENERATED]:
        'Data portability compliance - user requested export',
      [PrivacyAction.CONSENT_GRANTED]: 'PIPEDA Principle 3 - Consent obtained',
      [PrivacyAction.CONSENT_WITHDRAWN]:
        'PIPEDA Principle 3 - Consent withdrawn by user',
      [PrivacyAction.DATA_DELETION_REQUEST]:
        'PIPEDA Principle 4.5 - Data retention limits',
      [PrivacyAction.PRIVACY_SETTINGS_UPDATED]:
        'User exercised privacy control rights',
      [PrivacyAction.FILE_ENCRYPTED]:
        'PIPEDA Principle 7 - Safeguards implemented',
      // Add more as needed
    } as any;

    return notes[action] || 'Privacy-related action logged for compliance';
  }

  /**
   * Get legal basis for consent type
   */
  private static getLegalBasis(consentType: string): string {
    const legalBasisMap: Record<string, string> = {
      essential_services: 'contract',
      analytics_tracking: 'consent',
      marketing_communications: 'consent',
      crash_reporting: 'legitimate_interest',
      security_monitoring: 'legal_obligation',
    };

    return legalBasisMap[consentType] || 'consent';
  }

  /**
   * Calculate compliance score based on audit events
   */
  private static calculateComplianceScore(events: PrivacyAuditEvent[]): number {
    if (events.length === 0) return 100;

    const successfulEvents = events.filter(e => e.success).length;
    const baseScore = (successfulEvents / events.length) * 100;

    // Adjust for privacy-positive actions
    const consentEvents = events.filter(
      e =>
        e.action === PrivacyAction.CONSENT_GRANTED ||
        e.action === PrivacyAction.PRIVACY_SETTINGS_UPDATED
    ).length;

    const bonus = Math.min(consentEvents * 2, 20); // Up to 20 point bonus

    return Math.min(baseScore + bonus, 100);
  }

  /**
   * Estimate record count from export options
   */
  private static estimateRecordCount(options: any): number {
    let count = 0;

    if (options.includePersonalInfo) count += 10;
    if (options.includeTransactions) count += 500; // Estimate
    if (options.includeCategories) count += 24;
    if (options.includeSettings) count += 50;
    if (options.includeQAHistory) count += 100;

    return count;
  }
}
