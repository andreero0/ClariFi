import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

interface SubscriptionManager {
  unsubscribe: () => void;
  id: string;
  type: string;
}

class MemoryManagerService {
  private static instance: MemoryManagerService;
  private cache = new Map<string, CacheEntry<any>>();
  private subscriptions = new Map<string, SubscriptionManager>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
  private currentCacheSize = 0;
  private appStateSubscription?: SubscriptionManager;
  private cleanupInterval?: NodeJS.Timeout;

  static getInstance(): MemoryManagerService {
    if (!MemoryManagerService.instance) {
      MemoryManagerService.instance = new MemoryManagerService();
    }
    return MemoryManagerService.instance;
  }

  constructor() {
    this.initializeMemoryManagement();
  }

  /**
   * Initialize memory management
   */
  private initializeMemoryManagement(): void {
    // Listen for app state changes to trigger cleanup
    this.appStateSubscription = {
      unsubscribe: AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      ).remove,
      id: 'app_state_listener',
      type: 'app_state',
    };

    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.performPeriodicCleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      console.log('📱 App backgrounded - performing memory cleanup');
      this.performMemoryCleanup();
    } else if (nextAppState === 'active') {
      console.log('📱 App foregrounded - resuming normal operation');
    }
  }

  /**
   * Cache data with automatic size management
   */
  cacheData<T>(key: string, data: T, ttl = 30 * 60 * 1000): void {
    // 30 min default TTL
    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    // Check if adding this item would exceed cache limit
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictLeastRecentlyUsed(size);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.currentCacheSize += size;

    // Set TTL cleanup
    const timeoutId = setTimeout(() => {
      this.removeFromCache(key);
    }, ttl);

    this.timeouts.set(key, timeoutId);
  }

  /**
   * Retrieve cached data
   */
  getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Remove item from cache
   */
  removeFromCache(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
    }

    // Clear associated timeout
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }
  }

  /**
   * Evict least recently used items to make space
   */
  private evictLeastRecentlyUsed(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    const keysToEvict: string[] = [];

    for (const entry of entries) {
      keysToEvict.push(entry.key);
      freedSpace += entry.size;

      if (freedSpace >= requiredSpace) {
        break;
      }
    }

    keysToEvict.forEach(key => this.removeFromCache(key));
    console.log(
      `🧹 Evicted ${keysToEvict.length} cache entries to free ${freedSpace} bytes`
    );
  }

  /**
   * Register a subscription for cleanup
   */
  registerSubscription(
    id: string,
    unsubscribe: () => void,
    type = 'general'
  ): void {
    this.subscriptions.set(id, { unsubscribe, id, type });
  }

  /**
   * Unregister a subscription
   */
  unregisterSubscription(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  /**
   * Register an interval for cleanup
   */
  registerInterval(id: string, interval: NodeJS.Timeout): void {
    // Clear existing interval if it exists
    const existing = this.intervals.get(id);
    if (existing) {
      clearInterval(existing);
    }

    this.intervals.set(id, interval);
  }

  /**
   * Clear a registered interval
   */
  clearInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  /**
   * Register a timeout for cleanup
   */
  registerTimeout(id: string, timeout: NodeJS.Timeout): void {
    // Clear existing timeout if it exists
    const existing = this.timeouts.get(id);
    if (existing) {
      clearTimeout(existing);
    }

    this.timeouts.set(id, timeout);
  }

  /**
   * Clear a registered timeout
   */
  clearTimeout(id: string): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }

  /**
   * Perform periodic cleanup
   */
  private performPeriodicCleanup(): void {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    // Clean up stale cache entries
    const staleKeys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > staleThreshold) {
        staleKeys.push(key);
      }
    }

    staleKeys.forEach(key => this.removeFromCache(key));

    if (staleKeys.length > 0) {
      console.log(`🧹 Cleaned up ${staleKeys.length} stale cache entries`);
    }
  }

  /**
   * Perform aggressive memory cleanup (e.g., when app goes to background)
   */
  performMemoryCleanup(): void {
    // Clear non-essential cache entries
    const now = Date.now();
    const aggressiveThreshold = 10 * 60 * 1000; // 10 minutes

    const keysToRemove: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (
        now - entry.lastAccessed > aggressiveThreshold ||
        entry.accessCount < 2
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.removeFromCache(key));

    // Clear temporary AsyncStorage items
    this.clearTemporaryStorage();

    console.log(
      `🧹 Aggressive cleanup: removed ${keysToRemove.length} cache entries`
    );
  }

  /**
   * Clear temporary storage items
   */
  private async clearTemporaryStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tempKeys = keys.filter(
        key =>
          key.startsWith('temp_') ||
          key.startsWith('cache_') ||
          key.includes('_temporary')
      );

      if (tempKeys.length > 0) {
        await AsyncStorage.multiRemove(tempKeys);
        console.log(`🧹 Cleared ${tempKeys.length} temporary storage items`);
      }
    } catch (error) {
      console.error('Error clearing temporary storage:', error);
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    cacheSize: number;
    cacheEntries: number;
    subscriptions: number;
    intervals: number;
    timeouts: number;
  } {
    return {
      cacheSize: this.currentCacheSize,
      cacheEntries: this.cache.size,
      subscriptions: this.subscriptions.size,
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    } else {
      console.log('ℹ️ Garbage collection not available');
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Clear all caches
    this.cache.clear();
    this.currentCacheSize = 0;

    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Unsubscribe from app state
    if (this.appStateSubscription) {
      this.appStateSubscription.unsubscribe();
    }

    console.log('🧹 Memory manager destroyed and all resources cleaned up');
  }
}

// React hook for automatic memory management
export function useMemoryManagement(
  componentName: string,
  dependencies: any[] = []
): {
  cacheData: <T>(key: string, data: T, ttl?: number) => void;
  getCachedData: <T>(key: string) => T | null;
  registerCleanup: (cleanup: () => void) => void;
} {
  const memoryManager = MemoryManagerService.getInstance();
  const cleanupFunctions = React.useRef<(() => void)[]>([]);

  const cacheData = React.useCallback(
    <T>(key: string, data: T, ttl?: number) => {
      memoryManager.cacheData(`${componentName}_${key}`, data, ttl);
    },
    [componentName]
  );

  const getCachedData = React.useCallback(
    <T>(key: string): T | null => {
      return memoryManager.getCachedData<T>(`${componentName}_${key}`);
    },
    [componentName]
  );

  const registerCleanup = React.useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error in cleanup function:', error);
        }
      });
    };
  }, []);

  return { cacheData, getCachedData, registerCleanup };
}

// Export singleton instance
export const memoryManager = MemoryManagerService.getInstance();
