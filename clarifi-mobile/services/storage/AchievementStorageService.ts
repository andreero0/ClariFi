import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from '../../types/achievements';

const ACHIEVEMENT_STORAGE_KEY = '@clarifi/achievements';
const USER_PROGRESS_KEY = '@clarifi/user_progress';

export interface UserAchievementProgress {
  achievementId: string;
  isCompleted: boolean;
  completedAt?: Date;
  progress: number;
  currentValue: number;
  targetValue: number;
}

export interface UserProgress {
  totalPoints: number;
  completedAchievements: number;
  level: number;
  experiencePoints: number;
  lastUpdated: Date;
}

export class AchievementStorageService {
  /**
   * Save user's achievement progress
   */
  static async saveUserProgress(progress: UserProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving user progress:', error);
      throw error;
    }
  }

  /**
   * Load user's achievement progress
   */
  static async loadUserProgress(): Promise<UserProgress | null> {
    try {
      const data = await AsyncStorage.getItem(USER_PROGRESS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        if (parsed.lastUpdated) {
          parsed.lastUpdated = new Date(parsed.lastUpdated);
        }
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Error loading user progress:', error);
      return null;
    }
  }

  /**
   * Save achievement progress data
   */
  static async saveAchievementProgress(
    achievements: UserAchievementProgress[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ACHIEVEMENT_STORAGE_KEY,
        JSON.stringify(achievements)
      );
    } catch (error) {
      console.error('Error saving achievement progress:', error);
      throw error;
    }
  }

  /**
   * Load achievement progress data
   */
  static async loadAchievementProgress(): Promise<UserAchievementProgress[]> {
    try {
      const data = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        return parsed.map((achievement: any) => ({
          ...achievement,
          completedAt: achievement.completedAt
            ? new Date(achievement.completedAt)
            : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading achievement progress:', error);
      return [];
    }
  }

  /**
   * Update specific achievement progress
   */
  static async updateAchievementProgress(
    achievementId: string,
    currentValue: number,
    isCompleted: boolean = false
  ): Promise<void> {
    try {
      const existingProgress = await this.loadAchievementProgress();
      const achievementIndex = existingProgress.findIndex(
        progress => progress.achievementId === achievementId
      );

      if (achievementIndex >= 0) {
        existingProgress[achievementIndex].currentValue = currentValue;
        existingProgress[achievementIndex].isCompleted = isCompleted;
        if (isCompleted && !existingProgress[achievementIndex].completedAt) {
          existingProgress[achievementIndex].completedAt = new Date();
        }
      } else {
        // Create new progress entry
        existingProgress.push({
          achievementId,
          isCompleted,
          completedAt: isCompleted ? new Date() : undefined,
          progress: 0,
          currentValue,
          targetValue: 100, // Default target, should be set from achievement definition
        });
      }

      await this.saveAchievementProgress(existingProgress);
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }
  }

  /**
   * Clear all achievement data
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ACHIEVEMENT_STORAGE_KEY,
        USER_PROGRESS_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing achievement data:', error);
      throw error;
    }
  }

  /**
   * Get achievement progress for a specific achievement
   */
  static async getAchievementProgress(
    achievementId: string
  ): Promise<UserAchievementProgress | null> {
    try {
      const allProgress = await this.loadAchievementProgress();
      return (
        allProgress.find(
          progress => progress.achievementId === achievementId
        ) || null
      );
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return null;
    }
  }
}

export default AchievementStorageService;
