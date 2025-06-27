import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { educationService } from '../../services/education/educationService';
import { colors } from '../../constants/colors';

interface ProgressTrackerProps {
  moduleId?: string;
  showDetailedStats?: boolean;
  compact?: boolean;
}

interface LearningAnalytics {
  totalTimeSpent: number;
  modulesStarted: number;
  modulesCompleted: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  bookmarkedLessons: number;
  streakDays: number;
  lastActivityDate: Date | null;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  moduleId,
  showDetailedStats = false,
  compact = false,
}) => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [moduleTimeSpent, setModuleTimeSpent] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [moduleId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsData = await educationService.getLearningAnalytics();
      setAnalytics(analyticsData);

      if (moduleId) {
        const moduleTime = await educationService.getModuleTimeSpent(moduleId);
        setModuleTimeSpent(moduleTime);
      }
    } catch (error) {
      console.error('Failed to load learning analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading progress...
        </Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          Unable to load progress data
        </Text>
      </View>
    );
  }

  if (compact) {
    const completionPercentage =
      analytics.modulesStarted > 0
        ? (analytics.modulesCompleted / analytics.modulesStarted) * 100
        : 0;

    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <View style={styles.compactStat}>
          <Ionicons
            name="trophy-outline"
            size={16}
            color={getCompletionColor(completionPercentage)}
          />
          <Text style={[styles.compactText, { color: colors.textPrimary }]}>
            {analytics.modulesCompleted}/{analytics.modulesStarted}
          </Text>
        </View>
        <View style={styles.compactStat}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.compactText, { color: colors.textPrimary }]}>
            {formatTime(analytics.totalTimeSpent)}
          </Text>
        </View>
        {analytics.averageQuizScore > 0 && (
          <View style={styles.compactStat}>
            <Ionicons name="star-outline" size={16} color={colors.secondary} />
            <Text style={[styles.compactText, { color: colors.textPrimary }]}>
              {Math.round(analytics.averageQuizScore)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Learning Progress
      </Text>

      {/* Module-specific stats */}
      {moduleId && (
        <View style={styles.moduleSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Current Module
          </Text>
          <View style={styles.statRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.textPrimary }]}>
              Time spent: {formatTime(moduleTimeSpent)}
            </Text>
          </View>
        </View>
      )}

      {/* Overall progress stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Overall Progress
        </Text>

        <View style={styles.statGrid}>
          <View
            style={[
              styles.statItem,
              { backgroundColor: colors.backgroundOffset },
            ]}
          >
            <View style={styles.statHeader}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {analytics.modulesCompleted}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Modules Completed
            </Text>
          </View>

          <View
            style={[
              styles.statItem,
              { backgroundColor: colors.backgroundOffset },
            ]}
          >
            <View style={styles.statHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.success}
              />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {analytics.lessonsCompleted}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Lessons Completed
            </Text>
          </View>

          <View
            style={[
              styles.statItem,
              { backgroundColor: colors.backgroundOffset },
            ]}
          >
            <View style={styles.statHeader}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatTime(analytics.totalTimeSpent)}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Time
            </Text>
          </View>

          {analytics.quizzesCompleted > 0 && (
            <View
              style={[
                styles.statItem,
                { backgroundColor: colors.backgroundOffset },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="star-outline"
                  size={20}
                  color={colors.warning}
                />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {Math.round(analytics.averageQuizScore)}%
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg Quiz Score
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Additional stats if detailed view is enabled */}
      {showDetailedStats && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Additional Stats
          </Text>

          <View style={styles.detailStats}>
            {analytics.bookmarkedLessons > 0 && (
              <View style={styles.detailStatRow}>
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color={colors.secondary}
                />
                <Text
                  style={[styles.detailStatText, { color: colors.textPrimary }]}
                >
                  {analytics.bookmarkedLessons} lessons bookmarked
                </Text>
              </View>
            )}

            {analytics.quizzesCompleted > 0 && (
              <View style={styles.detailStatRow}>
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.detailStatText, { color: colors.textPrimary }]}
                >
                  {analytics.quizzesCompleted} quizzes completed
                </Text>
              </View>
            )}

            {analytics.lastActivityDate && (
              <View style={styles.detailStatRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.detailStatText, { color: colors.textPrimary }]}
                >
                  Last activity:{' '}
                  {analytics.lastActivityDate.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  compactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  moduleSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailStats: {
    gap: 8,
  },
  detailStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailStatText: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ProgressTracker;
