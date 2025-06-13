// Mobile Sentry Alert Configuration for ClariFi

export const MOBILE_NOTIFICATION_CHANNELS = {
  MOBILE_TEAM_EMAIL: 'mobile-team@clarifi.ca',
  MOBILE_TEAM_SLACK: '#mobile-alerts',
  UX_TEAM_EMAIL: 'ux-team@clarifi.ca', 
  EXEC_EMAIL: 'executives@clarifi.ca',
} as const;

export const CRITICAL_MOBILE_ALERTS = [
  {
    name: 'App Startup Crashes',
    description: 'Critical crashes preventing app startup',
    severity: 'critical',
    enabled: true
  },
  {
    name: 'Financial Operations Errors',
    description: 'Critical payment/transaction errors',
    severity: 'critical', 
    enabled: true
  },
  {
    name: 'Authentication Failures',
    description: 'Critical auth system failures',
    severity: 'critical',
    enabled: true
  },
  {
    name: 'Privacy System Failures',
    description: 'Critical privacy/consent errors',
    severity: 'critical',
    enabled: true
  }
];

export default {
  MOBILE_NOTIFICATION_CHANNELS,
  CRITICAL_MOBILE_ALERTS
}; 