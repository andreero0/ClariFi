/**
 * Enhanced notification templates with Canadian financial context, actionable content,
 * and dynamic content insertion for ClariFi notifications.
 * Compliant with Canadian financial regulations and terminology.
 */

import {
  CreditCard,
  Insight,
  Achievement,
  UtilizationSettings,
} from '../storage/dataModels';
import {
  calculateUtilization,
  getNextStatementDate,
  daysUntilNextStatement,
} from '../../utils/calculations/utilization';

interface NotificationContent {
  title: string;
  body: string;
  data?: { [key: string]: any }; // For deep linking or additional context
}

interface CanadianNotificationContext {
  language: 'en' | 'fr';
  creditScoreRange: [number, number]; // Always [300, 900] for Canada
  currency: 'CAD';
  reportingAgencies: ('Equifax' | 'TransUnion')[];
  bankingTerminology: 'canadian';
}

interface ActionableRecommendation {
  action: string;
  urgency: 'immediate' | 'soon' | 'planned' | 'monitor';
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  benefit: string;
}

interface UtilizationContext {
  current: number;
  target: number;
  creditScore: number;
  statementDays: number;
  paymentDueDate: Date;
  recommendedPayment: number;
  optimization: ActionableRecommendation;
}

/**
 * Canadian financial context defaults
 */
const CANADIAN_CONTEXT: CanadianNotificationContext = {
  language: 'en',
  creditScoreRange: [300, 900],
  currency: 'CAD',
  reportingAgencies: ['Equifax', 'TransUnion'],
  bankingTerminology: 'canadian',
};

/**
 * Format Canadian dollar amounts
 */
function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate actionable recommendation based on utilization context
 */
function generateUtilizationRecommendation(
  context: UtilizationContext
): ActionableRecommendation {
  const { current, target, statementDays, recommendedPayment } = context;

  if (current >= 90) {
    return {
      action: `Make an immediate payment of ${formatCAD(recommendedPayment)} to bring utilization below 80%`,
      urgency: 'immediate',
      impact: 'high',
      timeframe: 'within 24 hours',
      benefit:
        'Prevent potential credit score damage and avoid reporting at 90%+ utilization',
    };
  } else if (current >= 70) {
    return {
      action: `Consider making a payment of ${formatCAD(recommendedPayment)} before your statement date`,
      urgency: 'soon',
      impact: 'high',
      timeframe: `within ${Math.min(statementDays, 7)} days`,
      benefit: 'Optimize credit score by maintaining utilization below 30%',
    };
  } else if (current >= 50) {
    return {
      action: `Plan a payment of ${formatCAD(recommendedPayment)} to optimize your credit profile`,
      urgency: 'planned',
      impact: 'medium',
      timeframe: `within ${statementDays} days`,
      benefit: 'Improve credit utilization ratio for better score reporting',
    };
  } else {
    return {
      action: 'Monitor your spending to maintain current low utilization',
      urgency: 'monitor',
      impact: 'low',
      timeframe: 'ongoing',
      benefit: 'Continue excellent credit management practices',
    };
  }
}

/**
 * Create utilization context from card data
 */
function createUtilizationContext(
  card: CreditCard,
  utilizationSettings: UtilizationSettings,
  estimatedCreditScore: number = 720
): UtilizationContext {
  const currentUtil = calculateUtilization(
    card.current_balance,
    card.credit_limit
  );
  const targetUtil = utilizationSettings.target_overall_utilization || 30;
  const statementDays = daysUntilNextStatement(card);
  const nextStatement = getNextStatementDate(card);
  const paymentDueDate = new Date(nextStatement);
  paymentDueDate.setDate(paymentDueDate.getDate() + card.payment_due_days);

  // Calculate recommended payment to reach target utilization
  const targetBalance = (card.credit_limit * targetUtil) / 100;
  const recommendedPayment = Math.max(0, card.current_balance - targetBalance);

  return {
    current: currentUtil,
    target: targetUtil,
    creditScore: estimatedCreditScore,
    statementDays,
    paymentDueDate,
    recommendedPayment,
    optimization: generateUtilizationRecommendation({
      current: currentUtil,
      target: targetUtil,
      creditScore: estimatedCreditScore,
      statementDays,
      paymentDueDate,
      recommendedPayment,
    } as UtilizationContext),
  };
}

// --- Enhanced Canadian Payment Reminders ---

export const canadianPaymentDueSoon = (
  card: CreditCard,
  daysUntilDue: number,
  currentBalance: number = card.current_balance
): NotificationContent => {
  const urgencyEmoji =
    daysUntilDue <= 2 ? '🚨' : daysUntilDue <= 5 ? '⚠️' : '💳';
  const urgencyText =
    daysUntilDue <= 2 ? 'URGENT' : daysUntilDue <= 5 ? 'Important' : '';

  return {
    title:
      `${urgencyEmoji} ${urgencyText} Payment Due: ${card.nickname}`.trim(),
    body: `Your ${card.bank_name} ${card.nickname} payment (****${card.last_four}) is due in ${daysUntilDue} days. Balance: ${formatCAD(currentBalance)}. Make your payment to maintain excellent credit standing with Equifax and TransUnion.`,
    data: {
      type: 'payment_due',
      cardId: card.id,
      screen: 'Cards',
      urgency: daysUntilDue <= 2 ? 'critical' : 'high',
      daysRemaining: daysUntilDue,
      action: 'make_payment',
    },
  };
};

export const canadianPaymentPastDue = (
  card: CreditCard,
  daysPastDue: number
): NotificationContent => ({
  title: `🚨 URGENT: Payment Past Due - ${card.nickname}`,
  body: `Your ${card.bank_name} payment is ${daysPastDue} days overdue. Late payments can significantly impact your Canadian credit score (300-900 range). Make your payment immediately to minimize credit report damage.`,
  data: {
    type: 'payment_past_due',
    cardId: card.id,
    screen: 'Cards',
    urgency: 'critical',
    daysPastDue,
    action: 'urgent_payment',
  },
});

// --- Enhanced Canadian Utilization Alerts ---

export const canadianUtilizationAlert = (
  card: CreditCard,
  utilizationSettings: UtilizationSettings,
  estimatedCreditScore?: number
): NotificationContent => {
  const context = createUtilizationContext(
    card,
    utilizationSettings,
    estimatedCreditScore
  );
  const { current, optimization } = context;

  const urgencyEmoji = current >= 90 ? '🚨' : current >= 80 ? '⚠️' : '📈';
  const levelText =
    current >= 90
      ? 'Critical'
      : current >= 80
        ? 'High'
        : current >= 70
          ? 'Elevated'
          : 'Moderate';

  return {
    title: `${urgencyEmoji} ${levelText} Utilization: ${card.nickname}`,
    body: `Your ${card.bank_name} utilization is ${current.toFixed(0)}% (${formatCAD(card.current_balance)}/${formatCAD(card.credit_limit)}). ${optimization.action}. Impact: ${optimization.benefit}`,
    data: {
      type: 'utilization_warning',
      cardId: card.id,
      screen: 'Cards',
      utilization: current,
      urgency: optimization.urgency,
      recommendedPayment: context.recommendedPayment,
      action: 'view_optimization',
      statementDays: context.statementDays,
    },
  };
};

export const canadianUtilizationOptimized = (
  card: CreditCard,
  newUtilization: number,
  previousUtilization: number
): NotificationContent => {
  const improvement = previousUtilization - newUtilization;
  return {
    title: `✅ Credit Optimized: ${card.nickname}`,
    body: `Excellent! Your ${card.bank_name} utilization improved from ${previousUtilization.toFixed(0)}% to ${newUtilization.toFixed(0)}% (${improvement.toFixed(0)}% improvement). This positive change will be reported to Equifax and TransUnion on your next statement cycle.`,
    data: {
      type: 'utilization_optimized',
      cardId: card.id,
      screen: 'Cards',
      previousUtilization,
      newUtilization,
      improvement,
      action: 'view_progress',
    },
  };
};

export const canadianCriticalUtilizationImmediate = (
  card: CreditCard,
  utilizationSettings: UtilizationSettings
): NotificationContent => {
  const context = createUtilizationContext(card, utilizationSettings);
  const urgentPayment = context.recommendedPayment * 0.5; // Minimum to get below 80%

  return {
    title: `🚨 IMMEDIATE ACTION REQUIRED: ${card.nickname}`,
    body: `CRITICAL: Your ${card.bank_name} utilization is ${context.current.toFixed(0)}%. Make a payment of at least ${formatCAD(urgentPayment)} NOW to prevent credit score damage. Statement reports to credit bureaus in ${context.statementDays} days.`,
    data: {
      type: 'critical_utilization',
      cardId: card.id,
      screen: 'payment_optimizer',
      utilization: context.current,
      urgentPayment,
      statementDays: context.statementDays,
      action: 'immediate_payment',
      urgency: 'immediate',
    },
  };
};

// --- Multi-Card Optimization Alerts ---

export const canadianOverallUtilizationAlert = (
  totalUtilization: number,
  targetUtilization: number,
  affectedCards: CreditCard[],
  recommendedActions: ActionableRecommendation[]
): NotificationContent => {
  const cardList = affectedCards.map(c => c.nickname).join(', ');
  const urgencyEmoji = totalUtilization >= 50 ? '⚠️' : '📊';

  return {
    title: `${urgencyEmoji} Overall Credit Utilization: ${totalUtilization.toFixed(0)}%`,
    body: `Your total credit utilization across ${affectedCards.length} cards (${cardList}) is ${totalUtilization.toFixed(0)}%. Target: ${targetUtilization}%. ClariFi recommends optimizing payments for maximum credit score benefit.`,
    data: {
      type: 'overall_utilization',
      screen: 'payment_optimizer',
      totalUtilization,
      targetUtilization,
      affectedCardIds: affectedCards.map(c => c.id),
      action: 'optimize_payments',
      recommendationCount: recommendedActions.length,
    },
  };
};

// --- Enhanced Budget & Insights ---

export const canadianBudgetAlert = (
  categoryName: string,
  spentAmount: number,
  budgetAmount: number,
  percent: number,
  monthlyIncome?: number
): NotificationContent => {
  const overspend = spentAmount > budgetAmount;
  const emoji = overspend ? '🚨' : percent >= 90 ? '⚠️' : '💰';
  const statusText = overspend ? 'EXCEEDED' : 'Alert';

  return {
    title: `${emoji} Budget ${statusText}: ${categoryName}`,
    body: `You've spent ${formatCAD(spentAmount)} (${percent.toFixed(0)}%) of your ${formatCAD(budgetAmount)} ${categoryName} budget this month. ${overspend ? 'Consider adjusting spending or reallocating budget.' : 'Monitor remaining spending.'}`,
    data: {
      type: 'budget_threshold',
      categoryName,
      spentAmount,
      budgetAmount,
      percent,
      screen: 'Dashboard',
      action: overspend ? 'adjust_budget' : 'monitor_spending',
    },
  };
};

export const canadianInsightNotification = (
  insight: Insight
): NotificationContent => {
  const insightEmojis = {
    saving_opportunity: '💡',
    unusual_spend: '🔍',
    trend: '📈',
    budget_warning: '⚠️',
  };

  const emoji = insightEmojis[insight.type] || '💡';
  const typeText = insight.type
    .replace('_', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `${emoji} Canadian Finance Insight: ${typeText}`,
    body: `${insight.message.substring(0, 120)}${insight.message.length > 120 ? '...' : ''} Tap to view detailed analysis and recommendations.`,
    data: {
      type: 'new_insight',
      insightId: insight.id,
      insightType: insight.type,
      priority: insight.priority,
      screen: 'Insights',
      action: 'view_insight',
    },
  };
};

// --- Canadian Credit Education ---

export const canadianCreditEducationReminder = (
  moduleTitle: string,
  userCreditScore?: number,
  relevantTopic?: string
): NotificationContent => {
  const scoreContext = userCreditScore
    ? `With your current credit profile (${userCreditScore}/900), this `
    : 'This ';

  return {
    title: `🎓 Canadian Credit Education: ${moduleTitle}`,
    body: `${scoreContext}module covers important Canadian credit concepts including Equifax/TransUnion reporting, federal regulations, and banking practices. Complete it to improve your financial knowledge.`,
    data: {
      type: 'education_reminder',
      moduleTitle,
      userCreditScore,
      relevantTopic,
      screen: 'Education',
      action: 'start_module',
    },
  };
};

// --- Achievement & Progress ---

export const canadianAchievementUnlocked = (
  achievement: Achievement,
  creditImpact?: string
): NotificationContent => ({
  title: `🏆 Achievement Unlocked: ${achievement.name}`,
  body: `Congratulations! You've earned "${achievement.name}". ${achievement.description} ${creditImpact ? `Credit Impact: ${creditImpact}` : ''} Keep building your Canadian financial expertise!`,
  data: {
    type: 'achievement_unlocked',
    achievementId: achievement.id,
    creditImpact,
    points: achievement.points,
    screen: 'Progress',
    action: 'view_achievement',
  },
});

export const canadianCreditScoreUpdate = (
  previousScore: number,
  newScore: number,
  factors: string[],
  nextOptimization?: string
): NotificationContent => {
  const change = newScore - previousScore;
  const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '📊';
  const direction =
    change > 0 ? 'increased' : change < 0 ? 'decreased' : 'remained stable';

  return {
    title: `${emoji} Credit Score Update: ${newScore}/900`,
    body: `Your credit score ${direction} by ${Math.abs(change)} points (${previousScore} → ${newScore}). Key factors: ${factors.slice(0, 2).join(', ')}. ${nextOptimization || 'Continue your excellent credit management!'}`,
    data: {
      type: 'credit_score_update',
      previousScore,
      newScore,
      change,
      factors,
      nextOptimization,
      screen: 'credit_profile',
      action: 'view_score_details',
    },
  };
};

// --- Statement Cycle Notifications ---

export const canadianStatementReady = (
  card: CreditCard,
  statementBalance: number,
  minimumPayment: number,
  dueDate: Date
): NotificationContent => ({
  title: `📄 Statement Ready: ${card.nickname}`,
  body: `Your ${card.bank_name} statement is ready. Balance: ${formatCAD(statementBalance)}, Minimum: ${formatCAD(minimumPayment)}, Due: ${dueDate.toLocaleDateString('en-CA')}. This balance will be reported to credit bureaus.`,
  data: {
    type: 'statement_ready',
    cardId: card.id,
    statementBalance,
    minimumPayment,
    dueDate: dueDate.toISOString(),
    screen: 'Cards',
    action: 'view_statement',
  },
});

// --- Seasonal Canadian Financial Reminders ---

export const canadianTaxSeasonReminder = (
  estimatedRefund?: number,
  hasInvestmentAccounts?: boolean
): NotificationContent => {
  const refundText = estimatedRefund
    ? ` Consider using your estimated ${formatCAD(estimatedRefund)} refund to pay down credit card debt.`
    : '';
  const investmentText = hasInvestmentAccounts
    ? " Don't forget about investment income reporting."
    : '';

  return {
    title: `🍁 Canadian Tax Season Reminder`,
    body: `Tax season is approaching. Gather your T4s, T5s, and other tax documents.${refundText}${investmentText} ClariFi can help you plan debt repayment strategies.`,
    data: {
      type: 'tax_season_reminder',
      estimatedRefund,
      hasInvestmentAccounts,
      screen: 'Dashboard',
      action: 'tax_planning',
    },
  };
};

/**
 * Template-based content generator for dynamic notifications
 */
export class CanadianNotificationTemplateEngine {
  private context: CanadianNotificationContext;

  constructor(context: Partial<CanadianNotificationContext> = {}) {
    this.context = { ...CANADIAN_CONTEXT, ...context };
  }

  /**
   * Generate personalized utilization alert with full Canadian context
   */
  generateUtilizationAlert(
    card: CreditCard,
    utilizationSettings: UtilizationSettings,
    userProfile?: { creditScore?: number; preferredLanguage?: 'en' | 'fr' }
  ): NotificationContent {
    const creditScore = userProfile?.creditScore || 720;

    if (userProfile?.preferredLanguage === 'fr') {
      return this.generateFrenchUtilizationAlert(
        card,
        utilizationSettings,
        creditScore
      );
    }

    return canadianUtilizationAlert(card, utilizationSettings, creditScore);
  }

  /**
   * French language notification support
   */
  private generateFrenchUtilizationAlert(
    card: CreditCard,
    utilizationSettings: UtilizationSettings,
    creditScore: number
  ): NotificationContent {
    const context = createUtilizationContext(
      card,
      utilizationSettings,
      creditScore
    );
    const { current } = context;

    const urgencyEmoji = current >= 90 ? '🚨' : current >= 80 ? '⚠️' : '📈';
    const levelText =
      current >= 90
        ? 'Critique'
        : current >= 80
          ? 'Élevé'
          : current >= 70
            ? 'Modéré'
            : 'Normal';

    return {
      title: `${urgencyEmoji} Utilisation ${levelText}: ${card.nickname}`,
      body: `Votre utilisation ${card.bank_name} est de ${current.toFixed(0)}% (${formatCAD(card.current_balance)}/${formatCAD(card.credit_limit)}). Considérez un paiement pour optimiser votre cote de crédit canadienne.`,
      data: {
        type: 'utilization_warning',
        cardId: card.id,
        screen: 'Cards',
        language: 'fr',
        utilization: current,
        action: 'voir_optimisation',
      },
    };
  }

  /**
   * Generate comprehensive multi-card optimization recommendation
   */
  generateMultiCardOptimization(
    cards: CreditCard[],
    utilizationSettings: UtilizationSettings,
    availableFunds: number
  ): NotificationContent {
    const totalUtilization =
      cards.reduce((sum, card) => {
        return sum + (card.current_balance / card.credit_limit) * 100;
      }, 0) / cards.length;

    const highUtilizationCards = cards.filter(
      card => calculateUtilization(card.current_balance, card.credit_limit) > 50
    );

    return {
      title: `🎯 Payment Optimization Available`,
      body: `ClariFi found an opportunity to optimize your ${formatCAD(availableFunds)} payment across ${cards.length} cards. Current average utilization: ${totalUtilization.toFixed(0)}%. Optimize for maximum credit score impact.`,
      data: {
        type: 'multi_card_optimization',
        cardIds: cards.map(c => c.id),
        availableFunds,
        totalUtilization,
        highUtilizationCount: highUtilizationCards.length,
        screen: 'payment_optimizer',
        action: 'optimize_payments',
      },
    };
  }
}

// Export the template engine instance
export const canadianTemplateEngine = new CanadianNotificationTemplateEngine();

// Legacy exports for backward compatibility
export const paymentDueSoon = canadianPaymentDueSoon;
export const highUtilizationWarning = canadianUtilizationAlert;

console.log('Enhanced Canadian notification templates loaded');

export {}; // Ensures this is treated as a module
