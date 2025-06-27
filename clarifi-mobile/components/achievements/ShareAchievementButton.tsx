import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementContext';
import { useStreakTracking } from '../../hooks/useStreakTracking';
import { useFinancialAchievements } from '../../hooks/useFinancialAchievements';
import { Achievement, AchievementStatus } from '../../types/achievements';
import { Icon } from '../ui';
import { spacing } from '../../constants/spacing';
import AchievementSharingService, {
  ShareableAchievement,
} from '../../services/achievements/AchievementSharingService';

interface ShareAchievementButtonProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button' | 'text';
  showLabel?: boolean;
  onShareComplete?: () => void;
}

export default function ShareAchievementButton({
  achievement,
  size = 'medium',
  variant = 'icon',
  showLabel = false,
  onShareComplete,
}: ShareAchievementButtonProps) {
  const { theme } = useTheme();
  const { achievements } = useAchievements();
  const { streakData } = useStreakTracking();
  const { financialStats } = useFinancialAchievements();
  const [isSharing, setIsSharing] = useState(false);

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const iconSize = iconSizes[size];

  const getUserStats = () => ({
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
  });

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      const userStats = getUserStats();

      if (Platform.OS === 'ios') {
        showIOSActionSheet(userStats);
      } else {
        showAndroidAlert(userStats);
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      Alert.alert('Sharing Error', 'Unable to share achievement at this time.');
    } finally {
      setIsSharing(false);
    }
  };

  const showIOSActionSheet = (userStats: ShareableAchievement['userStats']) => {
    const options = [
      'Quick Share',
      'Share to Social Media',
      'Share Progress Report',
      'Share to Messages',
      'Cancel',
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 4,
        title: `Share "${achievement.title}" Achievement`,
        message: "Choose how you'd like to share this achievement",
      },
      async buttonIndex => {
        await executeShareOption(buttonIndex, userStats);
      }
    );
  };

  const showAndroidAlert = (userStats: ShareableAchievement['userStats']) => {
    Alert.alert(
      'Share Achievement',
      `Choose how you'd like to share "${achievement.title}":`,
      [
        {
          text: 'Quick Share',
          onPress: () => executeShareOption(0, userStats),
        },
        {
          text: 'Social Media',
          onPress: () => executeShareOption(1, userStats),
        },
        {
          text: 'Progress Report',
          onPress: () => executeShareOption(2, userStats),
        },
        {
          text: 'Messages',
          onPress: () => executeShareOption(3, userStats),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const executeShareOption = async (
    buttonIndex: number,
    userStats: ShareableAchievement['userStats']
  ) => {
    let success = false;

    try {
      switch (buttonIndex) {
        case 0: // Quick Share
          success =
            await AchievementSharingService.quickShareAchievement(achievement);
          break;
        case 1: // Social Media
          success = await AchievementSharingService.quickShareToSocial(
            achievement,
            userStats
          );
          break;
        case 2: // Progress Report
          success = await AchievementSharingService.quickShareProgress(
            achievements,
            userStats
          );
          break;
        case 3: // Messages
          const shareable =
            AchievementSharingService.prepareShareableAchievement(
              achievement,
              userStats
            );
          success = await AchievementSharingService.shareAchievement(
            shareable,
            {
              platform: 'messaging',
              includeBranding: false,
              includeStats: achievement.status === AchievementStatus.COMPLETED,
            }
          );
          break;
        default:
          return; // Cancel or invalid option
      }

      if (success) {
        onShareComplete?.();
        // Show success feedback for completed achievements
        if (achievement.status === AchievementStatus.COMPLETED) {
          Alert.alert(
            'Shared Successfully! 🎉',
            'Your achievement has been shared. Keep up the great work!',
            [{ text: 'Thanks!', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Share execution error:', error);
      Alert.alert(
        'Sharing Failed',
        'Unable to complete sharing. Please try again.'
      );
    }
  };

  const renderContent = () => {
    switch (variant) {
      case 'button':
        return (
          <View
            style={[styles.buttonContainer, { backgroundColor: theme.primary }]}
          >
            <Icon name="share" size={iconSize} color="white" />
            {showLabel && (
              <Text style={[styles.buttonLabel, { color: 'white' }]}>
                Share
              </Text>
            )}
          </View>
        );

      case 'text':
        return (
          <View style={styles.textContainer}>
            <Icon name="share" size={iconSize} color={theme.primary} />
            <Text style={[styles.textLabel, { color: theme.primary }]}>
              Share Achievement
            </Text>
          </View>
        );

      case 'icon':
      default:
        return (
          <View style={styles.iconContainer}>
            <Icon
              name="share"
              size={iconSize}
              color={isSharing ? theme.textDisabled : theme.textSecondary}
            />
            {showLabel && (
              <Text style={[styles.iconLabel, { color: theme.textSecondary }]}>
                Share
              </Text>
            )}
          </View>
        );
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      disabled={isSharing}
      style={[
        styles.container,
        variant === 'button' && styles.buttonStyle,
        { opacity: isSharing ? 0.6 : 1 },
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStyle: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    minHeight: 32,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  textLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
