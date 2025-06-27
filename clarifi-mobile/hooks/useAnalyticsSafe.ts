import { usePostHog } from '../services/analytics/PostHogProvider';

// Safe analytics hook that handles cases where PostHogProvider is not available
export const useAnalyticsSafe = () => {
  try {
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
      events: {
        education: {
          moduleStarted: 'education_module_started',
          moduleCompleted: 'education_module_completed',
          quizStarted: 'education_quiz_started',
          quizCompleted: 'education_quiz_completed',
        },
      },
    };
  } catch (error) {
    // PostHog provider not available, return mock functions
    return {
      track: (eventName: string, properties?: Record<string, any>) => {
        if (__DEV__) {
          console.log('Analytics event (mock):', eventName, properties);
        }
      },
      identify: (userId: string, userProperties?: Record<string, any>) => {
        if (__DEV__) {
          console.log('User identified (mock):', userId, userProperties);
        }
      },
      reset: () => {
        if (__DEV__) {
          console.log('User reset (mock)');
        }
      },
      isEnabled: false,
      hasConsent: false,
      events: {
        education: {
          moduleStarted: 'education_module_started',
          moduleCompleted: 'education_module_completed',
          quizStarted: 'education_quiz_started',
          quizCompleted: 'education_quiz_completed',
        },
      },
    };
  }
};
