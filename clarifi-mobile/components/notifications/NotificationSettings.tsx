import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  Clock,
  CreditCard,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Volume2,
  VolumeX,
  Send,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface NotificationGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  settings: NotificationSubSetting[];
}

interface NotificationSubSetting {
  id: string;
  title: string;
  enabled: boolean;
}

const NotificationSettings: React.FC = () => {
  const router = useRouter();
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '08:00' });
  const [daysBeforeStatement, setDaysBeforeStatement] = useState(3);
  
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([
    {
      id: 'utilization',
      title: 'Utilization Warnings',
      description: 'Alerts when credit usage approaches limits',
      icon: <CreditCard size={24} color={colors.warning} />,
      enabled: true,
      settings: [
        { id: 'high_utilization', title: 'High utilization (>70%)', enabled: true },
        { id: 'critical_utilization', title: 'Critical utilization (>90%)', enabled: true },
        { id: 'credit_limit_reached', title: 'Credit limit reached', enabled: true },
      ],
    },
    {
      id: 'payments',
      title: 'Payment Reminders',
      description: 'Never miss a payment deadline',
      icon: <Clock size={24} color={colors.clarityBlue} />,
      enabled: true,
      settings: [
        { id: 'due_soon', title: 'Due in 3 days', enabled: true },
        { id: 'due_tomorrow', title: 'Due tomorrow', enabled: true },
        { id: 'overdue', title: 'Overdue payments', enabled: true },
      ],
    },
    {
      id: 'insights',
      title: 'Spending Insights',
      description: 'Weekly summaries and spending patterns',
      icon: <TrendingUp size={24} color={colors.wisdomPurple} />,
      enabled: false,
      settings: [
        { id: 'weekly_summary', title: 'Weekly spending summary', enabled: false },
        { id: 'category_alerts', title: 'Category budget alerts', enabled: false },
        { id: 'unusual_spending', title: 'Unusual spending detected', enabled: true },
      ],
    },
    {
      id: 'education',
      title: 'Educational Tips',
      description: 'Learn to improve your credit health',
      icon: <Lightbulb size={24} color={colors.growthGreen} />,
      enabled: true,
      settings: [
        { id: 'credit_tips', title: 'Credit improvement tips', enabled: true },
        { id: 'financial_education', title: 'Financial education content', enabled: false },
      ],
    },
  ]);

  const toggleMasterNotifications = (enabled: boolean) => {
    setMasterEnabled(enabled);
    if (!enabled) {
      // Disable all notification groups when master is disabled
      setNotificationGroups(groups => 
        groups.map(group => ({ ...group, enabled: false }))
      );
    }
  };

  const toggleNotificationGroup = (groupId: string, enabled: boolean) => {
    if (!masterEnabled && enabled) {
      Alert.alert(
        'Enable Notifications',
        'Turn on the master notification toggle to enable specific notification types.',
        [{ text: 'OK' }]
      );
      return;
    }

    setNotificationGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, enabled } : group
      )
    );
  };

  const sendTestNotification = () => {
    Alert.alert(
      'Test Notification Sent',
      'Check your notification center to see how alerts will appear.',
      [{ text: 'OK' }]
    );
  };

  const renderNotificationGroup = (group: NotificationGroup) => (
    <View key={group.id} style={styles.groupContainer}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          {group.icon}
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
        </View>
        <Switch
          value={group.enabled && masterEnabled}
          onValueChange={(enabled) => toggleNotificationGroup(group.id, enabled)}
          trackColor={{ false: colors.neutralGray, true: colors.clarityBlue }}
          thumbColor={colors.pureWhite}
          disabled={!masterEnabled}
        />
      </View>
      
      {group.enabled && masterEnabled && (
        <View style={styles.subSettings}>
          {group.settings.map((setting) => (
            <View key={setting.id} style={styles.subSetting}>
              <Text style={styles.subSettingTitle}>{setting.title}</Text>
              <Switch
                value={setting.enabled}
                onValueChange={(enabled) => {
                  setNotificationGroups(groups =>
                    groups.map(g =>
                      g.id === group.id
                        ? {
                            ...g,
                            settings: g.settings.map(s =>
                              s.id === setting.id ? { ...s, enabled } : s
                            ),
                          }
                        : g
                    )
                  );
                }}
                trackColor={{ false: colors.neutralGray, true: colors.clarityBlue }}
                thumbColor={colors.pureWhite}
                style={styles.subSettingSwitch}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderTimePreference = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Notification Timing</Text>
      
      <TouchableOpacity 
        style={styles.settingRow}
        onPress={() => router.push('/modals/smart-notification-timing')}
      >
        <View style={styles.settingIcon}>
          <Clock size={20} color={colors.clarityBlue} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Smart Timing</Text>
          <Text style={styles.settingDescription}>AI learns your best notification times</Text>
        </View>
        <ChevronRight size={20} color={colors.neutralGray} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingRow}>
        <View style={styles.settingIcon}>
          {quietHours.start ? <VolumeX size={20} color={colors.neutralGray} /> : <Volume2 size={20} color={colors.clarityBlue} />}
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Quiet Hours</Text>
          <Text style={styles.settingDescription}>
            {quietHours.start && quietHours.end 
              ? `${quietHours.start} - ${quietHours.end}`
              : 'Not configured'
            }
          </Text>
        </View>
        <ChevronRight size={20} color={colors.neutralGray} />
      </TouchableOpacity>

      {/* Days before statement slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.settingTitle}>Payment Reminder Timing</Text>
        <Text style={styles.settingDescription}>
          Send payment reminders {daysBeforeStatement} day{daysBeforeStatement !== 1 ? 's' : ''} before due date
        </Text>
        <View style={styles.sliderTrack}>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 day</Text>
            <Text style={styles.sliderLabel}>7 days</Text>
          </View>
          {/* Slider implementation would go here - using TouchableOpacity for mock */}
          <View style={styles.sliderMock}>
            <View style={[styles.sliderThumb, { left: `${((daysBeforeStatement - 1) / 6) * 100}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>
            Stay informed about your credit health and payment deadlines
          </Text>
        </View>

        {/* Master Toggle */}
        <View style={styles.masterToggleContainer}>
          <View style={styles.masterToggleContent}>
            <Bell size={24} color={masterEnabled ? colors.clarityBlue : colors.neutralGray} />
            <View style={styles.masterToggleInfo}>
              <Text style={styles.masterToggleTitle}>All Notifications</Text>
              <Text style={styles.masterToggleDescription}>
                {masterEnabled ? 'Notifications are enabled' : 'All notifications are disabled'}
              </Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={toggleMasterNotifications}
              trackColor={{ false: colors.neutralGray, true: colors.clarityBlue }}
              thumbColor={colors.pureWhite}
            />
          </View>
        </View>

        {/* Notification Groups */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          {notificationGroups.map(renderNotificationGroup)}
        </View>

        {/* Time Preferences */}
        {renderTimePreference()}

        {/* Test Notification */}
        <View style={styles.testContainer}>
          <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
            <Send size={20} color={colors.pureWhite} />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...textStyles.h1,
    color: colors.midnightInk,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.neutralGray,
  },
  masterToggleContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  masterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterToggleInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  masterToggleTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: 2,
  },
  masterToggleDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  sectionContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  groupContainer: {
    backgroundColor: colors.pureWhite,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  groupTitle: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  subSettings: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderDivider,
  },
  subSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  subSettingTitle: {
    ...textStyles.body,
    color: colors.neutralGray,
    flex: 1,
  },
  subSettingSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  sliderContainer: {
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderTrack: {
    marginTop: spacing.md,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  sliderMock: {
    height: 4,
    backgroundColor: colors.cloudGray,
    borderRadius: 2,
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.clarityBlue,
    shadowColor: colors.clarityBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  testContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clarityBlue,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.clarityBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  testButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
    marginLeft: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default NotificationSettings;