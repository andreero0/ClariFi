import { InteractionManager, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface MemoryUsage {
  timestamp: number;
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  totalJSHeapSize: number;
}

interface RenderMetric {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
}

class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private renderMetrics: Map<string, RenderMetric> = new Map();
  private memorySnapshots: MemoryUsage[] = [];
  private isMonitoring = false;
  private memoryMonitorInterval?: NodeJS.Timeout;

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🚀 Performance monitoring started');

    // Monitor memory usage every 30 seconds
    this.memoryMonitorInterval = setInterval(() => {
      this.captureMemorySnapshot();
    }, 30000);

    // Monitor JavaScript interactions
    InteractionManager.setDeadline(1000); // 1 second deadline for interactions
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = undefined;
    }

    console.log('🛑 Performance monitoring stopped');
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log slow operations (> 16ms for 60fps)
    if (metric.duration > 16) {
      console.warn(
        `⚠️ Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`
      );
    }

    // Clean up completed metric
    this.metrics.delete(name);

    return metric.duration;
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startMeasure(name, metadata);
    try {
      const result = operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Track component render performance
   */
  trackRender(componentName: string, renderTime: number): void {
    const existing = this.renderMetrics.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime =
        existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        totalRenderTime: renderTime,
      });
    }

    // Warn about slow renders
    if (renderTime > 16) {
      console.warn(
        `⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Capture memory usage snapshot
   */
  private captureMemorySnapshot(): void {
    // In a real React Native app, you'd use a native module to get accurate memory stats
    // For now, we'll simulate with basic heap information if available
    const memoryUsage: MemoryUsage = {
      timestamp: Date.now(),
      jsHeapSizeUsed: (performance as any).memory?.usedJSHeapSize || 0,
      jsHeapSizeTotal: (performance as any).memory?.totalJSHeapSize || 0,
      totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
    };

    this.memorySnapshots.push(memoryUsage);

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }

    // Warn about potential memory leaks
    if (this.memorySnapshots.length >= 10) {
      const recent = this.memorySnapshots.slice(-10);
      const trend = this.calculateMemoryTrend(recent);

      if (trend > 1.5) {
        // 50% increase in memory usage
        console.warn(
          '⚠️ Potential memory leak detected - memory usage increasing'
        );
      }
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateMemoryTrend(snapshots: MemoryUsage[]): number {
    if (snapshots.length < 2) return 1;

    const first = snapshots[0].jsHeapSizeUsed;
    const last = snapshots[snapshots.length - 1].jsHeapSizeUsed;

    return first > 0 ? last / first : 1;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    renderMetrics: RenderMetric[];
    memoryUsage: MemoryUsage[];
    activeMetrics: PerformanceMetric[];
  } {
    return {
      renderMetrics: Array.from(this.renderMetrics.values()),
      memoryUsage: this.memorySnapshots,
      activeMetrics: Array.from(this.metrics.values()),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.renderMetrics.clear();
    this.memorySnapshots = [];
  }

  /**
   * Check for performance issues
   */
  checkPerformanceIssues(): string[] {
    const issues: string[] = [];

    // Check for slow renders
    const slowRenders = Array.from(this.renderMetrics.values()).filter(
      metric => metric.averageRenderTime > 16
    );

    if (slowRenders.length > 0) {
      issues.push(`${slowRenders.length} components have slow render times`);
    }

    // Check for memory trend
    if (this.memorySnapshots.length >= 5) {
      const trend = this.calculateMemoryTrend(this.memorySnapshots.slice(-5));
      if (trend > 1.3) {
        issues.push('Memory usage is trending upward');
      }
    }

    // Check for long-running operations
    const longOperations = Array.from(this.metrics.values()).filter(
      metric => metric.startTime && performance.now() - metric.startTime > 1000
    );

    if (longOperations.length > 0) {
      issues.push(
        `${longOperations.length} operations running longer than 1 second`
      );
    }

    return issues;
  }

  /**
   * Save performance data for analysis
   */
  async savePerformanceData(): Promise<void> {
    try {
      const report = this.getPerformanceReport();
      await AsyncStorage.setItem(
        'performance_report',
        JSON.stringify({
          timestamp: Date.now(),
          ...report,
        })
      );
    } catch (error) {
      console.error('Failed to save performance data:', error);
    }
  }

  /**
   * Load previous performance data
   */
  async loadPerformanceData(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem('performance_report');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load performance data:', error);
      return null;
    }
  }
}

// Performance monitoring HOC for React components
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName =
    componentName || WrappedComponent.displayName || WrappedComponent.name;

  return React.memo<P>(props => {
    const renderStart = React.useRef<number>();

    // Track render start
    renderStart.current = performance.now();

    // Track render end
    React.useEffect(() => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        performanceMonitor.trackRender(displayName, renderTime);
      }
    });

    return React.createElement(WrappedComponent, props);
  });
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitorService.getInstance();
