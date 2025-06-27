/**
 * useEngagementTracking Hook
 * React hook for integrating engagement tracking throughout the app
 */

import { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { TrackedFeature } from '../types/achievements';
import EngagementTracker from '../services/achievements/EngagementTracker';

interface UseEngagementTrackingOptions {
  screenName?: string;
  autoTrackScreenView?: boolean;
  autoTrackFocus?: boolean;
}

interface EngagementHookReturn {
  trackFeature: (
    feature: TrackedFeature,
    metadata?: Record<string, any>
  ) => Promise<void>;
  trackInteraction: (
    interactionType: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  trackScreenView: (
    screenName: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  getSessionStats: () => {
    sessionDuration: number;
    featuresUsed: number;
    interactions: number;
  };
  getCurrentMonthEngagement: () => {
    appOpens: number;
    sessionTime: number;
    featuresUsed: Record<string, number>;
    currentStreak: number;
  };
}

export function useEngagementTracking(
  options: UseEngagementTrackingOptions = {}
): EngagementHookReturn {
  const {
    screenName,
    autoTrackScreenView = true,
    autoTrackFocus = true,
  } = options;

  const tracker = EngagementTracker.getInstance();
  const screenViewTracked = useRef(false);

  // Track screen view when component mounts
  useEffect(() => {
    if (screenName && autoTrackScreenView && !screenViewTracked.current) {
      tracker.trackScreenView(screenName);
      screenViewTracked.current = true;
    }
  }, [screenName, autoTrackScreenView, tracker]);

  // Track screen focus (for navigation-based screens)
  useFocusEffect(
    useCallback(() => {
      if (screenName && autoTrackFocus) {
        tracker.trackScreenView(screenName, { focusEvent: true });
      }
    }, [screenName, autoTrackFocus, tracker])
  );

  // Memoized tracking functions
  const trackFeature = useCallback(
    async (feature: TrackedFeature, metadata?: Record<string, any>) => {
      await tracker.trackFeature(feature, metadata);
    },
    [tracker]
  );

  const trackInteraction = useCallback(
    async (interactionType: string, metadata?: Record<string, any>) => {
      await tracker.trackInteraction(interactionType, metadata);
    },
    [tracker]
  );

  const trackScreenView = useCallback(
    async (screen: string, metadata?: Record<string, any>) => {
      await tracker.trackScreenView(screen, metadata);
    },
    [tracker]
  );

  const getSessionStats = useCallback(() => {
    return tracker.getSessionStats();
  }, [tracker]);

  const getCurrentMonthEngagement = useCallback(() => {
    return tracker.getCurrentMonthEngagement();
  }, [tracker]);

  return {
    trackFeature,
    trackInteraction,
    trackScreenView,
    getSessionStats,
    getCurrentMonthEngagement,
  };
}

/**
 * Hook specifically for tracking button interactions
 */
export function useButtonTracking() {
  const { trackInteraction } = useEngagementTracking();

  const trackButtonPress = useCallback(
    async (buttonName: string, metadata?: Record<string, any>) => {
      await trackInteraction('button_press', {
        buttonName,
        ...metadata,
      });
    },
    [trackInteraction]
  );

  return { trackButtonPress };
}

/**
 * Hook for tracking form interactions
 */
export function useFormTracking() {
  const { trackInteraction } = useEngagementTracking();

  const trackFormSubmit = useCallback(
    async (formName: string, metadata?: Record<string, any>) => {
      await trackInteraction('form_submit', {
        formName,
        ...metadata,
      });
    },
    [trackInteraction]
  );

  const trackFormField = useCallback(
    async (fieldName: string, metadata?: Record<string, any>) => {
      await trackInteraction('form_field_interaction', {
        fieldName,
        ...metadata,
      });
    },
    [trackInteraction]
  );

  return { trackFormSubmit, trackFormField };
}

/**
 * Hook for tracking educational content interactions
 */
export function useEducationTracking() {
  const { trackFeature, trackInteraction } = useEngagementTracking();

  const trackModuleStart = useCallback(
    async (moduleId: string, moduleName: string) => {
      await trackFeature(TrackedFeature.EDUCATION_MODULE_START, {
        moduleId,
        moduleName,
      });
    },
    [trackFeature]
  );

  const trackModuleComplete = useCallback(
    async (moduleId: string, moduleName: string, timeSpent?: number) => {
      await trackFeature(TrackedFeature.EDUCATION_MODULE_COMPLETE, {
        moduleId,
        moduleName,
        timeSpent,
      });
    },
    [trackFeature]
  );

  const trackQuizAttempt = useCallback(
    async (moduleId: string, score: number, totalQuestions: number) => {
      await trackInteraction('quiz_attempt', {
        moduleId,
        score,
        totalQuestions,
        percentage: (score / totalQuestions) * 100,
      });
    },
    [trackInteraction]
  );

  return {
    trackModuleStart,
    trackModuleComplete,
    trackQuizAttempt,
  };
}

/**
 * Hook for tracking financial feature usage
 */
export function useFinancialTracking() {
  const { trackFeature } = useEngagementTracking();

  const trackBudgetCreate = useCallback(
    async (budgetType: string, amount?: number) => {
      await trackFeature(TrackedFeature.BUDGET_CREATE, {
        budgetType,
        amount,
      });
    },
    [trackFeature]
  );

  const trackBudgetView = useCallback(
    async (budgetId: string) => {
      await trackFeature(TrackedFeature.BUDGET_VIEW, {
        budgetId,
      });
    },
    [trackFeature]
  );

  const trackTransactionCategorize = useCallback(
    async (
      transactionId: string,
      category: string,
      isManual: boolean = true
    ) => {
      await trackFeature(TrackedFeature.TRANSACTION_CATEGORIZE, {
        transactionId,
        category,
        isManual,
      });
    },
    [trackFeature]
  );

  const trackCreditCardAdd = useCallback(
    async (cardType?: string) => {
      await trackFeature(TrackedFeature.CREDIT_CARD_ADD, {
        cardType,
      });
    },
    [trackFeature]
  );

  const trackPaymentOptimize = useCallback(
    async (optimizationType: string, potentialSavings?: number) => {
      await trackFeature(TrackedFeature.PAYMENT_OPTIMIZE, {
        optimizationType,
        potentialSavings,
      });
    },
    [trackFeature]
  );

  const trackStatementUpload = useCallback(
    async (fileType: string, fileSize?: number) => {
      await trackFeature(TrackedFeature.STATEMENT_UPLOAD, {
        fileType,
        fileSize,
      });
    },
    [trackFeature]
  );

  const trackDataExport = useCallback(
    async (exportType: string, dataRange?: string) => {
      await trackFeature(TrackedFeature.EXPORT_DATA, {
        exportType,
        dataRange,
      });
    },
    [trackFeature]
  );

  return {
    trackBudgetCreate,
    trackBudgetView,
    trackTransactionCategorize,
    trackCreditCardAdd,
    trackPaymentOptimize,
    trackStatementUpload,
    trackDataExport,
  };
}

/**
 * Hook for tracking achievement interactions
 */
export function useAchievementTracking() {
  const { trackFeature } = useEngagementTracking();

  const trackAchievementView = useCallback(
    async (achievementId: string) => {
      await trackFeature(TrackedFeature.ACHIEVEMENT_VIEW, {
        achievementId,
      });
    },
    [trackFeature]
  );

  const trackAchievementShare = useCallback(
    async (achievementId: string, platform: string) => {
      await trackFeature(TrackedFeature.ACHIEVEMENT_SHARE, {
        achievementId,
        platform,
      });
    },
    [trackFeature]
  );

  return {
    trackAchievementView,
    trackAchievementShare,
  };
}

/**
 * Hook for tracking Q&A system usage
 */
export function useQATracking() {
  const { trackFeature } = useEngagementTracking();

  const trackQuestionAsk = useCallback(
    async (questionText: string, category?: string) => {
      await trackFeature(TrackedFeature.QA_QUESTION_ASK, {
        questionLength: questionText.length,
        category,
      });
    },
    [trackFeature]
  );

  return {
    trackQuestionAsk,
  };
}

export default useEngagementTracking;
