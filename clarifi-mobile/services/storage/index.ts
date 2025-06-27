export { default as uploadFile } from './fileUploadService';
export * from './fileUploadService'; // To export interfaces like UploadResult, PresignedUploadData

// AsyncStorage utilities and constants
export * from './asyncStorage';
export { default as asyncStorage } from './asyncStorage';

// Data models and storage schemas
export * from './dataModels';

// Database migration utilities
export * from './migrations';

// Storage services
export { AchievementStorageService } from './AchievementStorageService';

// Storage hooks
export { useStoragePersistence } from '../../hooks/useStoragePersistence';

// Storage providers
export {
  StorageProvider,
  useStorage,
} from '../../components/providers/StorageProvider';

// Storage types
export interface StorageData {
  achievements: any[];
  userProgress: UserProgress;
  streakData: StreakData;
  financialStats: FinancialStats;
}

export interface UserProgress {
  totalPoints: number;
  completedAchievements: number;
  level: number;
  experiencePoints: number;
  lastUpdated: string;
}

export interface StreakData {
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

export interface FinancialStats {
  totalSaved: number;
  totalSpent: number;
  budgetCompliance: number;
  transactionsTracked: number;
  savingsGoalProgress: number;
  monthlyBudget: number;
  lastUpdated: string;
}

export interface StorageStats {
  totalSize: number;
  totalSizeKB: number;
  itemCount: number;
  lastSync: string | null;
  version: string;
}

// Storage constants
export const STORAGE_KEYS = {
  ACHIEVEMENTS: '@clarifi/achievements',
  USER_PROGRESS: '@clarifi/user_progress',
  STREAK_DATA: '@clarifi/streak_data',
  FINANCIAL_STATS: '@clarifi/financial_stats',
  SETTINGS: '@clarifi/settings',
  LAST_SYNC: '@clarifi/last_sync',
  STORAGE_VERSION: '@clarifi/storage_version',
  // Education-related keys
  EDUCATION_PROGRESS: 'clarifi:education:progress',
  EDUCATION_LAST_ACCESSED_MODULE: 'clarifi:education:lastModule',
  EDUCATION_PREFERRED_LANGUAGE: 'clarifi:education:language',
  EDUCATION_OFFLINE_CONTENT: 'clarifi:education:offlineContent',
} as const;

export const CURRENT_STORAGE_VERSION = '1.0.0';
