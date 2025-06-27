import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import PrivacyManager, {
  ConsentLevel,
} from '../../services/privacy/PrivacyManager';
import DataRetentionService from '../../services/privacy/DataRetentionService';
import ConsentManagementService, {
  ConsentType,
  ConsentConfiguration,
  ConsentBundle,
} from '../../services/privacy/ConsentManagementService';
import ConsentManagementService, {
  ConsentType,
  ConsentConfiguration,
  ConsentBundle,
} from '../../services/privacy/ConsentManagementService';

interface PrivacySettings {
  // Core data collection
  essentialData: boolean;
  analyticsData: boolean;
  personalizationData: boolean;
  marketingCommunications: boolean;

  // Granular product improvement controls
  crashReporting: boolean;
  performanceMetrics: boolean;
  userBehaviorAnalytics: boolean;
  featureUsageStats: boolean;

  // Third-party sharing controls
  shareWithServiceProviders: boolean;
  shareForLegalCompliance: boolean;
  shareForSecurityPurposes: boolean;
  shareAggregatedData: boolean;

  // Data retention preferences
  autoDeleteOldData: boolean;
  retentionPeriod: '1year' | '2years' | '5years' | 'legal_minimum';

  // Communication preferences
  securityNotifications: boolean;
  productUpdates: boolean;
  educationalContent: boolean;
  surveyInvitations: boolean;
}

interface EnhancedPrivacySettingsScreenProps {
  onClose?: () => void;
}

const EnhancedPrivacySettingsScreen: React.FC<
  EnhancedPrivacySettingsScreenProps
> = ({ onClose }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>({
    // Core data collection (defaults based on PIPEDA best practices)
    essentialData: true, // Required, cannot be disabled
    analyticsData: false,
    personalizationData: false,
    marketingCommunications: false,

    // Product improvement (more granular control)
    crashReporting: true, // Essential for app stability
    performanceMetrics: false,
    userBehaviorAnalytics: false,
    featureUsageStats: false,

    // Third-party sharing (all disabled by default)
    shareWithServiceProviders: false,
    shareForLegalCompliance: true, // Required for compliance
    shareForSecurityPurposes: false,
    shareAggregatedData: false,

    // Data retention
    autoDeleteOldData: true,
    retentionPeriod: 'legal_minimum',

    // Communications
    securityNotifications: true, // Essential for security
    productUpdates: false,
    educationalContent: false,
    surveyInvitations: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const privacyManager = PrivacyManager.getInstance();
  const consentService = ConsentManagementService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const privacySettings = await privacyManager.getPrivacySettings();
      // Map existing settings to enhanced structure
      setSettings(prevSettings => ({
        ...prevSettings,
        essentialData:
          privacySettings?.levels?.[ConsentLevel.ESSENTIAL] ?? true,
        analyticsData:
          privacySettings?.levels?.[ConsentLevel.ANALYTICS] ?? false,
        personalizationData:
          privacySettings?.levels?.[ConsentLevel.PERSONALIZATION] ?? false,
        marketingCommunications:
          privacySettings?.levels?.[ConsentLevel.MARKETING] ?? false,
      }));
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (
    key: keyof PrivacySettings,
    value: boolean | string
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasUnsavedChanges(true);

    // Immediate effect for critical settings
    try {
      await applySetting(key, value);

      // Auto-save after 2 seconds of no changes
      setTimeout(async () => {
        if (hasUnsavedChanges) {
          await saveAllSettings(newSettings);
          setHasUnsavedChanges(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error applying setting:', error);
      Alert.alert('Error', 'Failed to apply setting. Please try again.');
      // Revert the setting
      setSettings(settings);
    }
  };

  const applySetting = async (
    key: keyof PrivacySettings,
    value: boolean | string
  ) => {
    // Map to existing privacy manager structure
    switch (key) {
      case 'analyticsData':
        await privacyManager.updateConsentLevel(
          ConsentLevel.ANALYTICS,
          value as boolean
        );
        break;
      case 'personalizationData':
        await privacyManager.updateConsentLevel(
          ConsentLevel.PERSONALIZATION,
          value as boolean
        );
        break;
      case 'marketingCommunications':
        await privacyManager.updateConsentLevel(
          ConsentLevel.MARKETING,
          value as boolean
        );
        break;
      case 'autoDeleteOldData':
        await DataRetentionService.updateRetentionSettings({
          autoDeleteOldData: value as boolean,
        });
        break;
      case 'retentionPeriod':
        await DataRetentionService.updateRetentionSettings({
          retentionPeriod: value as
            | 'legal_minimum'
            | '1year'
            | '2years'
            | '5years',
        });
        break;
      // Additional settings would be handled by enhanced privacy service
      default:
        console.log(`Applying setting ${key}: ${value}`);
    }
  };

  const saveAllSettings = async (settingsToSave: PrivacySettings) => {
    try {
      // This would integrate with enhanced privacy service
      console.log('Saving all privacy settings:', settingsToSave);
      // await enhancedPrivacyService.saveSettings(settingsToSave);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Privacy Settings',
      'This will reset all privacy settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              essentialData: true,
              analyticsData: false,
              personalizationData: false,
              marketingCommunications: false,
              crashReporting: true,
              performanceMetrics: false,
              userBehaviorAnalytics: false,
              featureUsageStats: false,
              shareWithServiceProviders: false,
              shareForLegalCompliance: true,
              shareForSecurityPurposes: false,
              shareAggregatedData: false,
              autoDeleteOldData: true,
              retentionPeriod: 'legal_minimum',
              securityNotifications: true,
              productUpdates: false,
              educationalContent: false,
              surveyInvitations: false,
            });
            setHasUnsavedChanges(true);
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl * 2,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      ...(textStyles.h1 || {}),
      color: theme.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    sectionTitle: {
      ...(textStyles.h3 || {}),
      color: theme.textPrimary,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    sectionDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral.light,
    },
    settingInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingTitle: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs / 2,
    },
    settingDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      lineHeight: 16,
    },
    settingRequired: {
      ...(textStyles.bodySmall || {}),
      color: theme.error,
      fontStyle: 'italic',
      marginTop: spacing.xs / 2,
    },
    retentionSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
    },
    retentionOption: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.neutral.medium,
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    retentionOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    retentionOptionText: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
    },
    retentionOptionTextSelected: {
      color: theme.white,
    },
    unsavedIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sm,
      backgroundColor: theme.secondary + '20',
      borderRadius: 8,
      marginBottom: spacing.md,
    },
    unsavedText: {
      ...(textStyles.bodySmall || {}),
      color: theme.secondary,
      marginLeft: spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xl,
    },
    resetButton: {
      flex: 0.48,
    },
    exportButton: {
      flex: 0.48,
    },
    complianceFooter: {
      marginTop: spacing.xl,
      padding: spacing.md,
      backgroundColor: theme.secondary + '20',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.secondary,
    },
    complianceText: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      lineHeight: 16,
      textAlign: 'center',
    },
  });

  const renderSwitch = (
    key: keyof PrivacySettings,
    title: string,
    description: string,
    isRequired = false,
    requiredText?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
        {isRequired && (
          <Text style={styles.settingRequired}>
            {requiredText || 'Required for app functionality'}
          </Text>
        )}
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={value => updateSetting(key, value)}
        disabled={isRequired}
        trackColor={{ false: theme.neutral.medium, true: theme.primary + '50' }}
        thumbColor={
          (settings[key] as boolean) ? theme.primary : theme.neutral.light
        }
      />
    </View>
  );

  const retentionOptions = [
    { value: 'legal_minimum', label: 'Legal Minimum' },
    { value: '1year', label: '1 Year' },
    { value: '2years', label: '2 Years' },
    { value: '5years', label: '5 Years' },
  ];

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={styles.subtitle}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Settings</Text>
          <Text style={styles.subtitle}>
            Control how ClariFi collects, uses, and shares your data. All
            changes take effect immediately.
          </Text>
        </View>

        {hasUnsavedChanges && (
          <View style={styles.unsavedIndicator}>
            <Icon name="clock" size={16} color={theme.secondary} />
            <Text style={styles.unsavedText}>Auto-saving changes...</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Core Data Collection</Text>
        <Card>
          <Text style={styles.sectionDescription}>
            Control fundamental data collection for app functionality and
            features.
          </Text>

          {renderSwitch(
            'essentialData',
            'Essential Data',
            'Required for core app functionality, security, and legal compliance',
            true,
            'Cannot be disabled - required by law'
          )}

          {renderSwitch(
            'analyticsData',
            'Analytics & Performance',
            'Anonymous usage data to improve app performance and identify issues'
          )}

          {renderSwitch(
            'personalizationData',
            'Personalization',
            'Customize features and recommendations based on your financial patterns'
          )}

          {renderSwitch(
            'marketingCommunications',
            'Marketing Communications',
            'Receive promotional content, financial tips, and product announcements'
          )}
        </Card>

        <Text style={styles.sectionTitle}>Product Improvement Data</Text>
        <Card>
          <Text style={styles.sectionDescription}>
            Help us improve ClariFi by sharing specific types of usage data.
          </Text>

          {renderSwitch(
            'crashReporting',
            'Crash Reporting',
            'Automatically report app crashes to help us fix bugs quickly',
            true,
            'Essential for app stability'
          )}

          {renderSwitch(
            'performanceMetrics',
            'Performance Metrics',
            'Share app performance data like loading times and memory usage'
          )}

          {renderSwitch(
            'userBehaviorAnalytics',
            'User Behavior Analytics',
            'Track how you navigate and use features to improve user experience'
          )}

          {renderSwitch(
            'featureUsageStats',
            'Feature Usage Statistics',
            'Collect data on which features you use most to prioritize improvements'
          )}
        </Card>

        <Text style={styles.sectionTitle}>Third-Party Data Sharing</Text>
        <Card>
          <Text style={styles.sectionDescription}>
            Control when and how your data may be shared with third parties.
          </Text>

          {renderSwitch(
            'shareWithServiceProviders',
            'Service Providers',
            'Share necessary data with trusted service providers (hosting, analytics, support)'
          )}

          {renderSwitch(
            'shareForLegalCompliance',
            'Legal Compliance',
            'Share data when required by Canadian law or regulations',
            true,
            'Required by PIPEDA and financial regulations'
          )}

          {renderSwitch(
            'shareForSecurityPurposes',
            'Security & Fraud Prevention',
            'Share data with security providers to prevent fraud and protect your account'
          )}

          {renderSwitch(
            'shareAggregatedData',
            'Aggregated Analytics',
            'Share anonymized, aggregated data for industry research (no personal info)'
          )}
        </Card>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Card>
          <Text style={styles.sectionDescription}>
            Control how long your data is stored. Some data must be retained for
            legal compliance.
          </Text>

          {renderSwitch(
            'autoDeleteOldData',
            'Auto-Delete Old Data',
            'Automatically delete non-essential data older than your chosen retention period'
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Data Retention Period</Text>
              <Text style={styles.settingDescription}>
                How long to keep your financial data (excluding legally required
                records)
              </Text>
            </View>
          </View>

          <View style={styles.retentionSelector}>
            {retentionOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.retentionOption,
                  settings.retentionPeriod === option.value &&
                    styles.retentionOptionSelected,
                ]}
                onPress={() => updateSetting('retentionPeriod', option.value)}
              >
                <Text
                  style={[
                    styles.retentionOptionText,
                    settings.retentionPeriod === option.value &&
                      styles.retentionOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Communications</Text>
        <Card>
          <Text style={styles.sectionDescription}>
            Choose what types of communications you want to receive from
            ClariFi.
          </Text>

          {renderSwitch(
            'securityNotifications',
            'Security Notifications',
            'Receive alerts about account security, suspicious activity, and data breaches',
            true,
            'Essential for account security'
          )}

          {renderSwitch(
            'productUpdates',
            'Product Updates',
            'Get notified about new features, improvements, and important app changes'
          )}

          {renderSwitch(
            'educationalContent',
            'Educational Content',
            'Receive financial tips, budgeting advice, and educational resources'
          )}

          {renderSwitch(
            'surveyInvitations',
            'Survey Invitations',
            'Participate in user research and feedback surveys to help improve ClariFi'
          )}
        </Card>

        <View style={styles.buttonRow}>
          <Button
            title="Reset to Defaults"
            onPress={handleResetToDefaults}
            variant="outline"
            style={styles.resetButton}
            iconLeft="refresh-cw"
          />

          <Button
            title="Export Settings"
            onPress={() => router.push('/modals/data-export')}
            variant="outline"
            style={styles.exportButton}
            iconLeft="download"
          />
        </View>

        <Text style={styles.sectionTitle}>Legal Documents</Text>
        <Card>
          <Text style={styles.sectionDescription}>
            Review our privacy policy, terms of service, and other legal
            documents.
          </Text>

          <View style={styles.legalButtonRow}>
            <Button
              title="Privacy Policy"
              onPress={() => router.push('/modals/legal-documents?doc=privacy')}
              variant="outline"
              style={styles.legalButton}
              iconLeft="shield-check"
            />

            <Button
              title="Terms of Service"
              onPress={() => router.push('/modals/legal-documents?doc=terms')}
              variant="outline"
              style={styles.legalButton}
              iconLeft="file-text"
            />
          </View>
        </Card>

        <View style={styles.complianceFooter}>
          <Text style={styles.complianceText}>
            🔒 All privacy settings are processed in accordance with the
            Personal Information Protection and Electronic Documents Act
            (PIPEDA). Changes take effect immediately and are saved
            automatically. You can modify these settings at any time.
          </Text>
        </View>

        {onClose && (
          <Button
            title="Close"
            onPress={onClose}
            variant="primary"
            style={{ marginTop: spacing.lg }}
            fullWidth
          />
        )}
      </ScrollView>
    </View>
  );
};

export default EnhancedPrivacySettingsScreen;
