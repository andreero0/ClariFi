import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Filter,
  Download,
  ChevronRight,
  Receipt,
} from 'lucide-react-native';
import Svg, { Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { formatCurrency } from '../../utils/formatting/currency';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

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

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  merchant?: string;
  category: string;
  isRecurring?: boolean;
  notes?: string;
}

interface CategoryStats {
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  highestTransaction: number;
  lowestTransaction: number;
  comparisonToLastMonth: number;
  budget?: number;
  budgetUsed?: number;
  daysRemaining: number;
  projectedSpending: number;
  topMerchants: Array<{ name: string; amount: number; count: number }>;
}

// Mock data generator
const generateMockTransactions = (categoryName: string): Transaction[] => {
  const merchants = {
    'Food & Dining': ['Starbucks', 'Metro', 'Tim Hortons', 'Subway', 'Boston Pizza', 'Uber Eats'],
    'Transportation': ['Presto', 'Uber', 'Shell', 'Petro Canada', 'GO Transit', 'Via Rail'],
    'Shopping': ['Amazon', 'Walmart', 'Best Buy', 'Hudson\'s Bay', 'Winners', 'Costco'],
    'Bills & Utilities': ['Rogers', 'Bell', 'Hydro One', 'Enbridge', 'Netflix', 'Spotify'],
    'Entertainment': ['Cineplex', 'Steam', 'PlayStation', 'Ticketmaster', 'Casa Loma', 'ROM'],
    'Other': ['Shoppers Drug Mart', 'LCBO', 'Canada Post', 'Service Ontario', 'Bank Fee'],
  };
  
  const categoryMerchants = merchants[categoryName as keyof typeof merchants] || merchants.Other;
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    transactions.push({
      id: `trans-${i}`,
      date,
      merchant: categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)],
      description: `Purchase at ${categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)]}`,
      amount: Math.random() * 150 + 10,
      category: categoryName,
      isRecurring: Math.random() > 0.8,
    });
  }
  
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const generateMockStats = (transactions: Transaction[], budget?: number): CategoryStats => {
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const amounts = transactions.map(t => t.amount);
  
  // Calculate merchant stats
  const merchantMap = new Map<string, { amount: number; count: number }>();
  transactions.forEach(t => {
    if (t.merchant) {
      const existing = merchantMap.get(t.merchant) || { amount: 0, count: 0 };
      merchantMap.set(t.merchant, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    }
  });
  
  const topMerchants = Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysPassed = new Date().getDate();
  const daysRemaining = daysInMonth - daysPassed;
  const dailyAverage = totalSpent / daysPassed;
  const projectedSpending = dailyAverage * daysInMonth;
  
  return {
    totalSpent,
    transactionCount: transactions.length,
    averageTransaction: totalSpent / transactions.length,
    highestTransaction: Math.max(...amounts),
    lowestTransaction: Math.min(...amounts),
    comparisonToLastMonth: (Math.random() - 0.5) * 40, // -20% to +20%
    budget: budget || totalSpent * 1.2,
    budgetUsed: budget ? (totalSpent / budget) * 100 : 80,
    daysRemaining,
    projectedSpending,
    topMerchants,
  };
};

export default function CategoryTransactionsModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; color?: string }>();
  const categoryName = params.name || 'Category';
  const categoryColor = params.color || clarifiColors.primary;
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    loadData();
  }, [categoryName]);
  
  const loadData = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockTransactions = generateMockTransactions(categoryName);
      const mockStats = generateMockStats(mockTransactions, 900);
      
      setTransactions(mockTransactions);
      setStats(mockStats);
      setIsLoading(false);
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: categoryColor }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={clarifiColors.surface} />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{categoryName}</Text>
            <Text style={styles.headerSubtitle}>Transaction Details</Text>
          </View>
          
          <TouchableOpacity style={styles.exportButton}>
            <Download size={20} color={clarifiColors.surface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
  
  const renderStats = () => {
    if (!stats) return null;
    
    const isOverBudget = stats.budgetUsed > 100;
    const trendUp = stats.comparisonToLastMonth > 0;
    
    return (
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Main Stats Card */}
        <View style={styles.mainStatsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={[styles.statValue, styles.primaryStatValue]}>
                {formatCurrency(stats.totalSpent)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>vs Last Month</Text>
              <View style={styles.trendContainer}>
                {trendUp ? (
                  <TrendingUp size={16} color={clarifiColors.error} />
                ) : (
                  <TrendingDown size={16} color={clarifiColors.growth} />
                )}
                <Text
                  style={[
                    styles.trendValue,
                    { color: trendUp ? clarifiColors.error : clarifiColors.growth },
                  ]}
                >
                  {Math.abs(stats.comparisonToLastMonth).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
          
          {/* Budget Progress */}
          {stats.budget && (
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Budget Progress</Text>
                <Text style={styles.budgetAmount}>
                  {formatCurrency(stats.totalSpent)} / {formatCurrency(stats.budget)}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(stats.budgetUsed, 100)}%`,
                      backgroundColor: isOverBudget ? clarifiColors.error : categoryColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.budgetStatus, isOverBudget && styles.overBudget]}>
                {isOverBudget
                  ? `${(stats.budgetUsed - 100).toFixed(0)}% over budget`
                  : `${stats.daysRemaining} days remaining`}
              </Text>
            </View>
          )}
        </View>
        
        {/* Quick Stats Grid */}
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <Receipt size={20} color={clarifiColors.neutralSecondary} />
            <Text style={styles.quickStatValue}>{stats.transactionCount}</Text>
            <Text style={styles.quickStatLabel}>Transactions</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <DollarSign size={20} color={clarifiColors.neutralSecondary} />
            <Text style={styles.quickStatValue}>
              {formatCurrency(stats.averageTransaction)}
            </Text>
            <Text style={styles.quickStatLabel}>Average</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <Calendar size={20} color={clarifiColors.neutralSecondary} />
            <Text style={styles.quickStatValue}>
              {formatCurrency(stats.projectedSpending)}
            </Text>
            <Text style={styles.quickStatLabel}>Projected</Text>
          </View>
        </View>
        
        {/* Top Merchants */}
        {stats.topMerchants.length > 0 && (
          <View style={styles.topMerchantsCard}>
            <Text style={styles.sectionTitle}>Top Merchants</Text>
            {stats.topMerchants.map((merchant, index) => (
              <View key={merchant.name} style={styles.merchantRow}>
                <Text style={styles.merchantRank}>{index + 1}</Text>
                <Text style={styles.merchantName}>{merchant.name}</Text>
                <Text style={styles.merchantCount}>{merchant.count}x</Text>
                <Text style={styles.merchantAmount}>
                  {formatCurrency(merchant.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };
  
  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {(['week', 'month', 'year'] as const).map((timeframe) => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive,
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
        >
          <Text
            style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.timeframeTextActive,
            ]}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isToday = new Date().toDateString() === item.date.toDateString();
    const isYesterday =
      new Date(Date.now() - 86400000).toDateString() === item.date.toDateString();
    
    const dateLabel = isToday
      ? 'Today'
      : isYesterday
      ? 'Yesterday'
      : item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return (
      <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
        <View style={styles.transactionLeft}>
          <View style={[styles.merchantIcon, { backgroundColor: categoryColor + '20' }]}>
            <Text style={styles.merchantInitial}>
              {item.merchant?.charAt(0) || 'T'}
            </Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionMerchant}>{item.merchant}</Text>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            {item.isRecurring && (
              <View style={styles.recurringBadge}>
                <Text style={styles.recurringText}>Recurring</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={styles.transactionAmount}>
            -{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionDate}>{dateLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={clarifiColors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {renderStats()}
            {renderTimeframeSelector()}
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <TouchableOpacity style={styles.filterButton}>
                <Filter size={18} color={clarifiColors.primary} />
              </TouchableOpacity>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={clarifiColors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: clarifiColors.appBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: clarifiColors.neutralSecondary,
  },
  header: {
    paddingBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: clarifiColors.surface,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: clarifiColors.surface + 'CC',
    marginTop: 2,
  },
  exportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  statsContainer: {
    padding: spacing.lg,
  },
  mainStatsCard: {
    backgroundColor: clarifiColors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: clarifiColors.border,
    marginHorizontal: spacing.md,
  },
  statLabel: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: clarifiColors.primaryText,
  },
  primaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  budgetSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: clarifiColors.border,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  budgetLabel: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
  },
  budgetAmount: {
    fontSize: 14,
    color: clarifiColors.primaryText,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: clarifiColors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatus: {
    fontSize: 12,
    color: clarifiColors.neutralSecondary,
    marginTop: spacing.xs,
  },
  overBudget: {
    color: clarifiColors.error,
    fontWeight: '500',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: clarifiColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: clarifiColors.primaryText,
    marginVertical: spacing.xs,
  },
  quickStatLabel: {
    fontSize: 12,
    color: clarifiColors.neutralSecondary,
  },
  topMerchantsCard: {
    backgroundColor: clarifiColors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: clarifiColors.primaryText,
    marginBottom: spacing.md,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: clarifiColors.border,
  },
  merchantRank: {
    width: 24,
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
    fontWeight: '500',
  },
  merchantName: {
    flex: 1,
    fontSize: 14,
    color: clarifiColors.primaryText,
    marginLeft: spacing.sm,
  },
  merchantCount: {
    fontSize: 12,
    color: clarifiColors.neutralSecondary,
    marginRight: spacing.md,
  },
  merchantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: clarifiColors.primaryText,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: clarifiColors.surface,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: clarifiColors.border,
  },
  timeframeButtonActive: {
    backgroundColor: clarifiColors.primary,
    borderColor: clarifiColors.primary,
  },
  timeframeText: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: clarifiColors.surface,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: clarifiColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: clarifiColors.border,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: clarifiColors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  merchantInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: clarifiColors.primaryText,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '500',
    color: clarifiColors.primaryText,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: clarifiColors.neutralSecondary,
  },
  recurringBadge: {
    backgroundColor: clarifiColors.wisdom + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  recurringText: {
    fontSize: 11,
    color: clarifiColors.wisdom,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: clarifiColors.primaryText,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: clarifiColors.neutralSecondary,
  },
});