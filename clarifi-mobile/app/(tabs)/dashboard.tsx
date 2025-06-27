import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

// Import modular components
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { MonthSelector } from '../../components/dashboard/MonthSelector';
import { SummaryCards } from '../../components/dashboard/SummaryCards';
import { SpendingChart } from '../../components/dashboard/SpendingChart';
import { CategoryBreakdownList } from '../../components/dashboard/CategoryBreakdownList';
import { InsightsSection } from '../../components/dashboard/InsightsSection';

// Import new UI components
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ToggleGroup } from '../../components/ui/ToggleGroup';
import { Button } from '../../components/ui/Button';
import { IconWithBackground } from '../../components/ui/IconWithBackground';
import { Progress } from '../../components/ui/Progress';

interface DashboardData {
  userFirstName: string;
  currentMonth: {
    name: string;
    income: number;
    expenses: number;
    savings: number;
    savingsPercent: number;
  };
  trends: {
    income: { change: number; isPositive: boolean };
    expenses: { change: number; isPositive: boolean };
    savings: { change: number; isPositive: boolean };
  };
  spendingByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
    budget?: number;
    icon: any;
    transactions: number;
  }>;
  dailySpending: Array<{
    day: number;
    amount: number;
  }>;
}

interface PeriodData {
  labels: string[];
  values: number[];
  income: number;
  incomeChange: string;
  expenses: number;
  expenseChange: string;
  period: string;
}

const periodData: Record<string, PeriodData> = {
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [120, 210, 270, 150, 330, 240, 90],
    income: 1540,
    incomeChange: '+8.3%',
    expenses: 1410,
    expenseChange: '+5.2%',
    period: 'This Week',
  },
  month: {
    labels: ['1', '5', '10', '15', '20', '25', '30'],
    values: [240, 420, 540, 300, 660, 480, 180],
    income: 4200,
    incomeChange: '+12.6%',
    expenses: 2875,
    expenseChange: '+3.1%',
    period: 'November 2024',
  },
  year: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [1500, 1800, 2200, 1900, 2500, 2300, 2100, 2400, 2000, 2300, 2600, 2100],
    income: 31240,
    incomeChange: '+15.8%',
    expenses: 24680,
    expenseChange: '+7.4%',
    period: '2024',
  },
  all: {
    labels: ['2020', '2021', '2022', '2023', '2024'],
    values: [1800, 2200, 2700, 3200, 3500],
    income: 134000,
    incomeChange: '+22.4%',
    expenses: 98500,
    expenseChange: '+18.2%',
    period: 'All Time',
  },
};

// Mock category data matching the design
const mockCategories = [
  {
    id: '1',
    name: 'Housing',
    category: 'Housing',
    amount: 1200,
    percentage: 14,
    color: '#FF7A7A',
    transactions: 2,
    budget: 1200,
    trend: 'neutral' as const,
    trendPercentage: 0,
    icon: 'home',
  },
  {
    id: '2',
    name: 'Groceries',
    category: 'Groceries',
    amount: 850,
    percentage: 30,
    color: '#4ECDC4',
    transactions: 18,
    budget: 900,
    trend: 'up' as const,
    trendPercentage: 5.1,
    icon: 'storefront',
  },
  {
    id: '3',
    name: 'Shopping',
    category: 'Shopping',
    amount: 520,
    percentage: 18,
    color: '#8B5A3C',
    transactions: 12,
    budget: 600,
    trend: 'down' as const,
    trendPercentage: 2.3,
    icon: 'bag',
  },
  {
    id: '4',
    name: 'Dining Out',
    category: 'Dining Out',
    amount: 450,
    percentage: 16,
    color: '#F7B731',
    transactions: 8,
    budget: 500,
    trend: 'up' as const,
    trendPercentage: 8.2,
    icon: 'restaurant',
  },
  {
    id: '5',
    name: 'Transportation',
    category: 'Transportation',
    amount: 350,
    percentage: 12,
    color: '#5F27CD',
    transactions: 5,
    budget: 500,
    trend: 'down' as const,
    trendPercentage: 3.2,
    icon: 'car',
  },
  {
    id: '6',
    name: 'Utilities',
    category: 'Utilities',
    amount: 125,
    percentage: 4,
    color: '#00D2D3',
    transactions: 3,
    budget: 150,
    trend: 'neutral' as const,
    trendPercentage: 1.1,
    icon: 'flash',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  
  // State management
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation refs
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  // Mock data - in real app this would come from AsyncStorage/API
  const data = useMemo(() => ({
    userFirstName: 'Sarah',
    currentMonth: {
      name: currentMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }),
      income: 4250,
      expenses: 2845,
      savings: 1405,
      savingsPercent: ((1405) / 4250) * 100,
    },
  }), [currentMonth]);

  // Mock insights data matching the design
  const mockInsights = [
    {
      id: '1',
      type: 'warning' as const,
      priority: 'high' as const,
      title: 'Credit Card Payment',
      description: 'Your credit card payment is due in 3 days. Don\'t forget to pay to avoid fees.',
      actionText: 'Pay Now',
      onAction: () => console.log('Pay credit card'),
    },
    {
      id: '2',
      type: 'tip' as const,
      priority: 'medium' as const,
      title: 'Subscription Savings',
      description: 'You have 3 unused subscriptions that could save you $47/month if cancelled.',
      actionText: 'Review',
      onAction: () => console.log('Review subscriptions'),
    },
    {
      id: '3',
      type: 'achievement' as const,
      priority: 'low' as const,
      title: 'Savings Goal',
      description: 'Congratulations! You\'ve reached 75% of your monthly savings goal.',
      actionText: 'View Progress',
      onAction: () => console.log('View savings progress'),
    },
  ];

  // Mock spending chart data
  const spendingChartData = {
    categories: mockCategories.slice(0, 5).map(cat => ({
      name: cat.name,
      amount: cat.amount,
      color: cat.color,
    })),
    dailyTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1),
      amount: Math.floor(Math.random() * 200) + 50,
    })),
  };

  // Transform categories for CategoryBreakdownList
  const categoryListData = mockCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    amount: cat.amount,
    budget: cat.budget || cat.amount * 1.2,
    icon: cat.icon as keyof typeof Ionicons.glyphMap,
    color: cat.color,
    transactions: cat.transactions,
  }));

  // Initialize content fade animation
  useEffect(() => {
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Event handlers
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'year' | 'all') => {
    setSelectedPeriod(period);
    setSelectedDay(null);
  };

  const handleBarPress = (day: number, amount: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const handleCategoryPress = (category: any) => {
    // TODO: Navigate to category details
    console.log('Category pressed:', category.name);
  };


  const handleBudgetAdjust = (categoryId: string, newBudget: number) => {
    console.log('Budget adjusted:', categoryId, newBudget);
  };

  const handleSegmentPress = (category: string) => {
    console.log('Chart segment pressed:', category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };














  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Subframe-style Header */}
        <View style={styles.modernHeader}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>
                Good morning, {data.userFirstName}
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <Avatar
              size="large"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
            >
              {data.userFirstName.charAt(0)}
            </Avatar>
          </View>
        </View>

        <Animated.View style={{ opacity: contentFadeAnim }}>
          {/* Month Selector */}
          <MonthSelector
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />

          {/* Summary Cards */}
          <SummaryCards
            income={data.currentMonth.income}
            expenses={data.currentMonth.expenses}
            savings={data.currentMonth.savings}
            previousIncome={4070}
            previousExpenses={2930}
            previousSavings={1140}
            onCardPress={(cardId) => console.log('Card pressed:', cardId)}
          />

          {/* Spending Chart */}
          <SpendingChart
            data={spendingChartData}
            onSegmentPress={handleSegmentPress}
          />

          {/* Category Breakdown List */}
          <CategoryBreakdownList
            categories={categoryListData}
            onCategoryPress={handleCategoryPress}
            onBudgetAdjust={handleBudgetAdjust}
          />

          {/* Insights Section */}
          <InsightsSection insights={mockInsights} />

          {/* Bottom Navigation Links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity style={styles.bottomLink}>
              <Text style={styles.bottomLinkText}>View Detailed Analytics</Text>
              <Ionicons name="chevron-forward" size={16} color="#2B5CE6" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomLink}>
              <Text style={styles.bottomLinkText}>View All Transactions</Text>
              <Ionicons name="chevron-forward" size={16} color="#2B5CE6" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    padding: 6,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    overflow: 'hidden',
  },
  periodButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  overviewCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  periodLabel: {
    fontSize: 12,
    color: '#6B5DD3',
    fontWeight: '500',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 12,
    backgroundColor: '#6B5DD3',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryCard: {
    width: 160,
    height: 160,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  seeAllText: {
    fontSize: 12,
    color: '#6B5DD3',
    fontWeight: '500',
  },
  breakdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieChartContainer: {
    position: 'relative',
    marginRight: 20,
  },
  pieChart: {
    transform: [{ rotate: '0deg' }],
  },
  pieChartCenter: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartCenterLabel: {
    fontSize: 12,
  },
  pieChartCenterValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 8,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    flex: 1,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 60,
  },
  topSpendingSection: {
    marginHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 12,
    color: '#6B5DD3',
    fontWeight: '500',
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryTransactions: {
    fontSize: 12,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
  },
  // New styles for enhanced design system
  insightsSection: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  summaryCardsScroll: {
    marginBottom: 24,
  },
  summaryCardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00C896',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2B5CE6',
  },
  savingsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B5DD3',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniBreakdown: {
    marginTop: 8,
    gap: 4,
  },
  miniCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  miniCategoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  savingsPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Month selector styles
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 92, 230, 0.1)',
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentMonthIndicator: {
    marginTop: 4,
  },
  currentMonthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Enhanced bar chart styles
  todayBar: {
    backgroundColor: '#2B5CE6',
    shadowColor: '#2B5CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedBar: {
    transform: [{ scaleX: 1.2 }],
    backgroundColor: '#6B5DD3',
  },
  todayIndicator: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -4,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B5CE6',
  },
  todayLabel: {
    fontWeight: '700',
    color: '#2B5CE6',
  },
  valueTooltip: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -25,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Budget warning styles
  warningIndicator: {
    marginLeft: 6,
  },
  warningIcon: {
    fontSize: 12,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  budgetText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  // Enhanced loading skeleton styles
  loadingContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skeletonMonthSelector: {
    height: 60,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginBottom: 24,
  },
  skeletonCardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  skeletonCard: {
    width: 160,
    height: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  skeletonChart: {
    height: 280,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  skeletonChartHeader: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 20,
    width: '60%',
  },
  skeletonChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  skeletonBar: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonCategories: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 20,
  },
  skeletonCategoryItem: {
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
  },
  // Insight cards styles
  insightCardsContainer: {
    marginTop: 8,
    gap: 12,
  },
  insightCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '300',
  },
  insightAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  insightActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Chart period selector styles
  chartPeriodSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  chartPeriodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPeriodButtonActive: {
    overflow: 'hidden',
  },
  chartPeriodButtonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPeriodButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  periodSelectorContainer: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  yAxisContainer: {
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLinks: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1F36',
  },
  // Modern Subframe-style header
  modernHeader: {
    backgroundColor: colors.appBackground,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
});