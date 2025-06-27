/**
 * Achievement System Type Definitions
 * Comprehensive types for client-side progress tracking and achievements
 */

// Core achievement types
export enum AchievementType {
  STREAK = 'streak',
  MILESTONE = 'milestone',
  FEATURE_USAGE = 'feature_usage',
  FINANCIAL_GOAL = 'financial_goal',
  EDUCATION = 'education',
  ENGAGEMENT = 'engagement',
}

export enum AchievementStatus {
  LOCKED = 'locked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum AchievementCategory {
  BUDGETING = 'budgeting',
  TRANSACTIONS = 'transactions',
  CREDIT_MANAGEMENT = 'credit_management',
  EDUCATION = 'education',
  CONSISTENCY = 'consistency',
  FINANCIAL_HEALTH = 'financial_health',
}

// Achievement interfaces
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: AchievementType;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  requirements: AchievementRequirement[];
  status: AchievementStatus;
  progress: number; // 0-100 percentage
  completedAt?: Date;
  unlockedAt?: Date;
  isSecret?: boolean; // Hidden until unlocked
}

export interface AchievementRequirement {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string; // 'days', 'transactions', 'dollars', etc.
  completed: boolean;
}

// User engagement tracking
export interface UserEngagement {
  userId: string;
  lastActiveDate: Date;
  currentStreak: number;
  longestStreak: number;
  totalAppOpens: number;
  totalSessionTime: number; // in minutes
  featuresUsed: Record<string, number>;
  lastStreakUpdate: Date;
  streakFreezeUsed: boolean;
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  appOpens: number;
  sessionTime: number;
  featuresUsed: Record<string, number>;
  achievementsEarned: string[];
  streakDays: number;
  financialGoalsMet: number;
}

// Feature usage tracking
export interface FeatureUsage {
  feature: string;
  timestamp: Date;
  sessionId: string;
  metadata?: Record<string, any>;
}

export enum TrackedFeature {
  APP_OPEN = 'app_open',
  TRANSACTION_CATEGORIZE = 'transaction_categorize',
  BUDGET_CREATE = 'budget_create',
  BUDGET_VIEW = 'budget_view',
  CREDIT_CARD_ADD = 'credit_card_add',
  PAYMENT_OPTIMIZE = 'payment_optimize',
  EDUCATION_MODULE_START = 'education_module_start',
  EDUCATION_MODULE_COMPLETE = 'education_module_complete',
  QA_QUESTION_ASK = 'qa_question_ask',
  STATEMENT_UPLOAD = 'statement_upload',
  EXPORT_DATA = 'export_data',
  ACHIEVEMENT_VIEW = 'achievement_view',
  ACHIEVEMENT_SHARE = 'achievement_share',
}

// Progress tracking
export interface ProgressTracker {
  achievementId: string;
  progress: number;
  lastUpdated: Date;
  milestones: ProgressMilestone[];
}

export interface ProgressMilestone {
  id: string;
  description: string;
  target: number;
  achieved: boolean;
  achievedAt?: Date;
}

// Streak tracking
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  streakStartDate: Date;
  freezesUsed: number;
  maxFreezes: number;
  streakTarget: number;
}

// Notification preferences
export interface NotificationSettings {
  streakReminders: boolean;
  achievementProgress: boolean;
  milestones: boolean;
  monthlyReports: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
}

// Monthly report data
export interface MonthlyReport {
  month: string; // YYYY-MM
  summary: {
    totalAppOpens: number;
    totalSessionTime: number;
    streakDays: number;
    achievementsEarned: number;
    newFeaturesUsed: number;
  };
  achievements: Achievement[];
  topFeatures: Array<{
    feature: string;
    usage: number;
  }>;
  streakAnalysis: {
    bestStreak: number;
    consistencyScore: number; // 0-100
  };
  goals: {
    completed: number;
    inProgress: number;
  };
  comparison: {
    vs_previous_month: {
      app_opens: number; // percentage change
      session_time: number;
      achievements: number;
    };
  };
}

// Achievement sharing
export interface ShareableAchievement {
  achievement: Achievement;
  shareText: string;
  shareImage?: string;
  platform: SharePlatform;
}

export enum SharePlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  MESSAGE = 'message',
  EMAIL = 'email',
  COPY_LINK = 'copy_link',
}

// Storage interfaces
export interface AchievementStorage {
  achievements: Achievement[];
  userEngagement: UserEngagement;
  progressTrackers: ProgressTracker[];
  streakData: StreakData;
  notificationSettings: NotificationSettings;
  lastSyncDate: Date;
  version: string; // For data migration
}

// Event interfaces for achievement system
export interface AchievementEvent {
  type: AchievementEventType;
  achievementId?: string;
  progress?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum AchievementEventType {
  PROGRESS_UPDATE = 'progress_update',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  ACHIEVEMENT_COMPLETED = 'achievement_completed',
  STREAK_UPDATED = 'streak_updated',
  MILESTONE_REACHED = 'milestone_reached',
}

// API interfaces (for potential future backend integration)
export interface AchievementAPI {
  getAchievements: () => Promise<Achievement[]>;
  updateProgress: (achievementId: string, progress: number) => Promise<void>;
  completeAchievement: (achievementId: string) => Promise<void>;
  getUserEngagement: () => Promise<UserEngagement>;
  syncAchievements: (
    localData: AchievementStorage
  ) => Promise<AchievementStorage>;
}
