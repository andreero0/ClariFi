/**
 * Support Analytics Service
 * Aggregates analytics data from all support services for dashboard display
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HelpContentService,
  HelpArticle,
  FAQ,
  SearchResult,
} from './HelpContentService';
import {
  FeedbackService,
  FeedbackSummary,
  ContentAnalytics,
} from './FeedbackService';

export interface SupportMetrics {
  selfServiceResolutionRate: number;
  totalHelpContentViews: number;
  averageHelpfulnessScore: number;
  contentNeedingReviewCount: number;
  mostViewedArticles: Array<{
    id: string;
    title: string;
    category: string;
    views: number;
    helpfulnessScore: number;
  }>;
  searchAnalytics: {
    totalSearches: number;
    successfulSearches: number;
    commonSearchTerms: Array<{
      term: string;
      count: number;
      successRate: number;
    }>;
    failedSearchTerms: Array<{ term: string; count: number }>;
  };
  categoryPerformance: Array<{
    category: string;
    articleCount: number;
    totalViews: number;
    averageHelpfulness: number;
    needsAttention: boolean;
  }>;
  timeSeriesData: {
    dailyViews: Array<{
      date: string;
      views: number;
      searches: number;
      feedback: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      resolutionRate: number;
      satisfaction: number;
    }>;
  };
}

export interface SupportTicketAnalytics {
  totalTickets: number;
  ticketsByCategory: Record<string, number>;
  ticketsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  resolutionTimeByCategory: Record<string, number>;
  ticketVolumeByHour: Array<{ hour: number; count: number }>;
  recentTickets: Array<{
    id: string;
    category: string;
    severity: string;
    status: string;
    createdAt: string;
    estimatedResolution: string;
  }>;
  trends: {
    thisWeek: number;
    lastWeek: number;
    percentageChange: number;
  };
}

export interface ContentGapAnalysis {
  unsuccessfulSearches: Array<{
    query: string;
    frequency: number;
    suggestedContent: string;
  }>;
  missingTopics: Array<{
    topic: string;
    relatedTickets: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  improvementOpportunities: Array<{
    contentId: string;
    type: 'article' | 'faq';
    title: string;
    currentScore: number;
    potentialImpact: 'high' | 'medium' | 'low';
    suggestedActions: string[];
  }>;
}

export interface DashboardAlert {
  id: string;
  type:
    | 'content_quality'
    | 'search_failure'
    | 'ticket_volume'
    | 'resolution_time';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
}

export class SupportAnalyticsService {
  private static readonly ANALYTICS_STORAGE_KEY = 'clarifi_support_analytics';
  private static readonly SEARCH_TRACKING_KEY = 'clarifi_search_tracking';
  private static readonly TICKET_ANALYTICS_KEY = 'clarifi_ticket_analytics';
  private static readonly ALERTS_STORAGE_KEY = 'clarifi_dashboard_alerts';

  // Alert Thresholds
  private static readonly HELPFULNESS_THRESHOLD = 0.7; // 70%
  private static readonly SEARCH_SUCCESS_THRESHOLD = 0.8; // 80%
  private static readonly RESOLUTION_TIME_THRESHOLD = 24; // 24 hours

  /**
   * Get comprehensive support metrics for dashboard
   */
  static async getSupportMetrics(): Promise<SupportMetrics> {
    await HelpContentService.initialize();

    const categories = await HelpContentService.getCategories();
    const allArticles: HelpArticle[] = [];

    // Collect all articles from all categories
    for (const category of categories) {
      const articles = await HelpContentService.getArticlesByCategory(
        category.id
      );
      allArticles.push(...articles);
    }

    const feedbackOverview = await FeedbackService.getFeedbackOverview();
    const searchAnalytics = await this.getSearchAnalytics();
    const timeSeriesData = await this.getTimeSeriesData();

    // Calculate self-service resolution rate
    const totalInteractions = allArticles.reduce(
      (sum, article) => sum + article.views,
      0
    );
    const helpfulInteractions =
      feedbackOverview.totalFeedback *
      (feedbackOverview.helpfulPercentage / 100);
    const selfServiceResolutionRate =
      totalInteractions > 0
        ? (helpfulInteractions / totalInteractions) * 100
        : 0;

    // Get most viewed articles with helpfulness scores
    const mostViewedArticles =
      await this.getMostViewedArticlesWithScores(allArticles);

    // Analyze category performance
    const categoryPerformance =
      await this.analyzeCategoryPerformance(categories);

    return {
      selfServiceResolutionRate,
      totalHelpContentViews: allArticles.reduce(
        (sum, article) => sum + article.views,
        0
      ),
      averageHelpfulnessScore: feedbackOverview.helpfulPercentage,
      contentNeedingReviewCount: feedbackOverview.contentNeedingReview,
      mostViewedArticles,
      searchAnalytics,
      categoryPerformance,
      timeSeriesData,
    };
  }

  /**
   * Get support ticket analytics
   */
  static async getTicketAnalytics(): Promise<SupportTicketAnalytics> {
    const storedData = await this.getStoredTicketData();

    // Calculate trends
    const thisWeek = storedData.recentTickets.filter(ticket =>
      this.isThisWeek(new Date(ticket.createdAt))
    ).length;

    const lastWeek = storedData.recentTickets.filter(ticket =>
      this.isLastWeek(new Date(ticket.createdAt))
    ).length;

    const percentageChange =
      lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return {
      ...storedData,
      trends: {
        thisWeek,
        lastWeek,
        percentageChange,
      },
    };
  }

  /**
   * Perform content gap analysis
   */
  static async getContentGapAnalysis(): Promise<ContentGapAnalysis> {
    const searchData = await this.getSearchAnalytics();
    const contentNeedingReview =
      await FeedbackService.getContentNeedingReview();

    // Analyze unsuccessful searches
    const unsuccessfulSearches = searchData.failedSearchTerms.map(term => ({
      query: term.term,
      frequency: term.count,
      suggestedContent: this.generateContentSuggestion(term.term),
    }));

    // Identify missing topics based on failed searches and tickets
    const missingTopics = this.identifyMissingTopics(unsuccessfulSearches);

    // Generate improvement opportunities
    const improvementOpportunities =
      await this.generateImprovementOpportunities(contentNeedingReview);

    return {
      unsuccessfulSearches,
      missingTopics,
      improvementOpportunities,
    };
  }

  /**
   * Get active dashboard alerts
   */
  static async getDashboardAlerts(): Promise<DashboardAlert[]> {
    const storedAlerts = await this.getStoredAlerts();
    const currentAlerts = await this.generateCurrentAlerts();

    // Merge and deduplicate alerts
    const allAlerts = [...storedAlerts, ...currentAlerts];
    const uniqueAlerts = allAlerts.filter(
      (alert, index, self) =>
        index ===
        self.findIndex(a => a.type === alert.type && a.title === alert.title)
    );

    // Sort by severity and creation date
    return uniqueAlerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Track search interaction for analytics
   */
  static async trackSearchInteraction(
    query: string,
    results: SearchResult[],
    clickedResult?: SearchResult
  ): Promise<void> {
    const searchData = await this.getStoredSearchData();
    const timestamp = new Date().toISOString();

    const searchEntry = {
      query: query.toLowerCase().trim(),
      timestamp,
      resultCount: results.length,
      successful: results.length > 0,
      clicked: !!clickedResult,
      clickedResultId: clickedResult?.item.id,
      clickedResultType: clickedResult?.type,
    };

    searchData.searches.push(searchEntry);

    // Keep only last 1000 searches for performance
    if (searchData.searches.length > 1000) {
      searchData.searches = searchData.searches.slice(-1000);
    }

    await AsyncStorage.setItem(
      this.SEARCH_TRACKING_KEY,
      JSON.stringify(searchData)
    );
  }

  /**
   * Record support ticket for analytics
   */
  static async recordSupportTicket(ticket: {
    id: string;
    category: string;
    severity: string;
    status: string;
    createdAt: string;
    estimatedResolution: string;
  }): Promise<void> {
    const ticketData = await this.getStoredTicketData();

    ticketData.totalTickets += 1;
    ticketData.ticketsByCategory[ticket.category] =
      (ticketData.ticketsByCategory[ticket.category] || 0) + 1;
    ticketData.ticketsBySeverity[ticket.severity] =
      (ticketData.ticketsBySeverity[ticket.severity] || 0) + 1;

    ticketData.recentTickets.unshift(ticket);

    // Keep only last 100 tickets
    if (ticketData.recentTickets.length > 100) {
      ticketData.recentTickets = ticketData.recentTickets.slice(0, 100);
    }

    await AsyncStorage.setItem(
      this.TICKET_ANALYTICS_KEY,
      JSON.stringify(ticketData)
    );
  }

  /**
   * Export analytics data
   */
  static async exportAnalyticsData(
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const supportMetrics = await this.getSupportMetrics();
    const ticketAnalytics = await this.getTicketAnalytics();
    const gapAnalysis = await this.getContentGapAnalysis();
    const alerts = await this.getDashboardAlerts();

    const exportData = {
      exportDate: new Date().toISOString(),
      supportMetrics,
      ticketAnalytics,
      gapAnalysis,
      alerts,
    };

    if (format === 'csv') {
      return this.convertAnalyticsToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  // Private helper methods

  private static async getMostViewedArticlesWithScores(
    articles: HelpArticle[]
  ): Promise<
    Array<{
      id: string;
      title: string;
      category: string;
      views: number;
      helpfulnessScore: number;
    }>
  > {
    const articlesWithScores = await Promise.all(
      articles.map(async article => {
        const analytics = await FeedbackService.getContentAnalytics(
          article.id,
          'article'
        );
        return {
          id: article.id,
          title: article.title,
          category: article.category,
          views: article.views,
          helpfulnessScore: analytics?.helpfulnessScore || 0,
        };
      })
    );

    return articlesWithScores.sort((a, b) => b.views - a.views).slice(0, 10);
  }

  private static async analyzeCategoryPerformance(categories: any[]): Promise<
    Array<{
      category: string;
      articleCount: number;
      totalViews: number;
      averageHelpfulness: number;
      needsAttention: boolean;
    }>
  > {
    const performance = await Promise.all(
      categories.map(async category => {
        const articles = await HelpContentService.getArticlesByCategory(
          category.id
        );
        const totalViews = articles.reduce(
          (sum, article) => sum + article.views,
          0
        );

        // Calculate average helpfulness
        let totalHelpfulness = 0;
        let articlesWithFeedback = 0;

        for (const article of articles) {
          const analytics = await FeedbackService.getContentAnalytics(
            article.id,
            'article'
          );
          if (analytics && analytics.helpfulnessScore !== undefined) {
            totalHelpfulness += analytics.helpfulnessScore;
            articlesWithFeedback++;
          }
        }

        const averageHelpfulness =
          articlesWithFeedback > 0
            ? totalHelpfulness / articlesWithFeedback
            : 0;

        return {
          category: category.title,
          articleCount: articles.length,
          totalViews,
          averageHelpfulness,
          needsAttention: averageHelpfulness < this.HELPFULNESS_THRESHOLD,
        };
      })
    );

    return performance.sort((a, b) => b.totalViews - a.totalViews);
  }

  private static async getSearchAnalytics(): Promise<{
    totalSearches: number;
    successfulSearches: number;
    commonSearchTerms: Array<{
      term: string;
      count: number;
      successRate: number;
    }>;
    failedSearchTerms: Array<{ term: string; count: number }>;
  }> {
    const searchData = await this.getStoredSearchData();
    const searches = searchData.searches;

    const totalSearches = searches.length;
    const successfulSearches = searches.filter(s => s.successful).length;

    // Analyze search terms
    const termCounts: Record<string, { total: number; successful: number }> =
      {};

    searches.forEach(search => {
      const term = search.query;
      if (!termCounts[term]) {
        termCounts[term] = { total: 0, successful: 0 };
      }
      termCounts[term].total++;
      if (search.successful) {
        termCounts[term].successful++;
      }
    });

    // Create common and failed search terms
    const commonSearchTerms = Object.entries(termCounts)
      .map(([term, counts]) => ({
        term,
        count: counts.total,
        successRate: counts.total > 0 ? counts.successful / counts.total : 0,
      }))
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const failedSearchTerms = Object.entries(termCounts)
      .map(([term, counts]) => ({
        term,
        count: counts.total,
      }))
      .filter(item => termCounts[item.term].successful === 0 && item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches,
      successfulSearches,
      commonSearchTerms,
      failedSearchTerms,
    };
  }

  private static async getTimeSeriesData(): Promise<{
    dailyViews: Array<{
      date: string;
      views: number;
      searches: number;
      feedback: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      resolutionRate: number;
      satisfaction: number;
    }>;
  }> {
    // This would typically come from stored time-series data
    // For now, return mock data structure
    const dailyViews = this.generateMockDailyData();
    const weeklyTrends = this.generateMockWeeklyData();

    return {
      dailyViews,
      weeklyTrends,
    };
  }

  private static generateMockDailyData(): Array<{
    date: string;
    views: number;
    searches: number;
    feedback: number;
  }> {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 50,
        searches: Math.floor(Math.random() * 30) + 10,
        feedback: Math.floor(Math.random() * 20) + 5,
      });
    }

    return data;
  }

  private static generateMockWeeklyData(): Array<{
    week: string;
    resolutionRate: number;
    satisfaction: number;
  }> {
    const data = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);

      data.push({
        week: `Week of ${date.toISOString().split('T')[0]}`,
        resolutionRate: 0.7 + Math.random() * 0.25,
        satisfaction: 0.75 + Math.random() * 0.2,
      });
    }

    return data;
  }

  private static generateContentSuggestion(searchTerm: string): string {
    // Simple logic to suggest content based on search terms
    const suggestions: Record<string, string> = {
      budget: 'Create comprehensive budgeting guide for Canadian users',
      investment: 'Add investment basics and TFSA/RRSP guidance',
      tax: 'Develop tax preparation and deduction articles',
      credit: 'Expand credit building and repair content',
      bank: 'Add bank-specific connection and troubleshooting guides',
      sync: 'Create detailed transaction sync troubleshooting',
      category: 'Expand transaction categorization help content',
    };

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (searchTerm.includes(key)) {
        return suggestion;
      }
    }

    return `Create content addressing "${searchTerm}" queries`;
  }

  private static identifyMissingTopics(unsuccessfulSearches: any[]): Array<{
    topic: string;
    relatedTickets: number;
    priority: 'high' | 'medium' | 'low';
  }> {
    // Group searches by topic and determine priority
    const topicGroups: Record<string, number> = {};

    unsuccessfulSearches.forEach(search => {
      const topic = this.extractTopicFromQuery(search.query);
      topicGroups[topic] = (topicGroups[topic] || 0) + search.frequency;
    });

    return Object.entries(topicGroups)
      .map(([topic, frequency]) => ({
        topic,
        relatedTickets: frequency,
        priority:
          frequency > 5
            ? 'high'
            : frequency > 2
              ? 'medium'
              : ('low' as 'high' | 'medium' | 'low'),
      }))
      .sort((a, b) => b.relatedTickets - a.relatedTickets);
  }

  private static extractTopicFromQuery(query: string): string {
    const topics = [
      'budgeting',
      'investment',
      'tax',
      'credit',
      'banking',
      'sync',
      'categorization',
      'troubleshooting',
      'account',
      'privacy',
    ];

    for (const topic of topics) {
      if (query.toLowerCase().includes(topic)) {
        return topic;
      }
    }

    return 'general';
  }

  private static async generateImprovementOpportunities(
    contentNeedingReview: FeedbackSummary[]
  ): Promise<
    Array<{
      contentId: string;
      type: 'article' | 'faq';
      title: string;
      currentScore: number;
      potentialImpact: 'high' | 'medium' | 'low';
      suggestedActions: string[];
    }>
  > {
    return contentNeedingReview.map(content => {
      const impact =
        content.totalFeedback > 20
          ? 'high'
          : content.totalFeedback > 10
            ? 'medium'
            : 'low';

      const suggestedActions = [
        'Review and update content based on user feedback',
        'Check for outdated information or broken links',
        'Consider adding more detailed examples',
        'Improve readability and structure',
      ];

      if (content.recentComments.length > 0) {
        suggestedActions.unshift(
          'Address specific issues mentioned in user comments'
        );
      }

      return {
        contentId: content.contentId,
        type: content.contentType,
        title: content.title,
        currentScore: content.helpfulPercentage / 100,
        potentialImpact: impact as 'high' | 'medium' | 'low',
        suggestedActions,
      };
    });
  }

  private static async generateCurrentAlerts(): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];
    const supportMetrics = await this.getSupportMetrics();
    const searchAnalytics = await this.getSearchAnalytics();

    // Check helpfulness threshold
    if (
      supportMetrics.averageHelpfulnessScore <
      this.HELPFULNESS_THRESHOLD * 100
    ) {
      alerts.push({
        id: `alert_helpfulness_${Date.now()}`,
        type: 'content_quality',
        severity: 'medium',
        title: 'Low Content Helpfulness Score',
        description: `Average helpfulness score (${supportMetrics.averageHelpfulnessScore.toFixed(1)}%) is below threshold`,
        actionRequired: 'Review and improve low-performing content',
        threshold: this.HELPFULNESS_THRESHOLD * 100,
        currentValue: supportMetrics.averageHelpfulnessScore,
        createdAt: new Date().toISOString(),
      });
    }

    // Check search success rate
    const searchSuccessRate =
      searchAnalytics.totalSearches > 0
        ? searchAnalytics.successfulSearches / searchAnalytics.totalSearches
        : 1;

    if (searchSuccessRate < this.SEARCH_SUCCESS_THRESHOLD) {
      alerts.push({
        id: `alert_search_success_${Date.now()}`,
        type: 'search_failure',
        severity: 'high',
        title: 'Low Search Success Rate',
        description: `Search success rate (${(searchSuccessRate * 100).toFixed(1)}%) indicates content gaps`,
        actionRequired: 'Analyze failed searches and create missing content',
        threshold: this.SEARCH_SUCCESS_THRESHOLD * 100,
        currentValue: searchSuccessRate * 100,
        createdAt: new Date().toISOString(),
      });
    }

    return alerts;
  }

  private static async getStoredSearchData(): Promise<{ searches: any[] }> {
    try {
      const data = await AsyncStorage.getItem(this.SEARCH_TRACKING_KEY);
      return data ? JSON.parse(data) : { searches: [] };
    } catch {
      return { searches: [] };
    }
  }

  private static async getStoredTicketData(): Promise<SupportTicketAnalytics> {
    try {
      const data = await AsyncStorage.getItem(this.TICKET_ANALYTICS_KEY);
      return data
        ? JSON.parse(data)
        : {
            totalTickets: 0,
            ticketsByCategory: {},
            ticketsBySeverity: {},
            averageResolutionTime: 0,
            resolutionTimeByCategory: {},
            ticketVolumeByHour: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              count: 0,
            })),
            recentTickets: [],
            trends: { thisWeek: 0, lastWeek: 0, percentageChange: 0 },
          };
    } catch {
      return {
        totalTickets: 0,
        ticketsByCategory: {},
        ticketsBySeverity: {},
        averageResolutionTime: 0,
        resolutionTimeByCategory: {},
        ticketVolumeByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: 0,
        })),
        recentTickets: [],
        trends: { thisWeek: 0, lastWeek: 0, percentageChange: 0 },
      };
    }
  }

  private static async getStoredAlerts(): Promise<DashboardAlert[]> {
    try {
      const data = await AsyncStorage.getItem(this.ALERTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static isThisWeek(date: Date): boolean {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return date >= startOfWeek;
  }

  private static isLastWeek(date: Date): boolean {
    const now = new Date();
    const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    return date >= startOfLastWeek && date < startOfThisWeek;
  }

  private static convertAnalyticsToCSV(data: any): string {
    // Simplified CSV conversion - in production this would be more comprehensive
    const headers = ['Metric', 'Value', 'Category', 'Date'];
    const rows = [headers.join(',')];

    // Add support metrics
    rows.push(
      `Self-Service Resolution Rate,${data.supportMetrics.selfServiceResolutionRate}%,General,${data.exportDate}`
    );
    rows.push(
      `Total Help Content Views,${data.supportMetrics.totalHelpContentViews},General,${data.exportDate}`
    );
    rows.push(
      `Average Helpfulness Score,${data.supportMetrics.averageHelpfulnessScore}%,General,${data.exportDate}`
    );

    // Add ticket metrics
    rows.push(
      `Total Support Tickets,${data.ticketAnalytics.totalTickets},Tickets,${data.exportDate}`
    );
    rows.push(
      `Average Resolution Time,${data.ticketAnalytics.averageResolutionTime}h,Tickets,${data.exportDate}`
    );

    return rows.join('\n');
  }
}
