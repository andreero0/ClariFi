import { AppState } from 'react-native';
import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';
import { imageOptimizer } from './ImageOptimizer';
import { preloadCriticalComponents } from '../performance/LazyComponents';

interface PerformanceSettings {
  enablePerformanceMonitoring: boolean;
  enableMemoryManagement: boolean;
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  cacheSettings: {
    maxImageCacheSize: number;
    maxDataCacheSize: number;
    defaultTTL: number;
  };
  renderSettings: {
    maxToRenderPerBatch: number;
    updateCellsBatchingPeriod: number;
    windowSize: number;
    initialNumToRender: number;
  };
  debugMode: boolean;
}

class PerformanceConfigService {
  private static instance: PerformanceConfigService;
  private settings: PerformanceSettings;
  private isInitialized = false;
  private performanceMetrics: Map<string, number> = new Map();

  static getInstance(): PerformanceConfigService {
    if (!PerformanceConfigService.instance) {
      PerformanceConfigService.instance = new PerformanceConfigService();
    }
    return PerformanceConfigService.instance;
  }

  constructor() {
    this.settings = this.getDefaultSettings();
  }

  /**
   * Get default performance settings
   */
  private getDefaultSettings(): PerformanceSettings {
    return {
      enablePerformanceMonitoring: __DEV__, // Only in development
      enableMemoryManagement: true,
      enableImageOptimization: true,
      enableLazyLoading: true,
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
      debugMode: __DEV__,
    };
  }

  /**
   * Initialize performance optimizations
   */
  async initialize(
    customSettings?: Partial<PerformanceSettings>
  ): Promise<void> {
    if (this.isInitialized) {
      console.warn('Performance config already initialized');
      return;
    }

    // Merge custom settings with defaults
    if (customSettings) {
      this.settings = { ...this.settings, ...customSettings };
    }

    console.log('🚀 Initializing performance optimizations...');

    try {
      // Initialize performance monitoring
      if (this.settings.enablePerformanceMonitoring) {
        performanceMonitor.startMonitoring();
        this.logMetric('performance_monitoring_enabled', 1);
      }

      // Initialize memory management
      if (this.settings.enableMemoryManagement) {
        // Memory manager is automatically initialized
        this.logMetric('memory_management_enabled', 1);
      }

      // Initialize image optimization
      if (this.settings.enableImageOptimization) {
        // Image optimizer is automatically initialized
        this.logMetric('image_optimization_enabled', 1);
      }

      // Preload critical components
      if (this.settings.enableLazyLoading) {
        setTimeout(() => {
          preloadCriticalComponents();
        }, 1000); // Delay to avoid blocking initial render
        this.logMetric('lazy_loading_enabled', 1);
      }

      // Set up app state listeners for performance optimization
      this.setupAppStateOptimizations();

      // Configure React Native performance settings
      this.configureReactNativePerformance();

      this.isInitialized = true;
      console.log('✅ Performance optimizations initialized successfully');

      if (this.settings.debugMode) {
        this.startPerformanceReporting();
      }
    } catch (error) {
      console.error(
        '❌ Failed to initialize performance optimizations:',
        error
      );
      throw error;
    }
  }

  /**
   * Configure React Native performance settings
   */
  private configureReactNativePerformance(): void {
    // Configure interaction manager
    const InteractionManager = require('react-native').InteractionManager;
    InteractionManager.setDeadline(1000); // 1 second deadline

    // Configure console polyfill for better performance in production
    if (!__DEV__) {
      console.log = () => {};
      console.warn = () => {};
      console.info = () => {};
    }

    this.logMetric('react_native_performance_configured', 1);
  }

  /**
   * Set up app state optimizations
   */
  private setupAppStateOptimizations(): void {
    AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        this.onAppBackground();
      } else if (nextAppState === 'active') {
        this.onAppForeground();
      }
    });

    this.logMetric('app_state_optimizations_setup', 1);
  }

  /**
   * Handle app going to background
   */
  private onAppBackground(): void {
    console.log('📱 App backgrounded - applying performance optimizations');

    // Trigger aggressive memory cleanup
    if (this.settings.enableMemoryManagement) {
      memoryManager.performMemoryCleanup();
    }

    // Clear non-essential image cache
    setTimeout(() => {
      // Clear older cached images
      this.cleanupBackgroundResources();
    }, 5000); // Wait 5 seconds before cleanup

    this.logMetric('app_background_optimizations', 1);
  }

  /**
   * Handle app coming to foreground
   */
  private onAppForeground(): void {
    console.log('📱 App foregrounded - resuming optimizations');

    // Preload critical resources
    if (this.settings.enableLazyLoading) {
      setTimeout(() => {
        preloadCriticalComponents();
      }, 500);
    }

    this.logMetric('app_foreground_optimizations', 1);
  }

  /**
   * Clean up background resources
   */
  private async cleanupBackgroundResources(): Promise<void> {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clean up old performance metrics
      const now = Date.now();
      for (const [key, timestamp] of this.performanceMetrics.entries()) {
        if (now - timestamp > 60 * 60 * 1000) {
          // 1 hour
          this.performanceMetrics.delete(key);
        }
      }

      console.log('🧹 Background resource cleanup completed');
    } catch (error) {
      console.error('Error during background cleanup:', error);
    }
  }

  /**
   * Log performance metric
   */
  private logMetric(name: string, value: number): void {
    this.performanceMetrics.set(name, Date.now());

    if (this.settings.debugMode) {
      console.log(`📊 Performance metric: ${name} = ${value}`);
    }
  }

  /**
   * Start performance reporting
   */
  private startPerformanceReporting(): void {
    const reportInterval = setInterval(() => {
      this.generatePerformanceReport();
    }, 60000); // Report every minute

    // Clean up interval when app is destroyed
    memoryManager.registerInterval('performance_reporting', reportInterval);
  }

  /**
   * Generate performance report
   */
  private generatePerformanceReport(): void {
    const memoryStats = memoryManager.getMemoryStats();
    const imageStats = imageOptimizer.getCacheStats();
    const performanceReport = performanceMonitor.getPerformanceReport();

    const report = {
      timestamp: new Date().toISOString(),
      memory: memoryStats,
      images: imageStats,
      performance: {
        renderMetrics: performanceReport.renderMetrics.length,
        activeMetrics: performanceReport.activeMetrics.length,
      },
      settings: this.settings,
    };

    console.log('📊 Performance Report:', JSON.stringify(report, null, 2));

    // Check for performance issues
    const issues = performanceMonitor.checkPerformanceIssues();
    if (issues.length > 0) {
      console.warn('⚠️ Performance Issues Detected:', issues);
    }
  }

  /**
   * Get current performance settings
   */
  getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  /**
   * Update performance settings
   */
  updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ Performance settings updated:', newSettings);
  }

  /**
   * Get optimized FlatList props
   */
  getOptimizedFlatListProps(): {
    removeClippedSubviews: boolean;
    maxToRenderPerBatch: number;
    updateCellsBatchingPeriod: number;
    windowSize: number;
    initialNumToRender: number;
    getItemLayout?: (
      data: any,
      index: number
    ) => { length: number; offset: number; index: number };
  } {
    return {
      removeClippedSubviews: true,
      maxToRenderPerBatch: this.settings.renderSettings.maxToRenderPerBatch,
      updateCellsBatchingPeriod:
        this.settings.renderSettings.updateCellsBatchingPeriod,
      windowSize: this.settings.renderSettings.windowSize,
      initialNumToRender: this.settings.renderSettings.initialNumToRender,
    };
  }

  /**
   * Get optimized image props
   */
  getOptimizedImageProps(): {
    resizeMode: 'cover' | 'contain' | 'stretch' | 'center';
    fadeDuration: number;
    progressiveRenderingEnabled: boolean;
  } {
    return {
      resizeMode: 'cover',
      fadeDuration: 300,
      progressiveRenderingEnabled: true,
    };
  }

  /**
   * Optimize component for performance
   */
  optimizeComponent<T extends object>(
    Component: React.ComponentType<T>
  ): React.ComponentType<T> {
    // Wrap component with performance monitoring if enabled
    if (this.settings.enablePerformanceMonitoring) {
      const componentName =
        Component.displayName || Component.name || 'Unknown';

      return React.memo<T>(props => {
        const renderStart = React.useRef<number>();

        renderStart.current = performance.now();

        React.useEffect(() => {
          if (renderStart.current) {
            const renderTime = performance.now() - renderStart.current;
            performanceMonitor.trackRender(componentName, renderTime);
          }
        });

        return React.createElement(Component, props);
      });
    }

    return React.memo(Component);
  }

  /**
   * Cleanup all performance resources
   */
  cleanup(): void {
    if (!this.isInitialized) return;

    console.log('🧹 Cleaning up performance optimizations...');

    // Stop performance monitoring
    if (this.settings.enablePerformanceMonitoring) {
      performanceMonitor.stopMonitoring();
    }

    // Cleanup memory manager
    memoryManager.destroy();

    // Clear image cache
    imageOptimizer.clearCache();

    this.performanceMetrics.clear();
    this.isInitialized = false;

    console.log('✅ Performance cleanup completed');
  }

  /**
   * Check if initialization is complete
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const performanceConfig = PerformanceConfigService.getInstance();

// Export performance utilities
export { performanceMonitor, memoryManager, imageOptimizer };

// Export React hooks
export { useMemoryManagement } from './MemoryManager';
export { useOptimizedImage } from './ImageOptimizer';
