/**
 * Handles analytics event tracking using PostHog.
 * For MVP, this will be basic event tracking. PostHog is chosen for its generous free tier
 * and feature set including event tracking, session replay (optional), and feature flags.
 */

// To use PostHog, you would install the library:
// For React Native: `npx expo install posthog-react-native`
// And for web (if any): `npm install posthog-js`

/*
import { PostHog } from 'posthog-react-native';
// or for web: import posthog from 'posthog-js';

// Ensure this is your actual PostHog API key and host
// It's best to load these from environment variables or a config file.
const POSTHOG_API_KEY = 'YOUR_POSTHOG_API_KEY';
const POSTHOG_HOST = 'https://app.posthog.com'; // or your self-hosted instance

let posthogInitialized = false;

export const initializeAnalytics = async (): Promise<void> => {
  if (!POSTHOG_API_KEY || POSTHOG_API_KEY === 'YOUR_POSTHOG_API_KEY') {
    console.warn('[Analytics] PostHog API Key not configured. Analytics will be disabled.');
    return;
  }
  try {
    // For React Native:
    await PostHog.initAsync(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Opt-in to session replay, or leave it disabled by default for privacy.
      // capture σύμφωναReplay: false, 
      // Ensure GDPR compliance if needed, e.g. by disabling autocapture or IP collection if not handled by PostHog settings
    });
    posthogInitialized = true;
    console.log('[Analytics] PostHog initialized successfully.');

    // For web:
    // posthog.init(POSTHOG_API_KEY, {
    //   api_host: POSTHOG_HOST,
    //   // loaded: (ph) => { posthogInitialized = true; console.log('[Analytics] PostHog loaded.'); },
    // });

  } catch (e) {
    console.error('[Analytics] Error initializing PostHog:', e);
  }
};

// --- User Identification ---
export const identifyUser = (userId: string, traits?: Record<string, any>): void => {
  if (!posthogInitialized) return;
  try {
    PostHog.identify(userId, traits);
    // posthog.identify(userId, traits); // Web
  } catch (e) {
    console.error('[Analytics] Error identifying user:', e);
  }
};

export const resetAnalyticsUser = (): void => {
  if (!posthogInitialized) return;
  try {
    PostHog.reset();
    // posthog.reset(); // Web
  } catch (e) {
    console.error('[Analytics] Error resetting user:', e);
  }
};

// --- Event Tracking ---
// Standardize event names for consistency
export enum AnalyticEvents {
  // Onboarding
  ONBOARDING_STARTED = 'Onboarding Started',
  ONBOARDING_STEP_COMPLETED = 'Onboarding Step Completed', // + props: { step_name: string }
  ONBOARDING_COMPLETED = 'Onboarding Completed',
  BANK_SELECTED = 'Bank Selected', // + props: { bank_name: string }
  STATEMENT_UPLOAD_SUCCESS = 'Statement Upload Success',
  STATEMENT_UPLOAD_FAILED = 'Statement Upload Failed', // + props: { error: string }
  BIOMETRIC_SETUP_COMPLETED = 'Biometric Setup Completed',

  // Core App Usage
  APP_OPENED = 'App Opened',
  SCREEN_VIEWED = 'Screen Viewed', // + props: { screen_name: string }
  DASHBOARD_VIEWED = 'Dashboard Viewed',
  CARDS_VIEWED = 'Cards Viewed',
  INSIGHTS_VIEWED = 'Insights Viewed',
  PROFILE_VIEWED = 'Profile Viewed',
  
  // Transactions & Categories
  TRANSACTION_CATEGORIZED_AUTO = 'Transaction Categorized Automatically',
  TRANSACTION_CATEGORIZED_MANUAL = 'Transaction Categorized Manually',
  CATEGORY_CORRECTION = 'Category Correction', // + props: { old_category: string, new_category: string }
  MERCHANT_CACHE_HIT = 'Merchant Cache Hit',
  MERCHANT_CACHE_MISS = 'Merchant Cache Miss',

  // Budgeting
  BUDGET_CREATED = 'Budget Created',
  BUDGET_UPDATED = 'Budget Updated',
  BUDGET_DELETED = 'Budget Deleted',
  BUDGET_ALERT_TRIGGERED = 'Budget Alert Triggered',

  // Credit Cards
  CREDIT_CARD_ADDED = 'Credit Card Added',
  CREDIT_CARD_UPDATED = 'Credit Card Updated',
  CREDIT_CARD_REMOVED = 'Credit Card Removed',
  UTILIZATION_ALERT_TRIGGERED = 'Utilization Alert Triggered',
  PAYMENT_REMINDER_SET = 'Payment Reminder Set',
  OPTIMIZATION_PLAN_VIEWED = 'Optimization Plan Viewed',
  OPTIMIZATION_PLAN_SHARED = 'Optimization Plan Shared',

  // Notifications
  NOTIFICATION_SCHEDULED = 'Notification Scheduled', // + props: { type: string }
  NOTIFICATION_RECEIVED = 'Notification Received',
  NOTIFICATION_INTERACTED = 'Notification Interacted', // + props: { action: string }

  // Education
  EDUCATION_MODULE_STARTED = 'Education Module Started', // + props: { module_id: string }
  EDUCATION_MODULE_COMPLETED = 'Education Module Completed',
  EDUCATION_QUIZ_COMPLETED = 'Education Quiz Completed', // + props: { score: number }

  // AI Chat
  AI_CHAT_QUERY_SENT = 'AI Chat Query Sent',
  AI_CHAT_FAQ_HIT = 'AI Chat FAQ Hit',
  AI_CHAT_LLM_QUERY = 'AI Chat LLM Query',
  AI_CHAT_LIMIT_REACHED = 'AI Chat Limit Reached',

  // Progress & Gamification
  ACHIEVEMENT_UNLOCKED = 'Achievement Unlocked', // + props: { achievement_id: string }
  STREAK_MAINTAINED = 'Streak Maintained', // + props: { streak_days: number }
  STREAK_LOST = 'Streak Lost',

  // Support
  HELP_ARTICLE_VIEWED = 'Help Article Viewed', // + props: { article_id: string }
  HELP_SEARCH_PERFORMED = 'Help Search Performed', // + props: { query: string }
  SUPPORT_TICKET_CREATED = 'Support Ticket Created',
  COMMUNITY_LINK_CLICKED = 'Community Link Clicked',
  
  // Settings
  LANGUAGE_CHANGED = 'Language Changed', // + props: { new_language: string }
  THEME_CHANGED = 'Theme Changed', // + props: { new_theme: string }
}

export const trackEvent = (eventName: AnalyticEvents, properties?: Record<string, any>): void => {
  if (!posthogInitialized) {
    // console.log(`[Analytics] Event (not sent): ${eventName}`, properties || '');
    return;
  }
  try {
    PostHog.capture(eventName, properties);
    // posthog.capture(eventName, properties); // Web
  } catch (e) {
    console.error(`[Analytics] Error tracking event ${eventName}:`, e);
  }
};

// --- Feature Flags ---
// Example: Check a feature flag for premium features
export const isFeatureEnabled = async (flagKey: string): Promise<boolean> => {
  if (!posthogInitialized) return false; // Default to false if PostHog not ready
  try {
    const isEnabled = await PostHog.isFeatureEnabled(flagKey);
    // const isEnabled = posthog.isFeatureEnabled(flagKey); // Web
    return isEnabled ?? false;
  } catch (e) {
    console.error(`[Analytics] Error checking feature flag ${flagKey}:`, e);
    return false;
  }
};

// Call initializeAnalytics() when your app starts, e.g., in your main App.tsx or _layout.tsx
*/

// Placeholder content
export const placeholderAnalytics = () => {
  console.log(
    "Analytics service (PostHog) placeholder. Install 'posthog-react-native' and configure to implement."
  );
};

console.log('services/analytics/posthog.ts loaded (placeholder)');

export {}; // Ensures this is treated as a module
