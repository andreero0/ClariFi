import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import ConsentManagementService, {
  ConsentType,
  ConsentRecord,
  ConsentBundle,
  ConsentConfiguration,
  ConsentHistory,
  LegalBasis,
} from '../../services/privacy/ConsentManagementService';

interface ConsentManagementScreenProps {
  onClose?: () => void;
}

interface ConsentState {
  [key: string]: boolean;
}

const ConsentManagementScreen: React.FC<ConsentManagementScreenProps> = ({
  onClose,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [consentStates, setConsentStates] = useState<ConsentState>({});
  const [consentBundles, setConsentBundles] = useState<ConsentBundle[]>([]);
  const [consentConfigs, setConsentConfigs] = useState<ConsentConfiguration[]>(
    []
  );
  const [consentHistory, setConsentHistory] = useState<
    Record<ConsentType, ConsentHistory>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(
    new Set()
  );

  const consentService = ConsentManagementService.getInstance();

  useEffect(() => {
    loadConsentData();
  }, []);

  const loadConsentData = async () => {
    try {
      setIsLoading(true);

      // Get consent configurations and bundles
      const configs = consentService.getConsentConfigurations();
      const bundles = consentService.getConsentBundles();

      setConsentConfigs(configs);
      setConsentBundles(bundles);

      // Load current consent status
      const consentTypes = configs.map(c => c.type);
      const currentStatus = await consentService.getConsentStatus(consentTypes);
      setConsentStates(currentStatus);

      // Load consent history for all types
      const historyData: Record<ConsentType, ConsentHistory> = {} as Record<
        ConsentType,
        ConsentHistory
      >;
      for (const type of consentTypes) {
        const history = await consentService.getConsentHistory(type);
        if (history) {
          historyData[type] = history;
        }
      }
      setConsentHistory(historyData);
    } catch (error) {
      console.error('Error loading consent data:', error);
      Alert.alert(
        'Error',
        'Failed to load consent settings. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadConsentData();
    setIsRefreshing(false);
  };

  const handleConsentToggle = async (
    consentType: ConsentType,
    value: boolean
  ) => {
    const config = consentConfigs.find(c => c.type === consentType);

    if (config?.isRequired && !value) {
      Alert.alert(
        'Required Consent',
        `${config.name} cannot be disabled as it's required for the app to function properly and comply with legal obligations.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Update locally first for immediate feedback
      setConsentStates(prev => ({
        ...prev,
        [consentType]: value,
      }));

      // Update consent in service
      if (value) {
        await consentService.grantConsent([consentType], {
          source: 'settings_update',
          timestamp: new Date().toISOString(),
          userAgent: 'ClariFi Mobile App',
        });
      } else {
        await consentService.withdrawConsent([consentType], 'user_preference', {
          source: 'settings_update',
          timestamp: new Date().toISOString(),
        });
      }

      // Reload data to get updated history
      await loadConsentData();
    } catch (error) {
      console.error('Error updating consent:', error);

      // Revert the change on error
      setConsentStates(prev => ({
        ...prev,
        [consentType]: !value,
      }));

      Alert.alert(
        'Error',
        'Failed to update consent setting. Please try again.'
      );
    }
  };

  const toggleBundleExpansion = (bundleId: string) => {
    setExpandedBundles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bundleId)) {
        newSet.delete(bundleId);
      } else {
        newSet.add(bundleId);
      }
      return newSet;
    });
  };

  const handleViewConsentHistory = (consentType: ConsentType) => {
    const history = consentHistory[consentType];
    const config = consentConfigs.find(c => c.type === consentType);

    if (!history || !config) return;

    const historyText = history.records
      .slice(0, 5) // Show last 5 records
      .map(record => {
        const status = record.granted ? 'Granted' : 'Withdrawn';
        const date = new Date(record.timestamp).toLocaleDateString();
        const reason = record.withdrawalReason
          ? ` (${record.withdrawalReason})`
          : '';
        return `${status} on ${date}${reason}`;
      })
      .join('\n');

    Alert.alert(
      `${config.name} History`,
      `Recent consent changes:\n\n${historyText}`,
      [{ text: 'OK' }]
    );
  };

  const handleExportConsentData = async () => {
    try {
      const exportData = await consentService.exportConsentData();

      Alert.alert(
        'Consent Data Export',
        `Consent data ready for export.\n\nTotal records: ${exportData.allRecords.length}\nConsent types: ${Object.keys(exportData.consentHistory).length}\nGenerated: ${new Date(exportData.exportDate).toLocaleString()}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: () => {
              // Here you would integrate with the data export service
              // to include consent data in user's data export
              console.log('Consent data export:', exportData);
              Alert.alert(
                'Success',
                'Consent data has been included in your data export.'
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error exporting consent data:', error);
      Alert.alert('Error', 'Failed to export consent data. Please try again.');
    }
  };

  const renderConsentItem = (
    consentType: ConsentType,
    config: ConsentConfiguration
  ) => {
    const isGranted = consentStates[consentType];
    const history = consentHistory[consentType];
    const lastUpdated = history?.lastUpdated
      ? new Date(history.lastUpdated).toLocaleDateString()
      : 'Never';

    return (
      <View key={consentType} style={styles.consentItem}>
        <View style={styles.consentHeader}>
          <View style={styles.consentInfo}>
            <Text style={[styles.consentTitle, { color: theme.text }]}>
              {config.name}
            </Text>
            <Text
              style={[
                styles.consentDescription,
                { color: theme.textSecondary },
              ]}
            >
              {config.description}
            </Text>
            <View style={styles.consentMeta}>
              <Text
                style={[styles.legalBasisText, { color: theme.textSecondary }]}
              >
                Legal basis: {config.legalBasis.replace('_', ' ')}
              </Text>
              {config.expiryMonths && (
                <Text style={[styles.expiryText, { color: theme.warning }]}>
                  • Expires after {config.expiryMonths} months
                </Text>
              )}
            </View>
            <Text
              style={[styles.lastUpdatedText, { color: theme.textSecondary }]}
            >
              Last updated: {lastUpdated}
            </Text>
          </View>
          <View style={styles.consentControls}>
            <Switch
              value={isGranted}
              onValueChange={value => handleConsentToggle(consentType, value)}
              disabled={config.isRequired && isGranted}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.background}
            />
            {history && (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => handleViewConsentHistory(consentType)}
              >
                <Icon name="clock" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.consentStatus}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isGranted ? theme.success : theme.error },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isGranted ? theme.success : theme.error },
            ]}
          >
            {isGranted ? 'Active' : 'Disabled'}
          </Text>
          {config.isRequired && (
            <Text style={[styles.requiredBadge, { color: theme.warning }]}>
              REQUIRED
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderConsentBundle = (bundle: ConsentBundle) => {
    const isExpanded = expandedBundles.has(bundle.id);
    const bundleConsents = bundle.consentTypes
      .map(type => {
        const config = consentConfigs.find(c => c.type === type);
        return { type, config };
      })
      .filter(item => item.config);

    const activeCount = bundleConsents.filter(
      ({ type }) => consentStates[type]
    ).length;
    const totalCount = bundleConsents.length;

    return (
      <Card key={bundle.id} style={styles.bundleCard}>
        <TouchableOpacity
          style={styles.bundleHeader}
          onPress={() => toggleBundleExpansion(bundle.id)}
        >
          <View style={styles.bundleInfo}>
            <Text style={[styles.bundleTitle, { color: theme.text }]}>
              {bundle.name}
            </Text>
            <Text
              style={[styles.bundleDescription, { color: theme.textSecondary }]}
            >
              {bundle.description}
            </Text>
            <Text style={[styles.bundleStatus, { color: theme.textSecondary }]}>
              {activeCount} of {totalCount} enabled
            </Text>
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.bundleContent}>
            {bundleConsents.map(({ type, config }) =>
              config ? renderConsentItem(type, config) : null
            )}
          </View>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading consent settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose || (() => router.back())}
        >
          <Icon name="x" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Consent Management
        </Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportConsentData}
        >
          <Icon name="download" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="info-circle" size={24} color={theme.info} />
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                About Consent Management
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Manage your consent preferences for different types of data
              processing. You can withdraw consent at any time for optional
              features. Essential consents are required for app functionality
              and legal compliance.
            </Text>
          </Card>

          {consentBundles.map(renderConsentBundle)}

          <Card style={styles.actionCard}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>
              Consent Actions
            </Text>
            <View style={styles.actionButtons}>
              <Button
                title="View Full History"
                onPress={() => {
                  // Navigate to detailed consent history screen
                  console.log('Navigate to consent history');
                }}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Reset All Optional"
                onPress={() => {
                  Alert.alert(
                    'Reset Optional Consents',
                    'This will disable all optional consent settings. Essential consents will remain active. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const optionalTypes = consentConfigs
                              .filter(c => !c.isRequired)
                              .map(c => c.type);

                            await consentService.withdrawConsent(
                              optionalTypes,
                              'user_reset',
                              {
                                source: 'bulk_reset',
                                timestamp: new Date().toISOString(),
                              }
                            );

                            await loadConsentData();
                            Alert.alert(
                              'Success',
                              'Optional consents have been reset.'
                            );
                          } catch (error) {
                            Alert.alert(
                              'Error',
                              'Failed to reset consent settings.'
                            );
                          }
                        },
                      },
                    ]
                  );
                }}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </Card>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...textStyles.h1,
    flex: 1,
    textAlign: 'center',
  },
  exportButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...textStyles.h3,
    marginLeft: spacing.sm,
  },
  infoText: {
    ...textStyles.body,
    lineHeight: 22,
  },
  bundleCard: {
    marginBottom: spacing.md,
  },
  bundleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleTitle: {
    ...textStyles.h3,
    marginBottom: spacing.xs,
  },
  bundleDescription: {
    ...textStyles.body,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  bundleStatus: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  bundleContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  consentItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  consentInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  consentTitle: {
    ...textStyles.h4,
    marginBottom: spacing.xs,
  },
  consentDescription: {
    ...textStyles.body,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  consentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  legalBasisText: {
    ...textStyles.caption,
    fontStyle: 'italic',
  },
  expiryText: {
    ...textStyles.caption,
    marginLeft: spacing.sm,
  },
  lastUpdatedText: {
    ...textStyles.caption,
  },
  consentControls: {
    alignItems: 'center',
  },
  historyButton: {
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  consentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  requiredBadge: {
    ...textStyles.caption,
    fontWeight: 'bold',
    marginLeft: spacing.md,
  },
  actionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  actionTitle: {
    ...textStyles.h3,
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default ConsentManagementScreen;
