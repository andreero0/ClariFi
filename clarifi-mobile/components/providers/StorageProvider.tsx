import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { Achievement } from '../../types/achievements';

// Storage keys
const STORAGE_KEYS = {
  ACHIEVEMENTS: '@clarifi/achievements',
  USER_PROGRESS: '@clarifi/user_progress',
  STREAK_DATA: '@clarifi/streak_data',
  FINANCIAL_STATS: '@clarifi/financial_stats',
  SETTINGS: '@clarifi/settings',
  LAST_SYNC: '@clarifi/last_sync',
  STORAGE_VERSION: '@clarifi/storage_version',
} as const;

const CURRENT_VERSION = '1.0.0';

interface UserProgress {
  totalPoints: number;
  completedAchievements: number;
  level: number;
  experiencePoints: number;
  lastUpdated: string;
}

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  freezesUsed: number;
  lastActiveDate: string;
  streakHistory: Array<{
    date: string;
    streakCount: number;
    wasFrozen: boolean;
  }>;
}

interface FinancialStats {
  totalSaved: number;
  totalSpent: number;
  budgetCompliance: number;
  transactionsTracked: number;
  savingsGoalProgress: number;
  monthlyBudget: number;
  lastUpdated: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  dataSync: boolean;
  lastUpdated: string;
}

interface StorageContextType {
  // Storage state
  isLoading: boolean;
  isInitialized: boolean;
  lastSyncDate: string | null;

  // Data operations
  saveAchievements: (achievements: Achievement[]) => Promise<void>;
  loadAchievements: () => Promise<Achievement[]>;
  saveUserProgress: (progress: UserProgress) => Promise<void>;
  loadUserProgress: () => Promise<UserProgress | null>;
  saveStreakData: (data: StreakData) => Promise<void>;
  loadStreakData: () => Promise<StreakData | null>;
  saveFinancialStats: (stats: FinancialStats) => Promise<void>;
  loadFinancialStats: () => Promise<FinancialStats | null>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  loadSettings: () => Promise<AppSettings | null>;

  // Utility operations
  syncAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  getStorageStats: () => Promise<StorageStats>;
  createBackup: () => Promise<string>;
  restoreFromBackup: (backup: string) => Promise<void>;
  exportData: () => Promise<string>;
}

interface StorageStats {
  totalSize: number;
  totalSizeKB: number;
  itemCount: number;
  lastSync: string | null;
  version: string;
}

interface StorageProviderProps {
  children: ReactNode;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: StorageProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // Initialize storage on app start
  useEffect(() => {
    initializeStorage();
  }, []);

  // Handle app state changes for auto-sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Auto-sync when app goes to background
        syncAllData().catch(console.error);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  /**
   * Initialize storage system
   */
  const initializeStorage = async () => {
    try {
      setIsLoading(true);
      console.log('🗄️ Initializing Storage Provider...');

      // Check storage version and migrate if needed
      const currentVersion = await AsyncStorage.getItem(
        STORAGE_KEYS.STORAGE_VERSION
      );

      if (!currentVersion) {
        // First time setup
        await AsyncStorage.setItem(
          STORAGE_KEYS.STORAGE_VERSION,
          CURRENT_VERSION
        );
        console.log('✅ Storage version initialized');
      } else if (currentVersion !== CURRENT_VERSION) {
        // Handle migration in the future
        console.log(
          `🔄 Migration from ${currentVersion} to ${CURRENT_VERSION} (no-op for now)`
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.STORAGE_VERSION,
          CURRENT_VERSION
        );
      }

      // Load last sync date
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      setLastSyncDate(lastSync);

      setIsInitialized(true);
      console.log('✅ Storage Provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
      Alert.alert(
        'Storage Error',
        'Failed to initialize app storage. Some features may not work properly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save achievements to storage
   */
  const saveAchievements = async (
    achievements: Achievement[]
  ): Promise<void> => {
    try {
      const data = JSON.stringify(achievements);
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, data);
      console.log(`💾 Saved ${achievements.length} achievements`);
      await updateLastSync();
    } catch (error) {
      console.error('❌ Failed to save achievements:', error);
      throw error;
    }
  };

  /**
   * Load achievements from storage
   */
  const loadAchievements = async (): Promise<Achievement[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (!data) return [];

      const achievements = JSON.parse(data) as Achievement[];
      console.log(`📂 Loaded ${achievements.length} achievements`);
      return achievements;
    } catch (error) {
      console.error('❌ Failed to load achievements:', error);
      return [];
    }
  };

  /**
   * Save user progress to storage
   */
  const saveUserProgress = async (progress: UserProgress): Promise<void> => {
    try {
      const progressWithTimestamp = {
        ...progress,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROGRESS,
        JSON.stringify(progressWithTimestamp)
      );
      console.log('💾 Saved user progress');
      await updateLastSync();
    } catch (error) {
      console.error('❌ Failed to save user progress:', error);
      throw error;
    }
  };

  /**
   * Load user progress from storage
   */
  const loadUserProgress = async (): Promise<UserProgress | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
      if (!data) return null;

      return JSON.parse(data) as UserProgress;
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
      return null;
    }
  };

  /**
   * Save streak data to storage
   */
  const saveStreakData = async (streakData: StreakData): Promise<void> => {
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
      await updateLastSync();
    } catch (error) {
      console.error('❌ Failed to save streak data:', error);
      throw error;
    }
  };

  /**
   * Load streak data from storage
   */
  const loadStreakData = async (): Promise<StreakData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      if (!data) return null;

      return JSON.parse(data) as StreakData;
    } catch (error) {
      console.error('❌ Failed to load streak data:', error);
      return null;
    }
  };

  /**
   * Save financial statistics to storage
   */
  const saveFinancialStats = async (stats: FinancialStats): Promise<void> => {
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
      await updateLastSync();
    } catch (error) {
      console.error('❌ Failed to save financial stats:', error);
      throw error;
    }
  };

  /**
   * Load financial statistics from storage
   */
  const loadFinancialStats = async (): Promise<FinancialStats | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FINANCIAL_STATS);
      if (!data) return null;

      return JSON.parse(data) as FinancialStats;
    } catch (error) {
      console.error('❌ Failed to load financial stats:', error);
      return null;
    }
  };

  /**
   * Save app settings to storage
   */
  const saveSettings = async (settings: AppSettings): Promise<void> => {
    try {
      const settingsWithTimestamp = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settingsWithTimestamp)
      );
      console.log('💾 Saved app settings');
      await updateLastSync();
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  };

  /**
   * Load app settings from storage
   */
  const loadSettings = async (): Promise<AppSettings | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return null;

      return JSON.parse(data) as AppSettings;
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      return null;
    }
  };

  /**
   * Sync all data to storage
   */
  const syncAllData = async (): Promise<void> => {
    try {
      console.log('🔄 Syncing all data...');
      await updateLastSync();
      console.log('✅ Data sync completed');
    } catch (error) {
      console.error('❌ Failed to sync data:', error);
      throw error;
    }
  };

  /**
   * Clear all data from storage
   */
  const clearAllData = async (): Promise<void> => {
    try {
      console.log('🗑️ Clearing all data...');

      const keysToRemove = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keysToRemove);

      setLastSyncDate(null);
      console.log('✅ All data cleared');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      throw error;
    }
  };

  /**
   * Get storage statistics
   */
  const getStorageStats = async (): Promise<StorageStats> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const clarifiKeys = allKeys.filter(key => key.startsWith('@clarifi/'));

      let totalSize = 0;
      for (const key of clarifiKeys) {
        const data = await AsyncStorage.getItem(key);
        totalSize += data ? data.length : 0;
      }

      const version =
        (await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_VERSION)) || 'unknown';
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

      return {
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        itemCount: clarifiKeys.length,
        lastSync,
        version,
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalSize: 0,
        totalSizeKB: 0,
        itemCount: 0,
        lastSync: null,
        version: 'unknown',
      };
    }
  };

  /**
   * Create backup of all data
   */
  const createBackup = async (): Promise<string> => {
    try {
      console.log('💾 Creating data backup...');

      const [achievements, userProgress, streakData, financialStats, settings] =
        await Promise.all([
          loadAchievements(),
          loadUserProgress(),
          loadStreakData(),
          loadFinancialStats(),
          loadSettings(),
        ]);

      const backup = {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        app: 'ClariFi',
        data: {
          achievements,
          userProgress,
          streakData,
          financialStats,
          settings,
        },
      };

      const backupString = JSON.stringify(backup, null, 2);
      console.log(
        `✅ Backup created (${Math.round(backupString.length / 1024)}KB)`
      );

      return backupString;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  };

  /**
   * Restore data from backup
   */
  const restoreFromBackup = async (backupString: string): Promise<void> => {
    try {
      console.log('🔄 Restoring from backup...');

      const backup = JSON.parse(backupString);

      // Validate backup format
      if (!backup.data || backup.app !== 'ClariFi') {
        throw new Error('Invalid backup format');
      }

      const {
        achievements,
        userProgress,
        streakData,
        financialStats,
        settings,
      } = backup.data;

      // Save restored data
      const promises = [];
      if (achievements) promises.push(saveAchievements(achievements));
      if (userProgress) promises.push(saveUserProgress(userProgress));
      if (streakData) promises.push(saveStreakData(streakData));
      if (financialStats) promises.push(saveFinancialStats(financialStats));
      if (settings) promises.push(saveSettings(settings));

      await Promise.all(promises);

      console.log('✅ Data restored from backup');
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
      throw error;
    }
  };

  /**
   * Export data for sharing/analysis
   */
  const exportData = async (): Promise<string> => {
    try {
      const backup = await createBackup();
      return backup;
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw error;
    }
  };

  /**
   * Update last sync timestamp
   */
  const updateLastSync = async (): Promise<void> => {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    setLastSyncDate(timestamp);
  };

  const contextValue: StorageContextType = {
    // State
    isLoading,
    isInitialized,
    lastSyncDate,

    // Data operations
    saveAchievements,
    loadAchievements,
    saveUserProgress,
    loadUserProgress,
    saveStreakData,
    loadStreakData,
    saveFinancialStats,
    loadFinancialStats,
    saveSettings,
    loadSettings,

    // Utility operations
    syncAllData,
    clearAllData,
    getStorageStats,
    createBackup,
    restoreFromBackup,
    exportData,
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextType {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export default StorageProvider;
