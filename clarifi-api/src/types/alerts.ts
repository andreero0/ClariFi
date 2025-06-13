// Shared alert types for Sentry configuration

export interface SentryAlertRule {
  name: string;
  conditions: SentryAlertCondition[];
  actions: SentryAlertAction[];
  environment?: string[];
  frequency: number; // minutes
  enabled: boolean;
  description: string;
}

export interface SentryAlertCondition {
  type: 'event.type' | 'event.level' | 'event.tag' | 'event.message' | 'event.exception' | 'event.frequency';
  value: string | number;
  match: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
}

export interface SentryAlertAction {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'sms';
  targetType: 'team' | 'user' | 'url';
  target: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Critical error categories (shared between frontend and backend)
export enum CriticalErrorCategory {
  // Security-related critical errors
  SECURITY_BREACH = 'security_breach',
  AUTH_SYSTEM_FAILURE = 'auth_system_failure',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  
  // Financial operations critical errors  
  PAYMENT_PROCESSING_FAILURE = 'payment_processing_failure',
  TRANSACTION_CORRUPTION = 'transaction_corruption',
  ACCOUNT_DATA_INCONSISTENCY = 'account_data_inconsistency',
  
  // Infrastructure critical errors
  DATABASE_CONNECTION_FAILURE = 'database_connection_failure',
  EXTERNAL_API_TOTAL_FAILURE = 'external_api_total_failure',
  MEMORY_EXHAUSTION = 'memory_exhaustion',
  
  // User experience critical errors
  TOTAL_SERVICE_UNAVAILABLE = 'total_service_unavailable',
  MASS_USER_LOCKOUT = 'mass_user_lockout',
  DATA_LOSS_DETECTED = 'data_loss_detected',
}

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',           // Informational, no immediate action required
  MEDIUM = 'medium',     // Issue requiring attention during business hours  
  HIGH = 'high',         // Issue requiring prompt attention
  CRITICAL = 'critical', // Issue requiring immediate attention 24/7
}

export default {
  CriticalErrorCategory,
  AlertSeverity
}; 