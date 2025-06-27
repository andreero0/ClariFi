import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import PrivacyManager, { ConsentLevel } from '../privacy/PrivacyManager';
import { useAuth } from '../../context/AuthContext';
import sentryConfig, {
  sentryTags,
  validateSentryConfig,
} from '../../config/sentry.config';

interface SentryContextType {
  isInitialized: boolean;
  isErrorTrackingEnabled: boolean;
  canReportErrors: boolean;
  reportError: (error: Error, context?: Record<string, any>) => void;
  reportMessage: (
    message: string,
    level?: Sentry.SeverityLevel,
    context?: Record<string, any>
  ) => void;
  setUserContext: (
    userId: string,
    userProperties?: Record<string, any>
  ) => void;
  clearUserContext: () => void;
  addBreadcrumb: (breadcrumb: Sentry.Breadcrumb) => void;
}

const SentryContext = createContext<SentryContextType | null>(null);

interface SentryProviderProps {
  children: React.ReactNode;
}

// Import Sentry configuration
const SENTRY_CONFIG = sentryConfig;

export const SentryProvider: React.FC<SentryProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isErrorTrackingEnabled, setIsErrorTrackingEnabled] = useState(false);
  const [canReportErrors, setCanReportErrors] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const privacyManager = PrivacyManager.getInstance();

  useEffect(() => {
    initializeSentry();
  }, []);

  useEffect(() => {
    // Update error tracking consent when initialized
    if (isInitialized) {
      updateErrorTrackingConsent();
    }
  }, [isInitialized]);

  const initializeSentry = async () => {
    try {
      // Initialize privacy manager first
      await privacyManager.initialize();

      // Check if error tracking is allowed (essential data collection)
      const hasErrorTrackingConsent = await privacyManager.canTrackErrors();
      setCanReportErrors(hasErrorTrackingConsent);

      if (SENTRY_CONFIG.enabled && hasErrorTrackingConsent) {
        // Initialize Sentry with privacy-compliant configuration
        Sentry.init({
          dsn: SENTRY_CONFIG.dsn,
          environment: SENTRY_CONFIG.environment,
          debug: SENTRY_CONFIG.debug,
          tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,

          // Privacy-compliant settings
          beforeSend: (event, hint) => {
            return sanitizeEventForPrivacy(event);
          },

          beforeBreadcrumb: breadcrumb => {
            return sanitizeBreadcrumbForPrivacy(breadcrumb);
          },

          // Error filtering - don't send certain types of errors
          beforeSendTransaction: transaction => {
            // Filter out transactions that might contain sensitive data
            const transactionName = (transaction as any)?.transaction || '';
            if (
              transactionName.includes('payment') ||
              transactionName.includes('auth') ||
              transactionName.includes('profile')
            ) {
              return null; // Don't send sensitive transactions
            }
            return transaction;
          },

          // Set default tags for privacy compliance
          initialScope: {
            tags: {
              ...sentryTags,
              privacy_compliant: 'true',
              compliance_framework: 'PIPEDA',
              data_classification: 'non_sensitive',
            },
            contexts: {
              privacy: {
                consent_given: hasErrorTrackingConsent,
                consent_date: (await privacyManager.getPrivacySettings())
                  ?.consentDate,
                sanitized: true,
              },
            },
          },
        });

        setIsErrorTrackingEnabled(true);

        // Track initialization
        Sentry.addBreadcrumb({
          message: 'Sentry initialized with privacy compliance',
          category: 'init',
          level: 'info',
          data: {
            environment: SENTRY_CONFIG.environment,
            privacy_compliant: true,
          },
        });
      } else {
        // Sentry disabled due to configuration or privacy settings
        console.log('Sentry disabled:', {
          enabled: SENTRY_CONFIG.enabled,
          hasConsent: hasErrorTrackingConsent,
        });
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
      setIsInitialized(true); // Still set to true to avoid infinite retries
    }
  };

  const updateErrorTrackingConsent = async () => {
    if (!isInitialized) return;

    try {
      const hasConsent = await privacyManager.canTrackErrors();
      setCanReportErrors(hasConsent);

      if (hasConsent && !isErrorTrackingEnabled) {
        // Re-initialize if consent was granted
        await initializeSentry();
      } else if (!hasConsent && isErrorTrackingEnabled) {
        // Disable error tracking if consent was revoked
        Sentry.close();
        setIsErrorTrackingEnabled(false);
      }
    } catch (error) {
      console.error('Error updating consent status:', error);
    }
  };

  const reportError = (error: Error, context?: Record<string, any>) => {
    if (!canReportErrors || !isErrorTrackingEnabled) {
      // Log locally in development
      if (__DEV__) {
        console.error('Error (not reported to Sentry):', error, context);
      }
      return;
    }

    try {
      // Sanitize context before reporting
      const sanitizedContext = context
        ? privacyManager.sanitizeAnalyticsData(context)
        : {};

      // Set additional context
      Sentry.withScope(scope => {
        scope.setContext('error_context', {
          ...sanitizedContext,
          reported_at: new Date().toISOString(),
          privacy_sanitized: true,
        });

        // Set appropriate tags
        scope.setTag('error_source', 'react_native');
        scope.setTag('user_authenticated', !!user);
        scope.setTag('privacy_compliant', 'true');

        // Report the error
        Sentry.captureException(error);
      });
    } catch (reportingError) {
      console.error('Failed to report error to Sentry:', reportingError);
    }
  };

  const reportMessage = (
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, any>
  ) => {
    if (!canReportErrors || !isErrorTrackingEnabled) {
      if (__DEV__) {
        console.log(
          `Message (not reported to Sentry) [${level}]:`,
          message,
          context
        );
      }
      return;
    }

    try {
      const sanitizedContext = context
        ? privacyManager.sanitizeAnalyticsData(context)
        : {};

      Sentry.withScope(scope => {
        scope.setLevel(level);
        scope.setContext('message_context', {
          ...sanitizedContext,
          reported_at: new Date().toISOString(),
          privacy_sanitized: true,
        });

        scope.setTag('message_source', 'react_native');
        scope.setTag('privacy_compliant', 'true');

        Sentry.captureMessage(message);
      });
    } catch (reportingError) {
      console.error('Failed to report message to Sentry:', reportingError);
    }
  };

  const setUserContext = (
    userId: string,
    userProperties?: Record<string, any>
  ) => {
    if (!canReportErrors || !isErrorTrackingEnabled) return;

    try {
      // Hash the user ID for privacy
      const hashedUserId = privacyManager.sanitizeAnalyticsData({
        userId,
      }).userId;

      // Sanitize user properties
      const sanitizedProperties = userProperties
        ? privacyManager.sanitizeAnalyticsData(userProperties)
        : {};

      Sentry.setUser({
        id: hashedUserId,
        // Only include non-PII properties
        ...sanitizedProperties,
        privacy_compliant: true,
      });
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  };

  const clearUserContext = () => {
    if (!canReportErrors || !isErrorTrackingEnabled) return;

    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Failed to clear user context:', error);
    }
  };

  const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
    if (!canReportErrors || !isErrorTrackingEnabled) return;

    try {
      // Sanitize breadcrumb data
      const sanitizedBreadcrumb = sanitizeBreadcrumbForPrivacy(breadcrumb);
      if (sanitizedBreadcrumb) {
        Sentry.addBreadcrumb(sanitizedBreadcrumb);
      }
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  };

  const contextValue: SentryContextType = {
    isInitialized,
    isErrorTrackingEnabled,
    canReportErrors,
    reportError,
    reportMessage,
    setUserContext,
    clearUserContext,
    addBreadcrumb,
  };

  return (
    <SentryContext.Provider value={contextValue}>
      {children}
    </SentryContext.Provider>
  );
};

// Privacy-compliant event sanitization
function sanitizeEventForPrivacy(event: Sentry.Event): Sentry.Event | null {
  if (!event) return null;

  try {
    const privacyManager = PrivacyManager.getInstance();

    // Sanitize exception data
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(exception => ({
        ...exception,
        value: exception.value
          ? privacyManager.sanitizeAnalyticsData({ message: exception.value })
              .message
          : exception.value,
        stacktrace: exception.stacktrace
          ? {
              ...exception.stacktrace,
              frames: exception.stacktrace.frames?.map(frame => ({
                ...frame,
                // Remove potentially sensitive local variables
                vars: undefined,
              })),
            }
          : exception.stacktrace,
      }));
    }

    // Sanitize request data
    if (event.request) {
      event.request = privacyManager.sanitizeAnalyticsData(event.request);
    }

    // Sanitize user data
    if (event.user) {
      event.user = privacyManager.sanitizeAnalyticsData(event.user);
    }

    // Sanitize extra data
    if (event.extra) {
      event.extra = privacyManager.sanitizeAnalyticsData(event.extra);
    }

    // Add privacy compliance metadata
    event.tags = {
      ...event.tags,
      privacy_sanitized: 'true',
      compliance_framework: 'PIPEDA',
    };

    return event;
  } catch (error) {
    console.error('Error sanitizing Sentry event:', error);
    return null; // Don't send if sanitization fails
  }
}

// Privacy-compliant breadcrumb sanitization
function sanitizeBreadcrumbForPrivacy(
  breadcrumb: Sentry.Breadcrumb
): Sentry.Breadcrumb | null {
  if (!breadcrumb) return null;

  try {
    const privacyManager = PrivacyManager.getInstance();

    // Sanitize breadcrumb data
    const sanitizedData = breadcrumb.data
      ? privacyManager.sanitizeAnalyticsData(breadcrumb.data)
      : breadcrumb.data;

    // Sanitize message
    const sanitizedMessage = breadcrumb.message
      ? privacyManager.sanitizeAnalyticsData({ message: breadcrumb.message })
          .message
      : breadcrumb.message;

    return {
      ...breadcrumb,
      message: sanitizedMessage,
      data: sanitizedData,
    };
  } catch (error) {
    console.error('Error sanitizing breadcrumb:', error);
    return null;
  }
}

export const useSentry = (): SentryContextType => {
  const context = useContext(SentryContext);
  if (!context) {
    throw new Error('useSentry must be used within a SentryProvider');
  }
  return context;
};

// Convenience hook for error reporting
export const useErrorReporting = () => {
  const { reportError, reportMessage, addBreadcrumb, canReportErrors } =
    useSentry();

  return {
    reportError,
    reportMessage,
    addBreadcrumb,
    canReport: canReportErrors,
  };
};
