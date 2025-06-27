import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { useAchievements } from '../../context/AchievementContext';
import { useStreakTracking } from '../../hooks/useStreakTracking';
import { useFinancialAchievements } from '../../hooks/useFinancialAchievements';
import {
  AchievementCategory,
  AchievementStatus,
  AchievementTier,
} from '../../types/achievements';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Icon from '../../components/ui/Icon';
import AchievementSharingService from '../../services/achievements/AchievementSharingService';
import {
  BarChart3,
  Share,
  Flame,
  CheckCircle,
  Star,
  Trophy,
  Calculator,
  CreditCard,
  PiggyBank,
  BookOpen,
  TrendingUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
// cardWidth calculation moved inside component to avoid early spacing access

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All', icon: Trophy },
  { key: AchievementCategory.CONSISTENCY, label: 'Streaks', icon: Flame },
  { key: AchievementCategory.BUDGETING, label: 'Budget', icon: Calculator },
  {
    key: AchievementCategory.TRANSACTIONS,
    label: 'Spending',
    icon: CreditCard,
  },
  {
    key: AchievementCategory.FINANCIAL_HEALTH,
    label: 'Savings',
    icon: PiggyBank,
  },
  { key: AchievementCategory.EDUCATION, label: 'Learning', icon: BookOpen },
  {
    key: AchievementCategory.CREDIT_MANAGEMENT,
    label: 'Credit',
    icon: TrendingUp,
  },
];

const TIER_COLORS = {
  [AchievementTier.BRONZE]: '#CD7F32',
  [AchievementTier.SILVER]: '#C0C0C0',
  [AchievementTier.GOLD]: '#FFD700',
  [AchievementTier.PLATINUM]: '#E5E4E2',
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { achievements, userEngagement, getAchievementsByCategory } =
    useAchievements();
  const { streakData } = useStreakTracking();
  const { financialStats } = useFinancialAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate cardWidth inside component to avoid early spacing access
  const cardWidth = (width - spacing.lg * 3) / 2;

  // Filter achievements based on selected category
  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : getAchievementsByCategory(selectedCategory as AchievementCategory);

  // Calculate overall progress
  const completedAchievements = achievements.filter(
    a => a.status === AchievementStatus.COMPLETED
  ).length;
  const totalAchievements = achievements.length;
  const overallProgress =
    totalAchievements > 0 ? completedAchievements / totalAchievements : 0;

  // Calculate total points earned
  const totalPointsEarned = achievements
    .filter(a => a.status === AchievementStatus.COMPLETED)
    .reduce((sum, a) => sum + a.points, 0);

  // Get next achievement to unlock
  const nextAchievement = achievements
    .filter(a => a.status === AchievementStatus.IN_PROGRESS)
    .sort((a, b) => {
      const progressA = calculateAchievementProgress(a);
      const progressB = calculateAchievementProgress(b);
      return progressB - progressA;
    })[0];

  const calculateAchievementProgress = (achievement: any) => {
    if (!achievement.requirements.length) return 0;
    const totalProgress = achievement.requirements.reduce(
      (sum: number, req: any) => {
        const progress = Math.min(req.current / req.target, 1) * 100;
        return sum + progress;
      },
      0
    );
    return totalProgress / achievement.requirements.length;
  };

  const handleShareProgress = async () => {
    try {
      const userStats = {
        totalPoints: totalPointsEarned,
        completedAchievements,
        totalAchievements,
        streakDays: streakData?.currentStreak || 0,
        totalSaved: financialStats?.totalSaved || 0,
      };

      await AchievementSharingService.quickShareProgress(
        achievements,
        userStats
      );
    } catch (error) {
      console.error('Error sharing progress:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Your Achievements
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Track your financial journey milestones
          </Text>
        </View>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/modals/monthly-report')}
          >
            <Icon name={BarChart3} size={20} color="white" />
            <Text style={styles.actionButtonText}>Monthly Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleShareProgress}
          >
            <Icon name={Share} size={20} color="white" />
            <Text style={styles.actionButtonText}>Share Progress</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStatsOverview = () => (
    <Card
      style={
        [
          styles.statsCard,
          { backgroundColor: theme.backgroundSecondary },
        ] as any
      }
    >
      <View style={styles.statsHeader}>
        <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>
          Progress Overview
        </Text>
        <View style={styles.overallProgressContainer}>
          <Text style={[styles.progressPercentage, { color: theme.primary }]}>
            {Math.round(overallProgress * 100)}%
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={overallProgress}
        height={12}
        progressColor={theme.primary}
        backgroundColor={theme.neutral.light}
        style={styles.overallProgressBar}
      />

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {completedAchievements}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Completed
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.secondary }]}>
            {totalPointsEarned.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Points Earned
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.warning }]}>
            {streakData?.currentStreak || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Day Streak
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.success }]}>
            ${financialStats.totalSaved.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Saved
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderStreakDisplay = () => (
    <Card
      style={
        [
          styles.streakCard,
          { backgroundColor: theme.backgroundSecondary },
        ] as any
      }
    >
      <View style={styles.streakHeader}>
        <View style={styles.streakIconContainer}>
          <Icon name={Flame} size={24} color={theme.warning} />
        </View>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakTitle, { color: theme.textPrimary }]}>
            Current Streak
          </Text>
          <Text style={[styles.streakDays, { color: theme.warning }]}>
            {streakData?.currentStreak || 0} days
          </Text>
        </View>
        <View style={styles.streakFreezeBadge}>
          <Text style={[styles.freezeText, { color: theme.textSecondary }]}>
            {streakData?.freezesUsed || 0}/3 freezes
          </Text>
        </View>
      </View>

      {streakData?.longestStreak && (
        <View style={styles.bestStreakContainer}>
          <Text
            style={[styles.bestStreakLabel, { color: theme.textSecondary }]}
          >
            Best Streak: {streakData.longestStreak} days
          </Text>
        </View>
      )}
    </Card>
  );

  const renderNextAchievement = () => {
    if (!nextAchievement) return null;

    const progress = calculateAchievementProgress(nextAchievement);

    return (
      <Card
        style={
          [
            styles.nextAchievementCard,
            { backgroundColor: theme.backgroundSecondary },
          ] as any
        }
      >
        <View style={styles.nextAchievementHeader}>
          <Text
            style={[styles.nextAchievementTitle, { color: theme.textPrimary }]}
          >
            Next Achievement
          </Text>
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: TIER_COLORS[nextAchievement.tier] },
            ]}
          >
            <Text style={styles.tierText}>{nextAchievement.tier}</Text>
          </View>
        </View>

        <Text style={[styles.achievementName, { color: theme.textPrimary }]}>
          {nextAchievement.title}
        </Text>
        <Text
          style={[
            styles.achievementDescription,
            { color: theme.textSecondary },
          ]}
        >
          {nextAchievement.description}
        </Text>

        <View style={styles.progressContainer}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
            {Math.round(progress)}% Complete
          </Text>
          <ProgressBar
            progress={progress / 100}
            height={8}
            progressColor={theme.primary}
            backgroundColor={theme.neutral.light}
          />
        </View>
      </Card>
    );
  };

  const renderCategoryFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScrollView}
      >
        {CATEGORY_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  selectedCategory === filter.key
                    ? theme.primary
                    : theme.backgroundSecondary,
                borderColor:
                  selectedCategory === filter.key
                    ? theme.primary
                    : theme.neutral.light,
              },
            ]}
            onPress={() => setSelectedCategory(filter.key)}
          >
            <Icon
              name={filter.icon}
              size={16}
              color={
                selectedCategory === filter.key
                  ? theme.white
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedCategory === filter.key
                      ? theme.white
                      : theme.textSecondary,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAchievementCard = ({ item: achievement }: { item: any }) => {
    const progress = calculateAchievementProgress(achievement);
    const isCompleted = achievement.status === AchievementStatus.COMPLETED;
    const isLocked = achievement.status === AchievementStatus.LOCKED;

    return (
      <TouchableOpacity
        style={[
          styles.achievementCard,
          {
            width: cardWidth, // Dynamic width calculation
            backgroundColor: theme.backgroundSecondary,
            opacity: isLocked ? 0.6 : 1,
            borderColor: isCompleted
              ? TIER_COLORS[achievement.tier]
              : theme.neutral.light,
            borderWidth: isCompleted ? 2 : 1,
          },
        ]}
        onPress={() => {
          router.push(`/modals/achievement-detail?id=${achievement.id}`);
        }}
      >
        <View style={styles.achievementHeader}>
          <View
            style={[
              styles.achievementIcon,
              {
                backgroundColor: isCompleted
                  ? TIER_COLORS[achievement.tier] + '20'
                  : theme.neutral.light,
              },
            ]}
          >
            <Icon
              name={achievement.icon}
              size={24}
              color={
                isCompleted
                  ? TIER_COLORS[achievement.tier]
                  : theme.textSecondary
              }
            />
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Icon name={CheckCircle} size={16} color={theme.success} />
            </View>
          )}
        </View>

        <Text
          style={[styles.achievementTitle, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {achievement.title}
        </Text>

        <Text
          style={[styles.achievementDesc, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>

        <View style={styles.achievementFooter}>
          <View style={styles.pointsContainer}>
            <Icon name={Star} size={12} color={theme.warning} />
            <Text style={[styles.pointsText, { color: theme.textSecondary }]}>
              {achievement.points} pts
            </Text>
          </View>

          {!isCompleted && !isLocked && (
            <View style={styles.progressFooter}>
              <Text
                style={[styles.progressText, { color: theme.textSecondary }]}
              >
                {Math.round(progress)}%
              </Text>
              <ProgressBar
                progress={progress / 100}
                height={4}
                progressColor={theme.primary}
                backgroundColor={theme.neutral.light}
                style={styles.miniProgressBar}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {renderHeader()}
        {renderStatsOverview()}
        {renderStreakDisplay()}
        {renderNextAchievement()}
        {renderCategoryFilters()}

        <View style={styles.achievementsGrid}>
          <FlatList
            data={filteredAchievements}
            renderItem={renderAchievementCard}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginLeft: spacing.md,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  overallProgressContainer: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  overallProgressBar: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  streakCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  streakDays: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakFreezeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  freezeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bestStreakContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bestStreakLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  nextAchievementCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  nextAchievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextAchievementTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  filtersContainer: {
    paddingVertical: spacing.md,
  },
  filtersScrollView: {
    paddingHorizontal: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  achievementsGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  gridContainer: {
    gap: spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  achievementCard: {
    // width will be set dynamically in component
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
    minHeight: 34, // Ensure consistent height
  },
  achievementDesc: {
    fontSize: 12,
    marginBottom: spacing.md,
    minHeight: 30, // Ensure consistent height
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 11,
    marginLeft: spacing.xs,
  },
  progressFooter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 2,
  },
  miniProgressBar: {
    width: 40,
    alignSelf: 'flex-end',
  },
});
