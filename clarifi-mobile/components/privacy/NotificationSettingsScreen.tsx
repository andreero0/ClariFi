import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NotificationPreferences } from '../../services/storage/dataModels';
import {
  getObject,
  storeObject,
  STORAGE_KEYS,
} from '../../services/storage/asyncStorage';
import {
  validateQuietHours,
  getQuietHoursDescription,
} from '../../services/notifications/scheduler';
import * as Notifications from 'expo-notifications';

interface NotificationSettingsScreenProps {
  onClose?: () => void;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onClose,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    quiet_hours: { start_hour: 22, end_hour: 7 },
    preferred_time_hour: 10,
    days_before_statement_alert: 3,
    min_utilization_for_alert: 50,
  });
  const [loading, setLoading] = useState(true);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showPreferredTimePicker, setShowPreferredTimePicker] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadNotificationSettings();
    checkPermissions();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const stored = await getObject<NotificationPreferences>(
        STORAGE_KEYS.NOTIFICATION_PREFERENCES
      );
      if (stored) {
        setPreferences(stored);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setHasPermission(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'To receive credit utilization alerts and payment reminders, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Notifications.openSettingsAsync(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await storeObject(STORAGE_KEYS.NOTIFICATION_PREFERENCES, newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save notification settings. Please try again.'
      );
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (enabled) {
      updatePreference('quiet_hours', { start_hour: 22, end_hour: 7 });
    } else {
      updatePreference('quiet_hours', undefined);
    }
  };

  const updateQuietHours = (type: 'start' | 'end', hour: number) => {
    if (!preferences.quiet_hours) return;

    const newQuietHours = {
      ...preferences.quiet_hours,
      [type === 'start' ? 'start_hour' : 'end_hour']: hour,
    };

    if (validateQuietHours(newQuietHours)) {
      updatePreference('quiet_hours', newQuietHours);
    } else {
      Alert.alert(
        'Invalid Time',
        'Please select a valid time range for quiet hours.'
      );
    }
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const createTimeFromHour = (hour: number): Date => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const getHourFromTime = (time: Date): number => {
    return time.getHours();
  };

  const testNotifications = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please enable notifications first.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 ClariFi Test Notification',
          body: 'Your notification settings are working correctly! This is a test notification to verify your preferences.',
          data: { type: 'test_notification' },
        },
        trigger: { seconds: 2 },
      });

      Alert.alert(
        'Test Notification Scheduled',
        'A test notification will appear in 2 seconds to verify your settings.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule test notification.');
    }
  };

  const showQuietHoursInfo = () => {
    const criticalInfo = preferences.quiet_hours
      ? `Quiet hours are active ${getQuietHoursDescription(preferences.quiet_hours)}. Critical alerts (utilization >90% or urgent payment reminders) will still be delivered during quiet hours to prevent financial damage.`
      : 'Quiet hours are disabled. All notifications will be delivered immediately.';

    Alert.alert(
      'Quiet Hours Information',
      `${criticalInfo}\n\nYou can adjust these settings at any time to match your sleep schedule and preferences.`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Configure how and when ClariFi sends you credit utilization alerts and
          payment reminders
        </Text>
      </View>

      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Permission</Text>
        {hasPermission === null ? (
          <Text style={styles.permissionText}>Checking permissions...</Text>
        ) : hasPermission ? (
          <View style={styles.permissionStatus}>
            <Text style={styles.permissionText}>✅ Notifications enabled</Text>
          </View>
        ) : (
          <View style={styles.permissionWarning}>
            <Text style={styles.permissionText}>❌ Notifications disabled</Text>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={requestPermissions}
            >
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Notification Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive credit utilization alerts and payment reminders
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={value => updatePreference('enabled', value)}
            disabled={!hasPermission}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Preferred Notification Time</Text>
            <Text style={styles.settingDescription}>
              Default time for non-urgent notifications:{' '}
              {formatHour(preferences.preferred_time_hour || 10)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowPreferredTimePicker(true)}
            disabled={!preferences.enabled}
          >
            <Text style={styles.timeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <TouchableOpacity onPress={showQuietHoursInfo}>
            <Text style={styles.infoButton}>ℹ️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDescription}>
          Prevent non-critical notifications during your sleep or focus time.
          Critical alerts will override quiet hours.
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
            <Text style={styles.settingDescription}>
              {preferences.quiet_hours
                ? `Active ${getQuietHoursDescription(preferences.quiet_hours)}`
                : 'Disabled - all notifications delivered immediately'}
            </Text>
          </View>
          <Switch
            value={!!preferences.quiet_hours}
            onValueChange={handleQuietHoursToggle}
            disabled={!preferences.enabled}
          />
        </View>

        {preferences.quiet_hours && (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Start Time</Text>
                <Text style={styles.settingDescription}>
                  Quiet hours begin at{' '}
                  {formatHour(preferences.quiet_hours.start_hour)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>End Time</Text>
                <Text style={styles.settingDescription}>
                  Quiet hours end at{' '}
                  {formatHour(preferences.quiet_hours.end_hour)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Alert Thresholds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Thresholds</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Statement Alert Timing</Text>
            <Text style={styles.settingDescription}>
              Get payment reminders {preferences.days_before_statement_alert}{' '}
              days before statement due
            </Text>
          </View>
          <View style={styles.numberControl}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                updatePreference(
                  'days_before_statement_alert',
                  Math.max(1, preferences.days_before_statement_alert - 1)
                )
              }
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.numberValue}>
              {preferences.days_before_statement_alert}
            </Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                updatePreference(
                  'days_before_statement_alert',
                  Math.min(14, preferences.days_before_statement_alert + 1)
                )
              }
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Utilization Alert Threshold</Text>
            <Text style={styles.settingDescription}>
              Get alerts when credit utilization exceeds{' '}
              {preferences.min_utilization_for_alert}%
            </Text>
          </View>
          <View style={styles.numberControl}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                updatePreference(
                  'min_utilization_for_alert',
                  Math.max(30, preferences.min_utilization_for_alert - 10)
                )
              }
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.numberValue}>
              {preferences.min_utilization_for_alert}%
            </Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                updatePreference(
                  'min_utilization_for_alert',
                  Math.min(90, preferences.min_utilization_for_alert + 10)
                )
              }
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Test Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Your Settings</Text>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!hasPermission || !preferences.enabled) && styles.disabledButton,
          ]}
          onPress={testNotifications}
          disabled={!hasPermission || !preferences.enabled}
        >
          <Text style={styles.actionButtonText}>🔔 Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      )}

      {/* Time Pickers */}
      {showPreferredTimePicker && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>
                Preferred Notification Time
              </Text>
              <DateTimePicker
                value={createTimeFromHour(
                  preferences.preferred_time_hour || 10
                )}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === 'android') {
                    setShowPreferredTimePicker(false);
                  }
                  if (selectedTime) {
                    updatePreference(
                      'preferred_time_hour',
                      getHourFromTime(selectedTime)
                    );
                  }
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowPreferredTimePicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {showStartTimePicker && preferences.quiet_hours && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Quiet Hours Start Time</Text>
              <DateTimePicker
                value={createTimeFromHour(preferences.quiet_hours.start_hour)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === 'android') {
                    setShowStartTimePicker(false);
                  }
                  if (selectedTime) {
                    updateQuietHours('start', getHourFromTime(selectedTime));
                  }
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowStartTimePicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {showEndTimePicker && preferences.quiet_hours && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Quiet Hours End Time</Text>
              <DateTimePicker
                value={createTimeFromHour(preferences.quiet_hours.end_hour)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  if (Platform.OS === 'android') {
                    setShowEndTimePicker(false);
                  }
                  if (selectedTime) {
                    updateQuietHours('end', getHourFromTime(selectedTime));
                  }
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowEndTimePicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.complianceNotice}>
        <Text style={styles.complianceText}>
          Notification settings are stored locally on your device. Critical
          financial alerts may override quiet hours to prevent potential
          financial damage.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 100,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
    lineHeight: 20,
  },
  infoButton: {
    fontSize: 18,
    color: '#007bff',
  },
  permissionStatus: {
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  permissionWarning: {
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  permissionText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '500',
  },
  enableButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007bff',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  enableButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  numberControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
  },
  numberValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  closeButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  pickerDoneButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  pickerDoneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  complianceNotice: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  complianceText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default NotificationSettingsScreen;
