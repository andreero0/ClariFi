// Sentry Configuration for ClariFi Mobile

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  debug: boolean;
  tracesSampleRate: number;
  release?: string;
  dist?: string;
}

// Environment-based configuration
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

export const sentryConfig: SentryConfig = {
  // DSN from environment variables or fallback
  dsn:
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    (isDevelopment
      ? 'https://your-dev-dsn@o4504259096576000.ingest.sentry.io/project-id'
      : 'https://your-prod-dsn@o4504259096576000.ingest.sentry.io/project-id'),

  // Environment configuration
  environment: isDevelopment ? 'development' : 'production',

  // Enable/disable based on environment and privacy consent
  enabled: isProduction, // Disabled in development by default

  // Debug mode for development
  debug: isDevelopment,

  // Performance monitoring sample rates
  tracesSampleRate: isDevelopment ? 1.0 : 0.1, // 100% in dev, 10% in prod

  // Release version (should be set from app.json or build process)
  release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',

  // Distribution identifier for different build variants
  dist: isDevelopment ? 'dev' : 'prod',
};

// Tags for better error organization
export const sentryTags = {
  platform: 'react-native',
  app: 'clarifi-mobile',
  framework: 'expo',
  privacy_compliant: 'true',
  compliance_framework: 'PIPEDA',
} as const;

// User properties that are safe to include (no PII)
export const sentryUserFields = [
  'id', // Will be hashed by privacy manager
  'segment',
  'plan',
  'registration_date',
  'last_login',
  'app_version',
  'device_type',
  'os_version',
  'timezone',
  'language',
  'onboarding_status',
] as const;

// Contexts that are safe to include
export const sentryContexts = {
  app: {
    version: sentryConfig.release,
    environment: sentryConfig.environment,
    privacy_compliant: true,
  },
  device: {
    // Will be populated at runtime
    // No sensitive device identifiers
  },
  privacy: {
    consent_framework: 'PIPEDA',
    data_classification: 'non_sensitive',
    sanitized: true,
  },
} as const;

// Error categories specific to financial apps
export const financialAppErrorTags = {
  // Financial operation errors
  transaction_error: 'transaction_processing',
  account_error: 'account_management',
  payment_error: 'payment_processing',

  // Security-related errors
  auth_error: 'authentication',
  permission_error: 'authorization',
  security_error: 'security_violation',

  // Data privacy errors
  privacy_error: 'privacy_compliance',
  consent_error: 'consent_management',

  // Integration errors
  bank_api_error: 'banking_integration',
  external_service_error: 'external_service',

  // UI/UX errors
  navigation_error: 'navigation',
  rendering_error: 'ui_rendering',
} as const;

// Sensitive operations that should have filtered error reporting
export const sensitiveOperations = [
  'login',
  'signup',
  'password_reset',
  'payment',
  'transaction',
  'account_link',
  'bank_connect',
  'profile_update',
  'settings_change',
] as const;

export const isSensitiveOperation = (operation: string): boolean => {
  return sensitiveOperations.some(sensitive =>
    operation.toLowerCase().includes(sensitive)
  );
};

// Validation function for Sentry configuration
export const validateSentryConfig = (): boolean => {
  if (!sentryConfig.dsn || sentryConfig.dsn.includes('your-')) {
    console.warn('Sentry DSN not configured properly');
    return false;
  }

  if (!sentryConfig.environment) {
    console.warn('Sentry environment not set');
    return false;
  }

  return true;
};

export default sentryConfig;
