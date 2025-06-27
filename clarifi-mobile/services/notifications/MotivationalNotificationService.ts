/**
 * Motivational Notification Service
 * Handles local notifications for achievement progress, streak reminders, and milestone celebrations
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AchievementService from '../achievements/AchievementService';
import StreakService from '../achievements/StreakService';
import FinancialAchievementService from '../achievements/FinancialAchievementService';
import {
  Achievement,
  AchievementEvent,
  AchievementEventType,
} from '../../types/achievements';

export interface NotificationPreferences {
  enabled: boolean;
  streakReminders: boolean;
  achievementProgress: boolean;
  milestoneAlerts: boolean;
  weeklyReports: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  achievementCelebrations: boolean;
  progressMilestones: boolean;
  nearMissAlerts: boolean; // When close to achieving something
}

interface ScheduledNotification {
  id: string;
  type:
    | 'streak_reminder'
    | 'achievement_progress'
    | 'milestone_celebration'
    | 'weekly_report'
    | 'daily_reminder'
    | 'near_miss';
  title: string;
  body: string;
  data?: any;
  scheduledFor: Date;
  recurring?: boolean;
  achievementId?: string;
}

interface NotificationContent {
  title: string;
  body: string;
  data?: any;
}

class MotivationalNotificationService {
  private static instance: MotivationalNotificationService;
  private achievementService: AchievementService;
  private streakService: StreakService;
  private financialService: FinancialAchievementService;
  private preferences: NotificationPreferences | null = null;
  private scheduledNotifications: ScheduledNotification[] = [];

  private readonly STORAGE_KEY = '@clarifi_notification_preferences';
  private readonly SCHEDULED_KEY = '@clarifi_scheduled_notifications';

  // Motivational messages for different contexts
  private readonly STREAK_MESSAGES = {
    reminder: [
      "Don't break your streak! 🔥 Check in with ClariFi today",
      'Keep the momentum going! 💪 Your financial journey awaits',
      'Your streak is waiting for you! 📱 Quick check-in time',
      'Stay consistent! 🎯 Just a few minutes can keep your streak alive',
      "You're doing great! 🌟 Don't let your streak slip away",
    ],
    milestone: [
      "🎉 Amazing! You've reached a {days}-day streak!",
      '🔥 Incredible dedication! {days} days and counting!',
      "💎 You're a streak legend! {days} consecutive days!",
      '🏆 Outstanding commitment! {days}-day streak achieved!',
      '⭐ Phenomenal consistency! {days} days of financial focus!',
    ],
    freeze_used: [
      '🛡️ Streak freeze activated! Your dedication is protected',
      '❄️ No worries! Your streak freeze has you covered',
      "🔒 Streak saved! That's what freeze protection is for",
    ],
  };

  private readonly ACHIEVEMENT_MESSAGES = {
    progress: [
      "You're {percentage}% there! Keep going with {title}! 🎯",
      'Almost there! {percentage}% complete on {title} 💪',
      'Great progress! {percentage}% done with {title} ⭐',
      'So close! Just {remaining} more to unlock {title} 🔓',
    ],
    celebration: [
      '🎉 Achievement Unlocked: {title}!',
      "🏆 Congratulations! You've earned {title}!",
      '⭐ Well done! {title} achievement complete!',
      '💎 Success! {title} is now yours!',
      "🔥 Fantastic! You've mastered {title}!",
    ],
    nearMiss: [
      'So close to {title}! Just {remaining} more! 🎯',
      "You're almost there! {title} within reach! 💪",
      'Final push! {title} achievement waiting! ⭐',
      "Don't stop now! {title} is so close! 🔥",
    ],
  };

  private readonly FINANCIAL_MESSAGES = {
    budget: [
      "Great budgeting! You're {percentage}% within your monthly limit 📊",
      'Budget champion! Keep up the excellent spending control 💰',
      'Your budget discipline is paying off! 📈',
    ],
    savings: [
      'Awesome savings progress! ${amount} closer to your goal 🏦',
      "Keep saving! You've reached ${amount} - great work! 💎",
      'Your emergency fund is growing! ${amount} saved so far 🛡️',
    ],
    education: [
      'Learning pays off! {modules} financial modules completed 📚',
      'Knowledge is power! Great progress on financial education 🧠',
      "You're becoming a financial expert! Keep learning! 🎓",
    ],
  };

  private readonly WEEKLY_REPORT_MESSAGES = [
    '📊 Your weekly financial summary is ready!',
    '🎯 See how you did this week with ClariFi!',
    '📈 Weekly progress report: See your achievements!',
    "💪 Check out your week's financial wins!",
  ];

  private readonly DAILY_REMINDER_MESSAGES = [
    '☀️ Good morning! Ready to tackle your financial goals?',
    '🎯 Daily financial check-in time!',
    '💪 Start your day with smart financial choices!',
    '📱 Quick ClariFi check-in to stay on track!',
    '🌟 Your financial success starts with daily habits!',
  ];

  private constructor() {
    this.achievementService = AchievementService.getInstance();
    this.streakService = StreakService.getInstance();
    this.financialService = FinancialAchievementService.getInstance();
  }

  static getInstance(): MotivationalNotificationService {
    if (!MotivationalNotificationService.instance) {
      MotivationalNotificationService.instance =
        new MotivationalNotificationService();
    }
    return MotivationalNotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Configure notification handling
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Load preferences
      await this.loadPreferences();

      // Load scheduled notifications
      await this.loadScheduledNotifications();

      // Set up achievement event listeners
      this.setupAchievementListeners();

      // Request permissions
      await this.requestPermissions();

      // Schedule default notifications
      await this.scheduleDefaultNotifications();
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // For Android, set up notification channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        Notifications.setNotificationChannelAsync('streaks', {
          name: 'Streak Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
        });

        Notifications.setNotificationChannelAsync('reports', {
          name: 'Progress Reports',
          importance: Notifications.AndroidImportance.LOW,
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Set up achievement event listeners
   */
  private setupAchievementListeners(): void {
    // Listen for achievement events
    this.achievementService.addEventListener((event: AchievementEvent) => {
      this.handleAchievementEvent(event);
    });
  }

  /**
   * Handle achievement events
   */
  private async handleAchievementEvent(event: AchievementEvent): Promise<void> {
    if (!this.preferences?.enabled) return;

    switch (event.type) {
      case AchievementEventType.ACHIEVEMENT_UNLOCKED:
        if (this.preferences.achievementCelebrations) {
          await this.sendAchievementCelebration(event.achievement);
        }
        break;

      case AchievementEventType.PROGRESS_UPDATED:
        if (this.preferences.progressMilestones) {
          await this.checkProgressMilestone(event.achievement);
        }
        break;

      case AchievementEventType.STREAK_MILESTONE:
        if (this.preferences.milestoneAlerts) {
          await this.sendStreakMilestone(event.data.days);
        }
        break;

      case AchievementEventType.STREAK_FREEZE_USED:
        await this.sendStreakFreezeNotification();
        break;

      case AchievementEventType.NEAR_ACHIEVEMENT:
        if (this.preferences.nearMissAlerts) {
          await this.sendNearMissNotification(event.achievement);
        }
        break;
    }
  }

  /**
   * Send achievement celebration notification
   */
  private async sendAchievementCelebration(
    achievement: Achievement
  ): Promise<void> {
    const message = this.getRandomMessage(
      this.ACHIEVEMENT_MESSAGES.celebration
    ).replace('{title}', achievement.title);

    const content: NotificationContent = {
      title: '🎉 Achievement Unlocked!',
      body: message,
      data: {
        type: 'achievement_celebration',
        achievementId: achievement.id,
        points: achievement.points,
      },
    };

    await this.sendImmediateNotification(content, 'achievements');
  }

  /**
   * Check and send progress milestone notifications
   */
  private async checkProgressMilestone(
    achievement: Achievement
  ): Promise<void> {
    const progress = this.calculateAchievementProgress(achievement);

    // Send notifications at 25%, 50%, 75%, and 90% completion
    const milestones = [25, 50, 75, 90];
    const roundedProgress = Math.floor(progress);

    if (milestones.includes(roundedProgress)) {
      const message = this.getRandomMessage(this.ACHIEVEMENT_MESSAGES.progress)
        .replace('{percentage}', roundedProgress.toString())
        .replace('{title}', achievement.title);

      const content: NotificationContent = {
        title: '🎯 Great Progress!',
        body: message,
        data: {
          type: 'progress_milestone',
          achievementId: achievement.id,
          progress: roundedProgress,
        },
      };

      await this.sendImmediateNotification(content, 'achievements');
    }
  }

  /**
   * Send streak milestone notification
   */
  private async sendStreakMilestone(days: number): Promise<void> {
    const message = this.getRandomMessage(
      this.STREAK_MESSAGES.milestone
    ).replace('{days}', days.toString());

    const content: NotificationContent = {
      title: '🔥 Streak Milestone!',
      body: message,
      data: {
        type: 'streak_milestone',
        days: days,
      },
    };

    await this.sendImmediateNotification(content, 'streaks');
  }

  /**
   * Send near miss notification
   */
  private async sendNearMissNotification(
    achievement: Achievement
  ): Promise<void> {
    const progress = this.calculateAchievementProgress(achievement);
    const remaining = 100 - progress;

    const message = this.getRandomMessage(this.ACHIEVEMENT_MESSAGES.nearMiss)
      .replace('{title}', achievement.title)
      .replace('{remaining}', Math.ceil(remaining).toString() + '%');

    const content: NotificationContent = {
      title: '⚡ Almost There!',
      body: message,
      data: {
        type: 'near_miss',
        achievementId: achievement.id,
        progress: progress,
      },
    };

    await this.sendImmediateNotification(content, 'achievements');
  }

  /**
   * Send streak freeze notification
   */
  private async sendStreakFreezeNotification(): Promise<void> {
    const message = this.getRandomMessage(this.STREAK_MESSAGES.freeze_used);

    const content: NotificationContent = {
      title: '🛡️ Streak Protected',
      body: message,
      data: {
        type: 'streak_freeze',
      },
    };

    await this.sendImmediateNotification(content, 'streaks');
  }

  /**
   * Schedule default recurring notifications
   */
  private async scheduleDefaultNotifications(): Promise<void> {
    if (!this.preferences?.enabled) return;

    // Schedule daily streak reminder
    if (this.preferences.streakReminders) {
      await this.scheduleStreakReminder();
    }

    // Schedule daily reminder
    if (this.preferences.dailyReminder) {
      await this.scheduleDailyReminder();
    }

    // Schedule weekly report
    if (this.preferences.weeklyReports) {
      await this.scheduleWeeklyReport();
    }
  }

  /**
   * Schedule streak reminder notification
   */
  private async scheduleStreakReminder(): Promise<void> {
    const content: NotificationContent = {
      title: '🔥 Streak Reminder',
      body: this.getRandomMessage(this.STREAK_MESSAGES.reminder),
      data: {
        type: 'streak_reminder',
      },
    };

    // Schedule for 8 PM daily
    const trigger = {
      hour: 20,
      minute: 0,
      repeats: true,
    };

    await this.scheduleNotification(
      content,
      trigger,
      'streak_reminder',
      'streaks'
    );
  }

  /**
   * Schedule daily reminder notification
   */
  private async scheduleDailyReminder(): Promise<void> {
    if (!this.preferences?.reminderTime) return;

    const [hour, minute] = this.preferences.reminderTime.split(':').map(Number);

    const content: NotificationContent = {
      title: '💰 ClariFi Daily Check-in',
      body: this.getRandomMessage(this.DAILY_REMINDER_MESSAGES),
      data: {
        type: 'daily_reminder',
      },
    };

    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    await this.scheduleNotification(
      content,
      trigger,
      'daily_reminder',
      'reports'
    );
  }

  /**
   * Schedule weekly report notification
   */
  private async scheduleWeeklyReport(): Promise<void> {
    const content: NotificationContent = {
      title: '📊 Weekly Progress Report',
      body: this.getRandomMessage(this.WEEKLY_REPORT_MESSAGES),
      data: {
        type: 'weekly_report',
      },
    };

    // Schedule for Sunday at 6 PM
    const trigger = {
      weekday: 1, // Sunday
      hour: 18,
      minute: 0,
      repeats: true,
    };

    await this.scheduleNotification(
      content,
      trigger,
      'weekly_report',
      'reports'
    );
  }

  /**
   * Schedule a notification
   */
  private async scheduleNotification(
    content: NotificationContent,
    trigger: any,
    identifier: string,
    channelId?: string
  ): Promise<void> {
    try {
      // Cancel existing notification with same identifier
      await Notifications.cancelScheduledNotificationAsync(identifier);

      // Schedule new notification
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
          ...(Platform.OS === 'android' && channelId && { channelId }),
        },
        trigger,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Send immediate notification
   */
  private async sendImmediateNotification(
    content: NotificationContent,
    channelId?: string
  ): Promise<void> {
    try {
      // Check quiet hours
      if (this.isQuietHours()) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
          ...(Platform.OS === 'android' && channelId && { channelId }),
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = this.preferences.quietHours.start
      .split(':')
      .map(Number);
    const [endHour, endMinute] = this.preferences.quietHours.end
      .split(':')
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Calculate achievement progress percentage
   */
  private calculateAchievementProgress(achievement: Achievement): number {
    if (!achievement.requirements.length) return 0;

    const totalProgress = achievement.requirements.reduce((sum, req) => {
      const progress = Math.min(req.current / req.target, 1) * 100;
      return sum + progress;
    }, 0);

    return totalProgress / achievement.requirements.length;
  }

  /**
   * Get random message from array
   */
  private getRandomMessage(messages: string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    newPreferences: Partial<NotificationPreferences>
  ): Promise<void> {
    this.preferences = {
      ...this.getDefaultPreferences(),
      ...this.preferences,
      ...newPreferences,
    };

    await this.savePreferences();

    // Reschedule notifications based on new preferences
    await this.cancelAllScheduledNotifications();
    if (this.preferences.enabled) {
      await this.scheduleDefaultNotifications();
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return this.preferences || this.getDefaultPreferences();
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      streakReminders: true,
      achievementProgress: true,
      milestoneAlerts: true,
      weeklyReports: true,
      dailyReminder: false,
      reminderTime: '09:00',
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
      achievementCelebrations: true,
      progressMilestones: true,
      nearMissAlerts: true,
    };
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      await this.saveScheduledNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.preferences = JSON.parse(data);
      } else {
        this.preferences = this.getDefaultPreferences();
        await this.savePreferences();
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      if (this.preferences) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.preferences)
        );
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  /**
   * Load scheduled notifications from storage
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.SCHEDULED_KEY);
      if (data) {
        this.scheduledNotifications = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  /**
   * Save scheduled notifications to storage
   */
  private async saveScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.SCHEDULED_KEY,
        JSON.stringify(this.scheduledNotifications)
      );
    } catch (error) {
      console.error('Error saving scheduled notifications:', error);
    }
  }

  /**
   * Test notification (for development)
   */
  async sendTestNotification(): Promise<void> {
    const content: NotificationContent = {
      title: '🧪 Test Notification',
      body: 'This is a test notification from ClariFi!',
      data: { type: 'test' },
    };

    await this.sendImmediateNotification(content);
  }
}

export default MotivationalNotificationService;
