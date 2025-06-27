import { Image, ImageSourcePropType } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ImageCacheEntry {
  localUri: string;
  originalUri: string;
  timestamp: number;
  size: number;
  lastAccessed: number;
}

interface ImageLoadOptions {
  priority?: 'high' | 'normal' | 'low';
  resize?: { width: number; height: number };
  quality?: number; // 0.0 to 1.0
  cache?: boolean;
  placeholder?: ImageSourcePropType;
}

class ImageOptimizerService {
  private static instance: ImageOptimizerService;
  private cache = new Map<string, ImageCacheEntry>();
  private loadingPromises = new Map<string, Promise<string>>();
  private cacheDirectory: string;
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private currentCacheSize = 0;

  static getInstance(): ImageOptimizerService {
    if (!ImageOptimizerService.instance) {
      ImageOptimizerService.instance = new ImageOptimizerService();
    }
    return ImageOptimizerService.instance;
  }

  constructor() {
    this.cacheDirectory = `${FileSystem.cacheDirectory}images/`;
    this.initializeCache();
  }

  /**
   * Initialize image cache
   */
  private async initializeCache(): Promise<void> {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, {
          intermediates: true,
        });
      }

      // Load existing cache entries
      await this.loadCacheIndex();

      // Clean up expired entries
      await this.cleanupExpiredEntries();

      console.log('📸 Image cache initialized');
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const cacheIndex = await AsyncStorage.getItem('image_cache_index');
      if (cacheIndex) {
        const entries: [string, ImageCacheEntry][] = JSON.parse(cacheIndex);
        this.cache = new Map(entries);

        // Calculate current cache size
        this.currentCacheSize = Array.from(this.cache.values()).reduce(
          (total, entry) => total + entry.size,
          0
        );
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.cache.entries());
      await AsyncStorage.setItem('image_cache_index', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Generate cache key from URI and options
   */
  private generateCacheKey(uri: string, options?: ImageLoadOptions): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${uri}_${optionsStr}`.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Optimized image loading with caching
   */
  async loadOptimizedImage(
    uri: string,
    options: ImageLoadOptions = {}
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(uri, options);

    // Return cached image if available
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry) {
      // Check if file still exists
      const fileInfo = await FileSystem.getInfoAsync(cachedEntry.localUri);
      if (fileInfo.exists) {
        // Update access time
        cachedEntry.lastAccessed = Date.now();
        return cachedEntry.localUri;
      } else {
        // Remove stale cache entry
        this.cache.delete(cacheKey);
      }
    }

    // Return existing loading promise if image is already being loaded
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    // Create new loading promise
    const loadingPromise = this.downloadAndOptimizeImage(
      uri,
      cacheKey,
      options
    );
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Download and optimize image
   */
  private async downloadAndOptimizeImage(
    uri: string,
    cacheKey: string,
    options: ImageLoadOptions
  ): Promise<string> {
    try {
      const fileName = `${cacheKey}.jpg`;
      const localUri = `${this.cacheDirectory}${fileName}`;

      // Download image
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      const size = fileInfo.size || 0;

      // Check cache size limit
      await this.ensureCacheSpace(size);

      // Create cache entry
      const cacheEntry: ImageCacheEntry = {
        localUri,
        originalUri: uri,
        timestamp: Date.now(),
        size,
        lastAccessed: Date.now(),
      };

      this.cache.set(cacheKey, cacheEntry);
      this.currentCacheSize += size;

      // Save cache index
      await this.saveCacheIndex();

      console.log(
        `📸 Image cached: ${fileName} (${this.formatFileSize(size)})`
      );

      return localUri;
    } catch (error) {
      console.error('Failed to download and cache image:', error);
      // Return original URI as fallback
      return uri;
    }
  }

  /**
   * Ensure cache has enough space
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    if (this.currentCacheSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    // Remove least recently used images
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    const keysToRemove: string[] = [];

    for (const entry of entries) {
      keysToRemove.push(entry.key);
      freedSpace += entry.size;

      if (freedSpace >= requiredSize) {
        break;
      }
    }

    // Remove entries
    for (const key of keysToRemove) {
      await this.removeCacheEntry(key);
    }

    console.log(`📸 Freed ${this.formatFileSize(freedSpace)} of cache space`);
  }

  /**
   * Remove cache entry
   */
  private async removeCacheEntry(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (!entry) return;

    try {
      // Delete file
      const fileInfo = await FileSystem.getInfoAsync(entry.localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(entry.localUri);
      }

      // Remove from cache
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
    } catch (error) {
      console.error('Failed to remove cache entry:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.removeCacheEntry(key);
    }

    if (expiredKeys.length > 0) {
      await this.saveCacheIndex();
      console.log(`📸 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(
    uris: string[],
    options: ImageLoadOptions = {}
  ): Promise<void> {
    const preloadPromises = uris.map(uri =>
      this.loadOptimizedImage(uri, { ...options, priority: 'low' }).catch(
        error => {
          console.warn(`Failed to preload image ${uri}:`, error);
          return uri; // Return original URI as fallback
        }
      )
    );

    await Promise.allSettled(preloadPromises);
    console.log(`📸 Preloaded ${uris.length} images`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalSize: number;
    entryCount: number;
    maxSize: number;
    usagePercentage: number;
  } {
    return {
      totalSize: this.currentCacheSize,
      entryCount: this.cache.size,
      maxSize: this.maxCacheSize,
      usagePercentage: (this.currentCacheSize / this.maxCacheSize) * 100,
    };
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      // Delete all cached files
      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      for (const file of files) {
        await FileSystem.deleteAsync(`${this.cacheDirectory}${file}`);
      }

      // Clear cache map
      this.cache.clear();
      this.currentCacheSize = 0;

      // Clear cache index
      await AsyncStorage.removeItem('image_cache_index');

      console.log('📸 Image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Prefetch images based on user behavior
   */
  async intelligentPrefetch(recentlyViewedUris: string[]): Promise<void> {
    // Prefetch related or commonly accessed images
    const criticalImages = recentlyViewedUris.slice(0, 5); // Top 5 recent

    await this.preloadImages(criticalImages, {
      priority: 'high',
      cache: true,
    });
  }
}

// React hook for optimized image loading
export function useOptimizedImage(uri: string, options: ImageLoadOptions = {}) {
  const [optimizedUri, setOptimizedUri] = React.useState<string>(uri);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      if (!uri) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const optimized = await imageOptimizer.loadOptimizedImage(uri, options);

        if (!cancelled) {
          setOptimizedUri(optimized);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Image load failed'));
          setOptimizedUri(uri); // Fallback to original URI
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [uri, JSON.stringify(options)]);

  return { uri: optimizedUri, loading, error };
}

// Export singleton instance
export const imageOptimizer = ImageOptimizerService.getInstance();
