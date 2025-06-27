/**
 * Engagement Tracker Service
 * Tracks user interactions, session time, and app usage patterns
 */

import { AppState, AppStateStatus } from 'react-native';
import { TrackedFeature } from '../../types/achievements';
import AchievementService from './AchievementService';

interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  featuresUsed: Set<TrackedFeature>;
  interactions: number;
}

class EngagementTracker {
  private static instance: EngagementTracker;
  private achievementService: AchievementService;
  private currentSession: SessionData | null = null;
  private appStateSubscription: any = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT_MINUTES = 30;

  private constructor() {
    this.achievementService = AchievementService.getInstance();
    this.setupAppStateListener();
  }

  static getInstance(): EngagementTracker {
    if (!EngagementTracker.instance) {
      EngagementTracker.instance = new EngagementTracker();
    }
    return EngagementTracker.instance;
  }

  /**
   * Initialize engagement tracking for a user
   */
  async initialize(userId: string): Promise<void> {
    await this.achievementService.initializeForUser(userId);
    await this.startSession();
  }

  /**
   * Set up app state listener for session management
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Handle app state changes (active, background, inactive)
   */
  private async handleAppStateChange(
    nextAppState: AppStateStatus
  ): Promise<void> {
    switch (nextAppState) {
      case 'active':
        // App became active
        if (!this.currentSession) {
          await this.startSession();
        } else {
          // Resume existing session
          this.clearSessionTimeout();
        }
        break;

      case 'background':
      case 'inactive':
        // App went to background
        this.startSessionTimeout();
        break;
    }
  }

  /**
   * Start a new session
   */
  private async startSession(): Promise<void> {
    // End previous session if exists
    if (this.currentSession) {
      await this.endSession();
    }

    const sessionId = this.generateSessionId();
    this.currentSession = {
      sessionId,
      startTime: new Date(),
      featuresUsed: new Set(),
      interactions: 0,
    };

    // Track app open
    await this.trackFeature(TrackedFeature.APP_OPEN);
  }

  /**
   * End current session
   */
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - this.currentSession.startTime.getTime()) /
        (1000 * 60)
    );

    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;

    // Update user engagement data
    const userEngagement = this.achievementService.getUserEngagement();
    if (userEngagement) {
      userEngagement.totalSessionTime += duration;

      // Update monthly stats
      const currentMonth = this.getCurrentMonthString();
      let monthlyStats = userEngagement.monthlyStats.find(
        m => m.month === currentMonth
      );

      if (!monthlyStats) {
        monthlyStats = {
          month: currentMonth,
          appOpens: 0,
          sessionTime: 0,
          featuresUsed: {},
          achievementsEarned: [],
          streakDays: 0,
          financialGoalsMet: 0,
        };
        userEngagement.monthlyStats.push(monthlyStats);
      }

      monthlyStats.sessionTime += duration;

      // Update feature usage in monthly stats
      this.currentSession.featuresUsed.forEach(feature => {
        monthlyStats!.featuresUsed[feature] =
          (monthlyStats!.featuresUsed[feature] || 0) + 1;
      });
    }

    // Clear current session
    this.currentSession = null;
  }

  /**
   * Start session timeout
   */
  private startSessionTimeout(): void {
    this.clearSessionTimeout();
    this.sessionTimeout = setTimeout(
      async () => {
        await this.endSession();
      },
      this.SESSION_TIMEOUT_MINUTES * 60 * 1000
    );
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Track feature usage
   */
  async trackFeature(
    feature: TrackedFeature,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Add to current session
    if (this.currentSession) {
      this.currentSession.featuresUsed.add(feature);
      this.currentSession.interactions += 1;
    }

    // Track in achievement service
    await this.achievementService.trackFeature(feature, {
      ...metadata,
      sessionId: this.currentSession?.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track page/screen view
   */
  async trackScreenView(
    screenName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackFeature(TrackedFeature.APP_OPEN, {
      screenName,
      ...metadata,
    });
  }

  /**
   * Track user interaction (button press, form submission, etc.)
   */
  async trackInteraction(
    interactionType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.currentSession) {
      this.currentSession.interactions += 1;
    }

    // Map interaction types to tracked features
    let feature: TrackedFeature | null = null;

    switch (interactionType) {
      case 'transaction_categorize':
        feature = TrackedFeature.TRANSACTION_CATEGORIZE;
        break;
      case 'budget_create':
        feature = TrackedFeature.BUDGET_CREATE;
        break;
      case 'budget_view':
        feature = TrackedFeature.BUDGET_VIEW;
        break;
      case 'credit_card_add':
        feature = TrackedFeature.CREDIT_CARD_ADD;
        break;
      case 'payment_optimize':
        feature = TrackedFeature.PAYMENT_OPTIMIZE;
        break;
      case 'education_module_start':
        feature = TrackedFeature.EDUCATION_MODULE_START;
        break;
      case 'education_module_complete':
        feature = TrackedFeature.EDUCATION_MODULE_COMPLETE;
        break;
      case 'qa_question_ask':
        feature = TrackedFeature.QA_QUESTION_ASK;
        break;
      case 'statement_upload':
        feature = TrackedFeature.STATEMENT_UPLOAD;
        break;
      case 'export_data':
        feature = TrackedFeature.EXPORT_DATA;
        break;
      case 'achievement_view':
        feature = TrackedFeature.ACHIEVEMENT_VIEW;
        break;
      case 'achievement_share':
        feature = TrackedFeature.ACHIEVEMENT_SHARE;
        break;
    }

    if (feature) {
      await this.trackFeature(feature, metadata);
    }
  }

  /**
   * Track time spent on specific features
   */
  async trackFeatureTime(feature: string, duration: number): Promise<void> {
    // Could be used for detailed analytics
    const metadata = {
      feature,
      timeSpent: duration,
      sessionId: this.currentSession?.sessionId,
    };

    // This could trigger specific achievements based on time spent
    if (duration > 300) {
      // 5 minutes
      // User spent significant time on feature
      console.log(`User spent ${duration} seconds on ${feature}`);
    }
  }

  /**
   * Get current session data
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionDuration: number;
    featuresUsed: number;
    interactions: number;
  } {
    if (!this.currentSession) {
      return { sessionDuration: 0, featuresUsed: 0, interactions: 0 };
    }

    const duration = Math.round(
      (new Date().getTime() - this.currentSession.startTime.getTime()) /
        (1000 * 60)
    );

    return {
      sessionDuration: duration,
      featuresUsed: this.currentSession.featuresUsed.size,
      interactions: this.currentSession.interactions,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current month string (YYYY-MM)
   */
  private getCurrentMonthString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Force end current session (for testing or manual cleanup)
   */
  async forceEndSession(): Promise<void> {
    await this.endSession();
  }

  /**
   * Get engagement summary for current month
   */
  getCurrentMonthEngagement(): {
    appOpens: number;
    sessionTime: number;
    featuresUsed: Record<string, number>;
    currentStreak: number;
  } {
    const userEngagement = this.achievementService.getUserEngagement();
    const streakData = this.achievementService.getStreakData();

    if (!userEngagement) {
      return {
        appOpens: 0,
        sessionTime: 0,
        featuresUsed: {},
        currentStreak: 0,
      };
    }

    const currentMonth = this.getCurrentMonthString();
    const monthlyStats = userEngagement.monthlyStats.find(
      m => m.month === currentMonth
    );

    return {
      appOpens: monthlyStats?.appOpens || 0,
      sessionTime: monthlyStats?.sessionTime || 0,
      featuresUsed: monthlyStats?.featuresUsed || {},
      currentStreak: streakData?.currentStreak || 0,
    };
  }

  /**
   * Cleanup - remove listeners
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.clearSessionTimeout();

    // End current session
    if (this.currentSession) {
      this.endSession();
    }
  }
}

export default EngagementTracker;
