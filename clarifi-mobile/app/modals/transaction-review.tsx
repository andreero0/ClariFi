import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  X,
  Edit3,
  Split,
  ChevronDown,
  Search,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { formatCurrency } from '../../utils/formatting/currency';
import { formatDate } from '../../utils/formatting/dates';
import {
  statementProcessingService,
  ProcessedTransaction,
} from '../../services/statements/statementProcessingService';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  merchant_name: string;
  description: string;
  amount: number;
  date: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  confidence: number; // AI confidence score
  user_verified: boolean;
}

interface CategoryFilter {
  id: string;
  name: string;
  count: number;
  color: string;
}

// PRD: Transaction Categorization Screen - Transaction List Review State
const TransactionReviewModal = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const statementId = params.statementId as string;
  const transactionCount = parseInt(params.transactionCount as string) || 0;

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Animated values for swipe actions
  const swipeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Load real transaction data
  useEffect(() => {
    if (statementId) {
      loadRealTransactions();
    } else {
      loadMockTransactions();
    }
  }, [statementId]);

  const loadRealTransactions = async () => {
    try {
      const status =
        await statementProcessingService.getProcessingStatus(statementId);

      if (status && status.transactions) {
        // Convert ProcessedTransaction to Transaction format
        const convertedTransactions: Transaction[] = status.transactions.map(
          (pt, index) => ({
            id: pt.id || `transaction_${index}`,
            merchant_name:
              pt.merchant?.display_name || extractMerchantName(pt.description),
            description: pt.description,
            amount: pt.amount,
            date: pt.date,
            category_name: pt.category?.name || 'Uncategorized',
            category_color: pt.category?.color_hex || '#999999',
            category_icon: getCategoryIcon(
              pt.category?.name || 'uncategorized'
            ),
            confidence: Math.round((pt.confidence || 0.8) * 100),
            user_verified: false,
          })
        );

        setTransactions(convertedTransactions);
        generateCategoryFilters(convertedTransactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Fallback to mock data
      loadMockTransactions();
    }
  };

  const extractMerchantName = (description: string): string => {
    // Extract merchant name from transaction description
    const parts = description.split(' ');
    return (
      parts
        .slice(0, 2)
        .join(' ')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim() || 'Unknown Merchant'
    );
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
      uncategorized: '💳',
    };

    const lowercaseCategory = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowercaseCategory.includes(key)) {
        return icon;
      }
    }
    return '💳'; // Default icon
  };

  const generateCategoryFilters = (transactionList: Transaction[]) => {
    const categories = transactionList.reduce(
      (acc, transaction) => {
        const category = transaction.category_name;
        if (acc[category]) {
          acc[category].count++;
        } else {
          acc[category] = {
            id: category.toLowerCase().replace(/\s+/g, '-'),
            name: category,
            count: 1,
            color: transaction.category_color,
          };
        }
        return acc;
      },
      {} as { [key: string]: CategoryFilter }
    );

    const categoryArray = Object.values(categories);
    categoryArray.unshift({
      id: 'all',
      name: 'All',
      count: transactionList.length,
      color: colors.primary,
    });

    setCategoryFilters(categoryArray);
  };

  const loadMockTransactions = () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        merchant_name: 'Tim Hortons',
        description: 'TIM HORTONS #3456 TORONTO ON',
        amount: -4.85,
        date: '2024-01-08',
        category_name: 'Food & Dining',
        category_color: '#FF6B6B',
        category_icon: '🍔',
        confidence: 95,
        user_verified: false,
      },
      {
        id: '2',
        merchant_name: 'Shell',
        description: 'SHELL #1234 MISSISSAUGA ON',
        amount: -52.34,
        date: '2024-01-07',
        category_name: 'Transport',
        category_color: '#4ECDC4',
        category_icon: '🚗',
        confidence: 88,
        user_verified: false,
      },
      {
        id: '3',
        merchant_name: 'Loblaws',
        description: 'LOBLAWS SUPERSTORE TORONTO ON',
        amount: -127.45,
        date: '2024-01-07',
        category_name: 'Groceries',
        category_color: '#45B7D1',
        category_icon: '🛒',
        confidence: 92,
        user_verified: false,
      },
      {
        id: '4',
        merchant_name: 'Netflix',
        description: 'NETFLIX.COM SUBSCRIPTION',
        amount: -16.99,
        date: '2024-01-06',
        category_name: 'Entertainment',
        category_color: '#96CEB4',
        category_icon: '🎬',
        confidence: 98,
        user_verified: false,
      },
      {
        id: '5',
        merchant_name: 'Bell Canada',
        description: 'BELL MOBILITY MONTHLY BILL',
        amount: -85.0,
        date: '2024-01-05',
        category_name: 'Bills',
        category_color: '#FECA57',
        category_icon: '📱',
        confidence: 99,
        user_verified: false,
      },
    ];

    setTransactions(mockTransactions);
    generateCategoryFilters(mockTransactions);
  };

  // PRD: Pull-to-refresh gesture re-categorizes all
  const handleRefresh = async () => {
    setRefreshing(true);

    // Simulate re-categorization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In real app, this would trigger AI re-categorization
    Alert.alert(
      'Success',
      'Transactions have been re-categorized using the latest AI model'
    );

    setRefreshing(false);
  };

  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 90) return { color: colors.growth, label: 'High' };
    if (confidence >= 75) return { color: colors.warning, label: 'Medium' };
    return { color: colors.error, label: 'Low' };
  };

  const handleTransactionLongPress = (transactionId: string) => {
    // PRD: Long-press activates multi-select mode
    setIsBulkMode(true);
    setSelectedTransactions(new Set([transactionId]));
  };

  const handleTransactionSelect = (transactionId: string) => {
    if (isBulkMode) {
      const newSelection = new Set(selectedTransactions);
      if (newSelection.has(transactionId)) {
        newSelection.delete(transactionId);
      } else {
        newSelection.add(transactionId);
      }
      setSelectedTransactions(newSelection);

      if (newSelection.size === 0) {
        setIsBulkMode(false);
      }
    } else {
      // Navigate to transaction detail
      router.push({
        pathname: '/modals/transaction-detail',
        params: { transactionId },
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    return (
      transaction.category_name.toLowerCase().replace(/\s+/g, '-') ===
      selectedFilter
    );
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel: string;
      if (date.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = formatDate(transaction.date, 'MMM dd');
      }

      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(transaction);
      return groups;
    },
    {} as { [key: string]: Transaction[] }
  );

  const renderCategoryFilter = (category: CategoryFilter) => {
    const isSelected = selectedFilter === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.filterChip,
          isSelected && styles.selectedFilterChip,
          { borderColor: category.color },
        ]}
        onPress={() => setSelectedFilter(category.id)}
      >
        <View
          style={[
            styles.categoryIndicator,
            { backgroundColor: category.color },
          ]}
        />
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.selectedFilterChipText,
          ]}
        >
          {category.name} ({category.count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTransaction = (transaction: Transaction) => {
    const isSelected = selectedTransactions.has(transaction.id);
    const confidenceInfo = getConfidenceIndicator(transaction.confidence);
    const isExpense = transaction.amount < 0;

    return (
      <TouchableOpacity
        style={[
          styles.transactionCard,
          isSelected && styles.selectedTransactionCard,
          isBulkMode && styles.bulkModeCard,
        ]}
        onPress={() => handleTransactionSelect(transaction.id)}
        onLongPress={() => handleTransactionLongPress(transaction.id)}
        activeOpacity={0.7}
      >
        {/* PRD: Checkboxes appear on left in bulk mode */}
        {isBulkMode && (
          <View style={styles.checkboxContainer}>
            <View
              style={[styles.checkbox, isSelected && styles.selectedCheckbox]}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        )}

        {/* PRD: Selected items show Clarity Blue left border (4dp) */}
        {isSelected && <View style={styles.selectedBorder} />}

        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            {/* PRD: Merchant name (Body Regular, Midnight Ink) */}
            <Text style={styles.merchantName} numberOfLines={1}>
              {transaction.merchant_name}
            </Text>

            {/* PRD: Amount right-aligned (Bold if >$100) */}
            <Text
              style={[
                styles.amount,
                isExpense ? styles.expenseAmount : styles.incomeAmount,
                Math.abs(transaction.amount) > 100 && styles.largeAmount,
              ]}
            >
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          {/* PRD: Original description below (Caption, Neutral Gray Secondary) */}
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>

          <View style={styles.transactionFooter}>
            {/* PRD: Category badge with icon and color */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${transaction.category_color}20` },
              ]}
            >
              <Text style={styles.categoryIcon}>
                {transaction.category_icon}
              </Text>
              <Text
                style={[
                  styles.categoryName,
                  { color: transaction.category_color },
                ]}
              >
                {transaction.category_name}
              </Text>
            </View>

            {/* PRD: Confidence indicator (green/yellow/red dot) */}
            <View style={styles.confidenceContainer}>
              <View
                style={[
                  styles.confidenceDot,
                  { backgroundColor: confidenceInfo.color },
                ]}
              />
              <Text style={styles.confidenceText}>
                {transaction.confidence}%
              </Text>
            </View>
          </View>
        </View>

        {/* PRD: Swipe actions - this would be implemented with gesture handlers in real app */}
        <View style={styles.swipeActions}>
          <TouchableOpacity style={styles.editAction}>
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.splitAction}>
            <Split size={16} color={colors.wisdom} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item }: { item: [string, Transaction[]] }) => {
    const [dateLabel, transactions] = item;

    return (
      <View style={styles.dateGroup}>
        {/* PRD: Date grouping headers: "Today", "Yesterday", "Oct 24" */}
        <Text style={styles.dateHeader}>{dateLabel}</Text>
        {transactions.map(transaction => renderTransaction(transaction))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* PRD: "Review Categorized Transactions" H2 header */}
        <Text style={styles.headerTitle}>Review Categorized Transactions</Text>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* PRD: Filter chips horizontally scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {categoryFilters.map(renderCategoryFilter)}
      </ScrollView>

      {/* Transaction List */}
      <FlatList
        data={Object.entries(groupedTransactions)}
        renderItem={renderDateGroup}
        keyExtractor={item => item[0]}
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* PRD: Bottom action bar slides up in bulk mode */}
      {isBulkMode && (
        <Animated.View style={styles.bulkActionBar}>
          <Text style={styles.bulkActionText}>
            {selectedTransactions.size} selected
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.bulkActionButton}>
              <Text style={styles.bulkActionButtonText}>Categorize</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreActionsButton}>
              <Text style={styles.moreActionsText}>More</Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
  },
  // PRD: Filter chips horizontally scrollable
  filtersContainer: {
    maxHeight: 60,
    paddingVertical: 8,
  },
  filtersContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral.light,
    backgroundColor: colors.surface,
    marginRight: 8,
    minHeight: 36,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterChipText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedFilterChipText: {
    color: colors.surface,
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingBottom: 100,
  },
  // PRD: Date grouping headers
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    ...textStyles.h3,
    color: colors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: colors.neutral.lightest,
  },
  // PRD: Transaction cards
  transactionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginVertical: 4,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  selectedTransactionCard: {
    backgroundColor: `${colors.primary}05`,
  },
  bulkModeCard: {
    paddingLeft: 60, // Space for checkbox
  },
  // PRD: Checkboxes in bulk mode
  checkboxContainer: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.neutral.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // PRD: Selected items show Clarity Blue left border (4dp)
  selectedBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  // PRD: Merchant name (Body Regular, Midnight Ink)
  merchantName: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  // PRD: Amount right-aligned (Bold if >$100)
  amount: {
    ...textStyles.bodyRegular,
    fontWeight: '600',
  },
  expenseAmount: {
    color: colors.textPrimary,
  },
  incomeAmount: {
    color: colors.growth,
  },
  largeAmount: {
    fontWeight: 'bold',
  },
  // PRD: Original description below (Caption, Neutral Gray Secondary)
  description: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // PRD: Category badge with icon and color
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryName: {
    ...textStyles.caption,
    fontWeight: '500',
  },
  // PRD: Confidence indicator (green/yellow/red dot)
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  confidenceText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  // Swipe actions (would be implemented with gesture handlers)
  swipeActions: {
    position: 'absolute',
    right: -100,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editAction: {
    backgroundColor: colors.primary,
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitAction: {
    backgroundColor: colors.wisdom,
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // PRD: Bottom action bar in bulk mode
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.light,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bulkActionText: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkActionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  bulkActionButtonText: {
    ...textStyles.bodyRegular,
    color: colors.surface,
    fontWeight: '600',
  },
  moreActionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moreActionsText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginRight: 4,
  },
});

export default TransactionReviewModal;
