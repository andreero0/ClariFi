import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  PieChart,
  ArrowLeft,
} from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  monthlyReportService,
  MonthlyReportData,
  QuarterlyReportData,
} from '../../services/reports/MonthlyReportService';

const { width } = Dimensions.get('window');

interface MonthlyReportScreenProps {
  onClose?: () => void;
}

const MonthlyReportScreen: React.FC<MonthlyReportScreenProps> = ({
  onClose,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const [reportData, setReportData] = useState<
    MonthlyReportData | QuarterlyReportData | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>(
    'monthly'
  );
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.neutral.light,
    },
    headerTitle: {
      ...(textStyles.h2 || {}),
      color: theme.textPrimary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: spacing.sm,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl * 2,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: spacing.xs,
      marginBottom: spacing.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
    },
    activePeriodButton: {
      backgroundColor: theme.primary,
    },
    periodButtonText: {
      ...(textStyles.bodyRegular || {}),
      fontWeight: '600',
    },
    activePeriodButtonText: {
      color: theme.white,
    },
    inactivePeriodButtonText: {
      color: theme.textSecondary,
    },
    generateCard: {
      alignItems: 'center',
      padding: spacing.xl,
      marginBottom: spacing.lg,
    },
    generateIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    generateTitle: {
      ...(textStyles.h3 || {}),
      color: theme.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    generateDescription: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    summaryCard: {
      width: (width - spacing.md * 3) / 2,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 12,
      backgroundColor: theme.backgroundSecondary,
    },
    summaryValue: {
      ...(textStyles.h2 || {}),
      color: theme.primary,
      marginBottom: spacing.xs,
    },
    summaryLabel: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
    },
    sectionTitle: {
      ...(textStyles.h3 || {}),
      color: theme.textPrimary,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    insightCard: {
      padding: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
    },
    positiveInsight: {
      backgroundColor: theme.success + '10',
      borderLeftColor: theme.success,
    },
    warningInsight: {
      backgroundColor: theme.warning + '10',
      borderLeftColor: theme.warning,
    },
    achievementInsight: {
      backgroundColor: theme.primary + '10',
      borderLeftColor: theme.primary,
    },
    neutralInsight: {
      backgroundColor: theme.neutral.light + '50',
      borderLeftColor: theme.neutral.medium,
    },
    insightTitle: {
      ...(textStyles.bodyRegular || {}),
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: spacing.xs,
    },
    insightDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      lineHeight: 18,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      marginBottom: spacing.xs,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
    },
    categoryColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: spacing.sm,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: 2,
    },
    categoryDetails: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
    },
    categoryAmount: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      fontWeight: '700',
    },
    recommendationCard: {
      padding: spacing.md,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      marginBottom: spacing.sm,
    },
    priorityBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    highPriority: {
      backgroundColor: theme.error,
    },
    mediumPriority: {
      backgroundColor: theme.warning,
    },
    lowPriority: {
      backgroundColor: theme.success,
    },
    priorityText: {
      ...(textStyles.caption || {}),
      color: theme.white,
      fontWeight: '600',
    },
    recommendationTitle: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    recommendationDescription: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    actionSteps: {
      marginTop: spacing.sm,
    },
    actionStep: {
      ...(textStyles.bodySmall || {}),
      color: theme.textSecondary,
      marginBottom: spacing.xs,
      paddingLeft: spacing.sm,
    },
    exportButtons: {
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    loadingText: {
      ...(textStyles.bodyRegular || {}),
      color: theme.textSecondary,
      marginTop: spacing.md,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    // Auto-generate report when component mounts
    generateReport();
  }, [reportType, selectedPeriod]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let report: MonthlyReportData | QuarterlyReportData;

      if (reportType === 'monthly') {
        report = await monthlyReportService.generateMonthlyReport(
          selectedPeriod.year,
          selectedPeriod.month
        );
      } else {
        report = await monthlyReportService.generateQuarterlyReport(
          selectedPeriod.year,
          selectedPeriod.quarter
        );
      }

      setReportData(report);

      // Save report for future access
      await monthlyReportService.saveReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(
        'Error',
        'Failed to generate report. Please check your data and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = async () => {
    if (!reportData) return;

    setIsExporting(true);
    try {
      const result = await monthlyReportService.exportReportAsPDF(reportData);

      Alert.alert(
        'Report Exported',
        `Your ${reportType} report has been exported successfully!\n\nFile: ${result.filePath.split('/').pop()}\nSize: ${result.fileSize}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert(
        'Export Failed',
        'Failed to export report. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareReport = async () => {
    if (!reportData) return;

    try {
      // First export the report
      const result = await monthlyReportService.exportReportAsPDF(reportData);

      // Then use the native sharing functionality
      // Note: This would need platform-specific implementation
      Alert.alert(
        'Share Report',
        'Report sharing functionality would be implemented here with platform-specific sharing APIs.'
      );
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Share Failed', 'Failed to share report. Please try again.');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || 'Unknown';
  };

  const getPeriodDisplayName = (): string => {
    if (reportType === 'monthly') {
      return `${getMonthName(selectedPeriod.month)} ${selectedPeriod.year}`;
    } else {
      return `Q${selectedPeriod.quarter} ${selectedPeriod.year}`;
    }
  };

  const renderSummarySection = () => {
    if (!reportData) return null;

    return (
      <>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportData.summary.totalIncome)}
            </Text>
            <Text style={styles.summaryLabel}>Total Income</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatCurrency(reportData.summary.totalExpenses)}
            </Text>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    reportData.summary.netIncome >= 0
                      ? theme.success
                      : theme.error,
                },
              ]}
            >
              {formatCurrency(reportData.summary.netIncome)}
            </Text>
            <Text style={styles.summaryLabel}>Net Income</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    reportData.summary.savingsRate >= 20
                      ? theme.success
                      : reportData.summary.savingsRate >= 10
                        ? theme.warning
                        : theme.error,
                },
              ]}
            >
              {reportData.summary.savingsRate.toFixed(1)}%
            </Text>
            <Text style={styles.summaryLabel}>Savings Rate</Text>
          </View>
        </View>
      </>
    );
  };

  const renderCategoriesSection = () => {
    if (!reportData || !reportData.spendingByCategory.length) return null;

    return (
      <>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {reportData.spendingByCategory.slice(0, 8).map((category, index) => (
          <View key={category.categoryId} style={styles.categoryItem}>
            <View
              style={[
                styles.categoryColor,
                { backgroundColor: category.color },
              ]}
            />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.categoryName}</Text>
              <Text style={styles.categoryDetails}>
                {category.transactionCount} transactions •{' '}
                {category.percentage.toFixed(1)}% of spending
                {category.monthOverMonthChange !== 0 &&
                  ` • ${formatPercentage(category.monthOverMonthChange)} vs last period`}
              </Text>
            </View>
            <Text style={styles.categoryAmount}>
              {formatCurrency(category.totalAmount)}
            </Text>
          </View>
        ))}
      </>
    );
  };

  const renderInsightsSection = () => {
    if (!reportData || !reportData.insights.length) return null;

    const getInsightStyle = (type: string) => {
      switch (type) {
        case 'positive':
          return styles.positiveInsight;
        case 'warning':
          return styles.warningInsight;
        case 'achievement':
          return styles.achievementInsight;
        default:
          return styles.neutralInsight;
      }
    };

    return (
      <>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        {reportData.insights.map((insight, index) => (
          <View
            key={index}
            style={[styles.insightCard, getInsightStyle(insight.type)]}
          >
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            {insight.amount && (
              <Text
                style={[
                  styles.insightDescription,
                  { fontWeight: '600', marginTop: spacing.xs },
                ]}
              >
                Amount: {formatCurrency(insight.amount)}
              </Text>
            )}
          </View>
        ))}
      </>
    );
  };

  const renderRecommendationsSection = () => {
    if (!reportData || !reportData.recommendations.length) return null;

    const getPriorityStyle = (priority: string) => {
      switch (priority) {
        case 'high':
          return styles.highPriority;
        case 'medium':
          return styles.mediumPriority;
        default:
          return styles.lowPriority;
      }
    };

    return (
      <>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {reportData.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View
              style={[styles.priorityBadge, getPriorityStyle(rec.priority)]}
            >
              <Text style={styles.priorityText}>
                {rec.priority.toUpperCase()} PRIORITY
              </Text>
            </View>

            <Text style={styles.recommendationTitle}>{rec.title}</Text>
            <Text style={styles.recommendationDescription}>
              {rec.description}
            </Text>

            {rec.potentialSavings && (
              <Text
                style={[
                  styles.recommendationDescription,
                  { fontWeight: '600', color: theme.success },
                ]}
              >
                Potential Savings: {formatCurrency(rec.potentialSavings)}
              </Text>
            )}

            <View style={styles.actionSteps}>
              <Text style={[styles.insightTitle, { fontSize: 14 }]}>
                Action Steps:
              </Text>
              {rec.actionSteps.map((step, stepIndex) => (
                <Text key={stepIndex} style={styles.actionStep}>
                  • {step}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </>
    );
  };

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generating Report...</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            Analyzing your financial data and generating insights...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {reportData ? getPeriodDisplayName() : 'Financial Report'}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleShareReport}
          disabled={!reportData}
        >
          <Share2
            size={20}
            color={reportData ? theme.textPrimary : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Type Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              reportType === 'monthly' && styles.activePeriodButton,
            ]}
            onPress={() => setReportType('monthly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                reportType === 'monthly'
                  ? styles.activePeriodButtonText
                  : styles.inactivePeriodButtonText,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              reportType === 'quarterly' && styles.activePeriodButton,
            ]}
            onPress={() => setReportType('quarterly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                reportType === 'quarterly'
                  ? styles.activePeriodButtonText
                  : styles.inactivePeriodButtonText,
              ]}
            >
              Quarterly
            </Text>
          </TouchableOpacity>
        </View>

        {!reportData ? (
          <Card style={styles.generateCard}>
            <View style={styles.generateIcon}>
              <BarChart3 size={32} color={theme.primary} />
            </View>
            <Text style={styles.generateTitle}>
              Generate {reportType === 'monthly' ? 'Monthly' : 'Quarterly'}{' '}
              Report
            </Text>
            <Text style={styles.generateDescription}>
              Get comprehensive insights into your spending patterns, trends,
              and personalized recommendations for {getPeriodDisplayName()}.
            </Text>
            <Button
              title="Generate Report"
              onPress={generateReport}
              variant="primary"
              iconLeft="file-text"
              loading={isGenerating}
              disabled={isGenerating}
            />
          </Card>
        ) : (
          <>
            {renderSummarySection()}
            {renderCategoriesSection()}
            {renderInsightsSection()}
            {renderRecommendationsSection()}

            <View style={styles.exportButtons}>
              <Button
                title="Export as PDF"
                onPress={handleExportReport}
                variant="outline"
                iconLeft="download"
                loading={isExporting}
                disabled={isExporting}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MonthlyReportScreen;
