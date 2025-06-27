import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { CreditUtilizationScheduler } from './scheduler';
import { EnhancedScheduler } from './enhancedScheduler';
import { QuietHoursService } from './quietHours';
import { NotificationInteractionTracker } from './notificationInteractionTracker';
import { CardNotificationPreferencesService } from './cardNotificationPreferences';
import {
  CreditCard,
  CardNotificationPreferences,
} from '../../types/creditCard';

interface TestNotificationScenario {
  id: string;
  name: string;
  description: string;
  type: 'utilization' | 'payment' | 'achievement' | 'optimization' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  testQuietHours?: boolean;
  expectedBehavior: string;
}

interface TestExecutionResult {
  scenarioId: string;
  executedAt: Date;
  success: boolean;
  deliveryTime?: number;
  notificationId?: string;
  error?: string;
  quietHoursActive: boolean;
  shouldHaveBeenBlocked: boolean;
  actuallyDelivered: boolean;
}

interface NotificationMetrics {
  totalTests: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  quietHoursTests: number;
  quietHoursBlocked: number;
  priorityOverrides: number;
  lastTestDate: Date;
}

export class NotificationTestService {
  private static instance: NotificationTestService;
  private testScenarios: TestNotificationScenario[] = [];
  private testResults: TestExecutionResult[] = [];
  private metrics: NotificationMetrics = {
    totalTests: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageDeliveryTime: 0,
    quietHoursTests: 0,
    quietHoursBlocked: 0,
    priorityOverrides: 0,
    lastTestDate: new Date(),
  };

  private constructor() {
    this.initializeTestScenarios();
    this.loadMetrics();
  }

  public static getInstance(): NotificationTestService {
    if (!NotificationTestService.instance) {
      NotificationTestService.instance = new NotificationTestService();
    }
    return NotificationTestService.instance;
  }

  private initializeTestScenarios(): void {
    this.testScenarios = [
      // Utilization Alerts
      {
        id: 'util_70_warning',
        name: '70% Utilization Warning',
        description: 'Test standard utilization warning at 70% threshold',
        type: 'utilization',
        priority: 'medium',
        expectedBehavior: 'Should deliver unless in quiet hours',
      },
      {
        id: 'util_85_high',
        name: '85% High Utilization Alert',
        description: 'Test high utilization alert at 85% threshold',
        type: 'utilization',
        priority: 'high',
        expectedBehavior:
          'Should deliver even during quiet hours if override enabled',
      },
      {
        id: 'util_95_critical',
        name: '95% Critical Utilization Alert',
        description: 'Test critical utilization alert at 95% threshold',
        type: 'utilization',
        priority: 'critical',
        expectedBehavior: 'Should always deliver, override quiet hours',
      },

      // Payment Reminders
      {
        id: 'payment_7day',
        name: '7-Day Payment Reminder',
        description: 'Test payment reminder 7 days before due date',
        type: 'payment',
        priority: 'medium',
        expectedBehavior: 'Should deliver unless in quiet hours',
      },
      {
        id: 'payment_1day',
        name: '1-Day Payment Reminder',
        description: 'Test payment reminder 1 day before due date',
        type: 'payment',
        priority: 'high',
        expectedBehavior:
          'Should deliver even during quiet hours if override enabled',
      },
      {
        id: 'payment_overdue',
        name: 'Overdue Payment Alert',
        description: 'Test overdue payment critical alert',
        type: 'payment',
        priority: 'critical',
        expectedBehavior: 'Should always deliver, override quiet hours',
      },

      // Quiet Hours Testing
      {
        id: 'quiet_hours_test',
        name: 'Quiet Hours Compliance Test',
        description: 'Test notification behavior during quiet hours',
        type: 'system',
        priority: 'low',
        testQuietHours: true,
        expectedBehavior: 'Should be blocked during quiet hours',
      },
      {
        id: 'quiet_hours_override',
        name: 'Quiet Hours Override Test',
        description: 'Test critical notification during quiet hours',
        type: 'system',
        priority: 'critical',
        testQuietHours: true,
        expectedBehavior: 'Should override quiet hours',
      },

      // Achievement & Optimization
      {
        id: 'achievement_milestone',
        name: 'Achievement Milestone',
        description: 'Test achievement notification delivery',
        type: 'achievement',
        priority: 'low',
        expectedBehavior: 'Should deliver unless in quiet hours',
      },
      {
        id: 'optimization_tip',
        name: 'Optimization Tip',
        description: 'Test optimization tip notification',
        type: 'optimization',
        priority: 'low',
        expectedBehavior: 'Should deliver unless in quiet hours',
      },
    ];
  }

  public async executeTestScenario(
    scenarioId: string,
    cardId?: string
  ): Promise<TestExecutionResult> {
    const scenario = this.testScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Test scenario not found: ${scenarioId}`);
    }

    const startTime = Date.now();
    const quietHoursService = QuietHoursService.getInstance();
    const isQuietHours = await quietHoursService.isQuietHours();
    const shouldBeBlocked = isQuietHours && scenario.priority !== 'critical';

    try {
      const result: TestExecutionResult = {
        scenarioId,
        executedAt: new Date(),
        success: false,
        quietHoursActive: isQuietHours,
        shouldHaveBeenBlocked: shouldBeBlocked,
        actuallyDelivered: false,
      };

      // Create test notification content
      const notificationContent = this.generateTestNotificationContent(
        scenario,
        cardId
      );

      // Schedule the test notification
      const notificationRequest: Notifications.NotificationRequestInput = {
        content: notificationContent,
        trigger: { seconds: 1 }, // Immediate delivery
      };

      // Execute based on scenario type
      let notificationId: string;

      if (scenario.testQuietHours && shouldBeBlocked) {
        // Test if notification is properly blocked
        const enhancedScheduler = EnhancedScheduler.getInstance();
        const shouldSend = await enhancedScheduler.shouldSendNotification(
          'test',
          scenario.priority as any
        );

        if (!shouldSend) {
          // Correctly blocked
          result.success = true;
          result.actuallyDelivered = false;
          result.deliveryTime = Date.now() - startTime;
        } else {
          // Should have been blocked but wasn't
          result.success = false;
          result.actuallyDelivered = true;
          result.error =
            'Notification should have been blocked during quiet hours';
        }
      } else {
        // Normal notification delivery test
        notificationId =
          await Notifications.scheduleNotificationAsync(notificationRequest);
        result.notificationId = notificationId;
        result.success = true;
        result.actuallyDelivered = true;
        result.deliveryTime = Date.now() - startTime;
      }

      // Track the test execution
      this.recordTestResult(result);
      this.updateMetrics(result);

      return result;
    } catch (error) {
      const result: TestExecutionResult = {
        scenarioId,
        executedAt: new Date(),
        success: false,
        quietHoursActive: isQuietHours,
        shouldHaveBeenBlocked: shouldBeBlocked,
        actuallyDelivered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryTime: Date.now() - startTime,
      };

      this.recordTestResult(result);
      this.updateMetrics(result);
      return result;
    }
  }

  public async runAutomatedTestSuite(
    cardId?: string
  ): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = [];

    console.log('🧪 Starting automated notification test suite...');

    for (const scenario of this.testScenarios) {
      try {
        console.log(`🔬 Testing: ${scenario.name}`);
        const result = await this.executeTestScenario(scenario.id, cardId);
        results.push(result);

        // Wait between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Test failed for ${scenario.name}:`, error);
        results.push({
          scenarioId: scenario.id,
          executedAt: new Date(),
          success: false,
          quietHoursActive: false,
          shouldHaveBeenBlocked: false,
          actuallyDelivered: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('✅ Automated test suite completed');
    return results;
  }

  public async createTestCreditCard(): Promise<CreditCard> {
    const testCard: CreditCard = {
      id: `test_card_${Date.now()}`,
      name: 'Test Credit Card',
      lastFourDigits: '1234',
      currentBalance: 3500,
      creditLimit: 5000,
      paymentDueDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // 7 days from now
      minimumPayment: 150,
      interestRate: 19.99,
      cardType: 'Visa',
      issuer: 'Test Bank',
      color: '#007AFF',
    };

    return testCard;
  }

  public async simulateUtilizationBreach(
    cardId: string,
    targetUtilization: number,
    creditLimit: number = 5000
  ): Promise<void> {
    const currentBalance = (targetUtilization / 100) * creditLimit;

    // Create a mock card with the target utilization
    const mockCard: CreditCard = {
      id: cardId,
      name: 'Test Card',
      lastFourDigits: '1234',
      currentBalance,
      creditLimit,
      paymentDueDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      minimumPayment: 150,
      interestRate: 19.99,
      cardType: 'Visa',
      issuer: 'Test Bank',
      color: '#007AFF',
    };

    // Trigger utilization check
    const scheduler = CreditUtilizationScheduler.getInstance();
    await scheduler.checkUtilizationAndSchedule(mockCard);
  }

  private generateTestNotificationContent(
    scenario: TestNotificationScenario,
    cardId?: string
  ): Notifications.NotificationContentInput {
    const cardName = cardId ? `Card ${cardId.slice(-4)}` : 'Test Card';

    const contentMap: Record<string, Notifications.NotificationContentInput> = {
      util_70_warning: {
        title: '⚠️ Credit Utilization Alert',
        body: `${cardName} is at 70% utilization. Consider making a payment to improve your credit score.`,
        data: {
          type: 'utilization',
          cardId,
          utilization: 70,
          priority: 'medium',
          testScenario: scenario.id,
        },
      },
      util_85_high: {
        title: '🚨 High Credit Utilization',
        body: `${cardName} is at 85% utilization. This may negatively impact your credit score.`,
        data: {
          type: 'utilization',
          cardId,
          utilization: 85,
          priority: 'high',
          testScenario: scenario.id,
        },
      },
      util_95_critical: {
        title: '🔴 Critical: Near Credit Limit',
        body: `${cardName} is at 95% utilization! Make a payment immediately to avoid over-limit fees.`,
        data: {
          type: 'utilization',
          cardId,
          utilization: 95,
          priority: 'critical',
          testScenario: scenario.id,
        },
      },
      payment_7day: {
        title: '📅 Payment Reminder',
        body: `${cardName} payment is due in 7 days. Minimum payment: $150`,
        data: {
          type: 'payment',
          cardId,
          daysUntilDue: 7,
          priority: 'medium',
          testScenario: scenario.id,
        },
      },
      payment_1day: {
        title: '⏰ Payment Due Tomorrow',
        body: `${cardName} payment is due tomorrow! Don't forget to pay $150 minimum.`,
        data: {
          type: 'payment',
          cardId,
          daysUntilDue: 1,
          priority: 'high',
          testScenario: scenario.id,
        },
      },
      payment_overdue: {
        title: '🚨 OVERDUE: Payment Required',
        body: `${cardName} payment is overdue! Pay now to avoid late fees and credit damage.`,
        data: {
          type: 'payment',
          cardId,
          daysOverdue: 1,
          priority: 'critical',
          testScenario: scenario.id,
        },
      },
      quiet_hours_test: {
        title: '🌙 Quiet Hours Test',
        body: 'This is a test notification during quiet hours. Should be blocked.',
        data: {
          type: 'system',
          testScenario: scenario.id,
        },
      },
      quiet_hours_override: {
        title: '🚨 Critical Override Test',
        body: 'This critical notification should override quiet hours.',
        data: {
          type: 'system',
          priority: 'critical',
          testScenario: scenario.id,
        },
      },
      achievement_milestone: {
        title: '🏆 Achievement Unlocked!',
        body: "Congratulations! You've maintained low utilization for 3 months.",
        data: {
          type: 'achievement',
          testScenario: scenario.id,
        },
      },
      optimization_tip: {
        title: '💡 Optimization Tip',
        body: 'Consider spreading balances across cards to optimize your credit utilization ratio.',
        data: {
          type: 'optimization',
          testScenario: scenario.id,
        },
      },
    };

    return (
      contentMap[scenario.id] || {
        title: '🧪 Test Notification',
        body: `Test notification for scenario: ${scenario.name}`,
        data: { testScenario: scenario.id },
      }
    );
  }

  private recordTestResult(result: TestExecutionResult): void {
    this.testResults.push(result);

    // Keep only last 100 test results
    if (this.testResults.length > 100) {
      this.testResults = this.testResults.slice(-100);
    }

    this.saveTestResults();
  }

  private updateMetrics(result: TestExecutionResult): void {
    this.metrics.totalTests++;

    if (result.success) {
      this.metrics.successfulDeliveries++;
    } else {
      this.metrics.failedDeliveries++;
    }

    if (result.deliveryTime) {
      const totalTime =
        this.metrics.averageDeliveryTime * (this.metrics.totalTests - 1) +
        result.deliveryTime;
      this.metrics.averageDeliveryTime = totalTime / this.metrics.totalTests;
    }

    if (result.quietHoursActive) {
      this.metrics.quietHoursTests++;
      if (result.shouldHaveBeenBlocked && !result.actuallyDelivered) {
        this.metrics.quietHoursBlocked++;
      }
    }

    if (result.quietHoursActive && result.actuallyDelivered) {
      this.metrics.priorityOverrides++;
    }

    this.metrics.lastTestDate = result.executedAt;
    this.saveMetrics();
  }

  public getTestScenarios(): TestNotificationScenario[] {
    return [...this.testScenarios];
  }

  public getTestResults(): TestExecutionResult[] {
    return [...this.testResults];
  }

  public getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }

  public async clearTestData(): Promise<void> {
    this.testResults = [];
    this.metrics = {
      totalTests: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      quietHoursTests: 0,
      quietHoursBlocked: 0,
      priorityOverrides: 0,
      lastTestDate: new Date(),
    };

    await this.saveTestResults();
    await this.saveMetrics();
  }

  private async saveTestResults(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notification_test_results',
        JSON.stringify(this.testResults)
      );
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notification_test_metrics',
        JSON.stringify(this.metrics)
      );
    } catch (error) {
      console.error('Failed to save test metrics:', error);
    }
  }

  private async loadTestResults(): Promise<void> {
    try {
      const resultsJson = await AsyncStorage.getItem(
        'notification_test_results'
      );
      if (resultsJson) {
        this.testResults = JSON.parse(resultsJson);
      }
    } catch (error) {
      console.error('Failed to load test results:', error);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metricsJson = await AsyncStorage.getItem(
        'notification_test_metrics'
      );
      if (metricsJson) {
        this.metrics = JSON.parse(metricsJson);
      }
    } catch (error) {
      console.error('Failed to load test metrics:', error);
    }
  }
}
