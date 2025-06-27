import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { dashboardService } from '../services/dashboard/dashboardService';

interface DashboardSummary {
  income: number;
  expenses: number;
  savings: number;
  budget: number;
}

interface SpendingData {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  budget?: number;
  color: string;
  icon: string;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  priority: 'high' | 'medium' | 'low';
  category?: string;
  amount?: number;
}

interface DashboardData {
  summary: DashboardSummary;
  spendingData: SpendingData[];
  categories: CategoryData[];
  insights: Insight[];
  lastUpdated: Date;
}

const DASHBOARD_CACHE_KEY = 'dashboard_data';
const CACHE_EXPIRY_HOURS = 1;

export const useDashboardData = (selectedMonth: Date) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Mock data generator for development
  const generateMockData = useCallback((): DashboardData => {
    const income = 6500;
    const expenses = 4200;
    const savings = 1800;
    const budget = 5000;

    return {
      summary: {
        income,
        expenses,
        savings,
        budget,
      },
      spendingData: [
        {
          category: 'Groceries',
          amount: 850,
          color: '#007AFF',
          percentage: 20.2,
        },
        {
          category: 'Housing',
          amount: 1200,
          color: '#28a745',
          percentage: 28.6,
        },
        {
          category: 'Transportation',
          amount: 450,
          color: '#dc3545',
          percentage: 10.7,
        },
        {
          category: 'Entertainment',
          amount: 320,
          color: '#fd7e14',
          percentage: 7.6,
        },
        {
          category: 'Utilities',
          amount: 280,
          color: '#6f42c1',
          percentage: 6.7,
        },
        {
          category: 'Healthcare',
          amount: 180,
          color: '#20c997',
          percentage: 4.3,
        },
        { category: 'Other', amount: 920, color: '#6c757d', percentage: 21.9 },
      ],
      categories: [
        {
          id: '1',
          name: 'Housing',
          amount: 1200,
          budget: 1300,
          color: '#28a745',
          icon: '🏠',
          transactionCount: 3,
          trend: 'down',
          trendPercentage: 5.2,
        },
        {
          id: '2',
          name: 'Groceries',
          amount: 850,
          budget: 800,
          color: '#007AFF',
          icon: '🛒',
          transactionCount: 12,
          trend: 'up',
          trendPercentage: 8.5,
        },
        {
          id: '3',
          name: 'Transportation',
          amount: 450,
          budget: 500,
          color: '#dc3545',
          icon: '🚗',
          transactionCount: 8,
          trend: 'stable',
          trendPercentage: 1.2,
        },
        {
          id: '4',
          name: 'Entertainment',
          amount: 320,
          budget: 400,
          color: '#fd7e14',
          icon: '🎬',
          transactionCount: 6,
          trend: 'down',
          trendPercentage: 12.3,
        },
        {
          id: '5',
          name: 'Utilities',
          amount: 280,
          budget: 300,
          color: '#6f42c1',
          icon: '⚡',
          transactionCount: 4,
          trend: 'stable',
          trendPercentage: 2.1,
        },
      ],
      insights: [
        {
          id: '1',
          type: 'warning',
          title: 'Grocery Spending Above Budget',
          description:
            "You've spent $50 more than your grocery budget this month. Consider meal planning to reduce costs.",
          priority: 'high',
          category: 'Groceries',
          amount: 50,
          action: {
            label: 'View Grocery Transactions',
            onPress: () => console.log('Navigate to grocery transactions'),
          },
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Great Job on Housing Costs!',
          description:
            'You saved $100 on housing expenses compared to last month. Keep up the good work!',
          priority: 'medium',
          category: 'Housing',
          amount: 100,
        },
        {
          id: '3',
          type: 'tip',
          title: 'TFSA Contribution Room',
          description:
            'You have $4,500 remaining in TFSA contribution room for 2024. Consider maximizing your tax-free savings.',
          priority: 'medium',
          amount: 4500,
          action: {
            label: 'Learn About TFSA',
            onPress: () => console.log('Navigate to TFSA education'),
          },
        },
        {
          id: '4',
          type: 'recommendation',
          title: 'Set Up Emergency Fund',
          description:
            "Financial experts recommend having 3-6 months of expenses saved. You're currently at 1.2 months coverage.",
          priority: 'high',
          action: {
            label: 'Start Emergency Fund',
            onPress: () => console.log('Navigate to savings goals'),
          },
        },
      ],
      lastUpdated: new Date(),
    };
  }, []);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cachedData: any): boolean => {
    if (!cachedData || !cachedData.lastUpdated) return false;

    const lastUpdated = new Date(cachedData.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return hoursSinceUpdate < CACHE_EXPIRY_HOURS;
  }, []);

  // Load data from cache
  const loadCachedData =
    useCallback(async (): Promise<DashboardData | null> => {
      try {
        const cached = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cached) {
          const parsedData = JSON.parse(cached);
          if (isCacheValid(parsedData)) {
            return parsedData;
          }
        }
      } catch (error) {
        console.error('Failed to load cached dashboard data:', error);
      }
      return null;
    }, [isCacheValid]);

  // Save data to cache
  const saveToCache = useCallback(async (data: DashboardData) => {
    try {
      await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save dashboard data to cache:', error);
    }
  }, []);

  // Transform API data to hook interface format
  const transformApiDataToHookFormat = useCallback(
    (apiData: any): DashboardData => {
      // Transform spending by category to spending data
      const spendingData: SpendingData[] = apiData.spendingByCategory.map(
        (item: any) => ({
          category: item.categoryName,
          amount: item.amount,
          color: item.categoryColor || '#007AFF',
          percentage: item.percentage,
        })
      );

      // Transform spending by category to category data
      const categories: CategoryData[] = apiData.spendingByCategory.map(
        (item: any) => ({
          id: item.categoryId,
          name: item.categoryName,
          amount: item.amount,
          color: item.categoryColor || '#007AFF',
          icon: item.categoryIcon || '📊',
          transactionCount: item.transactionCount,
          trend: item.trend,
          trendPercentage: item.trendPercentage,
        })
      );

      // Transform insights
      const insights: Insight[] = apiData.insights.map((insight: any) => ({
        id: insight.id,
        type:
          insight.type === 'spending_alert'
            ? 'warning'
            : insight.type === 'budget_warning'
              ? 'warning'
              : insight.type === 'goal_progress'
                ? 'achievement'
                : insight.type === 'savings_opportunity'
                  ? 'tip'
                  : 'recommendation',
        title: insight.title,
        description: insight.description,
        priority:
          insight.severity === 'error'
            ? 'high'
            : insight.severity === 'warning'
              ? 'high'
              : 'medium',
        category: insight.metadata?.category || insight.metadata?.categoryName,
        amount: insight.metadata?.amount,
      }));

      return {
        summary: {
          income: apiData.summary.income,
          expenses: apiData.summary.expenses,
          savings: apiData.summary.savings,
          budget: apiData.summary.budget,
        },
        spendingData,
        categories,
        insights,
        lastUpdated: new Date(apiData.lastUpdated),
      };
    },
    []
  );

  // Fetch fresh data from real API
  const fetchFreshData = useCallback(async (): Promise<DashboardData> => {
    try {
      // Calculate period based on selectedMonth
      const now = new Date();
      const isCurrentMonth =
        selectedMonth.getFullYear() === now.getFullYear() &&
        selectedMonth.getMonth() === now.getMonth();
      const period = isCurrentMonth ? 'current_month' : 'last_month';

      const response = await dashboardService.getDashboardData(period);

      if (response.success && response.data) {
        return transformApiDataToHookFormat(response.data);
      } else {
        console.warn(
          'Dashboard API error, falling back to mock data:',
          response.error
        );
        return generateMockData();
      }
    } catch (error) {
      console.warn(
        'Dashboard API request failed, falling back to mock data:',
        error
      );
      return generateMockData();
    }
  }, [selectedMonth, transformApiDataToHookFormat, generateMockData]);

  // Main data loading function
  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        // Check network status
        const netInfo = await NetInfo.fetch();
        setIsOffline(!netInfo.isConnected);

        // Try to load from cache first
        if (!forceRefresh) {
          const cachedData = await loadCachedData();
          if (cachedData) {
            setDashboardData(cachedData);
            setLoading(false);
            return;
          }
        }

        // If online, fetch fresh data
        if (netInfo.isConnected) {
          const freshData = await fetchFreshData();
          setDashboardData(freshData);
          await saveToCache(freshData);
        } else {
          // If offline and no valid cache, use mock data
          const mockData = generateMockData();
          setDashboardData(mockData);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard data'
        );
        console.error('Dashboard data loading error:', err);

        // Fallback to mock data on error
        const mockData = generateMockData();
        setDashboardData(mockData);
      } finally {
        setLoading(false);
      }
    },
    [loadCachedData, fetchFreshData, generateMockData, saveToCache]
  );

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  }, []);

  // Load data when component mounts or selected month changes
  useEffect(() => {
    loadData();
  }, [selectedMonth, loadData]);

  return {
    dashboardData,
    loading,
    error,
    refreshData,
    isOffline,
  };
};
