// Sentry Alert Configuration for ClariFi API Backend
// This configuration defines alert rules for critical errors affecting user experience

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

// Critical error categories for financial application
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

// Notification channels configuration
export const NOTIFICATION_CHANNELS = {
  // Development team alerts
  DEV_TEAM_EMAIL: 'dev-team@clarifi.ca',
  DEV_TEAM_SLACK: '#dev-alerts',
  
  // Security team alerts  
  SECURITY_TEAM_EMAIL: 'security@clarifi.ca',
  SECURITY_TEAM_SLACK: '#security-alerts',
  
  // Operations team alerts
  OPS_TEAM_EMAIL: 'ops@clarifi.ca',
  OPS_TEAM_SLACK: '#ops-alerts',
  OPS_PAGERDUTY: 'clarifi-ops-pd',
  
  // Executive alerts (for critical business impact)
  EXEC_EMAIL: 'executives@clarifi.ca',
  EXEC_SMS: '+1-XXX-XXX-XXXX', // To be configured
  
  // Webhook endpoints
  INCIDENT_WEBHOOK: 'https://api.clarifi.ca/webhooks/incidents',
  MONITORING_WEBHOOK: 'https://monitoring.clarifi.ca/webhooks/sentry',
} as const;

// Critical error alert rules for backend
export const BACKEND_CRITICAL_ALERTS: SentryAlertRule[] = [
  {
    name: 'Critical Security Errors',
    description: 'Immediate alerts for security breaches and authentication failures',
    conditions: [
      {
        type: 'event.level',
        value: 'error',
        match: 'equals'
      },
      {
        type: 'event.tag',
        value: 'error_category:security',
        match: 'contains'
      }
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.SECURITY_TEAM_EMAIL,
        priority: 'critical'
      },
      {
        type: 'slack',
        targetType: 'team', 
        target: NOTIFICATION_CHANNELS.SECURITY_TEAM_SLACK,
        priority: 'critical'
      },
      {
        type: 'pagerduty',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.OPS_PAGERDUTY,
        priority: 'critical'
      }
    ],
    environment: ['production', 'staging'],
    frequency: 0, // Immediate
    enabled: true
  },

  {
    name: 'Financial Operations Critical Errors',
    description: 'Payment processing, transaction, and account data critical failures',
    conditions: [
      {
        type: 'event.level',
        value: 'error',
        match: 'equals'
      },
      {
        type: 'event.tag',
        value: 'financial_operation',
        match: 'contains'
      },
      {
        type: 'event.tag',
        value: 'severity:critical',
        match: 'contains'
      }
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.OPS_TEAM_EMAIL,
        priority: 'critical'
      },
      {
        type: 'slack',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.OPS_TEAM_SLACK,
        priority: 'critical'
      },
      {
        type: 'email',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.EXEC_EMAIL,
        priority: 'critical'
      }
    ],
    environment: ['production'],
    frequency: 5, // Max one alert per 5 minutes
    enabled: true
  },

  {
    name: 'Database Connection Failures',
    description: 'Critical database connectivity issues affecting service availability',
    conditions: [
      {
        type: 'event.exception',
        value: 'database',
        match: 'contains'
      },
      {
        type: 'event.frequency',
        value: 10,
        match: 'greater_than'
      }
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.OPS_TEAM_EMAIL,
        priority: 'critical'
      },
      {
        type: 'pagerduty',
        targetType: 'team',
        target: NOTIFICATION_CHANNELS.OPS_PAGERDUTY,
        priority: 'critical'
      },
      {
        type: 'webhook',
        targetType: 'url',
        target: NOTIFICATION_CHANNELS.INCIDENT_WEBHOOK,
        priority: 'critical'
      }
    ],
    environment: ['production', 'staging'],
    frequency: 10, // Max one alert per 10 minutes
    enabled: true
  }
];

// Alert configuration for different environments
export const ALERT_CONFIG_BY_ENVIRONMENT = {
  production: {
    enabled: true,
    allAlertsEnabled: true,
    notificationChannels: ['email', 'slack', 'pagerduty'],
    minSeverity: AlertSeverity.MEDIUM
  },
  staging: {
    enabled: true,
    allAlertsEnabled: false,
    notificationChannels: ['slack'],
    minSeverity: AlertSeverity.HIGH
  },
  development: {
    enabled: false,
    allAlertsEnabled: false,
    notificationChannels: ['slack'],
    minSeverity: AlertSeverity.CRITICAL
  }
} as const; 