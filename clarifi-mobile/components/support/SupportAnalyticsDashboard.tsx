/**
 * Support Analytics Dashboard
 * Displays comprehensive support metrics and insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  SupportAnalyticsService,
  SupportMetrics,
} from '../../services/support/SupportAnalyticsService';
import { Ionicons } from '@expo/vector-icons';

interface SupportAnalyticsDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export default function SupportAnalyticsDashboard({
  visible,
  onClose,
}: SupportAnalyticsDashboardProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supportMetrics, setSupportMetrics] = useState<SupportMetrics | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      loadAnalyticsData();
    }
  }, [visible]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const metrics = await SupportAnalyticsService.getSupportMetrics();
      setSupportMetrics(metrics);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  if (!visible) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Support Analytics
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading analytics...
            </Text>
          </View>
        ) : (
          supportMetrics && (
            <View style={styles.metricsContainer}>
              {/* Key Metrics */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Key Metrics
                </Text>

                <View style={styles.metricRow}>
                  <View style={styles.metric}>
                    <Text
                      style={[styles.metricValue, { color: theme.primary }]}
                    >
                      {supportMetrics.selfServiceResolutionRate.toFixed(1)}%
                    </Text>
                    <Text
                      style={[
                        styles.metricLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Self-Service Resolution
                    </Text>
                  </View>

                  <View style={styles.metric}>
                    <Text
                      style={[styles.metricValue, { color: theme.primary }]}
                    >
                      {supportMetrics.totalHelpContentViews}
                    </Text>
                    <Text
                      style={[
                        styles.metricLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Total Content Views
                    </Text>
                  </View>
                </View>

                <View style={styles.metricRow}>
                  <View style={styles.metric}>
                    <Text
                      style={[styles.metricValue, { color: theme.primary }]}
                    >
                      {supportMetrics.averageHelpfulnessScore.toFixed(1)}%
                    </Text>
                    <Text
                      style={[
                        styles.metricLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Avg Helpfulness Score
                    </Text>
                  </View>

                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: '#ff6b6b' }]}>
                      {supportMetrics.contentNeedingReviewCount}
                    </Text>
                    <Text
                      style={[
                        styles.metricLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Content Needs Review
                    </Text>
                  </View>
                </View>
              </View>

              {/* Most Viewed Articles */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Top Performing Articles
                </Text>
                {supportMetrics.mostViewedArticles
                  .slice(0, 5)
                  .map((article, index) => (
                    <View
                      key={article.id}
                      style={[
                        styles.articleItem,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <View style={styles.articleInfo}>
                        <Text
                          style={[styles.articleTitle, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {article.title}
                        </Text>
                        <Text
                          style={[
                            styles.articleCategory,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {article.category} • {article.views} views
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.helpfulnessScore,
                          { color: theme.primary },
                        ]}
                      >
                        {(article.helpfulnessScore * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ))}
              </View>

              {/* Search Analytics */}
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Search Analytics
                </Text>

                <View style={styles.searchStats}>
                  <View style={styles.searchStat}>
                    <Text
                      style={[styles.searchStatValue, { color: theme.primary }]}
                    >
                      {supportMetrics.searchAnalytics.totalSearches}
                    </Text>
                    <Text
                      style={[
                        styles.searchStatLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Total Searches
                    </Text>
                  </View>

                  <View style={styles.searchStat}>
                    <Text
                      style={[
                        styles.searchStatValue,
                        { color: theme.success || '#4caf50' },
                      ]}
                    >
                      {supportMetrics.searchAnalytics.successfulSearches}
                    </Text>
                    <Text
                      style={[
                        styles.searchStatLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Successful
                    </Text>
                  </View>

                  <View style={styles.searchStat}>
                    <Text
                      style={[styles.searchStatValue, { color: theme.primary }]}
                    >
                      {supportMetrics.searchAnalytics.totalSearches > 0
                        ? (
                            (supportMetrics.searchAnalytics.successfulSearches /
                              supportMetrics.searchAnalytics.totalSearches) *
                            100
                          ).toFixed(1)
                        : '0'}
                      %
                    </Text>
                    <Text
                      style={[
                        styles.searchStatLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Success Rate
                    </Text>
                  </View>
                </View>

                {/* Common Search Terms */}
                {supportMetrics.searchAnalytics.commonSearchTerms.length >
                  0 && (
                  <View style={styles.searchTerms}>
                    <Text
                      style={[styles.subsectionTitle, { color: theme.text }]}
                    >
                      Popular Search Terms
                    </Text>
                    {supportMetrics.searchAnalytics.commonSearchTerms
                      .slice(0, 5)
                      .map((term, index) => (
                        <View key={index} style={styles.searchTerm}>
                          <Text
                            style={[
                              styles.searchTermText,
                              { color: theme.text },
                            ]}
                          >
                            "{term.term}"
                          </Text>
                          <Text
                            style={[
                              styles.searchTermCount,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {term.count} searches (
                            {(term.successRate * 100).toFixed(0)}% success)
                          </Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>

              {/* Category Performance */}
              {supportMetrics.categoryPerformance &&
                supportMetrics.categoryPerformance.length > 0 && (
                  <View
                    style={[styles.section, { backgroundColor: theme.card }]}
                  >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Category Performance
                    </Text>
                    {supportMetrics.categoryPerformance.map(
                      (category, index) => (
                        <View
                          key={index}
                          style={[
                            styles.categoryItem,
                            { borderBottomColor: theme.border },
                          ]}
                        >
                          <View style={styles.categoryInfo}>
                            <Text
                              style={[
                                styles.categoryName,
                                { color: theme.text },
                              ]}
                            >
                              {category.category}
                            </Text>
                            <Text
                              style={[
                                styles.categoryStats,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {category.articleCount} articles •{' '}
                              {category.totalViews} views
                            </Text>
                          </View>
                          <View style={styles.categoryMetrics}>
                            <Text
                              style={[
                                styles.categoryScore,
                                {
                                  color: category.needsAttention
                                    ? '#ff6b6b'
                                    : theme.success || '#4caf50',
                                },
                              ]}
                            >
                              {(category.averageHelpfulness * 100).toFixed(0)}%
                            </Text>
                            {category.needsAttention && (
                              <Ionicons
                                name="warning"
                                size={16}
                                color="#ff6b6b"
                              />
                            )}
                          </View>
                        </View>
                      )
                    )}
                  </View>
                )}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  metricsContainer: {
    padding: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  articleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  articleInfo: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  articleCategory: {
    fontSize: 12,
  },
  helpfulnessScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  searchStat: {
    alignItems: 'center',
  },
  searchStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  searchTerms: {
    marginTop: 8,
  },
  searchTerm: {
    marginBottom: 8,
  },
  searchTermText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchTermCount: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryStats: {
    fontSize: 12,
  },
  categoryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryScore: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});
