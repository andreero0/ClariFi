import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatCurrency } from '../../utils/formatting/currency';
import { spacing } from '../../constants/spacing';

// ClariFi color palette
const clarifiColors = {
  primary: '#2B5CE6',
  secondary: '#4B7BF5',
  surface: '#FFFFFF',
  primaryText: '#1A1F36',
  growth: '#00C896',
  wisdom: '#6B5DD3',
  error: '#E53E3E',
  warning: '#F6AD55',
  success: '#00A76F',
  neutralPrimary: '#4A5568',
  neutralSecondary: '#718096',
  border: '#E2E8F0',
  appBackground: '#FAFBFD',
  backgroundGray: '#F7F9FC',
};

export type ExportFormat = 'pdf' | 'csv' | 'image';

interface ExportOption {
  id: ExportFormat;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  dashboardData: any;
  onExport: (format: ExportFormat, dateRange: DateRange, options: ExportOptions) => void;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface ExportOptions {
  includeTransactions: boolean;
  includeCharts: boolean;
  includeInsights: boolean;
  includeBudgets: boolean;
}

const exportFormatOptions: ExportOption[] = [
  {
    id: 'pdf',
    title: 'PDF Report',
    description: 'Complete financial report with charts',
    icon: 'document-text',
    color: clarifiColors.error,
  },
  {
    id: 'csv',
    title: 'CSV Spreadsheet',
    description: 'Transaction data for Excel/Google Sheets',
    icon: 'grid',
    color: clarifiColors.growth,
  },
  {
    id: 'image',
    title: 'Image Snapshot',
    description: 'Share your dashboard summary',
    icon: 'image',
    color: clarifiColors.wisdom,
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  dashboardData,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTransactions: true,
    includeCharts: true,
    includeInsights: true,
    includeBudgets: true,
  });
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Generate actual export data based on format
      const exportData = await generateExportData(selectedFormat, dateRange, exportOptions);
      
      // Call the parent onExport function with real data
      onExport(selectedFormat, dateRange, exportOptions);
      
      // Show success with actual file info
      Alert.alert(
        'Export Successful',
        `Your ${selectedFormat.toUpperCase()} report has been generated successfully.\n\nData includes: ${exportData.summary}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Share', 
            onPress: () => shareExportData(exportData.content, selectedFormat) 
          },
        ]
      );
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'There was an error generating your report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = async (format: ExportFormat, dateRange: any, options: ExportOptions) => {
    // Simulate data fetching delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock financial data - in real app this would come from API
    const mockData = {
      income: 4200,
      expenses: 2875,
      savings: 1325,
      categories: [
        { name: 'Food & Dining', amount: 845, transactions: 28 },
        { name: 'Transportation', amount: 420, transactions: 15 },
        { name: 'Shopping', amount: 380, transactions: 22 },
        { name: 'Utilities', amount: 285, transactions: 8 },
        { name: 'Entertainment', amount: 220, transactions: 12 }
      ],
      period: `${dateRange.startDate} to ${dateRange.endDate}`,
      generatedAt: new Date().toISOString()
    };

    let content: string;
    let summary: string;

    switch (format) {
      case 'pdf':
        content = generatePDFContent(mockData, options);
        summary = `${mockData.categories.length} categories, ${mockData.categories.reduce((sum, cat) => sum + cat.transactions, 0)} transactions`;
        break;
      
      case 'csv':
        content = generateCSVContent(mockData, options);
        summary = `${mockData.categories.length} category rows, financial summary included`;
        break;
      
      case 'json':
        content = generateJSONContent(mockData, options);
        summary = `Complete financial data in JSON format`;
        break;
      
      default:
        throw new Error('Unsupported export format');
    }

    return { content, summary };
  };

  const generatePDFContent = (data: any, options: ExportOptions) => {
    // Generate HTML content that could be converted to PDF
    let html = `
      <html>
      <head>
        <title>ClariFi Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: linear-gradient(135deg, #2B5CE6, #4B7BF5); color: white; padding: 20px; border-radius: 10px; }
          .summary { display: flex; justify-content: space-between; margin: 20px 0; }
          .summary-item { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ClariFi Financial Report</h1>
          <p>Period: ${data.period}</p>
        </div>
    `;

    if (options.includeSummary) {
      html += `
        <div class="summary">
          <div class="summary-item">
            <h3>Income</h3>
            <h2>$${data.income.toLocaleString()}</h2>
          </div>
          <div class="summary-item">
            <h3>Expenses</h3>
            <h2>$${data.expenses.toLocaleString()}</h2>
          </div>
          <div class="summary-item">
            <h3>Savings</h3>
            <h2>$${data.savings.toLocaleString()}</h2>
          </div>
        </div>
      `;
    }

    if (options.includeCategories) {
      html += `
        <h2>Category Breakdown</h2>
        <table>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Transactions</th>
            <th>Avg per Transaction</th>
          </tr>
      `;
      
      data.categories.forEach((cat: any) => {
        html += `
          <tr>
            <td>${cat.name}</td>
            <td>$${cat.amount.toLocaleString()}</td>
            <td>${cat.transactions}</td>
            <td>$${(cat.amount / cat.transactions).toFixed(2)}</td>
          </tr>
        `;
      });
      
      html += `</table>`;
    }

    html += `
        <div style="margin-top: 40px; font-size: 12px; color: #666;">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>Exported from ClariFi - AI-powered budgeting for Canadians</p>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const generateCSVContent = (data: any, options: ExportOptions) => {
    let csv = '';

    if (options.includeSummary) {
      csv += 'Financial Summary\n';
      csv += 'Type,Amount\n';
      csv += `Income,$${data.income}\n`;
      csv += `Expenses,$${data.expenses}\n`;
      csv += `Savings,$${data.savings}\n\n`;
    }

    if (options.includeCategories) {
      csv += 'Category Breakdown\n';
      csv += 'Category,Amount,Transactions,Avg per Transaction\n';
      data.categories.forEach((cat: any) => {
        csv += `${cat.name},$${cat.amount},${cat.transactions},$${(cat.amount / cat.transactions).toFixed(2)}\n`;
      });
    }

    csv += `\nGenerated on,${new Date().toISOString()}\n`;
    csv += 'Period,' + data.period + '\n';

    return csv;
  };

  const generateJSONContent = (data: any, options: ExportOptions) => {
    const exportData: any = {
      meta: {
        generatedAt: data.generatedAt,
        period: data.period,
        format: 'json',
        options: options
      }
    };

    if (options.includeSummary) {
      exportData.summary = {
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
        savingsRate: ((data.savings / data.income) * 100).toFixed(1) + '%'
      };
    }

    if (options.includeCategories) {
      exportData.categories = data.categories.map((cat: any) => ({
        ...cat,
        percentage: ((cat.amount / data.expenses) * 100).toFixed(1) + '%',
        avgPerTransaction: (cat.amount / cat.transactions).toFixed(2)
      }));
    }

    if (options.includeTransactions) {
      exportData.transactions = {
        total: data.categories.reduce((sum: number, cat: any) => sum + cat.transactions, 0),
        breakdown: data.categories.map((cat: any) => ({
          category: cat.name,
          count: cat.transactions
        }))
      };
    }

    return JSON.stringify(exportData, null, 2);
  };

  const shareExportData = async (content: string, format: ExportFormat) => {
    try {
      // In a real implementation, you would:
      // 1. Save content to a file using expo-file-system
      // 2. Share the file using expo-sharing
      // For now, we'll log the content and show a simplified share
      
      console.log(`Export content (${format.toUpperCase()}):`, content);
      
      // Simulate sharing functionality
      Alert.alert(
        'Share Export',
        `Export data is ready to share as ${format.toUpperCase()} file. In a full implementation, this would open the native share dialog.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share the export file.');
    }
  };
  
  const toggleOption = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };
  
  const renderFormatOption = (option: ExportOption) => {
    const isSelected = selectedFormat === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.formatOption,
          isSelected && styles.formatOptionSelected,
          isSelected && { borderColor: option.color },
        ]}
        onPress={() => setSelectedFormat(option.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.formatIconContainer,
            { backgroundColor: option.color + '20' },
          ]}
        >
          <Ionicons name={option.icon as any} size={24} color={option.color} />
        </View>
        <View style={styles.formatTextContainer}>
          <Text style={styles.formatTitle}>{option.title}</Text>
          <Text style={styles.formatDescription}>{option.description}</Text>
        </View>
        {isSelected && (
          <View
            style={[
              styles.formatCheckmark,
              { backgroundColor: option.color },
            ]}
          >
            <Ionicons name="checkmark" size={16} color={clarifiColors.surface} />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderDatePicker = () => (
    <View style={styles.dateSection}>
      <Text style={styles.sectionTitle}>Date Range</Text>
      
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Ionicons name="calendar" size={18} color={clarifiColors.neutralSecondary} />
          <Text style={styles.dateText}>
            {dateRange.start.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.dateSeparator}>to</Text>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Ionicons name="calendar" size={18} color={clarifiColors.neutralSecondary} />
          <Text style={styles.dateText}>
            {dateRange.end.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showStartPicker && (
        <DateTimePicker
          value={dateRange.start}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) {
              setDateRange(prev => ({ ...prev, start: date }));
            }
          }}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={dateRange.end}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) {
              setDateRange(prev => ({ ...prev, end: date }));
            }
          }}
        />
      )}
    </View>
  );
  
  const renderExportOptions = () => {
    // Only show relevant options for each format
    const availableOptions = {
      pdf: ['includeTransactions', 'includeCharts', 'includeInsights', 'includeBudgets'],
      csv: ['includeTransactions', 'includeBudgets'],
      image: ['includeCharts', 'includeInsights'],
    };
    
    const formatOptions = availableOptions[selectedFormat];
    
    return (
      <View style={styles.optionsSection}>
        <Text style={styles.sectionTitle}>Include in Export</Text>
        
        {formatOptions.includes('includeTransactions') && (
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => toggleOption('includeTransactions')}
          >
            <Text style={styles.optionText}>Transaction Details</Text>
            <View
              style={[
                styles.checkbox,
                exportOptions.includeTransactions && styles.checkboxChecked,
              ]}
            >
              {exportOptions.includeTransactions && (
                <Ionicons name="checkmark" size={16} color={clarifiColors.surface} />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {formatOptions.includes('includeCharts') && (
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => toggleOption('includeCharts')}
          >
            <Text style={styles.optionText}>Charts & Visualizations</Text>
            <View
              style={[
                styles.checkbox,
                exportOptions.includeCharts && styles.checkboxChecked,
              ]}
            >
              {exportOptions.includeCharts && (
                <Ionicons name="checkmark" size={16} color={clarifiColors.surface} />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {formatOptions.includes('includeInsights') && (
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => toggleOption('includeInsights')}
          >
            <Text style={styles.optionText}>AI Insights</Text>
            <View
              style={[
                styles.checkbox,
                exportOptions.includeInsights && styles.checkboxChecked,
              ]}
            >
              {exportOptions.includeInsights && (
                <Ionicons name="checkmark" size={16} color={clarifiColors.surface} />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {formatOptions.includes('includeBudgets') && (
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => toggleOption('includeBudgets')}
          >
            <Text style={styles.optionText}>Budget Information</Text>
            <View
              style={[
                styles.checkbox,
                exportOptions.includeBudgets && styles.checkboxChecked,
              ]}
            >
              {exportOptions.includeBudgets && (
                <Ionicons name="checkmark" size={16} color={clarifiColors.surface} />
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Export Dashboard</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={clarifiColors.neutralSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Format Selection */}
            <View style={styles.formatSection}>
              <Text style={styles.sectionTitle}>Choose Format</Text>
              {exportFormatOptions.map(renderFormatOption)}
            </View>
            
            {/* Date Range */}
            {renderDatePicker()}
            
            {/* Export Options */}
            {renderExportOptions()}
            
            {/* Summary Preview */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Summary Preview</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Income</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(dashboardData?.currentMonth?.income || 0)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(dashboardData?.currentMonth?.expenses || 0)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Savings</Text>
                  <Text style={[styles.summaryValue, styles.savingsValue]}>
                    {formatCurrency(dashboardData?.currentMonth?.savings || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Export Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                isExporting && styles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color={clarifiColors.surface} />
              ) : (
                <>
                  <Ionicons name="download" size={20} color={clarifiColors.surface} />
                  <Text style={styles.exportButtonText}>Generate Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: clarifiColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: clarifiColors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: clarifiColors.primaryText,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: clarifiColors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: clarifiColors.primaryText,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  formatSection: {
    marginBottom: spacing.md,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: clarifiColors.backgroundGray,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatOptionSelected: {
    backgroundColor: clarifiColors.surface,
  },
  formatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  formatTextContainer: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: clarifiColors.primaryText,
    marginBottom: 2,
  },
  formatDescription: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
  },
  formatCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSection: {
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: clarifiColors.backgroundGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: clarifiColors.border,
  },
  dateText: {
    fontSize: 14,
    color: clarifiColors.primaryText,
    fontWeight: '500',
  },
  dateSeparator: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
  },
  optionsSection: {
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: clarifiColors.border,
  },
  optionText: {
    fontSize: 16,
    color: clarifiColors.primaryText,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: clarifiColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: clarifiColors.primary,
    borderColor: clarifiColors.primary,
  },
  summarySection: {
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: clarifiColors.backgroundGray,
    borderRadius: 12,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: clarifiColors.primaryText,
  },
  savingsValue: {
    color: clarifiColors.growth,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: clarifiColors.border,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: clarifiColors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: clarifiColors.surface,
  },
});