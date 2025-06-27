import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  TooltipData,
  TooltipPosition,
  useTooltips,
} from '../components/help/TooltipSystem';
import {
  tooltipContentService,
  ContextualTooltip,
} from '../services/support/TooltipContentService';

export interface TooltipElementRef {
  id: string;
  ref: React.RefObject<any>;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const useContextualTooltips = (screenName: string) => {
  const router = useRouter();
  const { showTooltip, hideTooltip, activeTooltip } = useTooltips();
  const [elementRefs] = useState<Map<string, TooltipElementRef>>(new Map());
  const [screenTooltips, setScreenTooltips] = useState<ContextualTooltip[]>([]);
  const [currentTooltipIndex, setCurrentTooltipIndex] = useState(0);
  const screenVisitTimeRef = useRef<number>(Date.now());

  // Initialize tooltips for this screen
  useEffect(() => {
    const tooltips = tooltipContentService.getTooltipsForScreen(screenName);
    setScreenTooltips(tooltips);

    // Track screen visit time
    const startTime = Date.now();
    screenVisitTimeRef.current = startTime;

    return () => {
      const timeSpent = (Date.now() - startTime) / (1000 * 60); // Convert to minutes
      tooltipContentService.updateUserState({
        timeSpentInApp:
          tooltipContentService.getTooltipAnalytics().timeSpentInApp +
          timeSpent,
      });
    };
  }, [screenName]);

  // Register an element that can show tooltips
  const registerTooltipElement = useCallback(
    (
      elementId: string,
      ref: React.RefObject<any>,
      options?: {
        onPress?: () => void;
        onLongPress?: () => void;
        autoShow?: boolean;
        delay?: number;
      }
    ) => {
      const elementRef: TooltipElementRef = {
        id: elementId,
        ref,
        onPress: options?.onPress,
        onLongPress: options?.onLongPress,
      };

      elementRefs.set(elementId, elementRef);

      // Auto-show tooltip if conditions are met
      if (options?.autoShow) {
        const delay = options.delay || 1000;
        setTimeout(() => {
          checkAndShowTooltip(elementId);
        }, delay);
      }

      return () => {
        elementRefs.delete(elementId);
      };
    },
    [elementRefs]
  );

  // Check if tooltip should be shown for an element
  const checkAndShowTooltip = useCallback(
    (elementId: string) => {
      const tooltip = tooltipContentService.getTooltipForElement(
        screenName,
        elementId
      );
      if (!tooltip) return false;

      const elementRef = elementRefs.get(elementId);
      if (!elementRef?.ref.current) return false;

      // Measure element position
      elementRef.ref.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          const position: TooltipPosition = {
            x: pageX,
            y: pageY,
            width,
            height,
          };
          showTooltip(tooltip, position);
          tooltipContentService.markTooltipShown(tooltip.id);
        }
      );

      return true;
    },
    [screenName, elementRefs, showTooltip]
  );

  // Show tooltip manually
  const showTooltipForElement = useCallback(
    (elementId: string, tooltipData?: TooltipData) => {
      const elementRef = elementRefs.get(elementId);
      if (!elementRef?.ref.current) return false;

      const tooltip =
        tooltipData ||
        tooltipContentService.getTooltipForElement(screenName, elementId);
      if (!tooltip) return false;

      elementRef.ref.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          const position: TooltipPosition = {
            x: pageX,
            y: pageY,
            width,
            height,
          };
          showTooltip(tooltip, position);

          if (!tooltipData) {
            tooltipContentService.markTooltipShown(tooltip.id);
          }
        }
      );

      return true;
    },
    [elementRefs, screenName, showTooltip]
  );

  // Handle element interaction (press, long press)
  const handleElementInteraction = useCallback(
    (elementId: string, interactionType: 'press' | 'longPress' = 'press') => {
      // Track feature usage
      tooltipContentService.trackFeatureUsage(elementId);

      // Check if tooltip should be shown
      const tooltip = tooltipContentService.getTooltipForElement(
        screenName,
        elementId
      );
      if (tooltip) {
        // Check trigger conditions for this interaction
        const trigger = tooltip.triggers.find(
          t => t.screen === screenName && t.element === elementId
        );

        if (trigger && !trigger.conditions?.featureUsageCount) {
          showTooltipForElement(elementId, tooltip);
          return true; // Tooltip was shown, don't continue with original action
        }
      }

      // Execute original element action
      const elementRef = elementRefs.get(elementId);
      if (interactionType === 'press') {
        elementRef?.onPress?.();
      } else if (interactionType === 'longPress') {
        elementRef?.onLongPress?.();
      }

      return false; // Tooltip was not shown, original action executed
    },
    [screenName, elementRefs, showTooltipForElement]
  );

  // Show next tooltip in learning path
  const showNextTooltip = useCallback(() => {
    if (currentTooltipIndex < screenTooltips.length) {
      const tooltip = screenTooltips[currentTooltipIndex];
      const trigger = tooltip.triggers.find(t => t.screen === screenName);

      if (trigger) {
        const shown = showTooltipForElement(trigger.element, tooltip);
        if (shown) {
          setCurrentTooltipIndex(prev => prev + 1);
        }
      }
    }
  }, [currentTooltipIndex, screenTooltips, screenName, showTooltipForElement]);

  // Start guided tour
  const startGuidedTour = useCallback(() => {
    setCurrentTooltipIndex(0);
    showNextTooltip();
  }, [showNextTooltip]);

  // Handle tooltip dismiss with tour progression
  const handleTooltipDismiss = useCallback(() => {
    hideTooltip();

    // Auto-advance to next tooltip in tour if in guided mode
    if (currentTooltipIndex < screenTooltips.length) {
      setTimeout(() => {
        showNextTooltip();
      }, 500);
    }
  }, [
    hideTooltip,
    currentTooltipIndex,
    screenTooltips.length,
    showNextTooltip,
  ]);

  // Handle "Learn More" action
  const handleLearnMore = useCallback(() => {
    if (activeTooltip?.data.helpArticleId) {
      router.push(
        `/modals/help-article?id=${activeTooltip.data.helpArticleId}`
      );
    }
    hideTooltip();
  }, [activeTooltip, router, hideTooltip]);

  // Get tooltip for error states
  const showErrorTooltip = useCallback(
    (errorType: string, elementId: string) => {
      const errorTooltip = tooltipContentService.getErrorStateTooltip(
        errorType,
        screenName
      );
      if (errorTooltip) {
        showTooltipForElement(elementId, errorTooltip);
      }
    },
    [screenName, showTooltipForElement]
  );

  // Check for onboarding tooltips
  const checkOnboardingTooltips = useCallback(() => {
    const learningPath = tooltipContentService.getLearningPath();
    const screenOnboardingTooltips = learningPath.filter(tooltip =>
      tooltip.triggers.some(trigger => trigger.screen === screenName)
    );

    if (screenOnboardingTooltips.length > 0) {
      // Show first onboarding tooltip after a short delay
      setTimeout(() => {
        const firstTooltip = screenOnboardingTooltips[0];
        const trigger = firstTooltip.triggers.find(
          t => t.screen === screenName
        );
        if (trigger) {
          showTooltipForElement(trigger.element, firstTooltip);
        }
      }, 2000);
    }
  }, [screenName, showTooltipForElement]);

  // Auto-check for onboarding tooltips on screen load
  useEffect(() => {
    const timer = setTimeout(() => {
      checkOnboardingTooltips();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkOnboardingTooltips]);

  // Helper to create tooltip-enabled TouchableOpacity props
  const createTooltipProps = useCallback(
    (elementId: string, originalProps: any = {}) => {
      return {
        ...originalProps,
        onPress: () => {
          const tooltipShown = handleElementInteraction(elementId, 'press');
          if (!tooltipShown) {
            originalProps.onPress?.();
          }
        },
        onLongPress: () => {
          const tooltipShown = handleElementInteraction(elementId, 'longPress');
          if (!tooltipShown) {
            originalProps.onLongPress?.();
          }
        },
      };
    },
    [handleElementInteraction]
  );

  // Get analytics for this screen
  const getScreenAnalytics = useCallback(() => {
    const analytics = tooltipContentService.getTooltipAnalytics();
    return {
      ...analytics,
      screenTooltips: screenTooltips.length,
      screenTooltipsShown: screenTooltips.filter(t =>
        analytics.shownTooltips.toString().includes(t.id)
      ).length,
    };
  }, [screenTooltips]);

  return {
    // Core tooltip functions
    registerTooltipElement,
    showTooltipForElement,
    checkAndShowTooltip,
    handleElementInteraction,

    // Tour and onboarding
    startGuidedTour,
    showNextTooltip,
    checkOnboardingTooltips,

    // Error handling
    showErrorTooltip,

    // Event handlers
    handleTooltipDismiss,
    handleLearnMore,

    // Helper functions
    createTooltipProps,

    // State and analytics
    activeTooltip,
    screenTooltips,
    getScreenAnalytics,

    // Direct access to services
    tooltipService: tooltipContentService,
  };
};
