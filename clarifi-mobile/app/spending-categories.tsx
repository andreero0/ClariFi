import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Music,
  Heart
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface SpendingCategory {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: any;
  transactions: number;
  avgPerTransaction: number;
  trend: {
    change: number;
    isPositive: boolean;
  };
  lastTransaction: string;
  budget?: number;
}

// Mock data - in real app this would come from API
const mockSpendingData: SpendingCategory[] = [
  {
    id: '1',
    name: 'Food & Dining',
    amount: 845,
    percentage: 32.4,
    color: '#FF6B6B',
    icon: Utensils,
    transactions: 28,
    avgPerTransaction: 30.18,
    trend: { change: 12.5, isPositive: false },
    lastTransaction: '2 hours ago',
    budget: 800
  },
  {
    id: '2',
    name: 'Transportation',
    amount: 420,
    percentage: 16.1,
    color: '#4ECDC4',
    icon: Car,
    transactions: 15,
    avgPerTransaction: 28.00,
    trend: { change: 8.2, isPositive: true },
    lastTransaction: '1 day ago',
    budget: 500
  },
  {
    id: '3',
    name: 'Shopping',
    amount: 380,
    percentage: 14.6,
    color: '#45B7D1',
    icon: ShoppingBag,
    transactions: 22,
    avgPerTransaction: 17.27,
    trend: { change: 5.1, isPositive: false },
    lastTransaction: '3 hours ago',
    budget: 400
  },
  {
    id: '4',
    name: 'Utilities',
    amount: 285,
    percentage: 10.9,
    color: '#96CEB4',
    icon: Home,
    transactions: 8,
    avgPerTransaction: 35.63,
    trend: { change: 2.3, isPositive: true },
    lastTransaction: '1 week ago',
    budget: 300
  },
  {
    id: '5',
    name: 'Entertainment',
    amount: 220,
    percentage: 8.4,
    color: '#FECA57',
    icon: Music,
    transactions: 12,
    avgPerTransaction: 18.33,
    trend: { change: 15.8, isPositive: false },
    lastTransaction: '2 days ago',
    budget: 250
  },
  {
    id: '6',
    name: 'Healthcare',
    amount: 165,
    percentage: 6.3,
    color: '#A8E6CF',
    icon: Heart,
    transactions: 6,
    avgPerTransaction: 27.50,
    trend: { change: 3.2, isPositive: true },
    lastTransaction: '5 days ago',
    budget: 200
  }
];

type SortOption = 'amount' | 'percentage' | 'transactions' | 'name';
type FilterOption = 'all' | 'overBudget' | 'trending';

export default function SpendingCategoriesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [data, setData] = useState(mockSpendingData);
  const [showFilters, setShowFilters] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let filteredData = [...mockSpendingData];

    // Apply search filter
    if (searchText) {
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'overBudget':
        filteredData = filteredData.filter(item => 
          item.budget && item.amount > item.budget
        );
        break;
      case 'trending':
        filteredData = filteredData.filter(item => 
          Math.abs(item.trend.change) > 10
        );
        break;
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'transactions':
          aValue = a.transactions;
          bValue = b.transactions;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.amount;
          bValue = b.amount;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setData(filteredData);
  }, [searchText, sortBy, sortOrder, filterBy]);

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  };

  const renderCategoryItem = ({ item, index }: { item: SpendingCategory; index: number }) => {
    const IconComponent = item.icon;
    const isOverBudget = item.budget && item.amount > item.budget;
    const budgetPercentage = item.budget ? (item.amount / item.budget) * 100 : 0;

    return (
      <Animated.View
        style={[
          styles.categoryItem,
          { backgroundColor: theme.surface },
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.categoryContent}
          onPress={() => router.push(`/category/${item.name.toLowerCase().replace(/\s+/g, '-')}`)}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
              <IconComponent size={24} color={item.color} />
            </View>
            <View style={styles.categoryInfo}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
                  {item.name}
                </Text>
                {isOverBudget && (
                  <View style={[styles.overBudgetBadge, { backgroundColor: colors.errorRed + '20' }]}>
                    <Text style={[styles.overBudgetText, { color: colors.errorRed }]}>
                      Over Budget
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.categoryStats}>
                <Text style={[styles.categorySubtext, { color: theme.textSecondary }]}>
                  {item.transactions} transactions • Avg ${item.avgPerTransaction.toFixed(2)}
                </Text>
                <Text style={[styles.lastTransaction, { color: theme.textSecondary }]}>
                  Last: {item.lastTransaction}
                </Text>
              </View>
              {item.budget && (
                <View style={styles.budgetProgress}>
                  <View style={[styles.progressBar, { backgroundColor: colors.borderColor }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: isOverBudget ? colors.errorRed : item.color,
                          width: `${Math.min(budgetPercentage, 100)}%`
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>
                    ${item.amount} / ${item.budget} ({budgetPercentage.toFixed(0)}%)
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.categoryRight}>
            <Text style={[styles.categoryAmount, { color: theme.textPrimary }]}>
              ${item.amount.toLocaleString()}
            </Text>
            <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
              {item.percentage.toFixed(1)}%
            </Text>
            <View style={styles.trendContainer}>
              {item.trend.isPositive ? (
                <TrendingDown size={14} color={colors.errorRed} />
              ) : (
                <TrendingUp size={14} color={colors.growthGreen} />
              )}
              <Text style={[
                styles.trendText, 
                { color: item.trend.isPositive ? colors.errorRed : colors.growthGreen }
              ]}>
                {item.trend.change.toFixed(1)}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFilterChip = (label: string, value: FilterOption, isActive: boolean) => (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={() => setFilterBy(value)}
    >
      {isActive ? (
        <LinearGradient
          colors={[colors.clarityBlue, colors.skyTrust]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.filterChipGradient}
        >
          <Text style={[styles.filterChipText, { color: colors.pureWhite }]}>
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.filterChipText, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.clarityBlue} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Spending Categories</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={24} color={showFilters ? colors.clarityBlue : theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search categories..."
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <Animated.View style={[styles.filtersContainer, { opacity: fadeAnim }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: theme.textPrimary }]}>Filter by:</Text>
            <View style={styles.filterChips}>
              {renderFilterChip('All', 'all', filterBy === 'all')}
              {renderFilterChip('Over Budget', 'overBudget', filterBy === 'overBudget')}
              {renderFilterChip('Trending', 'trending', filterBy === 'trending')}
            </View>
          </View>
          
          <View style={styles.sortRow}>
            <Text style={[styles.filterLabel, { color: theme.textPrimary }]}>Sort by:</Text>
            <View style={styles.sortButtons}>
              {(['amount', 'percentage', 'transactions', 'name'] as SortOption[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
                  onPress={() => toggleSort(option)}
                >
                  <Text style={[
                    styles.sortButtonText, 
                    { color: sortBy === option ? colors.clarityBlue : theme.textSecondary }
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                  {sortBy === option && (
                    <ArrowUpDown size={14} color={colors.clarityBlue} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {data.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Categories
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            ${data.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Total Spent
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {data.reduce((sum, item) => sum + item.transactions, 0)}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Transactions
          </Text>
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={data}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No categories found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  filterRow: {
    gap: 8,
  },
  sortRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  filterChipActive: {},
  filterChipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: colors.clarityBlue + '10',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  categoryItem: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  overBudgetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overBudgetText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryStats: {
    marginBottom: 8,
    gap: 2,
  },
  categorySubtext: {
    fontSize: 12,
  },
  lastTransaction: {
    fontSize: 11,
  },
  budgetProgress: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
  },
});