/**
 * Feedback Collection Service for ClariFi Help Content
 * Collects user feedback on help articles and FAQs to improve content quality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Feedback {
  id: string;
  contentId: string;
  contentType: 'article' | 'faq';
  rating: 'helpful' | 'not-helpful';
  comment?: string;
  category?: string;
  timestamp: string;
  userId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
  };
  sessionId?: string;
}

export interface FeedbackSummary {
  contentId: string;
  contentType: 'article' | 'faq';
  title: string;
  category: string;
  totalFeedback: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulPercentage: number;
  averageRating: number;
  needsReview: boolean;
  recentComments: string[];
  lastUpdated: string;
}

export interface ContentAnalytics {
  contentId: string;
  views: number;
  feedbackCount: number;
  helpfulnessScore: number;
  engagementRate: number;
  searchAppearances: number;
  searchClickThroughs: number;
  relatedContentViews: number;
  improvementPriority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
}

export class FeedbackService {
  private static readonly FEEDBACK_STORAGE_KEY = 'clarifi_help_feedback';
  private static readonly ANALYTICS_STORAGE_KEY = 'clarifi_content_analytics';
  private static readonly REVIEW_THRESHOLD = 0.3; // 30% not helpful triggers review
  private static readonly MIN_FEEDBACK_FOR_REVIEW = 5;

  /**
   * Submit feedback for help content
   */
  static async submitFeedback(
    feedback: Omit<Feedback, 'id' | 'timestamp'>
  ): Promise<string> {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const completeFeedback: Feedback = {
      ...feedback,
      id: feedbackId,
      timestamp: new Date().toISOString(),
      sessionId: await this.getSessionId(),
      deviceInfo: await this.getDeviceInfo(),
    };

    await this.storeFeedback(completeFeedback);
    await this.updateContentAnalytics(
      feedback.contentId,
      feedback.contentType,
      'feedback'
    );

    // Send to backend if connected
    try {
      await this.syncFeedbackToBackend(completeFeedback);
    } catch (error) {
      console.log('Feedback stored locally, will sync when connected');
    }

    return feedbackId;
  }

  /**
   * Get feedback summary for specific content
   */
  static async getFeedbackSummary(
    contentId: string,
    contentType: 'article' | 'faq'
  ): Promise<FeedbackSummary | null> {
    const allFeedback = await this.getAllFeedback();
    const contentFeedback = allFeedback.filter(
      f => f.contentId === contentId && f.contentType === contentType
    );

    if (contentFeedback.length === 0) {
      return null;
    }

    const helpfulCount = contentFeedback.filter(
      f => f.rating === 'helpful'
    ).length;
    const notHelpfulCount = contentFeedback.filter(
      f => f.rating === 'not-helpful'
    ).length;
    const totalFeedback = contentFeedback.length;
    const helpfulPercentage =
      totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0;
    const needsReview = this.shouldContentBeReviewed(
      helpfulCount,
      notHelpfulCount,
      totalFeedback
    );

    // Get recent comments (last 5)
    const recentComments = contentFeedback
      .filter(f => f.comment && f.comment.trim() !== '')
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 5)
      .map(f => f.comment!);

    return {
      contentId,
      contentType,
      title: await this.getContentTitle(contentId, contentType),
      category: contentFeedback[0]?.category || 'unknown',
      totalFeedback,
      helpfulCount,
      notHelpfulCount,
      helpfulPercentage,
      averageRating: helpfulPercentage / 100,
      needsReview,
      recentComments,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get all content that needs review
   */
  static async getContentNeedingReview(): Promise<FeedbackSummary[]> {
    const allFeedback = await this.getAllFeedback();
    const contentGroups = this.groupFeedbackByContent(allFeedback);
    const summaries: FeedbackSummary[] = [];

    for (const [key, feedback] of contentGroups.entries()) {
      const [contentId, contentType] = key.split('|');
      const summary = await this.getFeedbackSummary(
        contentId,
        contentType as 'article' | 'faq'
      );

      if (summary && summary.needsReview) {
        summaries.push(summary);
      }
    }

    return summaries.sort((a, b) => a.helpfulPercentage - b.helpfulPercentage);
  }

  /**
   * Get comprehensive content analytics
   */
  static async getContentAnalytics(
    contentId: string,
    contentType: 'article' | 'faq'
  ): Promise<ContentAnalytics | null> {
    const storedAnalytics = await this.getStoredAnalytics();
    const key = `${contentId}|${contentType}`;
    const analytics = storedAnalytics[key];

    if (!analytics) {
      return null;
    }

    const feedbackSummary = await this.getFeedbackSummary(
      contentId,
      contentType
    );
    const helpfulnessScore = feedbackSummary?.helpfulPercentage || 0;
    const engagementRate =
      analytics.views > 0
        ? (analytics.feedbackCount / analytics.views) * 100
        : 0;

    // Calculate improvement priority
    const improvementPriority = this.calculateImprovementPriority(
      helpfulnessScore,
      engagementRate,
      analytics.views,
      feedbackSummary?.totalFeedback || 0
    );

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(
      helpfulnessScore,
      engagementRate,
      analytics.views,
      feedbackSummary
    );

    return {
      contentId,
      views: analytics.views,
      feedbackCount: analytics.feedbackCount,
      helpfulnessScore: helpfulnessScore / 100,
      engagementRate: engagementRate / 100,
      searchAppearances: analytics.searchAppearances || 0,
      searchClickThroughs: analytics.searchClickThroughs || 0,
      relatedContentViews: analytics.relatedContentViews || 0,
      improvementPriority,
      suggestedActions,
    };
  }

  /**
   * Track content view for analytics
   */
  static async trackContentView(
    contentId: string,
    contentType: 'article' | 'faq',
    source: 'search' | 'category' | 'related' | 'direct' = 'direct'
  ): Promise<void> {
    await this.updateContentAnalytics(contentId, contentType, 'view', {
      source,
    });
  }

  /**
   * Track search interaction
   */
  static async trackSearchInteraction(
    contentId: string,
    contentType: 'article' | 'faq',
    action: 'appear' | 'click'
  ): Promise<void> {
    await this.updateContentAnalytics(
      contentId,
      contentType,
      action === 'appear' ? 'search_appear' : 'search_click'
    );
  }

  /**
   * Export feedback data for analysis
   */
  static async exportFeedbackData(
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const allFeedback = await this.getAllFeedback();
    const analytics = await this.getStoredAnalytics();

    const exportData = {
      feedback: allFeedback,
      analytics: analytics,
      exportDate: new Date().toISOString(),
      totalFeedbackEntries: allFeedback.length,
      contentAnalyzed: Object.keys(analytics).length,
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(allFeedback);
    }
  }

  /**
   * Get feedback statistics overview
   */
  static async getFeedbackOverview(): Promise<{
    totalFeedback: number;
    helpfulPercentage: number;
    contentNeedingReview: number;
    mostHelpfulContent: Array<{ id: string; type: string; score: number }>;
    leastHelpfulContent: Array<{ id: string; type: string; score: number }>;
    categoryBreakdown: Record<string, { helpful: number; notHelpful: number }>;
  }> {
    const allFeedback = await this.getAllFeedback();
    const contentGroups = this.groupFeedbackByContent(allFeedback);

    const totalFeedback = allFeedback.length;
    const helpfulCount = allFeedback.filter(f => f.rating === 'helpful').length;
    const helpfulPercentage =
      totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0;

    const contentScores: Array<{ id: string; type: string; score: number }> =
      [];
    const categoryBreakdown: Record<
      string,
      { helpful: number; notHelpful: number }
    > = {};
    let contentNeedingReview = 0;

    for (const [key, feedback] of contentGroups.entries()) {
      const [contentId, contentType] = key.split('|');
      const helpful = feedback.filter(f => f.rating === 'helpful').length;
      const notHelpful = feedback.filter(
        f => f.rating === 'not-helpful'
      ).length;
      const score = feedback.length > 0 ? (helpful / feedback.length) * 100 : 0;

      contentScores.push({ id: contentId, type: contentType, score });

      if (this.shouldContentBeReviewed(helpful, notHelpful, feedback.length)) {
        contentNeedingReview++;
      }

      // Category breakdown
      const category = feedback[0]?.category || 'unknown';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { helpful: 0, notHelpful: 0 };
      }
      categoryBreakdown[category].helpful += helpful;
      categoryBreakdown[category].notHelpful += notHelpful;
    }

    const mostHelpfulContent = contentScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const leastHelpfulContent = contentScores
      .filter(c => c.score < 70) // Only show content with less than 70% helpful
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    return {
      totalFeedback,
      helpfulPercentage,
      contentNeedingReview,
      mostHelpfulContent,
      leastHelpfulContent,
      categoryBreakdown,
    };
  }

  // Private helper methods

  private static async storeFeedback(feedback: Feedback): Promise<void> {
    const existingFeedback = await this.getAllFeedback();
    existingFeedback.push(feedback);
    await AsyncStorage.setItem(
      this.FEEDBACK_STORAGE_KEY,
      JSON.stringify(existingFeedback)
    );
  }

  private static async getAllFeedback(): Promise<Feedback[]> {
    try {
      const stored = await AsyncStorage.getItem(this.FEEDBACK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading feedback:', error);
      return [];
    }
  }

  private static async updateContentAnalytics(
    contentId: string,
    contentType: 'article' | 'faq',
    action: 'view' | 'feedback' | 'search_appear' | 'search_click',
    metadata?: any
  ): Promise<void> {
    const analytics = await this.getStoredAnalytics();
    const key = `${contentId}|${contentType}`;

    if (!analytics[key]) {
      analytics[key] = {
        views: 0,
        feedbackCount: 0,
        searchAppearances: 0,
        searchClickThroughs: 0,
        relatedContentViews: 0,
      };
    }

    switch (action) {
      case 'view':
        analytics[key].views++;
        if (metadata?.source === 'related') {
          analytics[key].relatedContentViews++;
        }
        break;
      case 'feedback':
        analytics[key].feedbackCount++;
        break;
      case 'search_appear':
        analytics[key].searchAppearances++;
        break;
      case 'search_click':
        analytics[key].searchClickThroughs++;
        break;
    }

    await AsyncStorage.setItem(
      this.ANALYTICS_STORAGE_KEY,
      JSON.stringify(analytics)
    );
  }

  private static async getStoredAnalytics(): Promise<Record<string, any>> {
    try {
      const stored = await AsyncStorage.getItem(this.ANALYTICS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading analytics:', error);
      return {};
    }
  }

  private static shouldContentBeReviewed(
    helpful: number,
    notHelpful: number,
    total: number
  ): boolean {
    if (total < this.MIN_FEEDBACK_FOR_REVIEW) {
      return false;
    }

    const notHelpfulPercentage = total > 0 ? notHelpful / total : 0;
    return notHelpfulPercentage >= this.REVIEW_THRESHOLD;
  }

  private static groupFeedbackByContent(
    feedback: Feedback[]
  ): Map<string, Feedback[]> {
    const groups = new Map<string, Feedback[]>();

    feedback.forEach(f => {
      const key = `${f.contentId}|${f.contentType}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(f);
    });

    return groups;
  }

  private static calculateImprovementPriority(
    helpfulnessScore: number,
    engagementRate: number,
    views: number,
    feedbackCount: number
  ): 'high' | 'medium' | 'low' {
    // High priority: Popular content with low helpfulness
    if (views > 100 && helpfulnessScore < 60) {
      return 'high';
    }

    // Medium priority: Moderate usage with issues or high usage with minor issues
    if (
      (views > 50 && helpfulnessScore < 75) ||
      (views > 200 && helpfulnessScore < 80)
    ) {
      return 'medium';
    }

    // Low priority: Everything else
    return 'low';
  }

  private static generateSuggestedActions(
    helpfulnessScore: number,
    engagementRate: number,
    views: number,
    feedbackSummary: FeedbackSummary | null
  ): string[] {
    const actions: string[] = [];

    if (helpfulnessScore < 60) {
      actions.push('Review and rewrite content for clarity');
      actions.push('Add more detailed examples and screenshots');
    }

    if (helpfulnessScore < 40) {
      actions.push('Consider splitting into multiple articles');
      actions.push('Update content with latest app features');
    }

    if (engagementRate < 5 && views > 50) {
      actions.push('Add call-to-action for feedback');
      actions.push('Improve content discoverability');
    }

    if (feedbackSummary && feedbackSummary.recentComments.length > 0) {
      actions.push('Review recent user comments for improvement ideas');
    }

    if (views < 10) {
      actions.push('Improve SEO and categorization');
      actions.push('Add to related articles section');
    }

    return actions;
  }

  private static async getContentTitle(
    contentId: string,
    contentType: 'article' | 'faq'
  ): Promise<string> {
    // This would integrate with HelpContentService to get actual titles
    return `${contentType} ${contentId}`;
  }

  private static async getSessionId(): Promise<string> {
    // Generate or retrieve session ID
    return `session_${Date.now()}`;
  }

  private static async getDeviceInfo(): Promise<{
    platform: string;
    version: string;
  }> {
    // Get device information
    return {
      platform: 'mobile',
      version: '1.0.0',
    };
  }

  private static async syncFeedbackToBackend(
    feedback: Feedback
  ): Promise<void> {
    // Sync feedback to backend analytics service
    // Implementation would depend on backend API
    throw new Error('Backend sync not implemented');
  }

  private static convertToCSV(feedback: Feedback[]): string {
    if (feedback.length === 0) return '';

    const headers = [
      'ID',
      'Content ID',
      'Content Type',
      'Rating',
      'Comment',
      'Category',
      'Timestamp',
      'User ID',
    ];
    const csvRows = [headers.join(',')];

    feedback.forEach(f => {
      const row = [
        f.id,
        f.contentId,
        f.contentType,
        f.rating,
        f.comment ? `"${f.comment.replace(/"/g, '""')}"` : '',
        f.category || '',
        f.timestamp,
        f.userId || '',
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}
