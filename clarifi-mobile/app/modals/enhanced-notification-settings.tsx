import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useCreditCards } from '../../hooks/useCreditCards';
import {
  NotificationCalendar,
  ScheduledAlert,
} from '../../components/notifications/NotificationCalendar';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import {
  X,
  Bell,
  Calendar,
  Settings,
  TestTube,
  Clock,
  Smartphone,
  Mail,
  MessageSquare,
} from 'lucide-react-native';

type ViewMode = 'settings' | 'schedule';

const EnhancedNotificationSettingsModal: React.FC = () => {
  const router = useRouter();
  const { cards } = useCreditCards();

  const [viewMode, setViewMode] = useState<ViewMode>('settings');
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [utilizationThreshold, setUtilizationThreshold] = useState(70);
  const [daysBeforeStatement, setDaysBeforeStatement] = useState(3);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState(22);
  const [quietHoursEnd, setQuietHoursEnd] = useState(7);
  const [alertFrequency, setAlertFrequency] = useState<
    'once' | 'daily' | 'threshold'
  >('once');
  const [channelSettings, setChannelSettings] = useState({
    push: true,
    email: false,
    sms: false,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Mock scheduled alerts data
  const [scheduledAlerts] = useState<ScheduledAlert[]>([
    {
      id: '1',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '09:00',
      cardName: 'TD Rewards Visa',
      cardColor: colors.clarityBlue,
      type: 'utilization',
      projectedUtilization: 68,
      priority: 'high',
      isRecurring: false,
    },
    {
      id: '2',
      date: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
      time: '14:30',
      cardName: 'RBC Cashback',
      cardColor: colors.growthGreen,
      type: 'payment',
      priority: 'medium',
      isRecurring: true,
    },
    {
      id: '3',
      date: new Date(Date.now() + 4 * 86400000),
      time: '10:00',
      cardName: 'Scotiabank Gold',
      cardColor: colors.warning,
      type: 'utilization',
      projectedUtilization: 85,
      priority: 'critical',
      isRecurring: false,
    },
  ]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification Sent',
      'Check your device notifications to see how credit utilization alerts will appear.',
      [{ text: 'OK' }]
    );
  };

  const handleDateSelect = (date: Date, alerts: ScheduledAlert[]) => {
    if (alerts.length > 0) {
      const alertList = alerts
        .map(alert => `• ${alert.time} - ${alert.cardName} (${alert.type})`)
        .join('\n');

      Alert.alert(`Alerts for ${date.toLocaleDateString('en-CA')}`, alertList, [
        { text: 'OK' },
      ]);
    }
  };

  const handleAlertSnooze = (alertId: string) => {
    Alert.alert(
      'Snooze Alert',
      'How long would you like to snooze this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 Hour', onPress: () => console.log('Snoozed 1h') },
        { text: '1 Day', onPress: () => console.log('Snoozed 1d') },
        { text: '3 Days', onPress: () => console.log('Snoozed 3d') },
      ]
    );
  };

  const handleAlertEdit = (alertId: string) => {
    Alert.alert('Edit Alert', 'Alert editing functionality would open here.', [
      { text: 'OK' },
    ]);
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <X size={24} color={colors.pureWhite} />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Alert Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your credit utilization notifications
        </Text>
      </View>
    </Animated.View>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === 'settings' && styles.activeToggleButton,
        ]}
        onPress={() => setViewMode('settings')}
      >
        <Settings
          size={20}
          color={
            viewMode === 'settings' ? colors.pureWhite : colors.clarityBlue
          }
        />
        <Text
          style={[
            styles.toggleButtonText,
            viewMode === 'settings' && styles.activeToggleButtonText,
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === 'schedule' && styles.activeToggleButton,
        ]}
        onPress={() => setViewMode('schedule')}
      >
        <Calendar
          size={20}
          color={
            viewMode === 'schedule' ? colors.pureWhite : colors.clarityBlue
          }
        />
        <Text
          style={[
            styles.toggleButtonText,
            viewMode === 'schedule' && styles.activeToggleButtonText,
          ]}
        >
          Schedule
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMasterToggle = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Bell size={24} color={colors.clarityBlue} />
        <Text style={styles.sectionTitle}>Credit Utilization Alerts</Text>
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Enable Alerts</Text>
          <Text style={styles.settingDescription}>
            Get notified when your utilization approaches concerning levels
          </Text>
        </View>
        <Switch
          value={masterEnabled}
          onValueChange={setMasterEnabled}
          trackColor={{ false: colors.cloudGray, true: colors.clarityBlue }}
          thumbColor={colors.pureWhite}
        />
      </View>
    </View>
  );

  const renderAlertSettings = () => {
    if (!masterEnabled) return null;

    return (
      <Animated.View style={[styles.expandedSettings, { opacity: fadeAnim }]}>
        {/* Utilization Threshold */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Threshold</Text>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Alert when utilization above {utilizationThreshold}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={90}
              step={5}
              value={utilizationThreshold}
              onValueChange={setUtilizationThreshold}
              minimumTrackTintColor={colors.clarityBlue}
              maximumTrackTintColor={colors.cloudGray}
              thumbTintColor={colors.clarityBlue}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>30%</Text>
              <Text style={styles.sliderLabelText}>60%</Text>
              <Text style={styles.sliderLabelText}>90%</Text>
            </View>
          </View>
        </View>

        {/* Timing Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timing</Text>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Days before statement: {daysBeforeStatement}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={7}
              step={1}
              value={daysBeforeStatement}
              onValueChange={setDaysBeforeStatement}
              minimumTrackTintColor={colors.clarityBlue}
              maximumTrackTintColor={colors.cloudGray}
              thumbTintColor={colors.clarityBlue}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>1 day</Text>
              <Text style={styles.sliderLabelText}>7 days</Text>
            </View>
          </View>

          <View style={styles.frequencyContainer}>
            <Text style={styles.settingLabel}>Alert Frequency</Text>
            <View style={styles.frequencyOptions}>
              {[
                { key: 'once', label: 'Once' },
                { key: 'daily', label: 'Daily' },
                { key: 'threshold', label: 'At Threshold' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.frequencyOption,
                    alertFrequency === option.key &&
                      styles.selectedFrequencyOption,
                  ]}
                  onPress={() => setAlertFrequency(option.key as any)}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      alertFrequency === option.key &&
                        styles.selectedFrequencyOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
              <Text style={styles.settingDescription}>
                Pause non-critical alerts during specified hours
              </Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              trackColor={{ false: colors.cloudGray, true: colors.clarityBlue }}
              thumbColor={colors.pureWhite}
            />
          </View>

          {quietHoursEnabled && (
            <View style={styles.timeRangeContainer}>
              <View style={styles.timePickerRow}>
                <Clock size={16} color={colors.neutralGray} />
                <Text style={styles.timeLabel}>
                  {quietHoursStart}:00 to {quietHoursEnd}:00
                </Text>
                <TouchableOpacity
                  style={styles.changeTimeButton}
                  onPress={() =>
                    Alert.alert(
                      'Coming Soon',
                      'Time picker will be available soon.'
                    )
                  }
                >
                  <Text style={styles.changeTimeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Notification Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>

          <View style={styles.channelRow}>
            <Smartphone size={20} color={colors.clarityBlue} />
            <View style={styles.channelInfo}>
              <Text style={styles.channelLabel}>Push Notifications</Text>
              <Text style={styles.channelDescription}>
                Instant alerts on your device
              </Text>
            </View>
            <Switch
              value={channelSettings.push}
              onValueChange={value =>
                setChannelSettings({ ...channelSettings, push: value })
              }
              trackColor={{ false: colors.cloudGray, true: colors.clarityBlue }}
              thumbColor={colors.pureWhite}
            />
          </View>

          <View style={styles.channelRow}>
            <Mail size={20} color={colors.neutralGray} />
            <View style={styles.channelInfo}>
              <Text style={[styles.channelLabel, styles.disabledChannel]}>
                Email Alerts
              </Text>
              <Text style={styles.channelDescription}>Coming soon</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() =>
                Alert.alert(
                  'Coming Soon',
                  'Email notifications will be available in a future update.'
                )
              }
              disabled
              trackColor={{ false: colors.cloudGray, true: colors.neutralGray }}
              thumbColor={colors.neutralGray}
            />
          </View>

          <View style={styles.channelRow}>
            <MessageSquare size={20} color={colors.neutralGray} />
            <View style={styles.channelInfo}>
              <Text style={[styles.channelLabel, styles.disabledChannel]}>
                SMS Alerts
              </Text>
              <Text style={styles.channelDescription}>Coming soon</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() =>
                Alert.alert(
                  'Coming Soon',
                  'SMS notifications will be available in a future update.'
                )
              }
              disabled
              trackColor={{ false: colors.cloudGray, true: colors.neutralGray }}
              thumbColor={colors.neutralGray}
            />
          </View>
        </View>

        {/* Per-Card Settings */}
        {cards && cards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Per-Card Settings</Text>

            {cards.map(card => (
              <TouchableOpacity
                key={card.id}
                style={styles.cardSettingRow}
                onPress={() => {
                  router.push({
                    pathname: '/modals/card-notification-settings',
                    params: { cardId: card.id },
                  });
                }}
              >
                <View
                  style={[
                    styles.cardColor,
                    { backgroundColor: card.color || colors.clarityBlue },
                  ]}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardDescription}>
                    Custom thresholds and preferences
                  </Text>
                </View>
                <Text style={styles.cardSettingChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Test Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <TestTube size={20} color={colors.clarityBlue} />
            <Text style={styles.testButtonText}>Test Notification</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderScheduleView = () => (
    <View style={styles.scheduleContainer}>
      <NotificationCalendar
        scheduledAlerts={scheduledAlerts}
        onDateSelect={handleDateSelect}
        onAlertSnooze={handleAlertSnooze}
        onAlertEdit={handleAlertEdit}
      />
    </View>
  );

  return (
    <>
      <StatusBar
        backgroundColor={colors.clarityBlue}
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderViewToggle()}

        <Animated.ScrollView
          style={[
            styles.scrollView,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'settings' ? (
            <>
              {renderMasterToggle()}
              {renderAlertSettings()}
            </>
          ) : (
            renderScheduleView()
          )}

          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
      </SafeAreaView>
    </>
  );
};

export default EnhancedNotificationSettingsModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    backgroundColor: colors.clarityBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -40,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.9,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 12,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  activeToggleButton: {
    backgroundColor: colors.clarityBlue,
  },
  toggleButtonText: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  activeToggleButtonText: {
    color: colors.pureWhite,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
    lineHeight: 18,
  },
  expandedSettings: {
    gap: spacing.sm,
  },
  sliderContainer: {
    marginVertical: spacing.md,
  },
  sliderLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  slider: {
    height: 40,
    marginVertical: spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  sliderLabelText: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  frequencyContainer: {
    marginTop: spacing.md,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cloudGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedFrequencyOption: {
    backgroundColor: colors.clarityBlue,
  },
  frequencyOptionText: {
    ...textStyles.caption,
    color: colors.neutralGray,
    fontWeight: '600',
  },
  selectedFrequencyOptionText: {
    color: colors.pureWhite,
  },
  timeRangeContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.cloudGray,
    borderRadius: 8,
    padding: spacing.md,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    flex: 1,
  },
  changeTimeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.clarityBlue,
    borderRadius: 6,
  },
  changeTimeButtonText: {
    ...textStyles.caption,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cloudGray,
  },
  channelInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  channelLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  disabledChannel: {
    color: colors.neutralGray,
  },
  channelDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  cardSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cloudGray,
  },
  cardColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  cardSettingChevron: {
    ...textStyles.h2,
    color: colors.neutralGray,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cloudGray,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  testButtonText: {
    ...textStyles.button,
    color: colors.clarityBlue,
  },
  scheduleContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
