import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DashboardService, DashboardData } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get comprehensive dashboard data',
    description: 'Returns financial summary, spending by category, recent transactions, budget comparisons, and insights'
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['current_month', 'last_month', 'last_30_days'],
    description: 'Time period for the dashboard data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            income: { type: 'number' },
            expenses: { type: 'number' },
            savings: { type: 'number' },
            budget: { type: 'number' },
            period: { type: 'string' }
          }
        },
        spendingByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              categoryName: { type: 'string' },
              amount: { type: 'number' },
              percentage: { type: 'number' },
              transactionCount: { type: 'number' },
              trend: { type: 'string', enum: ['up', 'down', 'stable'] }
            }
          }
        },
        recentTransactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              date: { type: 'string' },
              description: { type: 'string' },
              amount: { type: 'number' },
              categoryName: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @Request() req: any,
    @Query('period') period?: 'current_month' | 'last_month' | 'last_30_days'
  ): Promise<DashboardData> {
    const userId = req.user.id;
    return this.dashboardService.getDashboardData(userId, period || 'current_month');
  }

  @Get('transactions/category/:categoryId')
  @ApiOperation({ 
    summary: 'Get transactions by category',
    description: 'Returns all transactions for a specific category within the specified period'
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['current_month', 'last_month', 'last_30_days']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Category transactions successfully retrieved'
  })
  async getTransactionsByCategory(
    @Request() req: any,
    @Param('categoryId') categoryId: string,
    @Query('period') period?: 'current_month' | 'last_month' | 'last_30_days'
  ) {
    const userId = req.user.id;
    return this.dashboardService.getTransactionsByCategory(userId, categoryId, period || 'current_month');
  }

  @Get('trends')
  @ApiOperation({ 
    summary: 'Get spending trends over time',
    description: 'Returns spending trends and category breakdowns for the specified number of months'
  })
  @ApiQuery({ 
    name: 'months', 
    required: false, 
    type: 'number',
    description: 'Number of months to include in trends (default: 6)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Spending trends successfully retrieved'
  })
  async getSpendingTrends(
    @Request() req: any,
    @Query('months') months?: string
  ) {
    const userId = req.user.id;
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.dashboardService.getSpendingTrends(userId, monthsNum);
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'Get financial summary only',
    description: 'Returns just the financial summary (income, expenses, savings, budget) for quick updates'
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['current_month', 'last_month', 'last_30_days']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial summary successfully retrieved'
  })
  async getFinancialSummary(
    @Request() req: any,
    @Query('period') period?: 'current_month' | 'last_month' | 'last_30_days'
  ) {
    const userId = req.user.id;
    const dashboardData = await this.dashboardService.getDashboardData(userId, period || 'current_month');
    return {
      summary: dashboardData.summary,
      lastUpdated: dashboardData.lastUpdated
    };
  }

  @Get('insights')
  @ApiOperation({ 
    summary: 'Get financial insights only',
    description: 'Returns just the AI-generated financial insights and recommendations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial insights successfully retrieved'
  })
  async getInsights(@Request() req: any) {
    const userId = req.user.id;
    const dashboardData = await this.dashboardService.getDashboardData(userId, 'current_month');
    return {
      insights: dashboardData.insights,
      lastUpdated: dashboardData.lastUpdated
    };
  }
}