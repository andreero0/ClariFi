import React, { createContext, useContext, useEffect, useState } from 'react';
import PostHog from 'posthog-react-native';
import {
  analyticsConfig,
  validateAnalyticsConfig,
  trackingEvents,
} from '../../config/analytics.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import PrivacyManager, { ConsentLevel } from '../privacy/PrivacyManager';

interface PostHogContextType {
  posthog: PostHog | null;
  isAnalyticsEnabled: boolean;
  hasConsent: boolean;
  giveConsent: () => Promise<void>;
  revokeConsent: () => Promise<void>;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, userProperties?: Record<string, any>) => void;
  resetUser: () => void;
}

const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  children: React.ReactNode;
}

const ANALYTICS_CONSENT_KEY = '@clarifi/analytics_consent';
const ANALYTICS_OPTED_OUT_KEY = '@clarifi/analytics_opted_out';

export const PostHogProvider: React.FC<PostHogProviderProps> = ({
  children,
}) => {
  const [posthog, setPosthog] = useState<PostHog | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState<boolean>(false);

  // Safely get auth context - handle case where AuthProvider isn't ready yet
  const user: any = null;
  const session: any = null;
  const onboardingStatus: any = 'unknown';
  //   try {
  //     const authContext = useAuth();
  //     user = authContext.user;
  //     session = authContext.session;
  //     onboardingStatus = authContext.onboardingStatus;
  useEffect(() => {
    initializePostHog();
  }, []);

  // Identify user when session changes
  useEffect(() => {
    if (posthog && isAnalyticsEnabled && hasConsent) {
      if (user && session) {
        identifyUser(user.id, {
          user_authenticated: true,
          onboarding_status: onboardingStatus,
          registration_date: user.created_at,
          user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else {
        resetUser();
      }
    }
  }, [
    user,
    session,
    posthog,
    isAnalyticsEnabled,
    hasConsent,
    onboardingStatus,
  ]);

  const initializePostHog = async () => {
    try {
      // Validate configuration
      if (!validateAnalyticsConfig()) {
        console.warn('PostHog configuration invalid, analytics disabled');
        return;
      }

      // Initialize privacy manager and check consent
      const privacyManager = PrivacyManager.getInstance();
      await privacyManager.initialize();

      const hasUserConsent = await privacyManager.canTrackAnalytics();
      const shouldEnableAnalytics =
        analyticsConfig.posthog.enabled && hasUserConsent;

      setHasConsent(hasUserConsent);
      setIsAnalyticsEnabled(shouldEnableAnalytics);

      if (shouldEnableAnalytics && analyticsConfig.posthog.apiKey) {
        // Initialize PostHog with privacy-compliant settings
        const posthogInstance = new PostHog(analyticsConfig.posthog.apiKey, {
          host: analyticsConfig.posthog.host,
          enableSessionReplay:
            analyticsConfig.posthog.options.enableSessionReplay,
          debug: __DEV__, // Enable debug mode in development
        });

        // Set privacy-compliant options
        if (analyticsConfig.posthog.options.anonymizeIps) {
          posthogInstance.optIn(); // Explicit opt-in for privacy compliance
        }

        setPosthog(posthogInstance);

        // Track initialization
        posthogInstance.capture('analytics_initialized', {
          platform: 'react-native',
          app_version: '1.0.0', // TODO: Get from app.json
          privacy_compliant: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  };

  const giveConsent = async () => {
    try {
      // Use privacy manager for PIPEDA compliance
      const privacyManager = PrivacyManager.getInstance();
      await privacyManager.grantConsent({
        [ConsentLevel.ESSENTIAL]: true,
        [ConsentLevel.ANALYTICS]: true,
        [ConsentLevel.PERSONALIZATION]: false,
        [ConsentLevel.MARKETING]: false,
      });

      setHasConsent(true);

      // Reinitialize PostHog with consent
      await initializePostHog();

      // Track consent event
      if (posthog) {
        posthog.capture(trackingEvents.privacy.consentGiven, {
          timestamp: new Date().toISOString(),
          method: 'user_action',
          privacy_compliant: true,
        });
      }
    } catch (error) {
      console.error('Failed to give analytics consent:', error);
    }
  };

  const revokeConsent = async () => {
    try {
      await AsyncStorage.setItem(ANALYTICS_OPTED_OUT_KEY, 'true');
      await AsyncStorage.removeItem(ANALYTICS_CONSENT_KEY);

      // Track revocation before disabling
      if (posthog) {
        posthog.capture(trackingEvents.privacy.consentRevoked, {
          timestamp: new Date().toISOString(),
          method: 'user_action',
        });

        // Disable PostHog
        posthog.optOut();
      }

      setHasConsent(false);
      setIsAnalyticsEnabled(false);
      setPosthog(null);
    } catch (error) {
      console.error('Failed to revoke analytics consent:', error);
    }
  };

  const identifyUser = (
    userId: string,
    userProperties?: Record<string, any>
  ) => {
    if (posthog && isAnalyticsEnabled && hasConsent) {
      // Sanitize user properties to ensure no PII
      const sanitizedProperties = userProperties ? { ...userProperties } : {};

      // Remove any potential PII fields
      delete sanitizedProperties.email;
      delete sanitizedProperties.phone;
      delete sanitizedProperties.name;
      delete sanitizedProperties.address;
      delete sanitizedProperties.firstName;
      delete sanitizedProperties.lastName;

      posthog.identify(userId, sanitizedProperties);

      // Set super properties for all future events
      posthog.register({
        user_id: userId,
        user_authenticated: true,
        ...sanitizedProperties,
      });
    } else if (__DEV__) {
      console.log('User identified (not tracked):', userId, userProperties);
    }
  };

  const resetUser = () => {
    if (posthog && isAnalyticsEnabled && hasConsent) {
      posthog.reset();

      // Clear user-specific super properties
      posthog.unregister('user_id');
      posthog.unregister('user_authenticated');
      posthog.unregister('onboarding_status');
      posthog.unregister('registration_date');
      posthog.unregister('user_timezone');
    } else if (__DEV__) {
      console.log('User reset (not tracked)');
    }
  };

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog && isAnalyticsEnabled && hasConsent) {
      // Add global context properties
      const contextProperties = {
        platform: 'react-native',
        timestamp: new Date().toISOString(),
        app_version: '1.0.0', // TODO: Get from app.json
        user_authenticated: !!user,
        onboarding_status: onboardingStatus,
        session_id: session?.access_token ? 'authenticated' : 'anonymous',
      };

      // Ensure no PII is tracked
      const sanitizedProperties: Record<string, any> = {
        ...contextProperties,
        ...properties,
      };

      // Remove any potential PII fields
      const piiFields = [
        'email',
        'phone',
        'name',
        'address',
        'firstName',
        'lastName',
      ];
      piiFields.forEach(field => {
        if (sanitizedProperties[field]) {
          delete sanitizedProperties[field];
        }
      });

      posthog.capture(eventName, sanitizedProperties);
    } else if (__DEV__) {
      console.log('Analytics event (not tracked):', eventName, properties);
    }
  };

  const contextValue: PostHogContextType = {
    posthog,
    isAnalyticsEnabled,
    hasConsent,
    giveConsent,
    revokeConsent,
    trackEvent,
    identifyUser,
    resetUser,
  };

  return (
    <PostHogContext.Provider value={contextValue}>
      {children}
    </PostHogContext.Provider>
  );
};

export const usePostHog = (): PostHogContextType => {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
};

// Convenience hook for tracking events
export const useAnalytics = () => {
  const {
    trackEvent,
    identifyUser,
    resetUser,
    isAnalyticsEnabled,
    hasConsent,
  } = usePostHog();

  return {
    track: trackEvent,
    identify: identifyUser,
    reset: resetUser,
    isEnabled: isAnalyticsEnabled,
    hasConsent,
    events: trackingEvents,
  };
};
