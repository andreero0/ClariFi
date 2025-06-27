import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import PrivacyManager, {
  ConsentLevel,
} from '../../services/privacy/PrivacyManager';
import PrivacyAwareAnalytics from '../../services/analytics/PrivacyAwareAnalytics';
import { useRouter } from 'expo-router';

interface PrivacySettingsScreenProps {
  onClose?: () => void;
}

const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({
  onClose,
}) => {
  const router = useRouter();
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics] = useState(() => new PrivacyAwareAnalytics());
  const privacyManager = PrivacyManager.getInstance();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settings = await privacyManager.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsentLevel = async (level: ConsentLevel, enabled: boolean) => {
    try {
      const currentSettings = await privacyManager.getPrivacySettings();
      const newLevels = {
        ...currentSettings?.levels,
        [level]: enabled,
      };

      if (level === ConsentLevel.ESSENTIAL && !enabled) {
        Alert.alert(
          'Essential Data Required',
          "Essential data collection cannot be disabled as it's required for the app to function properly.",
          [{ text: 'OK' }]
        );
        return;
      }

      await analytics.updatePrivacySettings(newLevels);
      await loadPrivacySettings();
    } catch (error) {
      console.error('Error updating consent level:', error);
      Alert.alert(
        'Error',
        'Failed to update privacy settings. Please try again.'
      );
    }
  };

  const showDataRetentionInfo = () => {
    Alert.alert(
      'Data Retention Policy',
      'Essential data: 1 year\nPerformance data: 3 months\nError logs: 6 months\nUsage analytics: 2 years\nSecurity/Compliance: 7 years',
      [{ text: 'OK' }]
    );
  };

  const exportUserData = async () => {
    try {
      const userData = await analytics.exportUserData();
      Alert.alert(
        'Data Export',
        'Your data has been prepared for export. In a production app, this would be sent to your email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const deleteUserData = async () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data and reset your privacy settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await analytics.deleteUserData();
              await loadPrivacySettings();
              Alert.alert('Success', 'Your data has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const optOutOfAnalytics = async () => {
    Alert.alert(
      'Opt Out of Analytics',
      'This will disable all analytics and performance tracking. You can re-enable this at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Opt Out',
          onPress: async () => {
            await updateConsentLevel(ConsentLevel.ANALYTICS, false);
            Alert.alert('Success', 'You have opted out of analytics tracking.');
          },
        },
      ]
    );
  };

  const optOutOfPersonalization = async () => {
    Alert.alert(
      'Opt Out of Personalization',
      'This will disable personalized features and recommendations. You can re-enable this at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Opt Out',
          onPress: async () => {
            await updateConsentLevel(ConsentLevel.PERSONALIZATION, false);
            Alert.alert(
              'Success',
              'You have opted out of personalization features.'
            );
          },
        },
      ]
    );
  };

  const optOutOfMarketing = async () => {
    Alert.alert(
      'Opt Out of Marketing',
      'This will disable marketing communications and promotional content. You can re-enable this at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Opt Out',
          onPress: async () => {
            await updateConsentLevel(ConsentLevel.MARKETING, false);
            Alert.alert(
              'Success',
              'You have opted out of marketing communications.'
            );
          },
        },
      ]
    );
  };

  const revokeAllConsent = async () => {
    Alert.alert(
      'Revoke All Consent',
      'This will disable all optional data collection. Only essential data required for app functionality will be processed. You can re-enable specific features at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              await privacyManager.revokeConsent();
              await loadPrivacySettings();
              Alert.alert(
                'Success',
                'All non-essential consent has been revoked.'
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to revoke consent. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const validatePrivacyControls = async () => {
    try {
      const settings = await privacyManager.getPrivacySettings();
      const analyticsEnabled = await privacyManager.canTrackAnalytics();
      const errorsEnabled = await privacyManager.canTrackErrors();

      // Test analytics tracking
      const analyticsTest =
        analyticsEnabled ===
        (settings?.levels?.[ConsentLevel.ANALYTICS] || false);

      // Test error tracking (should always be enabled for essential functionality)
      const errorTest = errorsEnabled === (settings?.consentGiven || false);

      const validationResults = [
        `Analytics Tracking: ${analyticsTest ? '✅ Working' : '❌ Failed'}`,
        `Error Tracking: ${errorTest ? '✅ Working' : '❌ Failed'}`,
        `Privacy Settings: ${settings ? '✅ Loaded' : '❌ Failed'}`,
      ];

      Alert.alert(
        'Privacy Validation Results',
        validationResults.join('\n\n'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Validation Error', 'Failed to validate privacy controls.');
    }
  };

  const showDataCollectionStatus = async () => {
    try {
      const settings = await privacyManager.getPrivacySettings();
      const retentionInfo = privacyManager.getDataRetentionInfo();

      const activeCollections = [];

      if (settings?.levels?.[ConsentLevel.ESSENTIAL]) {
        activeCollections.push('✅ Essential (App functionality, Security)');
      }
      if (settings?.levels?.[ConsentLevel.ANALYTICS]) {
        activeCollections.push('✅ Analytics (Performance monitoring)');
      }
      if (settings?.levels?.[ConsentLevel.PERSONALIZATION]) {
        activeCollections.push('✅ Personalization (Feature customization)');
      }
      if (settings?.levels?.[ConsentLevel.MARKETING]) {
        activeCollections.push('✅ Marketing (Promotional content)');
      }

      if (activeCollections.length === 0) {
        activeCollections.push('❌ No data collection active');
      }

      Alert.alert(
        'Active Data Collection',
        `Current Status:\n\n${activeCollections.join('\n\n')}\n\nData is automatically deleted according to our retention policy.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve data collection status.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy & Data Settings</Text>
        <Text style={styles.subtitle}>
          Manage how ClariFi collects and uses your data in compliance with
          PIPEDA
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consent Status</Text>
        {privacySettings?.consentGiven ? (
          <View style={styles.consentStatus}>
            <Text style={styles.consentText}>
              ✅ Consent given on{' '}
              {new Date(privacySettings.consentDate).toLocaleDateString()}
            </Text>
            <Text style={styles.versionText}>
              Version: {privacySettings.consentVersion}
            </Text>
          </View>
        ) : (
          <Text style={styles.noConsentText}>❌ No consent given</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Collection Preferences</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Essential Data</Text>
            <Text style={styles.settingDescription}>
              Required for app functionality, security, and legal compliance
            </Text>
          </View>
          <Switch
            value={privacySettings?.levels?.[ConsentLevel.ESSENTIAL] || false}
            onValueChange={value =>
              updateConsentLevel(ConsentLevel.ESSENTIAL, value)
            }
            disabled={true}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Analytics & Performance</Text>
            <Text style={styles.settingDescription}>
              Anonymous usage data to improve app performance and features
            </Text>
          </View>
          <Switch
            value={privacySettings?.levels?.[ConsentLevel.ANALYTICS] || false}
            onValueChange={value =>
              updateConsentLevel(ConsentLevel.ANALYTICS, value)
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Personalization</Text>
            <Text style={styles.settingDescription}>
              Customize features and recommendations based on your usage
              patterns
            </Text>
          </View>
          <Switch
            value={
              privacySettings?.levels?.[ConsentLevel.PERSONALIZATION] || false
            }
            onValueChange={value =>
              updateConsentLevel(ConsentLevel.PERSONALIZATION, value)
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Marketing & Communications</Text>
            <Text style={styles.settingDescription}>
              Receive promotional content and financial tips (disabled by
              default)
            </Text>
          </View>
          <Switch
            value={privacySettings?.levels?.[ConsentLevel.MARKETING] || false}
            onValueChange={value =>
              updateConsentLevel(ConsentLevel.MARKETING, value)
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={showDataRetentionInfo}
        >
          <Text style={styles.actionButtonText}>📋 Data Retention Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={exportUserData}>
          <Text style={styles.actionButtonText}>📤 Export My Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={deleteUserData}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            🗑️ Delete All Data
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opt-Out Controls</Text>
        <Text style={styles.sectionDescription}>
          You can opt out of specific data collection at any time. Changes take
          effect immediately.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={optOutOfAnalytics}
        >
          <Text style={styles.actionButtonText}>
            📊 Opt Out of All Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={optOutOfPersonalization}
        >
          <Text style={styles.actionButtonText}>
            🎯 Opt Out of Personalization
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={optOutOfMarketing}
        >
          <Text style={styles.actionButtonText}>📧 Opt Out of Marketing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.warningButton]}
          onPress={revokeAllConsent}
        >
          <Text style={[styles.actionButtonText, styles.warningButtonText]}>
            ⚠️ Revoke All Consent
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Validation</Text>
        <Text style={styles.sectionDescription}>
          Verify that your privacy preferences are being respected.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={validatePrivacyControls}
        >
          <Text style={styles.actionButtonText}>🔍 Test Privacy Controls</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={showDataCollectionStatus}
        >
          <Text style={styles.actionButtonText}>
            📋 View Active Data Collection
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Deletion</Text>
        <Text style={styles.sectionDescription}>
          Permanently delete your account and all associated data in compliance
          with PIPEDA.
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => router.push('/modals/account-deletion')}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            🗑️ Delete Account
          </Text>
        </TouchableOpacity>
      </View>

      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      )}

      <View style={styles.complianceNotice}>
        <Text style={styles.complianceText}>
          ClariFi is committed to protecting your privacy in accordance with the
          Personal Information Protection and Electronic Documents Act (PIPEDA)
          and Canadian privacy laws.
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  consentStatus: {
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  consentText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    color: '#155724',
    marginTop: 4,
  },
  noConsentText: {
    fontSize: 16,
    color: '#721c24',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
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
  deleteButton: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ffb3b3',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
    lineHeight: 20,
  },
  warningButton: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  warningButtonText: {
    color: '#856404',
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

export default PrivacySettingsScreen;
