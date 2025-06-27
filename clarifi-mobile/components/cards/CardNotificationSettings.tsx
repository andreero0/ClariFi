import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CardNotificationPreferences } from '../../services/storage/dataModels';
import { cardNotificationPreferences } from '../../services/notifications/cardNotificationPreferences';

interface CardNotificationSettingsProps {
  cardId: string;
  cardName: string;
  onPreferencesChanged?: (preferences: CardNotificationPreferences) => void;
  isModal?: boolean;
}

export const CardNotificationSettings: React.FC<
  CardNotificationSettingsProps
> = ({ cardId, cardName, onPreferencesChanged, isModal = false }) => {
  const [preferences, setPreferences] =
    useState<CardNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [cardId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const cardPrefs =
        await cardNotificationPreferences.getCardPreferences(cardId);
      setPreferences(cardPrefs);
    } catch (error) {
      console.error('Error loading card notification preferences:', error);
      Alert.alert(
        'Error',
        'Failed to load notification settings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (
    updatedPreferences: Partial<CardNotificationPreferences>
  ) => {
    if (!preferences) return;

    try {
      setSaving(true);
      await cardNotificationPreferences.updateCardPreferences(
        cardId,
        updatedPreferences
      );

      const newPreferences = { ...preferences, ...updatedPreferences };
      setPreferences(newPreferences);
      onPreferencesChanged?.(newPreferences);

      // Provide user feedback
      if (Platform.OS === 'ios') {
        // iOS haptic feedback could be added here
      }
    } catch (error) {
      console.error('Error saving card notification preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save notification settings. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all notification settings for this card to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await cardNotificationPreferences.resetCardPreferences(cardId);
              const defaultPrefs =
                cardNotificationPreferences.getDefaultPreferences();
              setPreferences(defaultPrefs);
              onPreferencesChanged?.(defaultPrefs);
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to reset settings. Please try again.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Notification Settings</Text>
      <Text style={styles.subtitle}>{cardName}</Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetToDefaults}
        disabled={saving}
      >
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMainToggle = () => (
    <View style={styles.section}>
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Enable Notifications</Text>
          <Text style={styles.settingDescription}>
            Master toggle for all notifications for this card
          </Text>
        </View>
        <Switch
          value={preferences?.enabled || false}
          onValueChange={value => savePreferences({ enabled: value })}
          disabled={saving}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>
    </View>
  );

  const renderUtilizationAlerts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💳 Utilization Alerts</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Enable Utilization Alerts</Text>
          <Text style={styles.settingDescription}>
            Get notified when your utilization exceeds thresholds
          </Text>
        </View>
        <Switch
          value={preferences?.utilization_alerts?.enabled || false}
          onValueChange={value =>
            savePreferences({
              utilization_alerts: {
                ...preferences?.utilization_alerts,
                enabled: value,
              },
            })
          }
          disabled={saving || !preferences?.enabled}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>

      {preferences?.utilization_alerts?.enabled && (
        <>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Alert Threshold:{' '}
              {preferences?.utilization_alerts?.threshold || 70}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={95}
              step={5}
              value={preferences?.utilization_alerts?.threshold || 70}
              onValueChange={value =>
                savePreferences({
                  utilization_alerts: {
                    ...preferences?.utilization_alerts,
                    threshold: value,
                  },
                })
              }
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#e1e5e9"
              thumbTintColor="#007AFF"
              disabled={saving}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>10%</Text>
              <Text style={styles.sliderLabelText}>95%</Text>
            </View>
          </View>

          <View style={styles.multiThresholdContainer}>
            <Text style={styles.settingTitle}>Multiple Alert Levels</Text>
            <Text style={styles.settingDescription}>
              Current:{' '}
              {preferences?.utilization_alerts?.custom_thresholds?.join(
                '%, '
              ) || '50, 70, 90'}
              %
            </Text>
            <TouchableOpacity
              style={styles.configButton}
              onPress={() =>
                Alert.alert(
                  'Coming Soon',
                  'Custom threshold configuration will be available soon.'
                )
              }
            >
              <Text style={styles.configButtonText}>Configure</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderPaymentReminders = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Payment Reminders</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Enable Payment Reminders</Text>
          <Text style={styles.settingDescription}>
            Get reminded before your payment is due
          </Text>
        </View>
        <Switch
          value={preferences?.payment_reminders?.enabled || false}
          onValueChange={value =>
            savePreferences({
              payment_reminders: {
                ...preferences?.payment_reminders,
                enabled: value,
              },
            })
          }
          disabled={saving || !preferences?.enabled}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>

      {preferences?.payment_reminders?.enabled && (
        <>
          <View style={styles.checkboxContainer}>
            <Text style={styles.settingTitle}>Reminder Options</Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                savePreferences({
                  payment_reminders: {
                    ...preferences?.payment_reminders,
                    due_date_reminder:
                      !preferences?.payment_reminders?.due_date_reminder,
                  },
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  preferences?.payment_reminders?.due_date_reminder &&
                    styles.checkboxSelected,
                ]}
              >
                {preferences?.payment_reminders?.due_date_reminder && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Due date reminder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                savePreferences({
                  payment_reminders: {
                    ...preferences?.payment_reminders,
                    overdue_alerts:
                      !preferences?.payment_reminders?.overdue_alerts,
                  },
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  preferences?.payment_reminders?.overdue_alerts &&
                    styles.checkboxSelected,
                ]}
              >
                {preferences?.payment_reminders?.overdue_alerts && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Overdue alerts</Text>
            </TouchableOpacity>

            <View style={styles.reminderDaysContainer}>
              <Text style={styles.settingDescription}>
                Advance reminders:{' '}
                {preferences?.payment_reminders?.days_before?.join(', ') ||
                  '7, 3, 1'}{' '}
                days before due
              </Text>
              <TouchableOpacity
                style={styles.configButton}
                onPress={() =>
                  Alert.alert(
                    'Coming Soon',
                    'Custom reminder day configuration will be available soon.'
                  )
                }
              >
                <Text style={styles.configButtonText}>Configure Days</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );

  const renderQuietHours = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🌙 Quiet Hours</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Custom Quiet Hours</Text>
          <Text style={styles.settingDescription}>
            Override global quiet hours for this card
          </Text>
        </View>
        <Switch
          value={preferences?.quiet_hours?.enabled || false}
          onValueChange={value =>
            savePreferences({
              quiet_hours: {
                ...preferences?.quiet_hours,
                enabled: value,
              },
            })
          }
          disabled={saving || !preferences?.enabled}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>

      {preferences?.quiet_hours?.enabled && (
        <View style={styles.timePickerContainer}>
          <Text style={styles.settingDescription}>
            Quiet hours: {preferences?.quiet_hours?.start_hour || 22}:00 to{' '}
            {preferences?.quiet_hours?.end_hour || 7}:00
          </Text>
          <TouchableOpacity
            style={styles.configButton}
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Time picker for quiet hours will be available soon.'
              )
            }
          >
            <Text style={styles.configButtonText}>Set Times</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderNotificationChannels = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📱 Notification Channels</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Mobile app notifications
          </Text>
        </View>
        <Switch
          value={preferences?.notification_channels?.push || false}
          onValueChange={value =>
            savePreferences({
              notification_channels: {
                ...preferences?.notification_channels,
                push: value,
              },
            })
          }
          disabled={saving || !preferences?.enabled}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Email Alerts</Text>
          <Text style={styles.settingDescription}>Coming soon</Text>
        </View>
        <Switch
          value={false}
          onValueChange={() =>
            Alert.alert(
              'Coming Soon',
              'Email notifications will be available in a future update.'
            )
          }
          disabled={true}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>SMS Alerts</Text>
          <Text style={styles.settingDescription}>Coming soon</Text>
        </View>
        <Switch
          value={false}
          onValueChange={() =>
            Alert.alert(
              'Coming Soon',
              'SMS notifications will be available in a future update.'
            )
          }
          disabled={true}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>
    </View>
  );

  const renderPriorityOverrides = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Priority Overrides</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>
            Critical Alerts Bypass Quiet Hours
          </Text>
          <Text style={styles.settingDescription}>
            Allow critical alerts during quiet hours
          </Text>
        </View>
        <Switch
          value={
            preferences?.priority_overrides?.critical_bypass_quiet_hours ||
            false
          }
          onValueChange={value =>
            savePreferences({
              priority_overrides: {
                ...preferences?.priority_overrides,
                critical_bypass_quiet_hours: value,
              },
            })
          }
          disabled={saving || !preferences?.enabled}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>
            High Priority Bypass Quiet Hours
          </Text>
          <Text style={styles.settingDescription}>
            Allow high priority alerts during quiet hours
          </Text>
        </View>
        <Switch
          value={
            preferences?.priority_overrides?.high_priority_bypass_quiet_hours ||
            false
          }
          onValueChange={value =>
            savePreferences({
              priority_overrides: {
                ...preferences?.priority_overrides,
                high_priority_bypass_quiet_hours: value,
              },
            })
          }
          disabled={saving || !preferences?.enabled}
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to load notification settings
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isModal && styles.modalContainer]}
      showsVerticalScrollIndicator={false}
    >
      {renderHeader()}
      {renderMainToggle()}
      {renderUtilizationAlerts()}
      {renderPaymentReminders()}
      {renderQuietHours()}
      {renderNotificationChannels()}
      {renderPriorityOverrides()}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContainer: {
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#6c757d',
  },
  multiThresholdContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  configButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginTop: 8,
  },
  configButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  checkboxContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  reminderDaysContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  timePickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
