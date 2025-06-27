/**
 * ClariFi Performance Optimization Suite
 *
 * Comprehensive performance optimization system for React Native apps
 * Includes memory management, image optimization, lazy loading, and monitoring
 */

// Core performance services
export { performanceConfig } from './PerformanceConfig';
export {
  performanceMonitor,
  withPerformanceMonitoring,
} from './PerformanceMonitor';
export { memoryManager, useMemoryManagement } from './MemoryManager';
export { imageOptimizer, useOptimizedImage } from './ImageOptimizer';

// Optimized components
export { default as OptimizedTransactionItem } from '../components/performance/OptimizedTransactionItem';
export { default as OptimizedTransactionList } from '../components/performance/OptimizedTransactionList';

// Lazy loading utilities
export {
  withLazyLoading,
  preloadCriticalComponents,
  LazyTransactionDetail,
  LazyMonthlyReport,
  LazyDataExport,
  LazyAiChat,
  LazyEducationModule,
  LazyCreditCardDetail,
  LazyCategoryDetail,
  LazyNotificationSettings,
  LazyPrivacySettings,
  LazyPaymentForm,
  LazySpendingChart,
  LazyCategoryBreakdown,
  LazyInsightsSection,
} from '../components/performance/LazyComponents';

// Performance-optimized App component
export { default as OptimizedApp } from '../App.performance';

// Performance utilities and hooks
export * from './PerformanceConfig';

/**
 * Performance optimization checklist and best practices
 */
export const PERFORMANCE_CHECKLIST = {
  /**
   * React Native Optimization Best Practices
   */
  reactNative: [
    'Use React.memo for expensive components',
    'Implement useMemo and useCallback for expensive computations',
    'Use FlatList with getItemLayout for large lists',
    'Implement removeClippedSubviews for long lists',
    'Use InteractionManager for expensive operations',
    'Minimize bridge calls between JS and native',
    'Use native driver for animations when possible',
    'Implement proper image caching and optimization',
  ],

  /**
   * Memory Management Best Practices
   */
  memory: [
    'Clean up subscriptions and listeners in useEffect cleanup',
    'Use weak references for large objects when possible',
    'Implement proper cache eviction strategies',
    'Monitor memory usage and set appropriate limits',
    'Clean up timers and intervals',
    'Use proper image sizing and compression',
    'Implement lazy loading for large components',
  ],

  /**
   * Bundle Size Optimization
   */
  bundleSize: [
    'Use lazy imports for non-critical components',
    'Implement code splitting at route level',
    'Remove unused dependencies',
    'Use tree shaking for libraries',
    'Optimize image assets',
    'Use vector icons instead of image icons',
    'Enable Hermes engine for better performance',
  ],

  /**
   * Rendering Performance
   */
  rendering: [
    'Minimize inline function creation in render',
    'Use stable keys for list items',
    'Implement shouldComponentUpdate or React.memo',
    'Avoid deep object comparisons in dependencies',
    'Use CSS transforms instead of changing layout properties',
    'Implement virtual scrolling for very large lists',
    'Debounce user input handling',
  ],

  /**
   * Network Performance
   */
  network: [
    'Implement request caching and deduplication',
    'Use compression for API responses',
    'Implement offline-first architecture',
    'Batch API requests when possible',
    'Use progressive loading for large datasets',
    'Implement retry mechanisms with exponential backoff',
    'Preload critical data',
  ],
};

/**
 * Performance monitoring metrics
 */
export const PERFORMANCE_METRICS = {
  // Rendering metrics
  SLOW_RENDER_THRESHOLD: 16, // ms (60fps)
  VERY_SLOW_RENDER_THRESHOLD: 33, // ms (30fps)

  // Memory metrics
  MEMORY_WARNING_THRESHOLD: 0.8, // 80% of available memory
  MEMORY_CRITICAL_THRESHOLD: 0.9, // 90% of available memory

  // Cache metrics
  CACHE_HIT_RATE_TARGET: 0.8, // 80% cache hit rate
  CACHE_SIZE_WARNING: 100 * 1024 * 1024, // 100MB

  // Network metrics
  SLOW_REQUEST_THRESHOLD: 3000, // 3 seconds
  VERY_SLOW_REQUEST_THRESHOLD: 10000, // 10 seconds

  // App lifecycle metrics
  STARTUP_TIME_TARGET: 3000, // 3 seconds
  SCREEN_TRANSITION_TARGET: 300, // 300ms
};

/**
 * Performance optimization configuration presets
 */
export const PERFORMANCE_PRESETS = {
  /**
   * Development preset - Full monitoring and debugging
   */
  development: {
    enablePerformanceMonitoring: true,
    enableMemoryManagement: true,
    enableImageOptimization: true,
    enableLazyLoading: true,
    debugMode: true,
    cacheSettings: {
      maxImageCacheSize: 50 * 1024 * 1024, // 50MB
      maxDataCacheSize: 25 * 1024 * 1024, // 25MB
      defaultTTL: 15 * 60 * 1000, // 15 minutes
    },
    renderSettings: {
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 50,
      windowSize: 5,
      initialNumToRender: 10,
    },
  },

  /**
   * Production preset - Optimized for performance
   */
  production: {
    enablePerformanceMonitoring: false,
    enableMemoryManagement: true,
    enableImageOptimization: true,
    enableLazyLoading: true,
    debugMode: false,
    cacheSettings: {
      maxImageCacheSize: 100 * 1024 * 1024, // 100MB
      maxDataCacheSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 30 * 60 * 1000, // 30 minutes
    },
    renderSettings: {
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      windowSize: 10,
      initialNumToRender: 15,
    },
  },

  /**
   * Low-end device preset - Optimized for limited resources
   */
  lowEnd: {
    enablePerformanceMonitoring: false,
    enableMemoryManagement: true,
    enableImageOptimization: true,
    enableLazyLoading: true,
    debugMode: false,
    cacheSettings: {
      maxImageCacheSize: 25 * 1024 * 1024, // 25MB
      maxDataCacheSize: 10 * 1024 * 1024, // 10MB
      defaultTTL: 10 * 60 * 1000, // 10 minutes
    },
    renderSettings: {
      maxToRenderPerBatch: 3,
      updateCellsBatchingPeriod: 100,
      windowSize: 3,
      initialNumToRender: 5,
    },
  },
};

/**
 * Quick setup function for common configurations
 */
export const setupPerformanceOptimizations = async (
  preset: 'development' | 'production' | 'lowEnd' | 'custom' = 'production',
  customConfig?: any
): Promise<void> => {
  let config;

  switch (preset) {
    case 'development':
      config = PERFORMANCE_PRESETS.development;
      break;
    case 'lowEnd':
      config = PERFORMANCE_PRESETS.lowEnd;
      break;
    case 'custom':
      config = customConfig;
      break;
    default:
      config = PERFORMANCE_PRESETS.production;
  }

  await performanceConfig.initialize(config);
  console.log(`🚀 Performance optimizations set up with ${preset} preset`);
};

/**
 * Performance debugging utilities
 */
export const performanceDebug = {
  /**
   * Log current performance state
   */
  logPerformanceState: () => {
    const memoryStats = memoryManager.getMemoryStats();
    const imageStats = imageOptimizer.getCacheStats();
    const performanceReport = performanceMonitor.getPerformanceReport();

    console.group('📊 Performance Debug Information');
    console.log('Memory Stats:', memoryStats);
    console.log('Image Cache Stats:', imageStats);
    console.log('Render Metrics:', performanceReport.renderMetrics);
    console.log('Active Performance Metrics:', performanceReport.activeMetrics);
    console.groupEnd();
  },

  /**
   * Check for performance issues
   */
  checkPerformanceIssues: () => {
    const issues = performanceMonitor.checkPerformanceIssues();
    if (issues.length > 0) {
      console.warn('⚠️ Performance Issues Detected:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ No performance issues detected');
    }
    return issues;
  },

  /**
   * Force cleanup for testing
   */
  forceCleanup: () => {
    memoryManager.performMemoryCleanup();
    console.log('🧹 Forced memory cleanup completed');
  },

  /**
   * Generate performance report
   */
  generateReport: async () => {
    await performanceMonitor.savePerformanceData();
    console.log('📊 Performance report saved');
  },
};

// Export default configuration for easy setup
export default {
  setupPerformanceOptimizations,
  performanceConfig,
  performanceDebug,
  PERFORMANCE_CHECKLIST,
  PERFORMANCE_METRICS,
  PERFORMANCE_PRESETS,
};
