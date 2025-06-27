import { TooltipData } from '../../components/help/TooltipSystem';

export interface TooltipTrigger {
  screen: string;
  element: string;
  conditions?: {
    firstVisit?: boolean;
    featureUsageCount?: number;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    timeSpentInApp?: number; // in minutes
    hasCompletedOnboarding?: boolean;
  };
}

export interface ContextualTooltip extends TooltipData {
  triggers: TooltipTrigger[];
  dependencies?: string[]; // Other tooltip IDs that should be shown first
  successMetrics?: {
    featureAdoption?: boolean;
    taskCompletion?: boolean;
    userConfidence?: boolean;
  };
}

class TooltipContentService {
  private tooltips: Map<string, ContextualTooltip> = new Map();
  private userState: {
    level: 'beginner' | 'intermediate' | 'advanced';
    completedOnboarding: boolean;
    timeSpentInApp: number;
    featureUsageCounts: Map<string, number>;
    shownTooltips: Set<string>;
  };

  constructor() {
    this.userState = {
      level: 'beginner',
      completedOnboarding: false,
      timeSpentInApp: 0,
      featureUsageCounts: new Map(),
      shownTooltips: new Set(),
    };
    this.initializeTooltips();
  }

  private initializeTooltips() {
    // Dashboard tooltips
    this.tooltips.set('dashboard-credit-utilization', {
      id: 'dashboard-credit-utilization',
      title: 'Credit Utilization Explained',
      content:
        "This shows how much of your available credit you're using. Keep it under 30% for optimal credit score impact.",
      helpArticleId: 'understanding-credit-utilization',
      category: 'financial',
      priority: 'high',
      showOnce: true,
      triggers: [
        {
          screen: 'dashboard',
          element: 'credit-utilization-card',
          conditions: {
            firstVisit: true,
            userLevel: 'beginner',
          },
        },
      ],
    });

    this.tooltips.set('dashboard-payment-optimizer', {
      id: 'dashboard-payment-optimizer',
      title: 'Optimize Your Payments',
      content:
        'Use our AI-powered payment optimizer to strategically pay down cards for maximum credit score improvement.',
      helpArticleId: 'payment-optimization-strategy',
      category: 'feature',
      priority: 'high',
      triggers: [
        {
          screen: 'dashboard',
          element: 'payment-optimizer-button',
          conditions: {
            featureUsageCount: 0,
            userLevel: 'beginner',
          },
        },
      ],
      dependencies: ['dashboard-credit-utilization'],
    });

    // Insights screen tooltips
    this.tooltips.set('insights-credit-health', {
      id: 'insights-credit-health',
      title: 'Your Credit Health Score',
      content:
        'This comprehensive score considers utilization, payment history, and credit mix to show your overall financial health.',
      helpArticleId: 'credit-health-metrics',
      category: 'financial',
      priority: 'medium',
      triggers: [
        {
          screen: 'insights',
          element: 'credit-health-card',
          conditions: {
            firstVisit: true,
          },
        },
      ],
    });

    this.tooltips.set('insights-optimization-recommendations', {
      id: 'insights-optimization-recommendations',
      title: 'Personalized Recommendations',
      content:
        'These AI-generated recommendations are tailored to your specific financial situation and goals.',
      helpArticleId: 'ai-financial-insights',
      category: 'feature',
      priority: 'medium',
      triggers: [
        {
          screen: 'insights',
          element: 'recommendations-card',
          conditions: {
            featureUsageCount: 0,
          },
        },
      ],
    });

    // Transactions screen tooltips
    this.tooltips.set('transactions-bulk-categorize', {
      id: 'transactions-bulk-categorize',
      title: 'Bulk Categorization',
      content:
        'Select multiple transactions to categorize them all at once. Long-press to start selection mode.',
      helpArticleId: 'managing-transactions',
      category: 'feature',
      priority: 'medium',
      showOnce: true,
      triggers: [
        {
          screen: 'transactions',
          element: 'transaction-item',
          conditions: {
            featureUsageCount: 0,
            timeSpentInApp: 5,
          },
        },
      ],
    });

    this.tooltips.set('transactions-ai-categorization', {
      id: 'transactions-ai-categorization',
      title: 'AI-Powered Categorization',
      content:
        'Our AI automatically categorizes transactions. You can always review and adjust these suggestions.',
      helpArticleId: 'ai-transaction-categorization',
      category: 'feature',
      priority: 'low',
      triggers: [
        {
          screen: 'transactions',
          element: 'ai-category-badge',
          conditions: {
            firstVisit: true,
            userLevel: 'beginner',
          },
        },
      ],
    });

    this.tooltips.set('transactions-filters', {
      id: 'transactions-filters',
      title: 'Advanced Filtering',
      content:
        'Use filters to find specific transactions by category, date range, or verification status.',
      helpArticleId: 'transaction-management',
      category: 'feature',
      priority: 'low',
      triggers: [
        {
          screen: 'transactions',
          element: 'filter-button',
          conditions: {
            featureUsageCount: 0,
            timeSpentInApp: 10,
          },
        },
      ],
    });

    // Cards screen tooltips
    this.tooltips.set('cards-add-first-card', {
      id: 'cards-add-first-card',
      title: 'Add Your Credit Cards',
      content:
        'Start by adding your credit cards to get personalized insights and payment recommendations.',
      helpArticleId: 'adding-credit-cards',
      category: 'navigation',
      priority: 'high',
      triggers: [
        {
          screen: 'cards',
          element: 'add-card-button',
          conditions: {
            firstVisit: true,
          },
        },
      ],
    });

    this.tooltips.set('cards-credit-limit-importance', {
      id: 'cards-credit-limit-importance',
      title: 'Why Credit Limits Matter',
      content:
        'Accurate credit limits help us calculate your utilization ratio, which is crucial for credit score optimization.',
      helpArticleId: 'credit-limits-explained',
      category: 'financial',
      priority: 'medium',
      triggers: [
        {
          screen: 'cards',
          element: 'credit-limit-field',
          conditions: {
            firstVisit: true,
            userLevel: 'beginner',
          },
        },
      ],
    });

    // Categories screen tooltips
    this.tooltips.set('categories-custom-categories', {
      id: 'categories-custom-categories',
      title: 'Create Custom Categories',
      content:
        'Add your own spending categories to track expenses that matter most to your budget.',
      helpArticleId: 'custom-spending-categories',
      category: 'feature',
      priority: 'low',
      triggers: [
        {
          screen: 'categories',
          element: 'add-category-button',
          conditions: {
            featureUsageCount: 0,
            timeSpentInApp: 15,
          },
        },
      ],
    });

    this.tooltips.set('categories-spending-insights', {
      id: 'categories-spending-insights',
      title: 'Spending Pattern Analysis',
      content:
        'See where your money goes each month and identify opportunities to optimize your spending.',
      helpArticleId: 'spending-analysis',
      category: 'financial',
      priority: 'medium',
      triggers: [
        {
          screen: 'categories',
          element: 'spending-chart',
          conditions: {
            firstVisit: true,
          },
        },
      ],
    });

    // Profile screen tooltips
    this.tooltips.set('profile-privacy-controls', {
      id: 'profile-privacy-controls',
      title: 'Your Privacy Matters',
      content:
        "Control what data is collected and how it's used. You can export or delete your data anytime.",
      helpArticleId: 'privacy-and-data-control',
      category: 'security',
      priority: 'high',
      triggers: [
        {
          screen: 'profile',
          element: 'privacy-section',
          conditions: {
            firstVisit: true,
          },
        },
      ],
    });

    this.tooltips.set('profile-data-export', {
      id: 'profile-data-export',
      title: 'Export Your Data',
      content:
        'Download all your financial data in multiple formats. Your data belongs to you.',
      helpArticleId: 'data-export-guide',
      category: 'security',
      priority: 'medium',
      triggers: [
        {
          screen: 'profile',
          element: 'data-export-button',
          conditions: {
            featureUsageCount: 0,
            timeSpentInApp: 30,
          },
        },
      ],
    });

    // Security tooltips
    this.tooltips.set('security-biometric-auth', {
      id: 'security-biometric-auth',
      title: 'Enhanced Security',
      content:
        'Enable biometric authentication for quick and secure access to your financial data.',
      helpArticleId: 'biometric-security',
      category: 'security',
      priority: 'high',
      triggers: [
        {
          screen: 'profile',
          element: 'biometric-toggle',
          conditions: {
            hasCompletedOnboarding: true,
            featureUsageCount: 0,
          },
        },
      ],
    });

    // Feature discovery tooltips
    this.tooltips.set('feature-payment-optimizer-intro', {
      id: 'feature-payment-optimizer-intro',
      title: 'Introducing Payment Optimizer',
      content:
        'Our most powerful feature! Get personalized payment strategies to maximize your credit score improvements.',
      helpArticleId: 'payment-optimizer-overview',
      category: 'feature',
      priority: 'high',
      triggers: [
        {
          screen: 'insights',
          element: 'payment-optimizer-card',
          conditions: {
            timeSpentInApp: 20,
            featureUsageCount: 0,
          },
        },
      ],
    });

    this.tooltips.set('feature-ai-insights-intro', {
      id: 'feature-ai-insights-intro',
      title: 'AI-Powered Financial Insights',
      content:
        'Get personalized recommendations based on your spending patterns and financial goals.',
      helpArticleId: 'ai-insights-overview',
      category: 'feature',
      priority: 'medium',
      triggers: [
        {
          screen: 'insights',
          element: 'ai-insights-section',
          conditions: {
            timeSpentInApp: 15,
            userLevel: 'beginner',
          },
        },
      ],
    });

    // Tips and best practices
    this.tooltips.set('tip-credit-utilization-30', {
      id: 'tip-credit-utilization-30',
      title: '30% Rule for Credit',
      content:
        'Keep your credit utilization below 30% for good credit health, and below 10% for excellent scores.',
      helpArticleId: 'credit-utilization-best-practices',
      category: 'tips',
      priority: 'medium',
      triggers: [
        {
          screen: 'dashboard',
          element: 'utilization-percentage',
          conditions: {
            userLevel: 'beginner',
            timeSpentInApp: 10,
          },
        },
      ],
    });

    this.tooltips.set('tip-payment-timing', {
      id: 'tip-payment-timing',
      title: 'Payment Timing Tip',
      content:
        'Make payments before your statement date to lower the utilization reported to credit bureaus.',
      helpArticleId: 'payment-timing-strategies',
      category: 'tips',
      priority: 'low',
      triggers: [
        {
          screen: 'insights',
          element: 'payment-schedule',
          conditions: {
            timeSpentInApp: 25,
          },
        },
      ],
    });
  }

  // Get tooltip for specific screen and element
  getTooltipForElement(
    screen: string,
    element: string
  ): ContextualTooltip | null {
    for (const tooltip of this.tooltips.values()) {
      const trigger = tooltip.triggers.find(
        t => t.screen === screen && t.element === element
      );

      if (trigger && this.shouldShowTooltip(tooltip, trigger)) {
        return tooltip;
      }
    }
    return null;
  }

  // Check if tooltip should be shown based on conditions
  private shouldShowTooltip(
    tooltip: ContextualTooltip,
    trigger: TooltipTrigger
  ): boolean {
    // Check if already shown (for showOnce tooltips)
    if (tooltip.showOnce && this.userState.shownTooltips.has(tooltip.id)) {
      return false;
    }

    // Check dependencies
    if (tooltip.dependencies) {
      const allDepsSatisfied = tooltip.dependencies.every(depId =>
        this.userState.shownTooltips.has(depId)
      );
      if (!allDepsSatisfied) return false;
    }

    // Check trigger conditions
    if (!trigger.conditions) return true;

    const conditions = trigger.conditions;

    if (conditions.firstVisit && this.userState.shownTooltips.size > 0) {
      return false;
    }

    if (conditions.userLevel && conditions.userLevel !== this.userState.level) {
      return false;
    }

    if (
      conditions.timeSpentInApp &&
      this.userState.timeSpentInApp < conditions.timeSpentInApp
    ) {
      return false;
    }

    if (
      conditions.hasCompletedOnboarding !== undefined &&
      conditions.hasCompletedOnboarding !== this.userState.completedOnboarding
    ) {
      return false;
    }

    if (conditions.featureUsageCount !== undefined) {
      const element = trigger.element;
      const usageCount = this.userState.featureUsageCounts.get(element) || 0;
      if (usageCount > conditions.featureUsageCount) {
        return false;
      }
    }

    return true;
  }

  // Get all applicable tooltips for a screen
  getTooltipsForScreen(screen: string): ContextualTooltip[] {
    const applicable: ContextualTooltip[] = [];

    for (const tooltip of this.tooltips.values()) {
      const hasScreenTrigger = tooltip.triggers.some(t => t.screen === screen);
      if (hasScreenTrigger) {
        applicable.push(tooltip);
      }
    }

    // Sort by priority (high first) and dependencies
    return applicable.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Check if one depends on the other
      if (a.dependencies?.includes(b.id)) return 1;
      if (b.dependencies?.includes(a.id)) return -1;

      return 0;
    });
  }

  // Mark tooltip as shown
  markTooltipShown(tooltipId: string) {
    this.userState.shownTooltips.add(tooltipId);
    this.saveUserState();
  }

  // Track feature usage
  trackFeatureUsage(element: string) {
    const currentCount = this.userState.featureUsageCounts.get(element) || 0;
    this.userState.featureUsageCounts.set(element, currentCount + 1);
    this.saveUserState();
  }

  // Update user state
  updateUserState(updates: Partial<typeof this.userState>) {
    this.userState = { ...this.userState, ...updates };
    this.saveUserState();
  }

  // Get user learning path recommendations
  getLearningPath(): ContextualTooltip[] {
    const path: ContextualTooltip[] = [];

    // Beginner path
    if (this.userState.level === 'beginner') {
      const beginnerTooltips = [
        'dashboard-credit-utilization',
        'cards-add-first-card',
        'dashboard-payment-optimizer',
        'transactions-ai-categorization',
        'profile-privacy-controls',
      ];

      beginnerTooltips.forEach(id => {
        const tooltip = this.tooltips.get(id);
        if (tooltip && !this.userState.shownTooltips.has(id)) {
          path.push(tooltip);
        }
      });
    }

    return path;
  }

  // Get tooltip analytics
  getTooltipAnalytics() {
    return {
      totalTooltips: this.tooltips.size,
      shownTooltips: this.userState.shownTooltips.size,
      completionRate: this.userState.shownTooltips.size / this.tooltips.size,
      userLevel: this.userState.level,
      timeSpentInApp: this.userState.timeSpentInApp,
      featureUsage: Object.fromEntries(this.userState.featureUsageCounts),
    };
  }

  // Reset tooltip state (for testing or user preference)
  resetTooltipState() {
    this.userState.shownTooltips.clear();
    this.userState.featureUsageCounts.clear();
    this.saveUserState();
  }

  // Private method to save user state (implement with AsyncStorage)
  private saveUserState() {
    // TODO: Implement AsyncStorage persistence
    // AsyncStorage.setItem('tooltip_user_state', JSON.stringify(this.userState));
  }

  // Private method to load user state (implement with AsyncStorage)
  private async loadUserState() {
    // TODO: Implement AsyncStorage loading
    // const saved = await AsyncStorage.getItem('tooltip_user_state');
    // if (saved) {
    //   this.userState = JSON.parse(saved);
    // }
  }

  // Get contextual help for error states
  getErrorStateTooltip(errorType: string, context: string): TooltipData | null {
    const errorTooltips: Record<string, TooltipData> = {
      'connection-error': {
        id: 'error-connection',
        title: 'Connection Issues',
        content:
          'Check your internet connection and try again. Your data is safely stored locally.',
        category: 'tips',
        priority: 'high',
      },
      'sync-error': {
        id: 'error-sync',
        title: 'Sync Problem',
        content:
          "Your data couldn't sync. Don't worry - your information is saved locally and will sync when connection improves.",
        category: 'tips',
        priority: 'medium',
      },
      'categorization-error': {
        id: 'error-categorization',
        title: 'Categorization Unavailable',
        content:
          'AI categorization is temporarily unavailable. You can still manually categorize transactions.',
        category: 'feature',
        priority: 'medium',
      },
    };

    return errorTooltips[errorType] || null;
  }
}

export const tooltipContentService = new TooltipContentService();
