import React, { lazy, Suspense, ComponentType } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

// Loading component for lazy-loaded screens
const LoadingFallback: React.FC<{ componentName?: string }> = ({
  componentName,
}) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>
      {componentName ? `Loading ${componentName}...` : 'Loading...'}
    </Text>
  </View>
);

// Error boundary for lazy-loaded components
class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load component</Text>
            <Text style={styles.errorDetail}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading with error boundary and loading state
export function withLazyLoading<P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  componentName?: string
): ComponentType<P> {
  const LazyComponent = lazy(importFunction);

  return React.memo<P>(props => (
    <LazyComponentErrorBoundary>
      <Suspense fallback={<LoadingFallback componentName={componentName} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyComponentErrorBoundary>
  ));
}

// Lazy-loaded modal components
export const LazyTransactionDetail = withLazyLoading(
  () => import('../../app/modals/transaction-detail'),
  'Transaction Detail'
);

export const LazyMonthlyReport = withLazyLoading(
  () => import('../../app/modals/monthly-report'),
  'Monthly Report'
);

export const LazyDataExport = withLazyLoading(
  () => import('../../app/modals/data-export'),
  'Data Export'
);

export const LazyAiChat = withLazyLoading(
  () => import('../../app/modals/ai-chat'),
  'AI Chat'
);

export const LazyEducationModule = withLazyLoading(
  () => import('../../app/modals/education-module'),
  'Education Module'
);

export const LazyCreditCardDetail = withLazyLoading(
  () => import('../../app/modals/credit-card-detail'),
  'Credit Card Detail'
);

export const LazyCategoryDetail = withLazyLoading(
  () => import('../../app/modals/category-detail'),
  'Category Detail'
);

export const LazyNotificationSettings = withLazyLoading(
  () => import('../../app/modals/notification-settings'),
  'Notification Settings'
);

export const LazyPrivacySettings = withLazyLoading(
  () => import('../../components/privacy/PrivacySettingsScreen'),
  'Privacy Settings'
);

export const LazyPaymentForm = withLazyLoading(
  () => import('../../app/modals/payment-form'),
  'Payment Form'
);

// Lazy-loaded dashboard components
export const LazySpendingChart = withLazyLoading(
  () => import('../../components/dashboard/SpendingChart'),
  'Spending Chart'
);

export const LazyCategoryBreakdown = withLazyLoading(
  () => import('../../components/dashboard/CategoryBreakdown'),
  'Category Breakdown'
);

export const LazyInsightsSection = withLazyLoading(
  () => import('../../components/dashboard/InsightsSection'),
  'Insights Section'
);

// Preload critical components
export const preloadCriticalComponents = (): void => {
  // Preload components that are likely to be used soon
  const criticalImports = [
    () => import('../../app/modals/transaction-detail'),
    () => import('../../app/modals/ai-chat'),
    () => import('../../components/dashboard/SpendingChart'),
  ];

  criticalImports.forEach(importFn => {
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    }, 100);
  });
};

// Component registry for dynamic imports
const componentRegistry = new Map<
  string,
  () => Promise<{ default: ComponentType<any> }>
>();

export const registerLazyComponent = (
  name: string,
  importFunction: () => Promise<{ default: ComponentType<any> }>
): void => {
  componentRegistry.set(name, importFunction);
};

export const getLazyComponent = (name: string): ComponentType<any> | null => {
  const importFunction = componentRegistry.get(name);
  if (!importFunction) {
    console.warn(`Lazy component "${name}" not found in registry`);
    return null;
  }

  return withLazyLoading(importFunction, name);
};

// Utility for measuring component load times
export const measureComponentLoadTime = async (
  componentName: string,
  importFunction: () => Promise<{ default: ComponentType<any> }>
): Promise<number> => {
  const startTime = performance.now();

  try {
    await importFunction();
    const loadTime = performance.now() - startTime;
    console.log(
      `📊 Component "${componentName}" loaded in ${loadTime.toFixed(2)}ms`
    );
    return loadTime;
  } catch (error) {
    console.error(`❌ Failed to load component "${componentName}":`, error);
    throw error;
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    padding: 20,
  },
  loadingText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    padding: 20,
  },
  errorText: {
    ...textStyles.h3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetail: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
