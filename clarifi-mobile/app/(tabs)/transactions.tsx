import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import Svg, { LinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { Transaction } from '../../services/storage/dataModels';
import { TransactionListItem } from '../../components/transactions/TransactionListItem';
import { TransactionFilters } from '../../components/transactions/TransactionFilters';
import { BulkActionBar } from '../../components/transactions/BulkActionBar';
import { EmptyTransactionsState } from '../../components/transactions/EmptyTransactionsState';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatting/currency';
import { spacing } from '../../constants/spacing';

const { width, height } = Dimensions.get('window');

// Modern dashboard-consistent color palette
const transactionColors = {
  // Primary brand colors matching dashboard
  primary: '#2B5CE6',
  primaryLight: '#4B7BF5', 
  primaryDark: '#1E4BD1',
  
  // Accent colors
  growth: '#00C896',
  wisdom: '#6B5DD3',
  error: '#FF4757',
  warning: '#FECA57',
  success: '#2ED573',
  
  // Neutral palette
  background: '#FAFBFD',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  textPrimary: '#1A1F36',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Gradient combinations
  gradients: {
    header: ['#2B5CE6', '#4B7BF5'],
    income: ['#00C896', '#2ED573'],
    expense: ['#FF4757', '#FF6B6B'],
    card: ['#FFFFFF', '#F8FAFC'],
  }
};

export interface FilterState {
  searchText: string;
  categoryId?: string;
  dateRange?: { start: string; end: string };
  sortBy: 'date' | 'amount' | 'merchant';
  sortOrder: 'asc' | 'desc';
  showOnlyUserVerified?: boolean;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation refs for modern interactions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnimHeader = useRef(new Animated.Value(50)).current;
  const slideAnimCards = useRef(new Animated.Value(50)).current;
  const scaleAnimFab = useRef(new Animated.Value(0.8)).current;

  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Custom hook for transaction data management
  const {
    transactions,
    loading,
    error,
    totalIncome,
    totalExpenses,
    refreshTransactions,
    updateTransaction,
    bulkUpdateTransactions,
  } = useTransactions();

  // Initialize animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(slideAnimHeader, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimCards, {
          toValue: 0,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnimFab, {
        toValue: 1,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.categoryId) count++;
    if (filters.dateRange) count++;
    if (filters.showOnlyUserVerified) count++;
    return count;
  }, [filters]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        transaction =>
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.merchant_name?.toLowerCase().includes(searchLower) ||
          transaction.category_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.categoryId) {
      filtered = filtered.filter(
        transaction => transaction.category_id === filters.categoryId
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    // Apply user verified filter
    if (filters.showOnlyUserVerified) {
      filtered = filtered.filter(transaction => transaction.user_verified);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'merchant':
          comparison = (a.merchant_name || a.description).localeCompare(
            b.merchant_name || b.description
          );
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [transactions, filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTransactions();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
      Alert.alert('Error', 'Failed to refresh transactions. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (isSelectionMode) {
      toggleTransactionSelection(transaction.id);
    } else {
      // Navigate to transaction detail modal
      router.push(`/modals/transaction-detail?id=${transaction.id}`);
    }
  };

  const handleTransactionLongPress = (transaction: Transaction) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedTransactions(new Set([transaction.id]));
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);

    // Exit selection mode if no transactions are selected
    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      // Deselect all
      setSelectedTransactions(new Set());
      setIsSelectionMode(false);
    } else {
      // Select all visible transactions
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    const selectedTransactionIds = Array.from(selectedTransactions);

    try {
      switch (action) {
        case 'categorize':
          await bulkUpdateTransactions(selectedTransactionIds, {
            category_id: data.categoryId,
            category_name: data.categoryName,
            user_verified: true,
          });
          break;
        case 'mark_verified':
          await bulkUpdateTransactions(selectedTransactionIds, {
            user_verified: true,
          });
          break;
        case 'delete':
          // Implement delete functionality if needed
          Alert.alert('Delete', 'Delete functionality to be implemented');
          break;
      }

      // Clear selection after successful bulk action
      setSelectedTransactions(new Set());
      setIsSelectionMode(false);

      Alert.alert(
        'Success',
        `${action} applied to ${selectedTransactionIds.length} transactions`
      );
    } catch (error) {
      console.error('Bulk action failed:', error);
      Alert.alert('Error', 'Failed to perform bulk action. Please try again.');
    }
  };

  const exitSelectionMode = () => {
    setSelectedTransactions(new Set());
    setIsSelectionMode(false);
  };

  // Modern gradient header similar to dashboard
  const renderModernHeader = () => (
    <View style={styles.modernHeader}>
      <StatusBar backgroundColor={transactionColors.primary} barStyle="light-content" />
      
      {/* Artistic Left-to-Right Gradient Background */}
      <Svg style={StyleSheet.absoluteFillObject} width={width} height={140}>
        <Defs>
          <LinearGradient id="transactionHeaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={transactionColors.primary} />
            <Stop offset="40%" stopColor={transactionColors.primaryLight} />
            <Stop offset="70%" stopColor={transactionColors.wisdom} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={transactionColors.surface} stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id="overlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="transparent" />
            <Stop offset="80%" stopColor={transactionColors.surface} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={transactionColors.surface} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={140} fill="url(#transactionHeaderGradient)" />
        <Rect width={width} height={140} fill="url(#overlayGradient)" />
      </Svg>
      
      <Animated.View 
        style={[
          styles.headerContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnimHeader }],
          },
        ]}
      >
        <View style={styles.titleSection}>
          <Text style={styles.modernTitle}>Transactions</Text>
          <Text style={styles.modernSubtitle}>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/modals/category-insights')}
          >
            <BarChart3 size={22} color={transactionColors.surface} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={22} color={transactionColors.surface} />
            {activeFiltersCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  // Enhanced summary cards with gradient design
  const renderEnhancedSummaryCards = () => (
    <Animated.View 
      style={[
        styles.modernSummaryContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnimCards }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.modernSummaryCard, styles.incomeCard]}
        onPress={() => router.push('/modals/transaction-detail?type=income')}
        activeOpacity={0.9}
      >
        <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
          <Defs>
            <LinearGradient id="incomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={transactionColors.growth} stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#2ED573" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#incomeGradient)" rx="20" />
        </Svg>
        
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: transactionColors.growth + '20' }]}>
            <TrendingUp size={24} color={transactionColors.growth} />
          </View>
          <View style={styles.trendBadge}>
            <ArrowUpRight size={12} color={transactionColors.growth} />
          </View>
        </View>
        
        <Text style={styles.cardTitle}>Total Income</Text>
        <Text style={[styles.cardAmount, { color: transactionColors.growth }]}>
          {formatCurrency(totalIncome)}
        </Text>
        <Text style={styles.cardSubtitle}>This month</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modernSummaryCard, styles.expenseCard]}
        onPress={() => router.push('/modals/transaction-detail?type=expenses')}
        activeOpacity={0.9}
      >
        <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
          <Defs>
            <LinearGradient id="expenseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={transactionColors.error} stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#expenseGradient)" rx="20" />
        </Svg>
        
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: transactionColors.error + '20' }]}>
            <TrendingDown size={24} color={transactionColors.error} />
          </View>
          <View style={[styles.trendBadge, { backgroundColor: transactionColors.error + '20' }]}>
            <ArrowDownRight size={12} color={transactionColors.error} />
          </View>
        </View>
        
        <Text style={styles.cardTitle}>Total Expenses</Text>
        <Text style={[styles.cardAmount, { color: transactionColors.error }]}>
          {formatCurrency(totalExpenses)}
        </Text>
        <Text style={styles.cardSubtitle}>This month</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
    <View>
      {renderModernHeader()}
      {renderEnhancedSummaryCards()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color="#718096" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by merchant, category, or amount"
            placeholderTextColor="#718096"
            value={filters.searchText}
            onChangeText={text =>
              setFilters(prev => ({ ...prev, searchText: text }))
            }
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter
            size={20}
            color={activeFiltersCount > 0 ? '#FFFFFF' : '#2B5CE6'}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <TransactionFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity onPress={exitSelectionMode}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedTransactions.size} selected
          </Text>
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedTransactions.size === filteredTransactions.length
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionListItem
      transaction={item}
      isSelected={selectedTransactions.has(item.id)}
      isSelectionMode={isSelectionMode}
      onPress={() => handleTransactionPress(item)}
      onLongPress={() => handleTransactionLongPress(item)}
      onToggleSelection={() => toggleTransactionSelection(item.id)}
    />
  );

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B5CE6" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load transactions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyTransactionsState
            hasFilters={
              filters.searchText !== '' ||
              filters.categoryId !== undefined ||
              filters.dateRange !== undefined ||
              filters.showOnlyUserVerified
            }
            onClearFilters={() =>
              setFilters({
                searchText: '',
                sortBy: 'date',
                sortOrder: 'desc',
              })
            }
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={
          filteredTransactions.length === 0 ? styles.emptyContainer : undefined
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Bulk Action Bar */}
      {isSelectionMode && selectedTransactions.size > 0 && (
        <BulkActionBar
          selectedCount={selectedTransactions.size}
          onAction={handleBulkAction}
          onCancel={exitSelectionMode}
        />
      )}

      {/* Enhanced Floating Action Button */}
      {!isSelectionMode && (
        <Animated.View
          style={[
            styles.modernFab,
            {
              transform: [{ scale: scaleAnimFab }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.push('/modals/transaction-detail')}
            activeOpacity={0.8}
          >
            <Plus size={24} color={transactionColors.surface} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: transactionColors.background,
  },
  
  // Modern Header Design
  modernHeader: {
    height: 140,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  titleSection: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: transactionColors.surface,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  modernSubtitle: {
    fontSize: 16,
    color: transactionColors.surface + 'CC',
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: transactionColors.surface + '25',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: transactionColors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: transactionColors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  // Modern Summary Cards
  modernSummaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: -20, // Overlap with header
    marginBottom: spacing.lg,
  },
  modernSummaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.xl,
    backgroundColor: transactionColors.surface,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: transactionColors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    color: transactionColors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  cardSubtitle: {
    fontSize: 14,
    color: transactionColors.textSecondary,
    fontWeight: '500',
  },
  // Modern Search and Filter Section
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: transactionColors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderWidth: 1,
    borderColor: transactionColors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: transactionColors.textPrimary,
    fontWeight: '400',
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: transactionColors.surface,
    borderWidth: 2,
    borderColor: transactionColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: transactionColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: transactionColors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: transactionColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: transactionColors.surface,
  },
  filterBadgeText: {
    color: transactionColors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  // Selection Mode and States
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    backgroundColor: transactionColors.primary + '10',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: transactionColors.primary + '20',
  },
  cancelText: {
    color: transactionColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '700',
    color: transactionColors.textPrimary,
  },
  selectAllText: {
    color: transactionColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: transactionColors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: transactionColors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: transactionColors.background,
  },
  errorText: {
    fontSize: 18,
    color: transactionColors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: transactionColors.primary,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: transactionColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  retryButtonText: {
    color: transactionColors.surface,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  
  // Enhanced FAB Design
  modernFab: {
    position: 'absolute',
    bottom: spacing.xl + 20,
    right: spacing.lg,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: transactionColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: transactionColors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
});
