import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from '../types/achievements';
import { useAchievements } from '../context/AchievementContext';

// Storage keys
const STORAGE_KEYS = {
  ACHIEVEMENTS: '@clarifi/achievements',
  USER_PROGRESS: '@clarifi/user_progress',
  STREAK_DATA: '@clarifi/streak_data',
  FINANCIAL_STATS: '@clarifi/financial_stats',
  LAST_SYNC: '@clarifi/last_sync',
  STORAGE_VERSION: '@clarifi/storage_version',
} as const;

const CURRENT_VERSION = '1.0.0';
const SYNC_DEBOUNCE_MS = 1000; // 1 second debounce for saves

interface UserProgress {
  totalPoints: number;
  completedAchievements: number;
  level: number;
  lastUpdated: string;
}

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  freezesUsed: number;
  lastActiveDate: string;
}

interface FinancialStats {
  totalSaved: number;
  totalSpent: number;
  budgetCompliance: number;
  transactionsTracked: number;
  lastUpdated: string;
}

interface StorageData {
  achievements: Achievement[];
  userProgress: UserProgress;
  streakData: StreakData;
  financialStats: FinancialStats;
}

export function useStoragePersistence() {
  const { achievements, totalPoints, setAchievements } = useAchievements();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isLoadingRef = useRef(false);

  /**
   * Initialize storage and load existing data
   */
  const initializeStorage = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      console.log('🗄️ Initializing storage persistence...');

      // Check if migration is needed
      const version = await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);
      if (!version) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.STORAGE_VERSION,
          CURRENT_VERSION
        );
        console.log('✅ Storage version initialized');
      }

      // Load existing data
      const loadedData = await loadAllData();
      if (loadedData.achievements.length > 0) {
        setAchievements(loadedData.achievements);
        console.log(
          `📂 Loaded ${loadedData.achievements.length} achievements from storage`
        );
      }
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [setAchievements]);

  /**
   * Save achievements to AsyncStorage
   */
  const saveAchievements = useCallback(
    async (achievementsToSave: Achievement[]) => {
      try {
        const dataToStore = JSON.stringify(achievementsToSave);
        await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, dataToStore);
        console.log(
          `💾 Saved ${achievementsToSave.length} achievements to storage`
        );
      } catch (error) {
        console.error('❌ Failed to save achievements:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Load achievements from AsyncStorage
   */
  const loadAchievements = useCallback(async (): Promise<Achievement[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (!data) return [];

      const achievements = JSON.parse(data) as Achievement[];
      console.log(`📂 Loaded ${achievements.length} achievements from storage`);
      return achievements;
    } catch (error) {
      console.error('❌ Failed to load achievements:', error);
      return [];
    }
  }, []);

  /**
   * Save user progress data
   */
  const saveUserProgress = useCallback(async (progress: UserProgress) => {
    try {
      const progressWithTimestamp = {
        ...progress,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROGRESS,
        JSON.stringify(progressWithTimestamp)
      );
      console.log('💾 Saved user progress to storage');
    } catch (error) {
      console.error('❌ Failed to save user progress:', error);
    }
  }, []);

  /**
   * Load user progress data
   */
  const loadUserProgress =
    useCallback(async (): Promise<UserProgress | null> => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
        if (!data) return null;

        return JSON.parse(data) as UserProgress;
      } catch (error) {
        console.error('❌ Failed to load user progress:', error);
        return null;
      }
    }, []);

  /**
   * Save streak data
   */
  const saveStreakData = useCallback(async (streakData: StreakData) => {
    try {
      const dataWithTimestamp = {
        ...streakData,
        lastActiveDate: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.STREAK_DATA,
        JSON.stringify(dataWithTimestamp)
      );
      console.log(`💾 Saved streak data: ${streakData.currentStreak} days`);
    } catch (error) {
      console.error('❌ Failed to save streak data:', error);
    }
  }, []);

  /**
   * Load streak data
   */
  const loadStreakData = useCallback(async (): Promise<StreakData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      if (!data) return null;

      return JSON.parse(data) as StreakData;
    } catch (error) {
      console.error('❌ Failed to load streak data:', error);
      return null;
    }
  }, []);

  /**
   * Save financial statistics
   */
  const saveFinancialStats = useCallback(async (stats: FinancialStats) => {
    try {
      const statsWithTimestamp = {
        ...stats,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.FINANCIAL_STATS,
        JSON.stringify(statsWithTimestamp)
      );
      console.log(`💾 Saved financial stats: $${stats.totalSaved} saved`);
    } catch (error) {
      console.error('❌ Failed to save financial stats:', error);
    }
  }, []);

  /**
   * Load financial statistics
   */
  const loadFinancialStats =
    useCallback(async (): Promise<FinancialStats | null> => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.FINANCIAL_STATS);
        if (!data) return null;

        return JSON.parse(data) as FinancialStats;
      } catch (error) {
        console.error('❌ Failed to load financial stats:', error);
        return null;
      }
    }, []);

  /**
   * Load all data from storage
   */
  const loadAllData = useCallback(async (): Promise<StorageData> => {
    try {
      const [achievements, userProgress, streakData, financialStats] =
        await Promise.all([
          loadAchievements(),
          loadUserProgress(),
          loadStreakData(),
          loadFinancialStats(),
        ]);

      return {
        achievements: achievements || [],
        userProgress: userProgress || {
          totalPoints: 0,
          completedAchievements: 0,
          level: 1,
          lastUpdated: new Date().toISOString(),
        },
        streakData: streakData || {
          currentStreak: 0,
          bestStreak: 0,
          freezesUsed: 0,
          lastActiveDate: new Date().toISOString(),
        },
        financialStats: financialStats || {
          totalSaved: 0,
          totalSpent: 0,
          budgetCompliance: 100,
          transactionsTracked: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to load all data:', error);
      throw error;
    }
  }, [loadAchievements, loadUserProgress, loadStreakData, loadFinancialStats]);

  /**
   * Sync all data to storage with debouncing
   */
  const syncAllData = useCallback(
    async (data: Partial<StorageData>) => {
      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Debounce the sync operation
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('🔄 Syncing data to storage...');

          const promises = [];

          if (data.achievements) {
            promises.push(saveAchievements(data.achievements));
          }

          if (data.userProgress) {
            promises.push(saveUserProgress(data.userProgress));
          }

          if (data.streakData) {
            promises.push(saveStreakData(data.streakData));
          }

          if (data.financialStats) {
            promises.push(saveFinancialStats(data.financialStats));
          }

          await Promise.all(promises);

          // Update last sync timestamp
          await AsyncStorage.setItem(
            STORAGE_KEYS.LAST_SYNC,
            new Date().toISOString()
          );

          console.log('✅ Data sync completed');
        } catch (error) {
          console.error('❌ Failed to sync data:', error);
        }
      }, SYNC_DEBOUNCE_MS);
    },
    [saveAchievements, saveUserProgress, saveStreakData, saveFinancialStats]
  );

  /**
   * Clear all stored data
   */
  const clearAllData = useCallback(async () => {
    try {
      console.log('🗑️ Clearing all stored data...');

      const keysToRemove = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keysToRemove);

      console.log('✅ All data cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      throw error;
    }
  }, []);

  /**
   * Get storage usage stats
   */
  const getStorageStats = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const clarifiKeys = allKeys.filter(key => key.startsWith('@clarifi/'));

      let totalSize = 0;
      for (const key of clarifiKeys) {
        const data = await AsyncStorage.getItem(key);
        totalSize += data ? data.length : 0;
      }

      return {
        totalKeys: clarifiKeys.length,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        keys: clarifiKeys,
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return { totalKeys: 0, totalSize: 0, totalSizeKB: 0, keys: [] };
    }
  }, []);

  /**
   * Backup data to a compressed format
   */
  const createBackup = useCallback(async (): Promise<string> => {
    try {
      const allData = await loadAllData();
      const backup = {
        ...allData,
        metadata: {
          version: CURRENT_VERSION,
          timestamp: new Date().toISOString(),
          app: 'ClariFi',
        },
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }, [loadAllData]);

  /**
   * Restore data from backup
   */
  const restoreFromBackup = useCallback(
    async (backupData: string) => {
      try {
        console.log('🔄 Restoring data from backup...');

        const backup = JSON.parse(backupData);

        // Validate backup structure
        if (!backup.achievements || !Array.isArray(backup.achievements)) {
          throw new Error('Invalid backup format');
        }

        // Clear existing data first
        await clearAllData();

        // Restore data
        await syncAllData({
          achievements: backup.achievements,
          userProgress: backup.userProgress,
          streakData: backup.streakData,
          financialStats: backup.financialStats,
        });

        // Update context
        setAchievements(backup.achievements);

        console.log('✅ Data restored from backup successfully');
      } catch (error) {
        console.error('❌ Failed to restore from backup:', error);
        throw error;
      }
    },
    [clearAllData, syncAllData, setAchievements]
  );

  // Auto-sync achievements when they change
  useEffect(() => {
    if (achievements.length > 0) {
      syncAllData({ achievements });
    }
  }, [achievements, syncAllData]);

  // Auto-sync user progress when total points change
  useEffect(() => {
    if (totalPoints > 0) {
      const userProgress: UserProgress = {
        totalPoints,
        completedAchievements: achievements.filter(
          a => a.status === 'COMPLETED'
        ).length,
        level: Math.floor(totalPoints / 1000) + 1, // Level up every 1000 points
        lastUpdated: new Date().toISOString(),
      };

      syncAllData({ userProgress });
    }
  }, [totalPoints, achievements, syncAllData]);

  // Initialize storage on mount
  useEffect(() => {
    initializeStorage();
  }, [initializeStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data operations
    loadAllData,
    syncAllData,
    clearAllData,

    // Individual operations
    saveAchievements,
    loadAchievements,
    saveUserProgress,
    loadUserProgress,
    saveStreakData,
    loadStreakData,
    saveFinancialStats,
    loadFinancialStats,

    // Utility operations
    getStorageStats,
    createBackup,
    restoreFromBackup,
    initializeStorage,
  };
}

export default useStoragePersistence;
