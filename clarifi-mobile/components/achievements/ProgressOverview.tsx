import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { useAchievements } from '../../context/AchievementContext';
import { useStreakTracking } from '../../hooks/useStreakTracking';
import { useFinancialAchievements } from '../../hooks/useFinancialAchievements';
import { AchievementStatus } from '../../types/achievements';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import Icon from '../ui/Icon';
import {
  ChevronRight,
  Star,
  PiggyBank,
  Calendar,
  TrendingUp,
  Flame,
  Snowflake,
} from 'lucide-react-native';

export interface ProgressOverviewProps {
  style?: ViewStyle;
  onStreakPress?: () => void;
  onStatsPress?: () => void;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  style,
  onStreakPress,
  onStatsPress,
}) => {
  const { theme } = useTheme();
  const { achievements, userEngagement } = useAchievements();
  const { streakData } = useStreakTracking();
  const { financialStats } = useFinancialAchievements();

  // Calculate overall progress metrics
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

  // Get progress by tier
  const tierProgress = achievements.reduce(
    (acc, achievement) => {
      const tier = achievement.tier;
      if (!acc[tier]) {
        acc[tier] = { completed: 0, total: 0 };
      }
      acc[tier].total += 1;
      if (achievement.status === AchievementStatus.COMPLETED) {
        acc[tier].completed += 1;
      }
      return acc;
    },
    {} as Record<string, { completed: number; total: number }>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderOverallProgress = () => (
    <Card style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
          Overall Progress
        </Text>
        <View style={styles.progressPercentageContainer}>
          <Text style={[styles.progressPercentage, { color: theme.primary }]}>
            {Math.round(overallProgress * 100)}%
          </Text>
          <Text
            style={[styles.progressSubtitle, { color: theme.textSecondary }]}
          >
            Complete
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

      <View style={styles.progressStats}>
        <Text
          style={[styles.progressStatsText, { color: theme.textSecondary }]}
        >
          {completedAchievements} of {totalAchievements} achievements unlocked
        </Text>
      </View>
    </Card>
  );

  const renderStatsGrid = () => (
    <TouchableOpacity
      style={[styles.statsCard, { backgroundColor: theme.backgroundSecondary }]}
      onPress={onStatsPress}
      activeOpacity={0.8}
    >
      <View style={styles.statsHeader}>
        <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>
          Your Stats
        </Text>
        <Icon name={ChevronRight} size={16} color={theme.textSecondary} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: theme.primary + '20' },
            ]}
          >
            <Icon name={Star} size={20} color={theme.primary} />
          </View>
          <Text style={[styles.statNumber, { color: theme.primary }]}>
            {totalPointsEarned.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Points
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: theme.secondary + '20' },
            ]}
          >
            <Icon name={PiggyBank} size={20} color={theme.secondary} />
          </View>
          <Text style={[styles.statNumber, { color: theme.secondary }]}>
            {formatCurrency(financialStats.totalSaved)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Saved
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: theme.warning + '20' },
            ]}
          >
            <Icon name={Calendar} size={20} color={theme.warning} />
          </View>
          <Text style={[styles.statNumber, { color: theme.warning }]}>
            {userEngagement?.totalAppOpens || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Days Active
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: theme.success + '20' },
            ]}
          >
            <Icon name={TrendingUp} size={20} color={theme.success} />
          </View>
          <Text style={[styles.statNumber, { color: theme.success }]}>
            {Math.round((financialStats.budgetStreak / 30) * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Budget Rate
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStreakCard = () => (
    <TouchableOpacity
      style={[
        styles.streakCard,
        { backgroundColor: theme.backgroundSecondary },
      ]}
      onPress={onStreakPress}
      activeOpacity={0.8}
    >
      <View style={styles.streakHeader}>
        <View style={styles.streakIconContainer}>
          <Icon name={Flame} size={28} color={theme.warning} />
        </View>
        <View style={styles.streakContent}>
          <Text style={[styles.streakTitle, { color: theme.textPrimary }]}>
            Current Streak
          </Text>
          <Text style={[styles.streakDaysText, { color: theme.warning }]}>
            {streakData?.currentStreak || 0} days
          </Text>
          {streakData?.longestStreak && (
            <Text style={[styles.streakBest, { color: theme.textSecondary }]}>
              Best: {streakData.longestStreak} days
            </Text>
          )}
        </View>
        <View style={styles.streakBadges}>
          <View
            style={[
              styles.freezeBadge,
              { backgroundColor: theme.neutral.lighter },
            ]}
          >
            <Icon name={Snowflake} size={12} color={theme.textSecondary} />
            <Text style={[styles.freezeText, { color: theme.textSecondary }]}>
              {streakData?.freezesUsed || 0}/3
            </Text>
          </View>
          <Icon name={ChevronRight} size={16} color={theme.textSecondary} />
        </View>
      </View>

      {/* Streak Progress */}
      <View style={styles.streakProgress}>
        <View style={styles.streakDays}>
          {Array.from({ length: 7 }, (_, index) => {
            const dayIndex = (index + 1) % 7;
            const isActive = dayIndex <= (streakData?.currentStreak || 0) % 7;
            return (
              <View
                key={index}
                style={[
                  styles.streakDay,
                  {
                    backgroundColor: isActive
                      ? theme.warning
                      : theme.neutral.light,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTierProgress = () => (
    <Card style={styles.tierCard}>
      <Text style={[styles.tierTitle, { color: theme.textPrimary }]}>
        Achievement Tiers
      </Text>

      <View style={styles.tiersList}>
        {Object.entries(tierProgress).map(([tier, progress]) => {
          const tierProgress =
            progress.total > 0 ? progress.completed / progress.total : 0;
          const tierColor = getTierColor(tier);

          return (
            <View key={tier} style={styles.tierItem}>
              <View style={styles.tierHeader}>
                <View
                  style={[styles.tierBadge, { backgroundColor: tierColor }]}
                >
                  <Text style={styles.tierBadgeText}>{tier.charAt(0)}</Text>
                </View>
                <Text style={[styles.tierName, { color: theme.textPrimary }]}>
                  {tier}
                </Text>
                <Text
                  style={[styles.tierProgress, { color: theme.textSecondary }]}
                >
                  {progress.completed}/{progress.total}
                </Text>
              </View>
              <ProgressBar
                progress={tierProgress}
                height={6}
                progressColor={tierColor}
                backgroundColor={theme.neutral.light}
                style={styles.tierProgressBar}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'BRONZE':
        return '#CD7F32';
      case 'SILVER':
        return '#C0C0C0';
      case 'GOLD':
        return '#FFD700';
      case 'PLATINUM':
        return '#E5E4E2';
      default:
        return theme.neutral.medium;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderOverallProgress()}
      {renderStatsGrid()}
      {renderStreakCard()}
      {renderTierProgress()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  progressCard: {
    padding: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressPercentageContainer: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressSubtitle: {
    fontSize: 12,
  },
  overallProgressBar: {
    marginBottom: spacing.sm,
  },
  progressStats: {
    alignItems: 'center',
  },
  progressStatsText: {
    fontSize: 14,
  },
  statsCard: {
    padding: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  streakCard: {
    padding: spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  streakDaysText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  streakBest: {
    fontSize: 12,
  },
  streakBadges: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  freezeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  streakProgress: {
    alignItems: 'center',
  },
  streakDays: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  streakDay: {
    width: 32,
    height: 6,
    borderRadius: 3,
  },
  tierCard: {
    padding: spacing.lg,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  tiersList: {
    gap: spacing.md,
  },
  tierItem: {
    gap: spacing.sm,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tierName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  tierProgress: {
    fontSize: 12,
  },
  tierProgressBar: {
    marginLeft: 32,
  },
});

export default ProgressOverview;
