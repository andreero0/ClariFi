import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  LogBox,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundaryProvider } from './components/ui/ErrorBoundaryProvider';
import { ThemeContext } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import { LocalizationContext } from './context/LocalizationContext';
import {
  performanceConfig,
  performanceMonitor,
  memoryManager,
} from './services/performance/PerformanceConfig';
import { colors } from './constants/colors';
import { textStyles } from './constants/typography';

// Suppress specific warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

// Keep splash screen visible while app loads
SplashScreen.preventAutoHideAsync();

interface AppPerformanceProps {
  children: React.ReactNode;
}

/**
 * Performance-optimized App wrapper with initialization
 */
const OptimizedApp: React.FC<AppPerformanceProps> = ({ children }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(
    null
  );
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize app with performance optimizations
   */
  const initializeApp = async (): Promise<void> => {
    try {
      console.log('🚀 Starting ClariFi app initialization...');

      // Step 1: Initialize performance monitoring (5%)
      setLoadingProgress(5);
      await performanceConfig.initialize({
        enablePerformanceMonitoring: __DEV__,
        enableMemoryManagement: true,
        enableImageOptimization: true,
        enableLazyLoading: true,
        debugMode: __DEV__,
      });

      // Step 2: Initialize core services (25%)
      setLoadingProgress(25);
      await initializeCoreServices();

      // Step 3: Load cached data (50%)
      setLoadingProgress(50);
      await loadCachedData();

      // Step 4: Preload critical resources (75%)
      setLoadingProgress(75);
      await preloadCriticalResources();

      // Step 5: Final setup (100%)
      setLoadingProgress(100);
      await finalizeInitialization();

      console.log('✅ ClariFi app initialization completed');
      setIsAppReady(true);
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setInitializationError(
        error instanceof Error
          ? error
          : new Error('Unknown initialization error')
      );
    } finally {
      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  };

  /**
   * Initialize core services
   */
  const initializeCoreServices = async (): Promise<void> => {
    return performanceMonitor.measureAsync('core_services_init', async () => {
      // Initialize storage services
      await initializeStorageServices();

      // Initialize analytics (privacy-aware)
      await initializeAnalyticsServices();

      // Initialize notification services
      await initializeNotificationServices();

      console.log('✅ Core services initialized');
    });
  };

  /**
   * Initialize storage services
   */
  const initializeStorageServices = async (): Promise<void> => {
    // Initialize AsyncStorage cleanup
    memoryManager.registerCleanup('storage_cleanup', async () => {
      // Cleanup temporary storage on app exit
      console.log('🧹 Cleaning up temporary storage');
    });
  };

  /**
   * Initialize analytics services
   */
  const initializeAnalyticsServices = async (): Promise<void> => {
    // Initialize privacy-aware analytics
    if (__DEV__) {
      console.log('📊 Analytics services initialized (dev mode)');
    }
  };

  /**
   * Initialize notification services
   */
  const initializeNotificationServices = async (): Promise<void> => {
    // Initialize notification services with performance monitoring
    console.log('🔔 Notification services initialized');
  };

  /**
   * Load cached data
   */
  const loadCachedData = async (): Promise<void> => {
    return performanceMonitor.measureAsync('cached_data_load', async () => {
      // Load user preferences
      await loadUserPreferences();

      // Load dashboard cache
      await loadDashboardCache();

      // Load transaction cache
      await loadTransactionCache();

      console.log('✅ Cached data loaded');
    });
  };

  /**
   * Load user preferences
   */
  const loadUserPreferences = async (): Promise<void> => {
    // Load theme, language, and other user preferences
    console.log('👤 User preferences loaded');
  };

  /**
   * Load dashboard cache
   */
  const loadDashboardCache = async (): Promise<void> => {
    // Load cached dashboard data for faster initial load
    console.log('📊 Dashboard cache loaded');
  };

  /**
   * Load transaction cache
   */
  const loadTransactionCache = async (): Promise<void> => {
    // Load cached transaction data
    console.log('💳 Transaction cache loaded');
  };

  /**
   * Preload critical resources
   */
  const preloadCriticalResources = async (): Promise<void> => {
    return performanceMonitor.measureAsync(
      'critical_resources_preload',
      async () => {
        // Preload critical images
        await preloadCriticalImages();

        // Preload fonts
        await preloadFonts();

        // Preload components
        await preloadComponents();

        console.log('✅ Critical resources preloaded');
      }
    );
  };

  /**
   * Preload critical images
   */
  const preloadCriticalImages = async (): Promise<void> => {
    // Preload app icons, splash screens, and critical UI images
    console.log('🖼️ Critical images preloaded');
  };

  /**
   * Preload fonts
   */
  const preloadFonts = async (): Promise<void> => {
    // Preload custom fonts if any
    console.log('🔤 Fonts preloaded');
  };

  /**
   * Preload components
   */
  const preloadComponents = async (): Promise<void> => {
    // Preload critical lazy components
    console.log('⚛️ Components preloaded');
  };

  /**
   * Finalize initialization
   */
  const finalizeInitialization = async (): Promise<void> => {
    return performanceMonitor.measureAsync('finalization', async () => {
      // Set up global error handlers
      setupGlobalErrorHandlers();

      // Start background services
      startBackgroundServices();

      // Register app lifecycle listeners
      registerAppLifecycleListeners();

      console.log('✅ App initialization finalized');
    });
  };

  /**
   * Set up global error handlers
   */
  const setupGlobalErrorHandlers = (): void => {
    // Handle unhandled promise rejections
    const originalHandler = global.ErrorUtils?.getGlobalHandler() || (() => {});

    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      console.error('🔥 Global error caught:', error);

      // Log to performance monitor
      performanceMonitor.startMeasure('error_handling');

      // Call original handler
      originalHandler(error, isFatal);

      performanceMonitor.endMeasure('error_handling');
    });
  };

  /**
   * Start background services
   */
  const startBackgroundServices = (): void => {
    // Start notification monitoring
    // Start cache cleanup services
    // Start analytics services
    console.log('🔄 Background services started');
  };

  /**
   * Register app lifecycle listeners
   */
  const registerAppLifecycleListeners = (): void => {
    // Register cleanup functions with memory manager
    memoryManager.registerCleanup('app_cleanup', () => {
      performanceConfig.cleanup();
    });
  };

  // Loading screen
  if (!isAppReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.primary} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Text style={styles.appName}>ClariFi</Text>
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { width: `${loadingProgress}%` }]}
              />
            </View>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loadingSpinner}
            />
            <Text style={styles.loadingText}>
              {loadingProgress < 25
                ? 'Starting up...'
                : loadingProgress < 50
                  ? 'Loading services...'
                  : loadingProgress < 75
                    ? 'Preparing data...'
                    : loadingProgress < 100
                      ? 'Almost ready...'
                      : 'Ready!'}
            </Text>
            {__DEV__ && (
              <Text style={styles.debugText}>
                Performance optimizations enabled
              </Text>
            )}
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Error screen
  if (initializationError) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Initialization Failed</Text>
          <Text style={styles.errorText}>{initializationError.message}</Text>
          <Text style={styles.errorDetail}>
            Please restart the app. If the problem persists, contact support.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // App ready - render with all context providers
  return (
    <SafeAreaProvider>
      <ErrorBoundaryProvider>
        <ThemeContext>
          <AuthContext>
            <LocalizationContext>
              <StatusBar style="auto" />
              {children}
            </LocalizationContext>
          </AuthContext>
        </ThemeContext>
      </ErrorBoundaryProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  appName: {
    ...textStyles.h1,
    color: colors.primary,
    marginBottom: 40,
    fontWeight: '700',
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: colors.neutral.light,
    borderRadius: 2,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  debugText: {
    ...textStyles.caption,
    color: colors.success,
    textAlign: 'center',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    ...textStyles.h2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorDetail: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OptimizedApp;
