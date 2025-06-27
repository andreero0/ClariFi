import { API_BASE_URL } from '../../constants/config';
import { supabase } from '../supabase/supabaseClient';

export interface FinancialSummary {
  income: number;
  expenses: number;
  savings: number;
  budget: number;
  period: 'current_month' | 'last_month' | 'last_30_days';
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  merchantName: string | null;
}

export interface BudgetComparison {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
  status: 'under' | 'over' | 'on_track';
  remainingAmount: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDate: string | null;
  status: string;
  description: string | null;
  iconName: string | null;
}

export interface DashboardInsight {
  id: string;
  type:
    | 'spending_alert'
    | 'budget_warning'
    | 'goal_progress'
    | 'savings_opportunity';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  actionable: boolean;
  metadata?: any;
}

export interface DashboardData {
  summary: FinancialSummary;
  spendingByCategory: SpendingByCategory[];
  recentTransactions: RecentTransaction[];
  budgetComparisons: BudgetComparison[];
  financialGoals: FinancialGoal[];
  insights: DashboardInsight[];
  lastUpdated: string;
}

export interface DashboardApiResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

class DashboardService {
  private baseUrl: string;

  constructor() {
    // Use the API_BASE_URL from config, fallback to localhost for development
    this.baseUrl =
      API_BASE_URL === 'http://your-api-base-url-here.com/api'
        ? 'http://localhost:3000'
        : API_BASE_URL.replace('/api', '');
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(
    period: 'current_month' | 'last_month' | 'last_30_days' = 'current_month'
  ): Promise<DashboardApiResponse> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(
        `${this.baseUrl}/dashboard?period=${period}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Dashboard API error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get financial summary only (lightweight request)
   */
  async getFinancialSummary(
    period: 'current_month' | 'last_month' | 'last_30_days' = 'current_month'
  ): Promise<{
    success: boolean;
    data?: { summary: FinancialSummary; lastUpdated: string };
    error?: string;
  }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(
        `${this.baseUrl}/dashboard/summary?period=${period}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Financial summary API error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(
    categoryId: string,
    period: 'current_month' | 'last_month' | 'last_30_days' = 'current_month'
  ): Promise<{ success: boolean; data?: RecentTransaction[]; error?: string }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(
        `${this.baseUrl}/dashboard/transactions/category/${categoryId}?period=${period}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Category transactions API error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get spending trends over time
   */
  async getSpendingTrends(months: number = 6): Promise<{
    success: boolean;
    data?: Array<{
      month: string;
      totalSpending: number;
      categoryBreakdown: SpendingByCategory[];
    }>;
    error?: string;
  }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(
        `${this.baseUrl}/dashboard/trends?months=${months}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Spending trends API error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get financial insights only
   */
  async getInsights(): Promise<{
    success: boolean;
    data?: { insights: DashboardInsight[]; lastUpdated: string };
    error?: string;
  }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(`${this.baseUrl}/dashboard/insights`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Insights API error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Check if user is authenticated and has access to dashboard
   */
  async checkAccess(): Promise<{ hasAccess: boolean; error?: string }> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { hasAccess: false, error: 'User not authenticated' };
      }

      // Quick health check
      const response = await fetch(`${this.baseUrl}/dashboard/summary`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      return { hasAccess: response.ok };
    } catch (error) {
      console.error('Dashboard access check error:', error);
      return { hasAccess: false, error: 'Unable to verify access' };
    }
  }
}

export const dashboardService = new DashboardService();
export default DashboardService;
