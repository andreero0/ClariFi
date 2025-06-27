import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { DataExportService } from '../../services/privacy/DataExportService';

interface ExportFormat {
  id: 'csv' | 'json' | 'pdf';
  name: string;
  description: string;
  icon: string;
  fileSize: string;
  features: string[];
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'csv',
    name: 'CSV (Spreadsheet)',
    description:
      'Export your data in a format suitable for Excel or Google Sheets',
    icon: '📊',
    fileSize: '~2-5 MB',
    features: [
      'All transaction data',
      'Categories and tags',
      'Account information',
      'Suitable for analysis',
    ],
  },
  {
    id: 'json',
    name: 'JSON (Structured Data)',
    description: 'Export your data in a machine-readable format',
    icon: '💾',
    fileSize: '~3-7 MB',
    features: [
      'Complete data structure',
      'Preserves relationships',
      'Developer-friendly',
      'Most comprehensive',
    ],
  },
  {
    id: 'pdf',
    name: 'PDF (Human-Readable)',
    description: 'Export a formatted summary report of your financial data',
    icon: '📄',
    fileSize: '~1-3 MB',
    features: [
      'Summary report',
      'Charts and insights',
      'Print-friendly',
      'Easy to read',
    ],
  },
];

const DATE_RANGES = [
  {
    id: 'all',
    name: 'All Data',
    description: 'Export everything since account creation',
  },
  {
    id: 'year',
    name: 'Last 12 Months',
    description: 'Export data from the past year',
  },
  {
    id: 'sixMonths',
    name: 'Last 6 Months',
    description: 'Export recent data for quick analysis',
  },
  {
    id: 'threeMonths',
    name: 'Last 3 Months',
    description: 'Export quarterly data',
  },
  {
    id: 'month',
    name: 'Last Month',
    description: 'Export most recent month only',
  },
];

interface DataExportOptionsScreenProps {
  onClose?: () => void;
}

const DataExportOptionsScreen: React.FC<DataExportOptionsScreenProps> = ({
  onClose,
}) => {
  const { theme } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf'>(
    'csv'
  );
  const [selectedDateRange, setSelectedDateRange] = useState('year');
  const [includePersonalInfo, setIncludePersonalInfo] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(false);
  const [includeQAHistory, setIncludeQAHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportService] = useState(() => new DataExportService());
  const [exportPreview, setExportPreview] = useState<any>(null);

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
    formatCard: {
      marginBottom: spacing.sm,
      borderWidth: 2,
    },
    selectedFormatCard: {
      borderColor: theme.primary,
      backgroundColor: theme.backgroundSecondary,
    },
    unselectedFormatCard: {
      borderColor: theme.neutral.light,
    },
    formatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    formatIcon: {
      fontSize: 24,
      marginRight: spacing.sm,
    },
    formatTitle: {
      ...(textStyles.h4 || {}),
      color: theme.textPrimary,
      flex: 1,
    },
    formatDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    formatFeatures: {
      marginTop: spacing.xs,
    },
    featureItem: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      marginBottom: spacing.xs / 2,
    },
    formatMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.neutral.light,
    },
    fileSize: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      fontWeight: '600',
    },
    dateRangeCard: {
      marginBottom: spacing.sm,
      borderWidth: 1,
    },
    selectedDateRange: {
      borderColor: theme.primary,
      backgroundColor: theme.backgroundSecondary,
    },
    unselectedDateRange: {
      borderColor: theme.neutral.light,
    },
    dateRangeContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      marginRight: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedRadio: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    unselectedRadio: {
      borderColor: theme.neutral.medium,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.white,
    },
    dateRangeText: {
      flex: 1,
    },
    dateRangeName: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    dateRangeDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
    },
    dataTypeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral.light,
    },
    dataTypeContent: {
      flex: 1,
      marginRight: spacing.sm,
    },
    dataTypeName: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    dataTypeDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
    },
    complianceNotice: {
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: theme.secondary + '20',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.secondary,
    },
    complianceText: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      lineHeight: 18,
      textAlign: 'center',
    },
    exportButtonContainer: {
      marginTop: spacing.xl,
    },
    previewButton: {
      marginBottom: spacing.sm,
    },
  });

  const handleFormatSelect = (format: 'csv' | 'json' | 'pdf') => {
    setSelectedFormat(format);
  };

  const handleDateRangeSelect = (range: string) => {
    setSelectedDateRange(range);
  };

  const handlePreviewExport = () => {
    Alert.alert(
      'Export Preview',
      `This export will include:\n\n` +
        `• Format: ${selectedFormat.toUpperCase()}\n` +
        `• Date range: ${DATE_RANGES.find(r => r.id === selectedDateRange)?.name}\n` +
        `• Personal info: ${includePersonalInfo ? 'Yes' : 'No'}\n` +
        `• Transactions: ${includeTransactions ? 'Yes' : 'No'}\n` +
        `• Categories: ${includeCategories ? 'Yes' : 'No'}\n` +
        `• Settings: ${includeSettings ? 'Yes' : 'No'}\n` +
        `• Q&A History: ${includeQAHistory ? 'Yes' : 'No'}`,
      [{ text: 'OK' }]
    );
  };

  const handleStartExport = async () => {
    if (
      !includePersonalInfo &&
      !includeTransactions &&
      !includeCategories &&
      !includeSettings &&
      !includeQAHistory
    ) {
      Alert.alert(
        'No Data Selected',
        'Please select at least one type of data to export.'
      );
      return;
    }

    Alert.alert(
      'Confirm Data Export',
      `You are about to export your data in ${selectedFormat.toUpperCase()} format. This will include all selected data types for the chosen date range.\n\nThe export will be processed securely and will expire after 24 hours for your privacy.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export Data',
          onPress: async () => {
            setIsExporting(true);
            try {
              const exportOptions = {
                format: selectedFormat,
                dateRange:
                  selectedDateRange === 'year'
                    ? 'last-year'
                    : selectedDateRange === 'sixMonths'
                      ? 'last-6-months'
                      : selectedDateRange === 'threeMonths'
                        ? 'last-3-months'
                        : selectedDateRange === 'month'
                          ? 'last-month'
                          : 'all',
                includePersonalInfo,
                includeTransactions,
                includeCategories,
                includeSettings,
                includeQAHistory,
              };

              const result = await exportService.initiateExport(exportOptions);

              if (result.success) {
                Alert.alert(
                  'Export Complete',
                  `Your data export is ready! File size: ${result.fileSize}\n\nTap "Download" to save or share your data.`,
                  [
                    { text: 'Later', style: 'cancel' },
                    {
                      text: 'Download',
                      onPress: async () => {
                        const downloadResult =
                          await exportService.downloadExport(result.exportId);
                        if (downloadResult) {
                          console.log('Export downloaded/shared successfully');
                        }
                        onClose?.();
                      },
                    },
                  ]
                );
              } else {
                throw new Error(result.error || 'Export failed');
              }
            } catch (error) {
              console.error('Export error:', error);
              Alert.alert(
                'Export Failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to start the export process. Please try again later.'
              );
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Export Your Data</Text>
          <Text style={styles.subtitle}>
            Export your financial data in various formats. All exports are
            PIPEDA-compliant and processed securely.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Export Format</Text>
        {EXPORT_FORMATS.map(format => (
          <TouchableOpacity
            key={format.id}
            onPress={() => handleFormatSelect(format.id)}
            activeOpacity={0.8}
          >
            <Card
              style={[
                styles.formatCard,
                selectedFormat === format.id
                  ? styles.selectedFormatCard
                  : styles.unselectedFormatCard,
              ]}
            >
              <View style={styles.formatHeader}>
                <Text style={styles.formatIcon}>{format.icon}</Text>
                <Text style={styles.formatTitle}>{format.name}</Text>
                {selectedFormat === format.id && (
                  <Icon name="check-circle" size={24} color={theme.primary} />
                )}
              </View>
              <Text style={styles.formatDescription}>{format.description}</Text>
              <View style={styles.formatFeatures}>
                {format.features.map((feature, index) => (
                  <Text key={index} style={styles.featureItem}>
                    • {feature}
                  </Text>
                ))}
              </View>
              <View style={styles.formatMeta}>
                <Text style={styles.fileSize}>
                  Estimated size: {format.fileSize}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Date Range</Text>
        {DATE_RANGES.map(range => (
          <TouchableOpacity
            key={range.id}
            onPress={() => handleDateRangeSelect(range.id)}
            activeOpacity={0.8}
          >
            <Card
              style={[
                styles.dateRangeCard,
                selectedDateRange === range.id
                  ? styles.selectedDateRange
                  : styles.unselectedDateRange,
              ]}
            >
              <View style={styles.dateRangeContent}>
                <View
                  style={[
                    styles.radioButton,
                    selectedDateRange === range.id
                      ? styles.selectedRadio
                      : styles.unselectedRadio,
                  ]}
                >
                  {selectedDateRange === range.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.dateRangeText}>
                  <Text style={styles.dateRangeName}>{range.name}</Text>
                  <Text style={styles.dateRangeDescription}>
                    {range.description}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Data Types to Include</Text>
        <Card>
          <View style={styles.dataTypeItem}>
            <View style={styles.dataTypeContent}>
              <Text style={styles.dataTypeName}>Personal Information</Text>
              <Text style={styles.dataTypeDescription}>
                Name, email, profile settings
              </Text>
            </View>
            <Switch
              value={includePersonalInfo}
              onValueChange={setIncludePersonalInfo}
              trackColor={{
                false: theme.neutral.medium,
                true: theme.primary + '50',
              }}
              thumbColor={
                includePersonalInfo ? theme.primary : theme.neutral.light
              }
            />
          </View>

          <View style={styles.dataTypeItem}>
            <View style={styles.dataTypeContent}>
              <Text style={styles.dataTypeName}>Transactions</Text>
              <Text style={styles.dataTypeDescription}>
                All financial transactions and amounts
              </Text>
            </View>
            <Switch
              value={includeTransactions}
              onValueChange={setIncludeTransactions}
              trackColor={{
                false: theme.neutral.medium,
                true: theme.primary + '50',
              }}
              thumbColor={
                includeTransactions ? theme.primary : theme.neutral.light
              }
            />
          </View>

          <View style={styles.dataTypeItem}>
            <View style={styles.dataTypeContent}>
              <Text style={styles.dataTypeName}>Categories & Tags</Text>
              <Text style={styles.dataTypeDescription}>
                Custom categories and transaction tags
              </Text>
            </View>
            <Switch
              value={includeCategories}
              onValueChange={setIncludeCategories}
              trackColor={{
                false: theme.neutral.medium,
                true: theme.primary + '50',
              }}
              thumbColor={
                includeCategories ? theme.primary : theme.neutral.light
              }
            />
          </View>

          <View style={styles.dataTypeItem}>
            <View style={styles.dataTypeContent}>
              <Text style={styles.dataTypeName}>App Settings</Text>
              <Text style={styles.dataTypeDescription}>
                Preferences and configuration
              </Text>
            </View>
            <Switch
              value={includeSettings}
              onValueChange={setIncludeSettings}
              trackColor={{
                false: theme.neutral.medium,
                true: theme.primary + '50',
              }}
              thumbColor={includeSettings ? theme.primary : theme.neutral.light}
            />
          </View>

          <View style={[styles.dataTypeItem, { borderBottomWidth: 0 }]}>
            <View style={styles.dataTypeContent}>
              <Text style={styles.dataTypeName}>Q&A History</Text>
              <Text style={styles.dataTypeDescription}>
                Questions asked to AI assistant (optional)
              </Text>
            </View>
            <Switch
              value={includeQAHistory}
              onValueChange={setIncludeQAHistory}
              trackColor={{
                false: theme.neutral.medium,
                true: theme.primary + '50',
              }}
              thumbColor={
                includeQAHistory ? theme.primary : theme.neutral.light
              }
            />
          </View>
        </Card>

        <View style={styles.exportButtonContainer}>
          <Button
            title="Preview Export"
            onPress={handlePreviewExport}
            variant="outline"
            iconLeft="eye"
            style={styles.previewButton}
            fullWidth
          />

          <Button
            title={isExporting ? 'Processing...' : 'Start Export'}
            onPress={handleStartExport}
            variant="primary"
            iconLeft="download"
            disabled={isExporting}
            loading={isExporting}
            fullWidth
          />
        </View>

        <View style={styles.complianceNotice}>
          <Text style={styles.complianceText}>
            🔒 All data exports are processed in accordance with the Personal
            Information Protection and Electronic Documents Act (PIPEDA). Your
            exported data is encrypted, securely stored for a limited time, and
            automatically deleted after 24 hours for your privacy protection.
          </Text>
        </View>

        {onClose && (
          <Button
            title="Cancel"
            onPress={onClose}
            variant="text"
            style={{ marginTop: spacing.lg }}
            fullWidth
          />
        )}
      </ScrollView>
    </View>
  );
};

export default DataExportOptionsScreen;
