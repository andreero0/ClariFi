import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { useAchievements } from '../../context/AchievementContext';
import { useStreakTracking } from '../../hooks/useStreakTracking';
import { useFinancialAchievements } from '../../hooks/useFinancialAchievements';
import {
  Achievement,
  AchievementStatus,
  AchievementTier,
  AchievementCategory,
} from '../../types/achievements';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AchievementSharingService from '../../services/achievements/AchievementSharingService';

const { width, height } = Dimensions.get('window');

const TIER_COLORS = {
  [AchievementTier.BRONZE]: '#CD7F32',
  [AchievementTier.SILVER]: '#C0C0C0',
  [AchievementTier.GOLD]: '#FFD700',
  [AchievementTier.PLATINUM]: '#E5E4E2',
};

const CATEGORY_ICONS = {
  [AchievementCategory.CONSISTENCY]: 'flame',
  [AchievementCategory.BUDGETING]: 'calculator',
  [AchievementCategory.TRANSACTIONS]: 'credit-card',
  [AchievementCategory.FINANCIAL_HEALTH]: 'piggy-bank',
  [AchievementCategory.EDUCATION]: 'book-open',
  [AchievementCategory.CREDIT_MANAGEMENT]: 'trending-up',
};

export default function AchievementDetailModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { achievements, getAchievementById } = useAchievements();
  const { streakData } = useStreakTracking();
  const { financialStats } = useFinancialAchievements();

  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrationAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAchievement();
  }, [id]);

  useEffect(() => {
    if (achievement?.status === AchievementStatus.COMPLETED) {
      startCelebrationAnimation();
    }
  }, [achievement]);

  const loadAchievement = async () => {
    try {
      setLoading(true);
      const achievementData = getAchievementById(id);

      if (achievementData) {
        setAchievement(achievementData);
      } else {
        Alert.alert('Error', 'Achievement not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load achievement:', error);
      Alert.alert('Error', 'Failed to load achievement details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startCelebrationAnimation = () => {
    Animated.sequence([
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const calculateProgress = () => {
    if (!achievement?.requirements.length) return 0;
    const totalProgress = achievement.requirements.reduce((sum, req) => {
      const progress = Math.min(req.current / req.target, 1) * 100;
      return sum + progress;
    }, 0);
    return totalProgress / achievement.requirements.length;
  };

  const handleShare = async () => {
    if (!achievement) return;

    try {
      // Prepare user stats for sharing context
      const userStats = {
        totalPoints: achievements.reduce((total, ach) => {
          return ach.status === AchievementStatus.COMPLETED
            ? total + ach.points
            : total;
        }, 0),
        completedAchievements: achievements.filter(
          ach => ach.status === AchievementStatus.COMPLETED
        ).length,
        totalAchievements: achievements.length,
        streakDays: streakData?.currentStreak || 0,
        totalSaved: financialStats?.totalSaved || 0,
      };

      // Use the comprehensive sharing service
      const success = await AchievementSharingService.quickShareToSocial(
        achievement,
        userStats
      );

      if (!success) {
        // If quick share fails or is cancelled, offer custom sharing options
        Alert.alert(
          'Share Achievement',
          "Choose how you'd like to share this achievement:",
          [
            {
              text: 'Simple Share',
              onPress: () =>
                AchievementSharingService.quickShareAchievement(achievement),
            },
            {
              text: 'Progress Report',
              onPress: () =>
                AchievementSharingService.quickShareProgress(
                  achievements,
                  userStats
                ),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      Alert.alert(
        'Sharing Failed',
        'Unable to share your achievement at this time. Please try again.'
      );
    }
  };

  const getStatusColor = () => {
    if (!achievement) return theme.textSecondary;

    switch (achievement.status) {
      case AchievementStatus.COMPLETED:
        return TIER_COLORS[achievement.tier];
      case AchievementStatus.IN_PROGRESS:
        return theme.primary;
      case AchievementStatus.LOCKED:
        return theme.textDisabled;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusText = () => {
    if (!achievement) return '';

    switch (achievement.status) {
      case AchievementStatus.COMPLETED:
        return 'Completed';
      case AchievementStatus.IN_PROGRESS:
        return 'In Progress';
      case AchievementStatus.LOCKED:
        return 'Locked';
      default:
        return 'Unknown';
    }
  };

  const formatRequirementValue = (value: number, unit: string) => {
    switch (unit) {
      case 'CAD':
        return new Intl.NumberFormat('en-CA', {
          style: 'currency',
          currency: 'CAD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'days':
        return `${value} day${value !== 1 ? 's' : ''}`;
      case 'transactions':
        return `${value} transaction${value !== 1 ? 's' : ''}`;
      case 'modules':
        return `${value} module${value !== 1 ? 's' : ''}`;
      case 'percentage':
        return `${value}%`;
      default:
        return `${value} ${unit}`;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-left" size={24} color={theme.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
        Achievement Details
      </Text>

      <TouchableOpacity
        onPress={handleShare}
        style={styles.shareButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="share" size={24} color={theme.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderAchievementCard = () => {
    if (!achievement) return null;

    const progress = calculateProgress();
    const tierColor = TIER_COLORS[achievement.tier];
    const isCompleted = achievement.status === AchievementStatus.COMPLETED;
    const isLocked = achievement.status === AchievementStatus.LOCKED;

    return (
      <Animated.View
        style={[
          styles.achievementCardContainer,
          {
            transform: [
              {
                scale: celebrationAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <Card
          style={[
            styles.achievementCard,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: isCompleted ? tierColor : theme.neutral.light,
              borderWidth: isCompleted ? 3 : 1,
            },
          ]}
        >
          {/* Achievement Icon and Tier */}
          <View style={styles.achievementIconSection}>
            <View
              style={[
                styles.achievementIcon,
                {
                  backgroundColor: isCompleted
                    ? tierColor + '20'
                    : theme.neutral.light,
                },
              ]}
            >
              <Icon
                name={achievement.icon}
                size={64}
                color={
                  isCompleted
                    ? tierColor
                    : isLocked
                      ? theme.textDisabled
                      : theme.textSecondary
                }
              />
            </View>

            {/* Tier Badge */}
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.tierText}>{achievement.tier}</Text>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor() },
              ]}
            >
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {/* Achievement Info */}
          <View style={styles.achievementInfo}>
            <Text
              style={[styles.achievementTitle, { color: theme.textPrimary }]}
            >
              {achievement.title}
            </Text>

            <Text
              style={[
                styles.achievementDescription,
                { color: theme.textSecondary },
              ]}
            >
              {achievement.description}
            </Text>

            {/* Category and Points */}
            <View style={styles.achievementMeta}>
              <View style={styles.categoryContainer}>
                <Icon
                  name={CATEGORY_ICONS[achievement.category]}
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.categoryText, { color: theme.textSecondary }]}
                >
                  {achievement.category.replace('_', ' ')}
                </Text>
              </View>

              <View style={styles.pointsContainer}>
                <Icon name="star" size={16} color={theme.warning} />
                <Text style={[styles.pointsText, { color: theme.warning }]}>
                  {achievement.points} points
                </Text>
              </View>
            </View>
          </View>

          {/* Celebration Overlay */}
          {isCompleted && (
            <Animated.View
              style={[
                styles.celebrationOverlay,
                {
                  opacity: celebrationAnimation,
                },
              ]}
            >
              <View
                style={[
                  styles.celebrationBadge,
                  { backgroundColor: tierColor },
                ]}
              >
                <Icon name="trophy" size={32} color={theme.white} />
              </View>
              <Text style={[styles.celebrationText, { color: tierColor }]}>
                Achievement Unlocked!
              </Text>
            </Animated.View>
          )}
        </Card>
      </Animated.View>
    );
  };

  const renderProgressSection = () => {
    if (!achievement || achievement.status === AchievementStatus.LOCKED)
      return null;

    const progress = calculateProgress();
    const isCompleted = achievement.status === AchievementStatus.COMPLETED;

    return (
      <Card
        style={[
          styles.progressCard,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Progress Overview
        </Text>

        <View style={styles.progressHeader}>
          <Text style={[styles.progressPercentage, { color: theme.primary }]}>
            {Math.round(progress)}%
          </Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
            {isCompleted ? 'Completed' : 'Complete'}
          </Text>
        </View>

        <ProgressBar
          progress={progress / 100}
          height={12}
          progressColor={
            isCompleted ? TIER_COLORS[achievement.tier] : theme.primary
          }
          backgroundColor={theme.neutral.light}
          style={styles.progressBar}
        />

        {isCompleted && achievement.completedAt && (
          <Text style={[styles.completedDate, { color: theme.textSecondary }]}>
            Completed on{' '}
            {new Date(achievement.completedAt).toLocaleDateString()}
          </Text>
        )}
      </Card>
    );
  };

  const renderRequirements = () => {
    if (!achievement || !achievement.requirements.length) return null;

    return (
      <Card
        style={[
          styles.requirementsCard,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Requirements
        </Text>

        <View style={styles.requirementsList}>
          {achievement.requirements.map((requirement, index) => {
            const progress = Math.min(
              requirement.current / requirement.target,
              1
            );
            const isCompleted = progress >= 1;

            return (
              <View key={index} style={styles.requirementItem}>
                <View style={styles.requirementHeader}>
                  <View style={styles.requirementIcon}>
                    <Icon
                      name={isCompleted ? 'check-circle' : 'circle'}
                      size={20}
                      color={isCompleted ? theme.success : theme.textSecondary}
                    />
                  </View>

                  <View style={styles.requirementContent}>
                    <Text
                      style={[
                        styles.requirementTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {requirement.description}
                    </Text>

                    <View style={styles.requirementProgress}>
                      <Text
                        style={[
                          styles.requirementValue,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatRequirementValue(
                          requirement.current,
                          requirement.unit
                        )}{' '}
                        of{' '}
                        {formatRequirementValue(
                          requirement.target,
                          requirement.unit
                        )}
                      </Text>
                    </View>

                    <ProgressBar
                      progress={progress}
                      height={6}
                      progressColor={
                        isCompleted ? theme.success : theme.primary
                      }
                      backgroundColor={theme.neutral.light}
                      style={styles.requirementProgressBar}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderRelatedAchievements = () => {
    if (!achievement) return null;

    // Find related achievements in the same category
    const relatedAchievements = achievements
      .filter(
        a => a.category === achievement.category && a.id !== achievement.id
      )
      .slice(0, 3);

    if (relatedAchievements.length === 0) return null;

    return (
      <Card
        style={[
          styles.relatedCard,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Related Achievements
        </Text>

        <View style={styles.relatedList}>
          {relatedAchievements.map(relatedAchievement => {
            const isCompleted =
              relatedAchievement.status === AchievementStatus.COMPLETED;
            const tierColor = TIER_COLORS[relatedAchievement.tier];

            return (
              <TouchableOpacity
                key={relatedAchievement.id}
                style={styles.relatedItem}
                onPress={() => {
                  router.replace(
                    `/modals/achievement-detail?id=${relatedAchievement.id}`
                  );
                }}
              >
                <View
                  style={[
                    styles.relatedIcon,
                    {
                      backgroundColor: isCompleted
                        ? tierColor + '20'
                        : theme.neutral.light,
                    },
                  ]}
                >
                  <Icon
                    name={relatedAchievement.icon}
                    size={24}
                    color={isCompleted ? tierColor : theme.textSecondary}
                  />
                </View>

                <View style={styles.relatedContent}>
                  <Text
                    style={[styles.relatedTitle, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {relatedAchievement.title}
                  </Text>
                  <Text
                    style={[
                      styles.relatedPoints,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {relatedAchievement.points} points
                  </Text>
                </View>

                <Icon
                  name="chevron-right"
                  size={16}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!achievement) return null;

    return (
      <View style={styles.actionButtons}>
        <Button
          title="Share Achievement"
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: theme.primary }]}
          disabled={false}
        />

        {achievement.status === AchievementStatus.IN_PROGRESS && (
          <Button
            title="View Tips"
            onPress={() => {
              // Navigate to tips/help for this achievement category
              Alert.alert(
                'Coming Soon',
                'Achievement tips will be available soon!'
              );
            }}
            style={[styles.tipsBtn, { backgroundColor: theme.secondary }]}
            disabled={false}
          />
        )}
      </View>
    );
  };

  if (loading || !achievement) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}
      >
        <View style={styles.loadingContainer}>
          <Icon name="trophy" size={48} color={theme.textSecondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading achievement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}
    >
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderAchievementCard()}
        {renderProgressSection()}
        {renderRequirements()}
        {renderRelatedAchievements()}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  achievementCardContainer: {
    marginBottom: spacing.lg,
  },
  achievementCard: {
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  achievementIconSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  achievementIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    minWidth: 64,
    alignItems: 'center',
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  achievementInfo: {
    alignItems: 'center',
    width: '100%',
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  achievementDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  achievementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  celebrationBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 16,
  },
  progressBar: {
    marginBottom: spacing.sm,
  },
  completedDate: {
    fontSize: 14,
    textAlign: 'center',
  },
  requirementsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  requirementsList: {
    gap: spacing.lg,
  },
  requirementItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: spacing.md,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  requirementIcon: {
    marginTop: 2,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requirementProgress: {
    marginBottom: spacing.sm,
  },
  requirementValue: {
    fontSize: 14,
  },
  requirementProgressBar: {},
  relatedCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  relatedList: {
    gap: spacing.md,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  relatedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  relatedPoints: {
    fontSize: 12,
  },
  actionButtons: {
    gap: spacing.md,
  },
  shareBtn: {
    paddingVertical: spacing.md,
  },
  tipsBtn: {
    paddingVertical: spacing.md,
  },
});
