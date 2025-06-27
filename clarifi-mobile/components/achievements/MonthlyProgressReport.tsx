import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { useAchievements } from '../../context/AchievementContext';
import { useStreakTracking } from '../../hooks/useStreakTracking';
import { useFinancialAchievements } from '../../hooks/useFinancialAchievements';
import {
  Achievement,
  AchievementCategory,
  AchievementStatus,
} from '../../types/achievements';

const { width: screenWidth } = Dimensions.get('window');

interface MonthlyProgressData {
  month: string;
  year: number;
  monthName: string;
  achievementsEarned: Achievement[];
  totalPointsEarned: number;
  streaksData: {
    averageStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    streakBreaks: number;
  };
  financialMetrics: {
    totalSaved: number;
    budgetCompliance: number;
    transactionsTracked: number;
    savingsGoalProgress: number;
  };
  categoryBreakdown: {
    [category in AchievementCategory]: {
      achievementsEarned: number;
      pointsEarned: number;
      progress: number;
    };
  };
  comparisonToPrevious: {
    achievementsDelta: number;
    pointsDelta: number;
    savingsDelta: number;
    streakDelta: number;
    improvementAreas: string[];
    strongAreas: string[];
  };
  personalizedInsights: {
    achievements: string[];
    recommendations: string[];
    motivationalMessages: string[];
    upcomingGoals: string[];
  };
}

interface MonthlyProgressReportProps {
  month?: string; // YYYY-MM format, defaults to current month
  onNavigateBack?: () => void;
}

export const MonthlyProgressReport: React.FC<MonthlyProgressReportProps> = ({
  month,
  onNavigateBack,
}) => {
  const { achievements, totalPoints } = useAchievements();
  const { streakData } = useStreakTracking();
  const { userStatistics } = useFinancialAchievements();

  const [reportData, setReportData] = useState<MonthlyProgressData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<
    'achievements' | 'points' | 'streaks' | 'savings'
  >('achievements');

  useEffect(() => {
    generateReport();
  }, [month, achievements, streakData, userStatistics]);

  const generateReport = async () => {
    try {
      setLoading(true);

      const targetMonth = month || getCurrentMonth();
      const [year, monthNumber] = targetMonth.split('-').map(Number);
      const monthName = getMonthName(monthNumber - 1);

      // Filter achievements for the month
      const monthlyAchievements = achievements.filter(
        achievement => achievement.status === AchievementStatus.COMPLETED
      );

      // Calculate metrics
      const totalPointsEarned = monthlyAchievements.reduce(
        (sum, ach) => sum + ach.points,
        0
      );

      // Generate category breakdown
      const categoryBreakdown = generateCategoryBreakdown(
        monthlyAchievements,
        achievements
      );

      // Calculate streaks data
      const monthlyStreaksData = {
        averageStreak: streakData?.currentStreak || 0,
        longestStreak: streakData?.bestStreak || 0,
        totalActiveDays: Math.min(streakData?.currentStreak || 0, 31),
        streakBreaks: 0,
      };

      // Calculate financial metrics
      const financialMetrics = {
        totalSaved: userStatistics?.totalSaved || 0,
        budgetCompliance: 85, // Mock data
        transactionsTracked: userStatistics?.totalTransactions || 0,
        savingsGoalProgress: 70, // Mock data
      };

      // Generate insights
      const personalizedInsights = generateInsights(
        monthlyAchievements,
        categoryBreakdown,
        monthlyStreaksData,
        financialMetrics
      );

      const data: MonthlyProgressData = {
        month: targetMonth,
        year,
        monthName,
        achievementsEarned: monthlyAchievements,
        totalPointsEarned,
        streaksData: monthlyStreaksData,
        financialMetrics,
        categoryBreakdown,
        comparisonToPrevious: {
          achievementsDelta: 2,
          pointsDelta: 150,
          savingsDelta: 200,
          streakDelta: 3,
          improvementAreas: ['Budget Tracking'],
          strongAreas: ['Daily Habits', 'Achievement Completion'],
        },
        personalizedInsights,
      };

      setReportData(data);
    } catch (error) {
      console.error('Error generating monthly report:', error);
      Alert.alert('Error', 'Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonth = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthName = (monthIndex: number): string => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthIndex];
  };

  const generateCategoryBreakdown = (
    monthlyAchievements: Achievement[],
    allAchievements: Achievement[]
  ) => {
    const categories = Object.values(AchievementCategory);
    const breakdown = {} as MonthlyProgressData['categoryBreakdown'];

    categories.forEach(category => {
      const categoryMonthlyAchievements = monthlyAchievements.filter(
        a => a.category === category
      );
      const categoryAllAchievements = allAchievements.filter(
        a => a.category === category
      );
      const categoryCompletedAchievements = categoryAllAchievements.filter(
        a => a.status === AchievementStatus.COMPLETED
      );

      breakdown[category] = {
        achievementsEarned: categoryMonthlyAchievements.length,
        pointsEarned: categoryMonthlyAchievements.reduce(
          (sum, a) => sum + a.points,
          0
        ),
        progress:
          categoryAllAchievements.length > 0
            ? (categoryCompletedAchievements.length /
                categoryAllAchievements.length) *
              100
            : 0,
      };
    });

    return breakdown;
  };

  const generateInsights = (
    achievementsEarned: Achievement[],
    categoryBreakdown: MonthlyProgressData['categoryBreakdown'],
    streaksData: MonthlyProgressData['streaksData'],
    financialMetrics: MonthlyProgressData['financialMetrics']
  ): MonthlyProgressData['personalizedInsights'] => {
    const achievements = [];
    const recommendations = [];
    const motivationalMessages = [];
    const upcomingGoals = [];

    if (achievementsEarned.length > 0) {
      achievements.push(
        `Unlocked ${achievementsEarned.length} achievement${achievementsEarned.length > 1 ? 's' : ''} this month!`
      );
    }

    if (streaksData.totalActiveDays >= 20) {
      achievements.push('Excellent consistency with 20+ active days!');
    }

    if (streaksData.totalActiveDays < 15) {
      recommendations.push(
        'Try to maintain daily engagement to build stronger habits.'
      );
    }

    if (financialMetrics.budgetCompliance < 80) {
      recommendations.push(
        'Consider reviewing your budget categories for better tracking accuracy.'
      );
    }

    motivationalMessages.push(
      'Every step forward is progress worth celebrating!'
    );
    if (achievementsEarned.length >= 3) {
      motivationalMessages.push("You're building incredible momentum!");
    }

    upcomingGoals.push('Complete your next achievement milestone');
    upcomingGoals.push('Maintain your daily engagement streak');

    return {
      achievements,
      recommendations,
      motivationalMessages,
      upcomingGoals,
    };
  };

  const getCategoryDisplayName = (category: AchievementCategory): string => {
    const displayNames = {
      [AchievementCategory.CONSISTENCY]: 'Daily Habits',
      [AchievementCategory.BUDGETING]: 'Budget Management',
      [AchievementCategory.TRANSACTIONS]: 'Spending Tracking',
      [AchievementCategory.FINANCIAL_HEALTH]: 'Financial Health',
      [AchievementCategory.EDUCATION]: 'Financial Learning',
      [AchievementCategory.CREDIT_MANAGEMENT]: 'Credit Building',
    };
    return displayNames[category] || category;
  };

  const getCategoryColor = (index: number): string => {
    const colors = [
      '#4DABF7',
      '#69DB7C',
      '#FFD43B',
      '#FF8CC8',
      '#9775FA',
      '#FF6B6B',
    ];
    return colors[index % colors.length];
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {reportData
          ? `${reportData.monthName} ${reportData.year} Report`
          : 'Monthly Report'}
      </Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderOverviewCards = () => {
    if (!reportData) return null;

    const cards = [
      {
        title: 'Achievements',
        value: reportData.achievementsEarned.length.toString(),
        subtitle: 'completed',
        icon: 'trophy',
        color: '#4DABF7',
        delta: reportData.comparisonToPrevious.achievementsDelta,
      },
      {
        title: 'Points',
        value: reportData.totalPointsEarned.toString(),
        subtitle: 'earned',
        icon: 'star',
        color: '#FFD43B',
        delta: reportData.comparisonToPrevious.pointsDelta,
      },
      {
        title: 'Active Days',
        value: reportData.streaksData.totalActiveDays.toString(),
        subtitle: 'this month',
        icon: 'calendar',
        color: '#69DB7C',
        delta: reportData.comparisonToPrevious.streakDelta,
      },
      {
        title: 'Savings',
        value: `$${Math.round(reportData.financialMetrics.totalSaved).toLocaleString()}`,
        subtitle: 'tracked',
        icon: 'wallet',
        color: '#FF8CC8',
        delta: reportData.comparisonToPrevious.savingsDelta,
      },
    ];

    return (
      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <View style={styles.cardsRow}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={card.title}
              style={[styles.overviewCard, { borderLeftColor: card.color }]}
              onPress={() => setSelectedMetric(card.title.toLowerCase() as any)}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name={card.icon as any}
                  size={20}
                  color={card.color}
                />
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              {card.delta !== 0 && (
                <View style={styles.deltaContainer}>
                  <Ionicons
                    name={card.delta > 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={card.delta > 0 ? '#28a745' : '#dc3545'}
                  />
                  <Text
                    style={[
                      styles.deltaText,
                      { color: card.delta > 0 ? '#28a745' : '#dc3545' },
                    ]}
                  >
                    {Math.abs(card.delta)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCategoryChart = () => {
    if (!reportData) return null;

    const chartData = Object.entries(reportData.categoryBreakdown)
      .filter(([_, data]) => data.achievementsEarned > 0)
      .map(([category, data], index) => ({
        name: getCategoryDisplayName(category as AchievementCategory),
        population: data.achievementsEarned,
        color: getCategoryColor(index),
        legendFontColor: '#333',
        legendFontSize: 12,
      }));

    if (chartData.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>
              No achievements yet this month
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    );
  };

  const renderProgressChart = () => {
    if (!reportData) return null;

    const progressData = Object.entries(reportData.categoryBreakdown).map(
      ([category, data]) => ({
        category: getCategoryDisplayName(category as AchievementCategory),
        progress: data.progress,
      })
    );

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Category Progress</Text>
        <View style={styles.progressBars}>
          {progressData.map((item, index) => (
            <View key={item.category} style={styles.progressBarItem}>
              <Text style={styles.progressLabel}>{item.category}</Text>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor: getCategoryColor(index),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressValue}>
                {Math.round(item.progress)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    if (!reportData) return null;

    const { personalizedInsights } = reportData;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Your Progress Insights</Text>

        {personalizedInsights.achievements.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionTitle}>🏆 Achievements</Text>
            {personalizedInsights.achievements.map((achievement, index) => (
              <Text key={index} style={styles.insightText}>
                • {achievement}
              </Text>
            ))}
          </View>
        )}

        {personalizedInsights.motivationalMessages.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionTitle}>💪 Motivation</Text>
            {personalizedInsights.motivationalMessages.map((message, index) => (
              <Text key={index} style={styles.insightText}>
                • {message}
              </Text>
            ))}
          </View>
        )}

        {personalizedInsights.recommendations.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionTitle}>💡 Recommendations</Text>
            {personalizedInsights.recommendations.map(
              (recommendation, index) => (
                <Text key={index} style={styles.insightText}>
                  • {recommendation}
                </Text>
              )
            )}
          </View>
        )}

        {personalizedInsights.upcomingGoals.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightSectionTitle}>🎯 Upcoming Goals</Text>
            {personalizedInsights.upcomingGoals.map((goal, index) => (
              <Text key={index} style={styles.insightText}>
                • {goal}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderComparison = () => {
    if (!reportData) return null;

    const { comparisonToPrevious } = reportData;

    return (
      <View style={styles.comparisonContainer}>
        <Text style={styles.sectionTitle}>vs. Previous Month</Text>

        {comparisonToPrevious.strongAreas.length > 0 && (
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonSectionTitle}>✅ Strong Areas</Text>
            {comparisonToPrevious.strongAreas.map((area, index) => (
              <Text key={index} style={styles.comparisonText}>
                • {area}
              </Text>
            ))}
          </View>
        )}

        {comparisonToPrevious.improvementAreas.length > 0 && (
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonSectionTitle}>
              📈 Areas for Improvement
            </Text>
            {comparisonToPrevious.improvementAreas.map((area, index) => (
              <Text key={index} style={styles.comparisonText}>
                • {area}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4DABF7" />
        <Text style={styles.loadingText}>Generating your report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderOverviewCards()}
        {renderCategoryChart()}
        {renderProgressChart()}
        {renderInsights()}
        {renderComparison()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 16,
    color: '#888',
  },
  progressBars: {
    marginTop: 8,
  },
  progressBarItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  insightsContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  insightSection: {
    marginBottom: 20,
  },
  insightSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 4,
  },
  comparisonContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  comparisonSection: {
    marginBottom: 16,
  },
  comparisonSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 4,
  },
  bottomPadding: {
    height: 40,
  },
});

export default MonthlyProgressReport;
