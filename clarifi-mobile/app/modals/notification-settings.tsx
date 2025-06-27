import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface GlobalNotificationSettings {
  enabled: boolean;
  defaultUtilizationThreshold: number;
  paymentReminders: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  criticalOverride: boolean;
  pushNotifications: boolean;
  achievements: boolean;
  optimizationTips: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<GlobalNotificationSettings>({
    enabled: true,
    defaultUtilizationThreshold: 70,
    paymentReminders: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00',
    },
    criticalOverride: true,
    pushNotifications: true,
    achievements: true,
    optimizationTips: true,
  });

  const updateSetting = <K extends keyof GlobalNotificationSettings>(
    key: K,
    value: GlobalNotificationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    console.log('Saving global notification settings:', newSettings);
  };

  const handleOpenSystemSettings = () => {
    Alert.alert(
      'System Notification Settings',
      'To fully enable notifications, please allow notifications for ClariFi in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const renderSettingRow = (
    label: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    description?: string,
    icon?: keyof typeof Ionicons.glyphMap,
    enabled: boolean = true
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={theme.textSecondary}
              style={styles.settingIcon}
            />
          )}
          <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
            {label}
          </Text>
        </View>
        {description && (
          <Text
            style={[styles.settingDescription, { color: theme.textSecondary }]}
          >
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value && enabled}
        onValueChange={enabled ? onToggle : undefined}
        disabled={!enabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
      />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    headerTitle: {
      ...(textStyles.h2 || {}),
      color: theme.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      padding: spacing.xs,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    sectionTitle: {
      ...(textStyles.bodyLarge || {}),
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      marginRight: spacing.xs,
    },
    settingLabel: {
      ...(textStyles.bodyRegular || {}),
      fontWeight: '500',
    },
    settingDescription: {
      ...(textStyles.bodySmall || {}),
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    sliderContainer: {
      paddingVertical: spacing.md,
    },
    sliderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sliderValue: {
      ...(textStyles.bodyLarge || {}),
      fontWeight: '600',
      color: theme.primary,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    sliderLabel: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
    },
    quietHoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    quietHoursTime: {
      ...(textStyles.bodyRegular || {}),
      color: theme.primary,
      fontWeight: '500',
    },
    systemButton: {
      marginTop: spacing.xs,
    },
  });

  const renderSliderRow = (
    label: string,
    value: number,
    onValueChange: (value: number) => void,
    min: number = 0,
    max: number = 100,
    step: number = 5,
    unit: string = '%'
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
          {label}
        </Text>
        <Text style={styles.sliderValue}>
          {value}
          {unit}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={onValueChange}
        step={step}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.primary}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>
          {min}
          {unit}
        </Text>
        <Text style={styles.sliderLabel}>
          {max}
          {unit}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        {renderSection(
          'General',
          <>
            {renderSettingRow(
              'Enable Notifications',
              settings.enabled,
              value => updateSetting('enabled', value),
              'Master switch for all ClariFi notifications',
              'notifications'
            )}
            {renderSettingRow(
              'Push Notifications',
              settings.pushNotifications,
              value => updateSetting('pushNotifications', value),
              'Receive notifications on this device',
              'phone-portrait',
              settings.enabled
            )}
          </>
        )}

        {/* Credit Utilization */}
        {renderSection(
          'Credit Utilization Alerts',
          <>
            {renderSliderRow(
              'Default Alert Threshold',
              settings.defaultUtilizationThreshold,
              value =>
                updateSetting('defaultUtilizationThreshold', Math.round(value)),
              10,
              95,
              5
            )}
            <Text
              style={[
                styles.settingDescription,
                { color: theme.textSecondary },
              ]}
            >
              Default threshold for new cards. Individual cards can override
              this setting.
            </Text>
          </>
        )}

        {/* Payment Reminders */}
        {renderSection(
          'Payment Reminders',
          <>
            {renderSettingRow(
              'Payment Reminders',
              settings.paymentReminders,
              value => updateSetting('paymentReminders', value),
              'Get reminded before payment due dates',
              'calendar'
            )}
          </>
        )}

        {/* Quiet Hours */}
        {renderSection(
          'Quiet Hours',
          <>
            {renderSettingRow(
              'Enable Quiet Hours',
              settings.quietHours.enabled,
              value =>
                updateSetting('quietHours', {
                  ...settings.quietHours,
                  enabled: value,
                }),
              'Silence non-critical notifications during specified hours',
              'moon'
            )}
            {settings.quietHours.enabled && (
              <View style={styles.quietHoursRow}>
                <Text
                  style={[styles.settingLabel, { color: theme.textPrimary }]}
                >
                  Quiet Hours
                </Text>
                <Text style={styles.quietHoursTime}>
                  {settings.quietHours.start} - {settings.quietHours.end}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Priority Overrides */}
        {renderSection(
          'Priority Overrides',
          <>
            {renderSettingRow(
              'Critical Alerts Override',
              settings.criticalOverride,
              value => updateSetting('criticalOverride', value),
              'Allow critical alerts during quiet hours',
              'warning'
            )}
          </>
        )}

        {/* Additional Features */}
        {renderSection(
          'Additional Features',
          <>
            {renderSettingRow(
              'Achievement Notifications',
              settings.achievements,
              value => updateSetting('achievements', value),
              'Celebrate when you reach financial milestones',
              'trophy'
            )}
            {renderSettingRow(
              'Optimization Tips',
              settings.optimizationTips,
              value => updateSetting('optimizationTips', value),
              'Receive personalized tips to improve your credit usage',
              'bulb'
            )}
          </>
        )}

        {/* System Settings */}
        {renderSection(
          'System Settings',
          <>
            <Button
              title="Open Device Notification Settings"
              onPress={handleOpenSystemSettings}
              variant="outline"
              style={styles.systemButton}
            />
            <Text
              style={[
                styles.settingDescription,
                { color: theme.textSecondary, marginTop: spacing.sm },
              ]}
            >
              Manage system-level notification permissions and settings for
              ClariFi.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
