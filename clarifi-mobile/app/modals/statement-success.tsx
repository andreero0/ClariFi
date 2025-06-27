import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  CheckCircle,
  Plus,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { formatCurrency } from '../../utils/formatting/currency';
import { formatDate } from '../../utils/formatting/dates';
import {
  statementProcessingService,
  ProcessedTransaction,
} from '../../services/statements/statementProcessingService';
import PrivacyAwareAnalytics from '../../services/analytics/PrivacyAwareAnalytics';

const { width } = Dimensions.get('window');

interface ProcessingSummary {
  totalTransactions: number;
  totalAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
  topCategories: Array<{
    name: string;
    amount: number;
    color: string;
    icon: string;
  }>;
  processingTime: number;
}

// PRD: Statement Processing Success Screen - Feature 5.1
const StatementSuccessModal = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const statementId = params.statementId as string;
  const transactionCount = parseInt(params.transactionCount as string) || 0;

  const analytics = useRef(new PrivacyAwareAnalytics()).current;

  // Animation values
  const checkmarkAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  // Processing summary state
  const [summary, setSummary] = useState<ProcessingSummary>(
    transactionCount > 0
      ? {
          totalTransactions: transactionCount,
          totalAmount: 0, // Will be calculated from real data
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-08',
          },
          topCategories: [],
          processingTime: 0,
        }
      : {
          totalTransactions: 12,
          totalAmount: -847.23,
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-08',
          },
          topCategories: [
            {
              name: 'Groceries',
              amount: -234.56,
              color: '#45B7D1',
              icon: '🛒',
            },
            {
              name: 'Transport',
              amount: -156.78,
              color: '#4ECDC4',
              icon: '🚗',
            },
            {
              name: 'Food & Dining',
              amount: -89.34,
              color: '#FF6B6B',
              icon: '🍔',
            },
          ],
          processingTime: 23,
        }
  );

  const [isLoading, setIsLoading] = useState(!!statementId);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);

  // Load real processing data
  useEffect(() => {
    if (statementId) {
      loadProcessingData();
    } else {
      // Use mock data for demo
      startAnimations();
    }
  }, [statementId]);

  const loadProcessingData = async () => {
    try {
      const status =
        await statementProcessingService.getProcessingStatus(statementId);

      if (status && status.transactions) {
        setTransactions(status.transactions);

        // Calculate summary from real data
        const totalAmount = status.transactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        const categories = calculateTopCategories(status.transactions);

        // Find date range
        const dates = status.transactions.map(t => new Date(t.date)).sort();
        const dateRange = {
          start: dates[0]?.toISOString().split('T')[0] || '2024-01-01',
          end:
            dates[dates.length - 1]?.toISOString().split('T')[0] ||
            '2024-01-08',
        };

        setSummary({
          totalTransactions: status.transactions.length,
          totalAmount,
          dateRange,
          topCategories: categories,
          processingTime: calculateProcessingTime(
            status.createdAt,
            status.processedAt
          ),
        });

        // Track success analytics
        analytics.track('statement_processing_completed', {
          statement_id: statementId,
          transaction_count: status.transactions.length,
          total_amount: Math.abs(totalAmount),
          processing_time: calculateProcessingTime(
            status.createdAt,
            status.processedAt
          ),
          categories_found: categories.length,
        });
      }
    } catch (error) {
      console.error('Error loading processing data:', error);
    } finally {
      setIsLoading(false);
      startAnimations();
    }
  };

  const calculateTopCategories = (transactions: ProcessedTransaction[]) => {
    const categoryTotals: {
      [key: string]: { amount: number; color: string; icon: string };
    } = {};

    transactions.forEach(transaction => {
      if (transaction.category) {
        const categoryName = transaction.category.name;
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = {
            amount: 0,
            color: transaction.category.color_hex || '#45B7D1',
            icon: getCategoryIcon(categoryName),
          };
        }
        categoryTotals[categoryName].amount += transaction.amount;
      }
    });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 3)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color,
        icon: data.icon,
      }));
  };

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
      groceries: '🛒',
      food: '🍔',
      dining: '🍔',
      transport: '🚗',
      gas: '⛽',
      entertainment: '🎬',
      bills: '📱',
      utilities: '💡',
      shopping: '🛍️',
      health: '🏥',
      education: '📚',
      travel: '✈️',
    };

    const lowercaseCategory = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowercaseCategory.includes(key)) {
        return icon;
      }
    }
    return '💳'; // Default icon
  };

  const calculateProcessingTime = (
    createdAt?: string,
    processedAt?: string
  ): number => {
    if (!createdAt || !processedAt) return 23; // Default

    const created = new Date(createdAt);
    const processed = new Date(processedAt);
    return Math.round((processed.getTime() - created.getTime()) / 1000);
  };

  // PRD: Animated checkmark and celebratory entrance
  const startAnimations = () => {
    // Haptic feedback for success
    Vibration.vibrate([0, 100, 50, 100]);

    // Stagger animations for delightful entrance
    Animated.sequence([
      // Checkmark scale animation
      Animated.spring(checkmarkAnimation, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      // Slide up content
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleViewDashboard = () => {
    // Track analytics
    analytics.track('statement_success_action', {
      action: 'view_dashboard',
      statement_id: statementId,
      transaction_count: summary.totalTransactions,
    });

    // Navigate to main dashboard
    router.push('/(tabs)/dashboard');
  };

  const handleImportAnother = () => {
    // Track analytics
    analytics.track('statement_success_action', {
      action: 'import_another',
      statement_id: statementId,
      transaction_count: summary.totalTransactions,
    });

    // Return to statement capture flow
    router.push('/(auth)/statement-instructions');
  };

  const handleTakeTour = () => {
    // Track analytics
    analytics.track('statement_success_action', {
      action: 'complete_setup',
      statement_id: statementId,
      transaction_count: summary.totalTransactions,
    });

    // Navigate to main dashboard to complete onboarding
    router.push('/(tabs)/dashboard');
  };

  const renderSummaryCard = () => (
    <Animated.View
      style={[
        styles.summaryCard,
        {
          transform: [{ translateY: slideAnimation }],
          opacity: fadeAnimation,
        },
      ]}
    >
      <Text style={styles.summaryTitle}>Processing Complete!</Text>

      {/* Quick stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <BarChart3 size={20} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{summary.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <DollarSign size={20} color={colors.growth} />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(Math.abs(summary.totalAmount))}
          </Text>
          <Text style={styles.statLabel}>Total Spending</Text>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Calendar size={20} color={colors.wisdom} />
          </View>
          <Text style={styles.statValue}>
            {Math.ceil(
              (new Date(summary.dateRange.end).getTime() -
                new Date(summary.dateRange.start).getTime()) /
                (1000 * 60 * 60 * 24)
            )}
          </Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
      </View>

      {/* Processing time */}
      <Text style={styles.processingTime}>
        Processed in {summary.processingTime} seconds
      </Text>
    </Animated.View>
  );

  const renderCategoryPreview = () => (
    <Animated.View
      style={[
        styles.categoryPreviewCard,
        {
          transform: [{ translateY: slideAnimation }],
          opacity: fadeAnimation,
        },
      ]}
    >
      <Text style={styles.previewTitle}>Top Spending Categories</Text>

      {summary.topCategories.map((category, index) => (
        <View key={index} style={styles.categoryItem}>
          <View style={styles.categoryLeft}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <Text style={[styles.categoryAmount, { color: category.color }]}>
            {formatCurrency(Math.abs(category.amount))}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => {
          analytics.track('statement_success_action', {
            action: 'view_transactions',
            statement_id: statementId,
            transaction_count: summary.totalTransactions,
          });
          router.push({
            pathname: '/modals/transaction-review',
            params: {
              imageUri,
              statementId,
              transactionCount: summary.totalTransactions.toString(),
            },
          });
        }}
      >
        <Text style={styles.viewAllText}>View All Transactions</Text>
        <ArrowRight size={16} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark */}
        <View style={styles.checkmarkContainer}>
          <Animated.View
            style={[
              styles.checkmarkCircle,
              {
                transform: [{ scale: checkmarkAnimation }],
              },
            ]}
          >
            <CheckCircle size={80} color={colors.growth} />
          </Animated.View>
        </View>

        {/* Success message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              transform: [{ translateY: slideAnimation }],
              opacity: fadeAnimation,
            },
          ]}
        >
          <Text style={styles.successTitle}>
            Statement Imported Successfully!
          </Text>
          <Text style={styles.successSubtitle}>
            Your financial data has been extracted and categorized using AI
          </Text>
        </Animated.View>

        {/* Summary card */}
        {renderSummaryCard()}

        {/* Category preview */}
        {renderCategoryPreview()}

        {/* Action buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              transform: [{ translateY: slideAnimation }],
              opacity: fadeAnimation,
            },
          ]}
        >
          {/* Primary action: View Dashboard */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewDashboard}
          >
            <TrendingUp size={20} color={colors.surface} />
            <Text style={styles.primaryButtonText}>View Dashboard</Text>
          </TouchableOpacity>

          {/* Secondary actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleImportAnother}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Import Another</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleTakeTour}
            >
              <Text style={styles.secondaryButtonText}>Complete Setup</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Date range info */}
        <Animated.View
          style={[
            styles.dateRangeContainer,
            {
              opacity: fadeAnimation,
            },
          ]}
        >
          <Text style={styles.dateRangeText}>
            Statement period: {formatDate(summary.dateRange.start)} -{' '}
            {formatDate(summary.dateRange.end)}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  checkmarkContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  checkmarkCircle: {
    shadowColor: colors.growth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...textStyles.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
  },
  summaryTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    ...textStyles.h3,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  processingTime: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoryPreviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  previewTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryAmount: {
    ...textStyles.bodyRegular,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...textStyles.button,
    color: colors.surface,
    marginLeft: spacing.xs,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.light,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  dateRangeContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  dateRangeText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default StatementSuccessModal;
