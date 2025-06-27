// Sentry Alert Configuration for ClariFi Mobile Frontend

// Alert interfaces
interface SentryAlertRule {
  name: string;
  conditions: SentryAlertCondition[];
  actions: SentryAlertAction[];
  environment?: string[];
  frequency: number; // minutes
  enabled: boolean;
  description: string;
}

interface SentryAlertCondition {
  type:
    | 'event.type'
    | 'event.level'
    | 'event.tag'
    | 'event.message'
    | 'event.exception'
    | 'event.frequency';
  value: string | number;
  match:
    | 'equals'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
    | 'greater_than'
    | 'less_than';
}

interface SentryAlertAction {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'sms';
  targetType: 'team' | 'user' | 'url';
  target: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Alert severity levels
enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Mobile-specific notification channels
export const MOBILE_NOTIFICATION_CHANNELS = {
  MOBILE_TEAM_EMAIL: 'mobile-team@clarifi.ca',
  MOBILE_TEAM_SLACK: '#mobile-alerts',
  UX_TEAM_EMAIL: 'ux-team@clarifi.ca',
  UX_TEAM_SLACK: '#ux-alerts',
  SUPPORT_EMAIL: 'support@clarifi.ca',
  SUPPORT_SLACK: '#customer-support',
  EXEC_EMAIL: 'executives@clarifi.ca',
  MOBILE_INCIDENT_WEBHOOK: 'https://api.clarifi.ca/webhooks/mobile-incidents',
  USER_IMPACT_WEBHOOK: 'https://api.clarifi.ca/webhooks/user-impact',
} as const;

// Critical error alert rules for mobile frontend
export const MOBILE_CRITICAL_ALERTS: SentryAlertRule[] = [
  {
    name: 'App Startup Crashes',
    description: 'Critical crashes preventing users from starting the app',
    conditions: [
      {
        type: 'event.level',
        value: 'error',
        match: 'equals',
      },
      {
        type: 'event.tag',
        value: 'startup_crash',
        match: 'contains',
      },
      {
        type: 'event.frequency',
        value: 5,
        match: 'greater_than',
      },
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_EMAIL,
        priority: 'critical',
      },
      {
        type: 'slack',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_SLACK,
        priority: 'critical',
      },
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.EXEC_EMAIL,
        priority: 'critical',
      },
    ],
    environment: ['production'],
    frequency: 5,
    enabled: true,
  },

  {
    name: 'Financial Operations Mobile Errors',
    description: 'Critical errors in mobile payment and financial operations',
    conditions: [
      {
        type: 'event.level',
        value: 'error',
        match: 'equals',
      },
      {
        type: 'event.tag',
        value: 'financial_mobile',
        match: 'contains',
      },
      {
        type: 'event.tag',
        value: 'severity:critical',
        match: 'contains',
      },
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_EMAIL,
        priority: 'critical',
      },
      {
        type: 'slack',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_SLACK,
        priority: 'critical',
      },
      {
        type: 'webhook',
        targetType: 'url',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_INCIDENT_WEBHOOK,
        priority: 'critical',
      },
    ],
    environment: ['production'],
    frequency: 0, // Immediate
    enabled: true,
  },

  {
    name: 'Authentication Critical Failures',
    description: 'Critical authentication failures preventing user access',
    conditions: [
      {
        type: 'event.tag',
        value: 'auth_critical',
        match: 'contains',
      },
      {
        type: 'event.frequency',
        value: 10,
        match: 'greater_than',
      },
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_EMAIL,
        priority: 'critical',
      },
      {
        type: 'slack',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.SUPPORT_SLACK,
        priority: 'critical',
      },
    ],
    environment: ['production'],
    frequency: 5,
    enabled: true,
  },

  {
    name: 'Privacy System Failures',
    description: 'Critical failures in privacy consent and data protection',
    conditions: [
      {
        type: 'event.tag',
        value: 'privacy_critical',
        match: 'contains',
      },
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_EMAIL,
        priority: 'critical',
      },
      {
        type: 'email',
        targetType: 'team',
        target: 'privacy@clarifi.ca',
        priority: 'critical',
      },
    ],
    environment: ['production', 'staging'],
    frequency: 0, // Immediate
    enabled: true,
  },
];

// User experience monitoring alerts
export const MOBILE_UX_ALERTS: SentryAlertRule[] = [
  {
    name: 'High Crash Rate',
    description: 'Mobile app experiencing unusually high crash rates',
    conditions: [
      {
        type: 'event.level',
        value: 'error',
        match: 'equals',
      },
      {
        type: 'event.frequency',
        value: 100,
        match: 'greater_than',
      },
    ],
    actions: [
      {
        type: 'slack',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_SLACK,
        priority: 'high',
      },
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.UX_TEAM_EMAIL,
        priority: 'medium',
      },
    ],
    environment: ['production'],
    frequency: 60,
    enabled: true,
  },

  {
    name: 'Navigation System Failures',
    description: 'Critical navigation failures preventing app usage',
    conditions: [
      {
        type: 'event.exception',
        value: 'navigation',
        match: 'contains',
      },
      {
        type: 'event.tag',
        value: 'blocking_error',
        match: 'contains',
      },
    ],
    actions: [
      {
        type: 'email',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.UX_TEAM_EMAIL,
        priority: 'high',
      },
      {
        type: 'slack',
        targetType: 'team',
        target: MOBILE_NOTIFICATION_CHANNELS.MOBILE_TEAM_SLACK,
        priority: 'high',
      },
    ],
    environment: ['production', 'staging'],
    frequency: 15,
    enabled: true,
  },
];

// Alert configuration by environment
export const MOBILE_ALERT_CONFIG = {
  production: {
    enabled: true,
    minSeverity: AlertSeverity.MEDIUM,
    notificationChannels: ['email', 'slack', 'webhook'],
  },
  staging: {
    enabled: true,
    minSeverity: AlertSeverity.HIGH,
    notificationChannels: ['slack'],
  },
  development: {
    enabled: false,
    minSeverity: AlertSeverity.CRITICAL,
    notificationChannels: ['slack'],
  },
} as const;

export default {
  MOBILE_CRITICAL_ALERTS,
  MOBILE_UX_ALERTS,
  MOBILE_NOTIFICATION_CHANNELS,
  MOBILE_ALERT_CONFIG,
};
