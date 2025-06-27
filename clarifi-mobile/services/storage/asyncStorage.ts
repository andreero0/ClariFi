// services/storage/asyncStorage.ts
// A wrapper around AsyncStorage for typed, consistent access.

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage wrapper with TypeScript support and error handling
 */

/**
 * Store a string value in AsyncStorage
 */
export const storeString = async (
  key: string,
  value: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('[AsyncStorage] Error saving string:', key, error);
    throw error;
  }
};

/**
 * Get a string value from AsyncStorage
 */
export const getString = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('[AsyncStorage] Error getting string:', key, error);
    return null;
  }
};

/**
 * Store an object in AsyncStorage (JSON serialized)
 */
export const storeObject = async <T extends object>(
  key: string,
  value: T
): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('[AsyncStorage] Error saving object:', key, error);
    throw error;
  }
};

/**
 * Get an object from AsyncStorage (JSON deserialized)
 */
export const getObject = async <T extends object>(
  key: string
): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (error) {
    console.error('[AsyncStorage] Error getting object:', key, error);
    return null;
  }
};

/**
 * Store an object in AsyncStorage
 */
export const setObject = async <T extends object>(
  key: string,
  value: T
): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('[AsyncStorage] Error saving object:', key, error);
    throw error;
  }
};

/**
 * Store a number in AsyncStorage
 */
export const storeNumber = async (
  key: string,
  value: number
): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (error) {
    console.error('[AsyncStorage] Error saving number:', key, error);
    throw error;
  }
};

/**
 * Get a number from AsyncStorage
 */
export const getNumber = async (key: string): Promise<number | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null ? parseFloat(value) : null;
  } catch (error) {
    console.error('[AsyncStorage] Error getting number:', key, error);
    return null;
  }
};

/**
 * Store a boolean in AsyncStorage
 */
export const storeBoolean = async (
  key: string,
  value: boolean
): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (error) {
    console.error('[AsyncStorage] Error saving boolean:', key, error);
    throw error;
  }
};

/**
 * Get a boolean from AsyncStorage
 */
export const getBoolean = async (key: string): Promise<boolean | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null ? value === 'true' : null;
  } catch (error) {
    console.error('[AsyncStorage] Error getting boolean:', key, error);
    return null;
  }
};

/**
 * Remove an item from AsyncStorage
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[AsyncStorage] Error removing item:', key, error);
    throw error;
  }
};

/**
 * Remove multiple items from AsyncStorage
 */
export const removeItems = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('[AsyncStorage] Error removing items:', keys, error);
    throw error;
  }
};

/**
 * Clear all data from AsyncStorage
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('[AsyncStorage] All data cleared.');
  } catch (error) {
    console.error('[AsyncStorage] Error clearing all data:', error);
    throw error;
  }
};

/**
 * Get all keys from AsyncStorage
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('[AsyncStorage] Error getting all keys:', error);
    return [];
  }
};

/**
 * Check if a key exists in AsyncStorage
 */
export const hasKey = async (key: string): Promise<boolean> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(key);
  } catch (error) {
    console.error('[AsyncStorage] Error checking key existence:', key, error);
    return false;
  }
};

/**
 * Get multiple items from AsyncStorage
 */
export const getMultiple = async (
  keys: readonly string[]
): Promise<readonly (readonly [string, string | null])[]> => {
  try {
    return await AsyncStorage.multiGet(keys);
  } catch (error) {
    console.error('[AsyncStorage] Error getting multiple items:', keys, error);
    return [];
  }
};

/**
 * Set multiple items in AsyncStorage
 */
export const setMultiple = async (
  keyValuePairs: Array<[string, string]>
): Promise<void> => {
  try {
    await AsyncStorage.multiSet(keyValuePairs);
  } catch (error) {
    console.error(
      '[AsyncStorage] Error setting multiple items:',
      keyValuePairs,
      error
    );
    throw error;
  }
};

/**
 * Storage keys for the ClariFi application
 */
export const STORAGE_KEYS = {
  // User data
  USER_DATA: 'clarifi:user_data',
  USER_PREFERENCES: 'clarifi:user_preferences',
  ONBOARDING_PROGRESS: 'clarifi:onboarding_progress',

  // Financial data
  TRANSACTIONS_BY_MONTH: (year: number, month: number) =>
    `clarifi:transactions_${year}_${String(month).padStart(2, '0')}`,
  BUDGETS: 'clarifi:budgets',
  CREDIT_CARDS: 'clarifi:credit_cards',
  UTILIZATION_SETTINGS: 'clarifi:utilization_settings',

  // Education system
  EDUCATION_PROGRESS: 'clarifi:education:progress',
  EDUCATION_PREFERRED_LANGUAGE: 'clarifi:education:language',
  EDUCATION_LAST_ACCESSED_MODULE: 'clarifi:education:lastModule',
  EDUCATION_OFFLINE_CONTENT: 'clarifi:education:offlineContent',
  EDUCATION_QUIZ_RESULTS: 'clarifi:education:quizResults',
  EDUCATION_LESSON_BOOKMARKS: 'clarifi:education:bookmarks',

  // App settings
  NOTIFICATION_SCHEDULE: 'clarifi:notification_schedule',
  NOTIFICATION_PREFERENCES: 'clarifi:notification_preferences',
  AI_USAGE: 'clarifi:ai_usage',
  APP_SETTINGS: 'clarifi:app_settings',
  THEME_SETTINGS: 'clarifi:theme_settings',

  // Sync and cache
  LAST_SYNC_TIMESTAMP: 'clarifi:last_sync_timestamp',
  CACHE_MANIFEST: 'clarifi:cache_manifest',

  // Analytics and debugging
  ANALYTICS_EVENTS: 'clarifi:analytics_events',
  ERROR_LOGS: 'clarifi:error_logs',

  // Privacy and data retention
  DATA_RETENTION_SETTINGS: 'clarifi:data_retention_settings',
  AI_USAGE_STATS: 'clarifi:ai_usage_stats',
} as const;

/**
 * Education-specific storage utilities
 */
export const EducationStorage = {
  /**
   * Save lesson progress
   */
  saveLessonProgress: async (
    moduleId: string,
    lessonId: string,
    progress: any
  ): Promise<void> => {
    const key = `clarifi:education:lesson:${moduleId}:${lessonId}`;
    await storeObject(key, progress);
  },

  /**
   * Load lesson progress
   */
  loadLessonProgress: async (
    moduleId: string,
    lessonId: string
  ): Promise<any | null> => {
    const key = `clarifi:education:lesson:${moduleId}:${lessonId}`;
    return await getObject(key);
  },

  /**
   * Save quiz result
   */
  saveQuizResult: async (
    moduleId: string,
    quizId: string,
    result: any
  ): Promise<void> => {
    const key = `clarifi:education:quiz:${moduleId}:${quizId}`;
    await storeObject(key, result);
  },

  /**
   * Load quiz result
   */
  loadQuizResult: async (
    moduleId: string,
    quizId: string
  ): Promise<any | null> => {
    const key = `clarifi:education:quiz:${moduleId}:${quizId}`;
    return await getObject(key);
  },

  /**
   * Save module completion time
   */
  saveModuleCompletionTime: async (
    moduleId: string,
    timeSpent: number
  ): Promise<void> => {
    const key = `clarifi:education:time:${moduleId}`;
    await storeNumber(key, timeSpent);
  },

  /**
   * Load module completion time
   */
  loadModuleCompletionTime: async (
    moduleId: string
  ): Promise<number | null> => {
    const key = `clarifi:education:time:${moduleId}`;
    return await getNumber(key);
  },

  /**
   * Mark lesson as bookmarked
   */
  bookmarkLesson: async (moduleId: string, lessonId: string): Promise<void> => {
    const key = `clarifi:education:bookmark:${moduleId}:${lessonId}`;
    await storeBoolean(key, true);
  },

  /**
   * Remove lesson bookmark
   */
  removeBookmark: async (moduleId: string, lessonId: string): Promise<void> => {
    const key = `clarifi:education:bookmark:${moduleId}:${lessonId}`;
    await removeItem(key);
  },

  /**
   * Check if lesson is bookmarked
   */
  isLessonBookmarked: async (
    moduleId: string,
    lessonId: string
  ): Promise<boolean> => {
    const key = `clarifi:education:bookmark:${moduleId}:${lessonId}`;
    return (await getBoolean(key)) ?? false;
  },

  /**
   * Get all bookmarked lessons
   */
  getAllBookmarks: async (): Promise<
    Array<{ moduleId: string; lessonId: string }>
  > => {
    try {
      const keys = await getAllKeys();
      const bookmarkKeys = keys.filter(key =>
        key.startsWith('clarifi:education:bookmark:')
      );
      const bookmarks: Array<{ moduleId: string; lessonId: string }> = [];

      for (const key of bookmarkKeys) {
        const isBookmarked = await getBoolean(key);
        if (isBookmarked) {
          const parts = key.split(':');
          if (parts.length >= 5) {
            bookmarks.push({
              moduleId: parts[3],
              lessonId: parts[4],
            });
          }
        }
      }

      return bookmarks;
    } catch (error) {
      console.error('[EducationStorage] Error getting all bookmarks:', error);
      return [];
    }
  },

  /**
   * Clear all education data
   */
  clearEducationData: async (): Promise<void> => {
    try {
      const keys = await getAllKeys();
      const educationKeys = keys.filter(key =>
        key.startsWith('clarifi:education:')
      );
      await removeItems(educationKeys);
    } catch (error) {
      console.error('[EducationStorage] Error clearing education data:', error);
      throw error;
    }
  },
};

export default {
  storeString,
  getString,
  storeObject,
  getObject,
  storeNumber,
  getNumber,
  storeBoolean,
  getBoolean,
  removeItem,
  removeItems,
  clearAll,
  getAllKeys,
  hasKey,
  getMultiple,
  setMultiple,
  STORAGE_KEYS,
  EducationStorage,
};
