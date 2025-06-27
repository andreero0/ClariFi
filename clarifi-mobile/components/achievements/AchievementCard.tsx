import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import {
  Achievement,
  AchievementStatus,
  AchievementTier,
} from '../../types/achievements';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import Icon from '../ui/Icon';
import { CheckCircle, Lock, Star, Trophy } from 'lucide-react-native';

const TIER_COLORS = {
  [AchievementTier.BRONZE]: '#CD7F32',
  [AchievementTier.SILVER]: '#C0C0C0',
  [AchievementTier.GOLD]: '#FFD700',
  [AchievementTier.PLATINUM]: '#E5E4E2',
};

export interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  width?: number;
  showProgress?: boolean;
  style?: ViewStyle;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  width = 160,
  showProgress = true,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = new Animated.Value(0);

  const isCompleted = achievement.status === AchievementStatus.COMPLETED;
  const isLocked = achievement.status === AchievementStatus.LOCKED;
  const isInProgress = achievement.status === AchievementStatus.IN_PROGRESS;

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!achievement.requirements.length) return 0;
    const totalProgress = achievement.requirements.reduce((sum, req) => {
      const progress = Math.min(req.current / req.target, 1) * 100;
      return sum + progress;
    }, 0);
    return totalProgress / achievement.requirements.length;
  };

  const progress = calculateProgress();

  // Animation for completed achievements
  React.useEffect(() => {
    if (isCompleted) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(animatedValue, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCompleted]);

  const handlePress = () => {
    if (onPress) {
      // Add haptic feedback for completed achievements
      if (isCompleted) {
        // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress(achievement);
    }
  };

  const tierColor = TIER_COLORS[achievement.tier];
  const iconColor = isCompleted
    ? tierColor
    : isLocked
      ? theme.textDisabled
      : theme.textSecondary;
  const cardOpacity = isLocked ? 0.6 : 1;

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={!onPress}
        activeOpacity={0.8}
        style={[
          styles.container,
          {
            width,
            backgroundColor: theme.backgroundSecondary,
            opacity: cardOpacity,
            borderColor: isCompleted ? tierColor : theme.neutral.light,
            borderWidth: isCompleted ? 2 : 1,
          },
        ]}
      >
        {/* Achievement Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBackground,
              {
                backgroundColor: isCompleted
                  ? tierColor + '20'
                  : theme.neutral.light,
              },
            ]}
          >
            <Icon name={achievement.icon} size={32} color={iconColor} />
          </View>

          {/* Tier Badge */}
          {isCompleted && (
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.tierText}>{achievement.tier.charAt(0)}</Text>
            </View>
          )}

          {/* Completion Check */}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Icon name={CheckCircle} size={20} color={theme.success} />
            </View>
          )}

          {/* Lock Icon */}
          {isLocked && (
            <View style={styles.lockBadge}>
              <Icon name={Lock} size={16} color={theme.textDisabled} />
            </View>
          )}
        </View>

        {/* Achievement Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isLocked ? theme.textDisabled : theme.textPrimary,
              },
            ]}
            numberOfLines={2}
          >
            {achievement.title}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: isLocked ? theme.textDisabled : theme.textSecondary,
              },
            ]}
            numberOfLines={3}
          >
            {achievement.description}
          </Text>
        </View>

        {/* Progress Section */}
        {showProgress && isInProgress && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text
                style={[styles.progressText, { color: theme.textSecondary }]}
              >
                {Math.round(progress)}% Complete
              </Text>
            </View>
            <ProgressBar
              progress={progress / 100}
              height={6}
              progressColor={theme.primary}
              backgroundColor={theme.neutral.light}
            />
          </View>
        )}

        {/* Points Badge */}
        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <Icon name={Star} size={14} color={theme.warning} />
            <Text style={[styles.pointsText, { color: theme.textSecondary }]}>
              {achievement.points} pts
            </Text>
          </View>

          {/* Requirements Summary */}
          {achievement.requirements.length > 0 && !isCompleted && (
            <View style={styles.requirementsContainer}>
              <Text
                style={[
                  styles.requirementsText,
                  { color: theme.textSecondary },
                ]}
              >
                {achievement.requirements[0].current}/
                {achievement.requirements[0].target}{' '}
                {achievement.requirements[0].unit}
              </Text>
            </View>
          )}
        </View>

        {/* Celebration Overlay */}
        {isCompleted && (
          <View style={styles.celebrationOverlay}>
            <View
              style={[styles.celebrationBadge, { backgroundColor: tierColor }]}
            >
              <Icon name={Trophy} size={16} color={theme.white} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 200,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
    minHeight: 40,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 48,
  },
  progressSection: {
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  requirementsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  requirementsText: {
    fontSize: 10,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  celebrationBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AchievementCard;
