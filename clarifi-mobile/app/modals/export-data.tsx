import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  format: 'csv' | 'json' | 'pdf' | 'excel';
  icon: string;
  fileExtension: string;
}

interface ExportSettings {
  includeTransactions: boolean;
  includeCategories: boolean;
  includeBudgets: boolean;
  includeInsights: boolean;
  dateRange: 'month' | 'quarter' | 'year' | 'all';
  includePII: boolean; // Personal Identifiable Information
}

export default function ExportDataModal() {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [exporting, setExporting] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    includeTransactions: true,
    includeCategories: true,
    includeBudgets: true,
    includeInsights: false,
    dateRange: 'month',
    includePII: false,
  });

  const exportOptions: ExportOption[] = [
    {
      id: 'csv',
      title: 'CSV Spreadsheet',
      description:
        'Compatible with Excel, Google Sheets, and most accounting software',
      format: 'csv',
      icon: '📊',
      fileExtension: '.csv',
    },
    {
      id: 'json',
      title: 'JSON Data',
      description: 'Raw data format for developers and data analysis',
      format: 'json',
      icon: '🔧',
      fileExtension: '.json',
    },
    {
      id: 'pdf',
      title: 'PDF Report',
      description: 'Professional report with charts and summaries',
      format: 'pdf',
      icon: '📄',
      fileExtension: '.pdf',
    },
    {
      id: 'excel',
      title: 'Excel Workbook',
      description: 'Multi-sheet Excel file with formatted data and charts',
      format: 'excel',
      icon: '📈',
      fileExtension: '.xlsx',
    },
  ];

  const dateRangeOptions = [
    { value: 'month', label: 'Current Month' },
    { value: 'quarter', label: 'Current Quarter' },
    { value: 'year', label: 'Current Year' },
    { value: 'all', label: 'All Time' },
  ];

  const generateCSVData = () => {
    // Mock CSV generation - in real app, this would pull from actual data
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    const rows = [
      ['2024-06-01', 'Grocery Store', 'Groceries', '-85.50', 'Expense'],
      ['2024-06-02', 'Salary Deposit', 'Income', '3250.00', 'Income'],
      ['2024-06-03', 'Gas Station', 'Transportation', '-45.00', 'Expense'],
    ];

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generateJSONData = () => {
    // Mock JSON generation
    return JSON.stringify(
      {
        exportInfo: {
          generatedAt: new Date().toISOString(),
          dateRange: settings.dateRange,
          includedData: Object.keys(settings).filter(
            key => settings[key as keyof ExportSettings]
          ),
          compliance: 'PIPEDA_2024',
        },
        transactions: [
          {
            id: '1',
            date: '2024-06-01',
            description: 'Grocery Store',
            category: 'Groceries',
            amount: -85.5,
            currency: 'CAD',
          },
          {
            id: '2',
            date: '2024-06-02',
            description: 'Salary Deposit',
            category: 'Income',
            amount: 3250.0,
            currency: 'CAD',
          },
        ],
        summary: {
          totalIncome: 3250.0,
          totalExpenses: 130.5,
          netIncome: 3119.5,
          currency: 'CAD',
        },
      },
      null,
      2
    );
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const selectedOption = exportOptions.find(
        opt => opt.id === selectedFormat
      );
      if (!selectedOption) return;

      let fileContent = '';
      let mimeType = '';

      switch (selectedOption.format) {
        case 'csv':
          fileContent = generateCSVData();
          mimeType = 'text/csv';
          break;
        case 'json':
          fileContent = generateJSONData();
          mimeType = 'application/json';
          break;
        case 'pdf':
          Alert.alert('PDF Export', 'PDF export feature coming soon!');
          return;
        case 'excel':
          Alert.alert('Excel Export', 'Excel export feature coming soon!');
          return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clarifi_export_${timestamp}${selectedOption.fileExtension}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, fileContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: 'Export Financial Data',
        UTI: mimeType,
      });

      Alert.alert(
        'Export Successful',
        `Your financial data has been exported as ${filename}`,
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'There was an error exporting your data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const renderFormatOption = (option: ExportOption) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.formatOption,
        selectedFormat === option.id && styles.selectedFormat,
      ]}
      onPress={() => setSelectedFormat(option.id)}
    >
      <View style={styles.formatHeader}>
        <Text style={styles.formatIcon}>{option.icon}</Text>
        <View style={styles.formatInfo}>
          <Text style={styles.formatTitle}>{option.title}</Text>
          <Text style={styles.formatDescription}>{option.description}</Text>
        </View>
        <View style={styles.radioButton}>
          {selectedFormat === option.id && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSetting = (
    key: keyof ExportSettings,
    label: string,
    description: string,
    type: 'boolean' | 'select' = 'boolean'
  ) => {
    if (type === 'select' && key === 'dateRange') {
      return (
        <View key={key} style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
          <View style={styles.dateRangeOptions}>
            {dateRangeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dateRangeOption,
                  settings.dateRange === option.value &&
                    styles.selectedDateRange,
                ]}
                onPress={() =>
                  setSettings(prev => ({
                    ...prev,
                    dateRange: option.value as any,
                  }))
                }
              >
                <Text
                  style={[
                    styles.dateRangeText,
                    settings.dateRange === option.value &&
                      styles.selectedDateRangeText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View key={key} style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Switch
          value={settings[key] as boolean}
          onValueChange={value =>
            setSettings(prev => ({ ...prev, [key]: value }))
          }
          trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
          thumbColor="#ffffff"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Export Data</Text>

        <TouchableOpacity
          style={[
            styles.exportButton,
            exporting && styles.exportButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.exportText}>Export</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>Privacy & Compliance</Text>
            <Text style={styles.privacyText}>
              Your data export complies with PIPEDA (Personal Information
              Protection and Electronic Documents Act) requirements for Canadian
              financial data.
            </Text>
          </View>
        </View>

        {/* Export Format Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          {exportOptions.map(renderFormatOption)}
        </View>

        {/* Export Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Settings</Text>

          {renderSetting(
            'dateRange',
            'Date Range',
            'Select the time period for your export',
            'select'
          )}

          {renderSetting(
            'includeTransactions',
            'Include Transactions',
            'Export detailed transaction history'
          )}

          {renderSetting(
            'includeCategories',
            'Include Categories',
            'Export category definitions and spending breakdown'
          )}

          {renderSetting(
            'includeBudgets',
            'Include Budgets',
            'Export budget settings and progress'
          )}

          {renderSetting(
            'includeInsights',
            'Include Insights',
            'Export AI-generated financial insights and recommendations'
          )}

          {renderSetting(
            'includePII',
            'Include Personal Information',
            'Include account numbers and other sensitive data (use caution)'
          )}
        </View>

        {/* Export Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • Exported files include a timestamp and are formatted for
              Canadian financial standards
            </Text>
            <Text style={styles.infoText}>
              • All amounts are in Canadian Dollars (CAD)
            </Text>
            <Text style={styles.infoText}>
              • Date format follows ISO 8601 standard (YYYY-MM-DD)
            </Text>
            <Text style={styles.infoText}>
              • Files can be imported into most accounting software
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  formatOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFormat: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  dateRangeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedDateRange: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  selectedDateRangeText: {
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 18,
    marginBottom: 4,
  },
});
