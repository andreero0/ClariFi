/**
 * Enhanced Canadian notification templates with financial context, actionable content,
 * and dynamic content insertion for ClariFi notifications.
 * Compliant with Canadian financial regulations and terminology.
 */

import {
  CreditCard,
  Insight,
  Achievement,
  UtilizationSettings,
} from '../storage/dataModels';

interface NotificationContent {
  title: string;
  body: string;
  data?: { [key: string]: any };
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
  current: number,
  recommendedPayment: number,
  statementDays: number
): ActionableRecommendation {
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

// --- Enhanced Canadian Utilization Alerts ---

export const canadianUtilizationAlert = (
  card: CreditCard,
  utilizationSettings: UtilizationSettings,
  estimatedCreditScore: number = 720
): NotificationContent => {
  const current = (card.current_balance / card.credit_limit) * 100;
  const targetUtil = utilizationSettings.target_overall_utilization || 30;
  const targetBalance = (card.credit_limit * targetUtil) / 100;
  const recommendedPayment = Math.max(0, card.current_balance - targetBalance);
  const statementDays = 15; // Default statement cycle

  const optimization = generateUtilizationRecommendation(
    current,
    recommendedPayment,
    statementDays
  );

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
      recommendedPayment,
      action: 'view_optimization',
      statementDays,
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
    const current = (card.current_balance / card.credit_limit) * 100;

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
      card => (card.current_balance / card.credit_limit) * 100 > 50
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

console.log('Enhanced Canadian notification templates loaded');

export {};
