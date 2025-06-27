/**
 * This file defines the TypeScript interfaces for the data structures stored locally.
 * These correspond to the schemas outlined in the MVP features, specifically
 * for AsyncStorage usage (Features 3, 4, 5, 7, 8, 9).
 */

// From Feature 3: Instant Budget Dashboard & Insights
export interface Transaction {
  id: string; // UUID
  date: string; // ISO date string, e.g., YYYY-MM-DD
  amount: number;
  category_id: string; // Corresponds to Category.id
  category_name?: string; // Denormalized for easier display
  merchant_name?: string;
  description: string;
  notes?: string; // Additional user notes about the transaction
  is_recurring?: boolean;
  user_verified?: boolean; // If user explicitly categorized or confirmed
  statement_import_id?: string; // Link to the import batch
  tags?: string[];
  ai_confidence?: number; // AI categorization confidence (0-100)
  // local_update_timestamp?: number; // For syncing if needed later
}

export interface MonthlySummary {
  total_income: number;
  total_expenses: number;
  by_category: { [category_id: string]: number };
  by_day: { [day_of_month: number]: number }; // Spending per day
  top_merchants: Array<{ name: string; amount: number; count: number }>;
  insights_generated: Insight[];
  // version: number; // For data structure versioning if schema changes
}

export interface TransactionsForMonth {
  items: Transaction[];
  summary: MonthlySummary;
  // version: number;
}

export interface Budget {
  category_id: string;
  amount: number;
  // period: 'monthly' | 'weekly'; // Default monthly
}

export interface BudgetAlert {
  id: string;
  category_id: string;
  threshold_percent: number; // e.g., 80 for 80%
  last_triggered?: string; // ISO timestamp
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string; // ISO date string
  // associated_account?: string; // Future linking to specific savings accounts
}

export interface Insight {
  id: string;
  type: 'saving_opportunity' | 'unusual_spend' | 'trend' | 'budget_warning';
  priority: 1 | 2 | 3 | 4 | 5; // 1 is highest
  message: string;
  action_data?: any; // e.g., transaction_id, category_id for quick action
  created_at: string; // ISO timestamp
  is_dismissed?: boolean;
}

// From Feature 4: Credit Card Setup & Utilization Tracking
export interface CreditCard {
  id: string; // UUID
  nickname: string;
  last_four: string;
  credit_limit: number;
  statement_day: number; // Day of month (1-31)
  payment_due_days: number; // Days after statement_day the payment is due
  apr?: number; // Optional, for interest calculations
  bank_name: string; // e.g., 'TD', 'RBC'
  color_tag?: string; // Hex color for UI theming
  is_active: boolean;
  created_at: string; // ISO timestamp
  current_balance: number; // User-updated or from statement
  last_statement_balance?: number;
  last_payment?: {
    amount: number;
    date: string; // ISO timestamp
  };
  notification_preferences?: CardNotificationPreferences; // New per-card settings
  // notes?: string;
}

// New interface for per-card notification preferences
export interface CardNotificationPreferences {
  enabled: boolean;
  utilization_alerts?: {
    enabled: boolean;
    threshold: number; // Override global threshold, e.g., 70 for 70%
    custom_thresholds?: number[]; // Multiple thresholds: [50, 70, 90]
  };
  payment_reminders?: {
    enabled: boolean;
    days_before: number[]; // e.g., [7, 3, 1] for multiple reminders
    due_date_reminder: boolean;
    overdue_alerts: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    start_hour: number; // 0-23, overrides global quiet hours
    end_hour: number; // 0-23
  };
  notification_channels?: {
    push: boolean; // Mobile push notifications
    email: boolean; // Email alerts (requires server-side)
    sms: boolean; // SMS alerts (requires server-side)
  };
  priority_overrides?: {
    critical_bypass_quiet_hours: boolean; // Allow critical alerts during quiet hours
    high_priority_bypass_quiet_hours: boolean; // Allow high priority during quiet hours
  };
  optimization_suggestions?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly'; // How often to suggest optimizations
  };
  achievement_notifications?: {
    enabled: boolean;
    types: (
      | 'payment_streak'
      | 'utilization_improvement'
      | 'spending_reduction'
    )[];
  };
}

export interface UtilizationHistoryEntry {
  date: string; // YYYY-MM-DD
  balance: number;
  utilization: number; // Percentage
  was_statement_date: boolean;
}

export interface UtilizationData {
  [card_id: string]: {
    [YYYY_MM_DD: string]: UtilizationHistoryEntry;
  };
}

export interface UtilizationSettings {
  target_overall_utilization: number; // Default 30%
  alert_individual_card_threshold: number; // Default 70%
  optimization_strategy:
    | 'minimize_interest'
    | 'maximize_credit_score'
    | 'snowball'
    | 'avalanche';
  notification_days_before_statement: number; // Default 3
}

// From Feature 5: Proactive Credit Utilization Alerts
export interface ScheduledNotification {
  id: string; // Local notification identifier
  card_id?: string; // If card-specific
  type:
    | 'utilization_warning'
    | 'payment_due'
    | 'optimization_suggestion'
    | 'streak_reminder'
    | 'achievement_unlocked';
  scheduled_for: string; // ISO timestamp
  content: {
    title: string;
    body: string;
    data?: any; // For deep linking or context
  };
  local_notification_trigger_id?: string; // Platform-specific ID for cancellation
  status:
    | 'pending'
    | 'delivered'
    | 'interacted'
    | 'failed_local'
    | 'server_backup_sent';
  created_at: string; // ISO timestamp
}

export interface NotificationPreferences {
  enabled: boolean;
  quiet_hours?: { start_hour: number; end_hour: number }; // 0-23
  preferred_time_hour?: number; // 0-23, for non-critical alerts
  days_before_statement_alert: number;
  min_utilization_for_alert: number; // e.g. 50 for 50%
}

// From Feature 7: Basic Newcomer Financial Education
export interface EducationModuleProgress {
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  chapters_completed: string[]; // Array of chapter IDs
  quiz_scores?: Array<{ attempt: number; score: number; date: string }>;
  time_spent_minutes?: number;
  last_position?: { chapter_id: string; scroll_position_percent?: number };
}

export interface OverallEducationStats {
  modules_completed: number;
  total_time_minutes: number;
  last_accessed_module?: string;
  current_streak_days?: number;
}

// From Feature 8: AI-Powered Q&A
export interface AIUsageStats {
  current_month_queries: number; // YYYY-MM format for key, or just track current
  query_limit_per_month: number;
  last_query_timestamp?: string; // ISO timestamp
  // query_history?: Array<{timestamp: string, tokens_used: number, cached: boolean}>;
}

// From Feature 9: Monthly Cycle & Progress View
export interface Streaks {
  current_app_usage_streak: number;
  longest_app_usage_streak: number;
  last_active_date: string; // YYYY-MM-DD
  // streak_history?: Array<{ start_date: string, end_date: string, days: number }>;
}

export interface Achievement {
  id: string; // e.g., 'first_budget_created', 'utilization_master'
  name: string;
  description: string;
  icon_name: string; // For local icon mapping
  points?: number;
  earned_date?: string; // ISO timestamp, if earned
  // progress_current?: number;
  // progress_target?: number;
}

export interface MonthlyUserStats {
  // [YYYY_MM: string] -> to store historical monthly stats
  budget_adherence_percent?: number;
  avg_credit_utilization?: number;
  total_savings_amount?: number;
  categories_optimized_count?: number;
  insights_actioned_count?: number;
  education_modules_completed_this_month?: string[];
}

// General App Settings
export interface AppSettings {
  user_id?: string; // Supabase User ID, once authenticated
  preferred_language: 'en' | 'fr';
  is_biometric_enabled: boolean;
  theme: 'light' | 'dark' | 'system';
  onboarding_completed: boolean;
  // last_backup_timestamp?: string; // For potential cloud backup feature
}

// This is just a console log to confirm the file is loaded during development.
console.log('services/storage/dataModels.ts loaded');

export {}; // Ensures this is treated as a module if no other exports are present initially
