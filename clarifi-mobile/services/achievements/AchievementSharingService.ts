import { Share, ShareContent, Alert } from 'react-native';
import {
  Achievement,
  AchievementCategory,
  AchievementTier,
  AchievementStatus,
} from '../../types/achievements';

export interface ShareableAchievement {
  achievement: Achievement;
  progress?: number;
  userStats?: {
    totalPoints: number;
    completedAchievements: number;
    totalAchievements: number;
    streakDays: number;
    totalSaved: number;
  };
}

export interface ShareOptions {
  includeProgress?: boolean;
  includeBranding?: boolean;
  includeStats?: boolean;
  platform?: 'general' | 'social' | 'messaging';
  customMessage?: string;
}

export class AchievementSharingService {
  private static readonly APP_NAME = 'ClariFi';
  private static readonly APP_TAGLINE = 'Your Financial Journey Partner';
  private static readonly WEBSITE_URL = 'https://clarifi.app';
  private static readonly HASHTAGS = [
    '#ClariFi',
    '#FinancialGoals',
    '#FinancialLiteracy',
    '#MoneyManagement',
  ];

  /**
   * Share an individual achievement with customizable options
   */
  static async shareAchievement(
    shareable: ShareableAchievement,
    options: ShareOptions = {}
  ): Promise<boolean> {
    try {
      const shareContent = this.buildShareContent(shareable, options);

      const result = await Share.share(shareContent);

      // Track successful shares for analytics
      if (result.action === Share.sharedAction) {
        this.trackShare(
          'achievement',
          shareable.achievement.id,
          options.platform
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sharing achievement:', error);
      Alert.alert(
        'Sharing Failed',
        'Unable to share your achievement at this time. Please try again.'
      );
      return false;
    }
  }

  /**
   * Share progress report with multiple achievements
   */
  static async shareProgressReport(
    achievements: Achievement[],
    userStats: ShareableAchievement['userStats'],
    options: ShareOptions = {}
  ): Promise<boolean> {
    try {
      const shareContent = this.buildProgressReportContent(
        achievements,
        userStats,
        options
      );

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        this.trackShare('progress_report', 'multiple', options.platform);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sharing progress report:', error);
      Alert.alert(
        'Sharing Failed',
        'Unable to share your progress report at this time. Please try again.'
      );
      return false;
    }
  }

  /**
   * Share milestone celebration (e.g., first achievement, 10th achievement, etc.)
   */
  static async shareMilestone(
    milestone: string,
    userStats: ShareableAchievement['userStats'],
    options: ShareOptions = {}
  ): Promise<boolean> {
    try {
      const shareContent = this.buildMilestoneContent(
        milestone,
        userStats,
        options
      );

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        this.trackShare('milestone', milestone, options.platform);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sharing milestone:', error);
      Alert.alert(
        'Sharing Failed',
        'Unable to share your milestone at this time. Please try again.'
      );
      return false;
    }
  }

  /**
   * Build share content for individual achievements
   */
  private static buildShareContent(
    shareable: ShareableAchievement,
    options: ShareOptions
  ): ShareContent {
    const { achievement, progress, userStats } = shareable;

    const message =
      options.customMessage ||
      this.generateAchievementMessage(
        achievement,
        progress,
        userStats,
        options
      );

    return {
      message: message,
      title: `${this.APP_NAME} Achievement - ${achievement.title}`,
      url: options.includeBranding ? this.WEBSITE_URL : undefined,
    };
  }

  /**
   * Generate contextual sharing message for achievements
   */
  private static generateAchievementMessage(
    achievement: Achievement,
    progress?: number,
    userStats?: ShareableAchievement['userStats'],
    options: ShareOptions = {}
  ): string {
    const isCompleted = achievement.status === AchievementStatus.COMPLETED;
    const emoji = this.getAchievementEmoji(achievement);
    const tierEmoji = this.getTierEmoji(achievement.tier);

    let message = '';

    if (isCompleted) {
      // Completed achievement messages
      const completionMessages = this.getCompletionMessagesByCategory(
        achievement.category
      );
      const randomMessage =
        completionMessages[
          Math.floor(Math.random() * completionMessages.length)
        ];

      message = `${emoji} ${randomMessage}\n\n`;
      message += `${tierEmoji} "${achievement.title}" achievement unlocked!\n`;
      message += `${achievement.description}\n\n`;
      message += `💎 ${achievement.points} points earned\n`;

      if (userStats && options.includeStats) {
        message += `📊 Total achievements: ${userStats.completedAchievements}/${userStats.totalAchievements}\n`;
        message += `⭐ Total points: ${userStats.totalPoints.toLocaleString()}\n`;

        if (userStats.streakDays > 0) {
          message += `🔥 Current streak: ${userStats.streakDays} days\n`;
        }

        if (userStats.totalSaved > 0) {
          message += `💰 Total saved: $${userStats.totalSaved.toLocaleString()}\n`;
        }
      }
    } else {
      // In-progress achievement messages
      const progressPercentage = progress ? Math.round(progress) : 0;
      const progressMessages = this.getProgressMessagesByCategory(
        achievement.category
      );
      const randomMessage =
        progressMessages[Math.floor(Math.random() * progressMessages.length)];

      message = `💪 ${randomMessage}\n\n`;
      message += `🎯 Working towards: "${achievement.title}"\n`;
      message += `${achievement.description}\n\n`;
      message += `📈 Progress: ${progressPercentage}% complete\n`;
      message += `🎁 Reward: ${achievement.points} points\n`;
    }

    // Add motivational call-to-action
    message += `\n${this.getCallToAction(achievement.category)}`;

    // Add branding if enabled
    if (options.includeBranding !== false) {
      message += `\n\n📱 Join me on ${this.APP_NAME} - ${this.APP_TAGLINE}`;
      message += `\n${this.WEBSITE_URL}`;

      // Add hashtags for social platforms
      if (options.platform === 'social') {
        message += `\n\n${this.HASHTAGS.join(' ')}`;
      }
    }

    return message;
  }

  /**
   * Build progress report sharing content
   */
  private static buildProgressReportContent(
    achievements: Achievement[],
    userStats: ShareableAchievement['userStats'],
    options: ShareOptions
  ): ShareContent {
    const completedAchievements = achievements.filter(
      a => a.status === AchievementStatus.COMPLETED
    );
    const recentAchievements = completedAchievements.slice(-3); // Last 3 completed

    let message = `📊 My ${this.APP_NAME} Progress Report\n\n`;

    // Overall stats
    if (userStats) {
      message += `🏆 Achievements unlocked: ${userStats.completedAchievements}/${userStats.totalAchievements}\n`;
      message += `⭐ Total points earned: ${userStats.totalPoints.toLocaleString()}\n`;

      if (userStats.streakDays > 0) {
        message += `🔥 Current streak: ${userStats.streakDays} days\n`;
      }

      if (userStats.totalSaved > 0) {
        message += `💰 Money saved: $${userStats.totalSaved.toLocaleString()}\n`;
      }
    }

    // Recent achievements
    if (recentAchievements.length > 0) {
      message += `\n✨ Recent achievements:\n`;
      recentAchievements.forEach(achievement => {
        const emoji = this.getAchievementEmoji(achievement);
        message += `${emoji} ${achievement.title}\n`;
      });
    }

    // Motivational message
    const motivationalMessages = [
      'Every step counts on the path to financial freedom! 🚀',
      'Building better financial habits one achievement at a time! 💪',
      "Progress isn't just about the destination, it's about the journey! 🌟",
      'Small wins lead to big victories! Keep it up! 🎯',
    ];

    message += `\n${motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}`;

    // Add branding
    if (options.includeBranding !== false) {
      message += `\n\n📱 Track your financial journey with ${this.APP_NAME}`;
      message += `\n${this.WEBSITE_URL}`;

      if (options.platform === 'social') {
        message += `\n\n${this.HASHTAGS.join(' ')}`;
      }
    }

    return {
      message: message,
      title: `${this.APP_NAME} Progress Report`,
      url: options.includeBranding ? this.WEBSITE_URL : undefined,
    };
  }

  /**
   * Build milestone celebration content
   */
  private static buildMilestoneContent(
    milestone: string,
    userStats: ShareableAchievement['userStats'],
    options: ShareOptions
  ): ShareContent {
    let message = `🎉 Milestone Achievement! ${milestone}\n\n`;

    if (userStats) {
      message += `🏆 Total achievements: ${userStats.completedAchievements}\n`;
      message += `⭐ Points earned: ${userStats.totalPoints.toLocaleString()}\n`;

      if (userStats.totalSaved > 0) {
        message += `💰 Money saved: $${userStats.totalSaved.toLocaleString()}\n`;
      }
    }

    message += `\n🚀 Every achievement brings me closer to my financial goals!`;

    if (options.includeBranding !== false) {
      message += `\n\n📱 Building financial confidence with ${this.APP_NAME}`;
      message += `\n${this.WEBSITE_URL}`;

      if (options.platform === 'social') {
        message += `\n\n${this.HASHTAGS.join(' ')}`;
      }
    }

    return {
      message: message,
      title: `${this.APP_NAME} Milestone - ${milestone}`,
      url: options.includeBranding ? this.WEBSITE_URL : undefined,
    };
  }

  /**
   * Get category-specific emoji for achievements
   */
  private static getAchievementEmoji(achievement: Achievement): string {
    const emojiMap = {
      [AchievementCategory.CONSISTENCY]: '🔥',
      [AchievementCategory.BUDGETING]: '📊',
      [AchievementCategory.TRANSACTIONS]: '💳',
      [AchievementCategory.FINANCIAL_HEALTH]: '💰',
      [AchievementCategory.EDUCATION]: '📚',
      [AchievementCategory.CREDIT_MANAGEMENT]: '📈',
    };

    return emojiMap[achievement.category] || '🏆';
  }

  /**
   * Get tier-specific emoji
   */
  private static getTierEmoji(tier: AchievementTier): string {
    const tierEmojiMap = {
      [AchievementTier.BRONZE]: '🥉',
      [AchievementTier.SILVER]: '🥈',
      [AchievementTier.GOLD]: '🥇',
      [AchievementTier.PLATINUM]: '💎',
    };

    return tierEmojiMap[tier] || '🏆';
  }

  /**
   * Get completion messages by category
   */
  private static getCompletionMessagesByCategory(
    category: AchievementCategory
  ): string[] {
    const messageMap = {
      [AchievementCategory.CONSISTENCY]: [
        "Consistency is key and I'm proving it!",
        'Building habits that stick!',
        'One day at a time, one achievement at a time!',
        'Staying committed to my financial journey!',
      ],
      [AchievementCategory.BUDGETING]: [
        'Budget mastery unlocked!',
        'Taking control of my finances!',
        'Every dollar has a purpose!',
        'Budgeting like a pro!',
      ],
      [AchievementCategory.TRANSACTIONS]: [
        'Smart spending decisions paying off!',
        'Mindful money management in action!',
        'Every transaction tracked and accounted for!',
        'Financial organization at its finest!',
      ],
      [AchievementCategory.FINANCIAL_HEALTH]: [
        'Building wealth one step at a time!',
        'Financial health is true wealth!',
        'Securing my financial future!',
        'Money goals achieved!',
      ],
      [AchievementCategory.EDUCATION]: [
        'Knowledge is power, especially financial knowledge!',
        'Learning my way to financial freedom!',
        'Education is the best investment!',
        'Growing my financial IQ!',
      ],
      [AchievementCategory.CREDIT_MANAGEMENT]: [
        'Credit confidence achieved!',
        'Building a strong credit foundation!',
        'Smart credit decisions in action!',
        'Credit management mastery!',
      ],
    };

    return messageMap[category] || ['Achievement unlocked!'];
  }

  /**
   * Get progress messages by category
   */
  private static getProgressMessagesByCategory(
    category: AchievementCategory
  ): string[] {
    const messageMap = {
      [AchievementCategory.CONSISTENCY]: [
        'Building momentum with every day!',
        'Consistency is my superpower!',
        'One day closer to my streak goal!',
      ],
      [AchievementCategory.BUDGETING]: [
        'Budgeting skills leveling up!',
        'Getting closer to budget mastery!',
        'Every budget decision counts!',
      ],
      [AchievementCategory.TRANSACTIONS]: [
        'Tracking every dollar with purpose!',
        'Building better spending habits!',
        'Financial awareness growing stronger!',
      ],
      [AchievementCategory.FINANCIAL_HEALTH]: [
        'Building wealth step by step!',
        'Financial goals in sight!',
        'Every dollar saved matters!',
      ],
      [AchievementCategory.EDUCATION]: [
        'Learning my way to financial success!',
        'Knowledge is my best investment!',
        'Growing smarter about money every day!',
      ],
      [AchievementCategory.CREDIT_MANAGEMENT]: [
        'Building credit confidence!',
        'Smart credit decisions in progress!',
        'Working towards credit excellence!',
      ],
    };

    return messageMap[category] || ['Progress in motion!'];
  }

  /**
   * Get call-to-action by category
   */
  private static getCallToAction(category: AchievementCategory): string {
    const ctaMap = {
      [AchievementCategory.CONSISTENCY]:
        'What financial habit are you building? 💪',
      [AchievementCategory.BUDGETING]:
        'Ready to take control of your budget? 📊',
      [AchievementCategory.TRANSACTIONS]: 'How do you track your spending? 💳',
      [AchievementCategory.FINANCIAL_HEALTH]:
        "What's your next financial goal? 🎯",
      [AchievementCategory.EDUCATION]:
        'What financial topic are you learning about? 📚',
      [AchievementCategory.CREDIT_MANAGEMENT]:
        'Building credit confidence together! 📈',
    };

    return ctaMap[category] || "What's your next financial goal? 🚀";
  }

  /**
   * Track sharing events for analytics
   */
  private static trackShare(
    type: string,
    identifier: string,
    platform?: string
  ): void {
    // TODO: Integrate with analytics service
    console.log('Share tracked:', {
      type,
      identifier,
      platform,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get shareable achievement data with progress calculation
   */
  static prepareShareableAchievement(
    achievement: Achievement,
    userStats?: ShareableAchievement['userStats']
  ): ShareableAchievement {
    // Calculate progress if achievement is in progress
    let progress = 0;
    if (
      achievement.status === AchievementStatus.IN_PROGRESS &&
      achievement.requirements.length > 0
    ) {
      const totalProgress = achievement.requirements.reduce((sum, req) => {
        const reqProgress = Math.min(req.current / req.target, 1) * 100;
        return sum + reqProgress;
      }, 0);
      progress = totalProgress / achievement.requirements.length;
    }

    return {
      achievement,
      progress: progress > 0 ? progress : undefined,
      userStats,
    };
  }

  /**
   * Quick share methods for common scenarios
   */
  static async quickShareAchievement(
    achievement: Achievement
  ): Promise<boolean> {
    const shareable = this.prepareShareableAchievement(achievement);
    return this.shareAchievement(shareable, {
      includeBranding: true,
      includeProgress: true,
      platform: 'general',
    });
  }

  static async quickShareToSocial(
    achievement: Achievement,
    userStats?: ShareableAchievement['userStats']
  ): Promise<boolean> {
    const shareable = this.prepareShareableAchievement(achievement, userStats);
    return this.shareAchievement(shareable, {
      includeBranding: true,
      includeStats: true,
      platform: 'social',
    });
  }

  static async quickShareProgress(
    achievements: Achievement[],
    userStats: ShareableAchievement['userStats']
  ): Promise<boolean> {
    return this.shareProgressReport(achievements, userStats, {
      includeBranding: true,
      platform: 'social',
    });
  }
}

export default AchievementSharingService;
