/**
 * Analytics Configuration for ClariFi Mobile App
 * Handles PostHog and Sentry configuration with privacy compliance
 */

export interface AnalyticsConfig {
  posthog: {
    apiKey: string;
    host: string;
    enabled: boolean;
    options: {
      anonymizeIps: boolean;
      respectDnt: boolean;
      captureScreenViews: boolean;
      enableSessionReplay: boolean;
    };
  };
  sentry: {
    dsn: string;
    enabled: boolean;
    options: {
      environment: string;
      enableInExpoDevelopment: boolean;
      debug: boolean;
    };
  };
  privacy: {
    requireConsent: boolean;
    allowOptOut: boolean;
    anonymousTracking: boolean;
  };
}

// Environment-based configuration
const getAnalyticsConfig = (): AnalyticsConfig => {
  const environment = process.env.EXPO_PUBLIC_ENV || 'development';

  return {
    posthog: {
      apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '',
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      enabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true',
      options: {
        anonymizeIps: true, // PIPEDA compliance
        respectDnt: true, // Respect Do Not Track
        captureScreenViews: false, // Privacy-first approach
        enableSessionReplay: false, // Disabled for privacy
      },
    },
    sentry: {
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      enabled: process.env.EXPO_PUBLIC_ERROR_TRACKING_ENABLED === 'true',
      options: {
        environment,
        enableInExpoDevelopment: environment === 'development',
        debug: environment === 'development',
      },
    },
    privacy: {
      requireConsent: true, // PIPEDA requirement
      allowOptOut: true, // User choice
      anonymousTracking: true, // No PII collection
    },
  };
};

export const analyticsConfig = getAnalyticsConfig();

// Event tracking configuration
export const trackingEvents = {
  // Financial Education Events
  education: {
    moduleStarted: 'education_module_started',
    lessonCompleted: 'education_lesson_completed',
    quizAttempted: 'education_quiz_attempted',
    progressMilestone: 'education_progress_milestone',
    languageChanged: 'education_language_changed',
    quizCompleted: 'education_quiz_completed',
    contentShared: 'education_content_shared',
    progressSaved: 'education_progress_saved',
    certificateEarned: 'education_certificate_earned',
  },

  // Transaction Management Events
  transactions: {
    categorized: 'transaction_categorized',
    manuallyCategorized: 'transaction_manually_categorized',
    ocrScanCompleted: 'ocr_scan_completed',
    receiptUploaded: 'receipt_uploaded',
    categoryFeedback: 'categorization_feedback_provided',
  },

  // User Engagement Events
  engagement: {
    appOpened: 'app_opened',
    featureAccessed: 'feature_accessed',
    onboardingCompleted: 'onboarding_completed',
    settingsChanged: 'settings_changed',
    privacySettingsChanged: 'privacy_settings_changed',
    screenViewed: 'screen_viewed',
    featureUsed: 'feature_used',
    buttonClicked: 'button_clicked',
    modalOpened: 'modal_opened',
    searchPerformed: 'search_performed',
    filterApplied: 'filter_applied',
    sortChanged: 'sort_changed',
    shareAction: 'share_action',
  },

  // User lifecycle events
  user: {
    signUp: 'user_sign_up',
    signIn: 'user_sign_in',
    signOut: 'user_sign_out',
    profileUpdated: 'user_profile_updated',
    onboardingStarted: 'user_onboarding_started',
    onboardingCompleted: 'user_onboarding_completed',
  },

  // Financial events (anonymized)
  financial: {
    documentUploaded: 'document_uploaded',
    documentCategorized: 'document_categorized',
    categorySelected: 'category_selected',
    budgetCreated: 'budget_created',
    goalSet: 'goal_set',
    reminderSet: 'reminder_set',
    exportGenerated: 'export_generated',
  },

  // Error and performance events
  technical: {
    errorOccurred: 'error_occurred',
    crashReported: 'crash_reported',
    performanceIssue: 'performance_issue',
    apiCallFailed: 'api_call_failed',
    loadTimeExceeded: 'load_time_exceeded',
    offlineUsage: 'offline_usage',
    syncCompleted: 'sync_completed',
  },

  // App lifecycle events
  app: {
    launched: 'app_launched',
    backgrounded: 'app_backgrounded',
    foregrounded: 'app_foregrounded',
    updated: 'app_updated',
    uninstalled: 'app_uninstalled',
    crashDetected: 'app_crash_detected',
  },

  // Privacy and Consent Events
  privacy: {
    consentGiven: 'analytics_consent_given',
    consentRevoked: 'analytics_consent_revoked',
    optedOut: 'analytics_opted_out',
    privacyPolicyViewed: 'privacy_policy_viewed',
    dataExported: 'privacy_data_exported',
    dataDeleted: 'privacy_data_deleted',
    optOutRequested: 'privacy_opt_out_requested',
  },
} as const;

export type TrackingEvent = typeof trackingEvents;
export type EventName =
  TrackingEvent[keyof TrackingEvent][keyof TrackingEvent[keyof TrackingEvent]];

// Additional analytics property definitions
// User Properties (sanitized, no PII)
export const userProperties = {
  // Standard user context
  user_authenticated: 'boolean',
  onboarding_status: 'pending | complete | unknown',
  registration_date: 'ISO 8601 timestamp',
  user_timezone: 'string (e.g., "America/Toronto")',
  preferred_language: 'en | fr',

  // App usage patterns
  session_type: 'authenticated | anonymous',
  feature_access_level: 'basic | premium',

  // Privacy compliance
  analytics_consent: 'boolean',
  data_retention_preference: 'standard | minimal',
} as const;

// Custom Event Properties (added to all events)
export const globalProperties = {
  platform: 'react-native',
  app_version: '1.0.0', // TODO: Get from app.json
  timestamp: 'ISO 8601 timestamp',
  user_authenticated: 'boolean',
  onboarding_status: 'string',
  session_id: 'authenticated | anonymous',
  privacy_compliant: true,
} as const;

// Education-specific properties
export const educationProperties = {
  module_id: 'string (e.g., "budgeting-newcomers")',
  lesson_id: 'string (e.g., "lesson-1")',
  language: 'en | fr',
  time_spent_seconds: 'number',
  completion_percentage: 'number (0-100)',
  quiz_score: 'number (0-100)',
  quiz_attempts: 'number',
  correct_answers: 'number',
  total_questions: 'number',
  learning_path: 'string',
  difficulty_level: 'beginner | intermediate | advanced',
} as const;

// Engagement properties
export const engagementProperties = {
  screen_name: 'string',
  interaction_type: 'tap | swipe | scroll | input',
  element_type: 'button | link | card | modal',
  content_category: 'education | financial | settings',
  user_journey_stage: 'onboarding | active | returning',
  feature_used: 'string',
  error_occurred: 'boolean',
  performance_metric: 'number (ms)',
} as const;

// Validation function to ensure required config is present
export const validateAnalyticsConfig = (): boolean => {
  const config = analyticsConfig;

  if (config.posthog.enabled && !config.posthog.apiKey) {
    console.warn('PostHog enabled but API key not provided');
    return false;
  }

  if (config.sentry.enabled && !config.sentry.dsn) {
    console.warn('Sentry enabled but DSN not provided');
    return false;
  }

  return true;
};

// Privacy helper to sanitize event properties
export const sanitizeProperties = (
  properties: Record<string, any>
): Record<string, any> => {
  const sanitized = { ...properties };

  // Remove PII fields
  const piiFields = [
    'email',
    'phone',
    'name',
    'firstName',
    'lastName',
    'address',
    'postalCode',
    'sin',
    'bankAccount',
    'creditCard',
    'income',
    'personalInfo',
  ];

  piiFields.forEach(field => {
    delete sanitized[field];
  });

  return sanitized;
};

// Helper to create consistent event properties
export const createEventProperties = (
  baseProperties: Record<string, any> = {},
  additionalProperties: Record<string, any> = {}
): Record<string, any> => {
  return sanitizeProperties({
    ...globalProperties,
    timestamp: new Date().toISOString(),
    ...baseProperties,
    ...additionalProperties,
  });
};

export default analyticsConfig;
