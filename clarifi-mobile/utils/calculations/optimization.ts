/**
 * Contains algorithms for credit card payment optimization strategies.
 * This includes strategies like avalanche, snowball, and credit score maximization.
 * Relevant for Feature 6: Multi-Card Optimization Advice.
 */

import {
  CreditCard,
  UtilizationSettings,
} from '../../services/storage/dataModels';
import { calculateUtilization } from './utilization'; // Assuming this is in the same directory or path is correct

export type PaymentStrategy =
  | 'minimize_interest'
  | 'maximize_credit_score'
  | 'snowball'
  | 'avalanche';

export interface PaymentAllocation {
  card_id: string;
  card_nickname: string; // For display
  amount: number;
  original_balance: number;
  new_balance: number;
  original_utilization: number;
  new_utilization: number;
  interest_saved_this_month?: number; // Approximate
  score_impact_points?: number; // Approximate relative impact
}

export interface OptimizationPlan {
  strategy: PaymentStrategy;
  total_payment_amount: number;
  allocations: PaymentAllocation[];
  projected_overall_utilization: number;
  estimated_total_interest_saved?: number;
  estimated_score_improvement?: number; // Points or qualitative
  warnings?: string[];
}

/**
 * Base class or helper for optimization strategies.
 * Can be extended or used by specific strategy functions.
 */

// --- Strategy Implementations ---

/**
 * Avalanche Method: Prioritizes paying off cards with the highest APR first.
 * @param cards Array of CreditCard objects.
 * @param availableFunds Total amount available for payments.
 * @returns Array of PaymentAllocation objects.
 */
const avalancheMethod = (
  cards: CreditCard[],
  availableFunds: number
): PaymentAllocation[] => {
  const allocations: PaymentAllocation[] = [];
  let remainingFunds = availableFunds;

  // Sort cards by APR, highest first. Then by balance to break ties.
  const sortedCards = [...cards]
    .filter(c => c.is_active && c.current_balance > 0)
    .sort(
      (a, b) =>
        (b.apr || 0) - (a.apr || 0) || b.current_balance - a.current_balance
    );

  for (const card of sortedCards) {
    if (remainingFunds <= 0) break;

    // For avalanche, typically pay minimum on others, then all extra on highest APR.
    // MVP simplification: distribute available funds, focusing on high APR.
    // A more complex version would incorporate minimum payments.
    const paymentAmount = Math.min(remainingFunds, card.current_balance);

    allocations.push({
      card_id: card.id,
      card_nickname: card.nickname,
      amount: paymentAmount,
      original_balance: card.current_balance,
      new_balance: card.current_balance - paymentAmount,
      original_utilization: calculateUtilization(
        card.current_balance,
        card.credit_limit
      ),
      new_utilization: calculateUtilization(
        card.current_balance - paymentAmount,
        card.credit_limit
      ),
    });
    remainingFunds -= paymentAmount;
  }
  return allocations;
};

/**
 * Snowball Method: Prioritizes paying off cards with the smallest balance first.
 * @param cards Array of CreditCard objects.
 * @param availableFunds Total amount available for payments.
 * @returns Array of PaymentAllocation objects.
 */
const snowballMethod = (
  cards: CreditCard[],
  availableFunds: number
): PaymentAllocation[] => {
  const allocations: PaymentAllocation[] = [];
  let remainingFunds = availableFunds;

  // Sort cards by balance, smallest first.
  const sortedCards = [...cards]
    .filter(c => c.is_active && c.current_balance > 0)
    .sort(
      (a, b) =>
        a.current_balance - b.current_balance || (a.apr || 0) - (b.apr || 0)
    );

  for (const card of sortedCards) {
    if (remainingFunds <= 0) break;

    const paymentAmount = Math.min(remainingFunds, card.current_balance);

    allocations.push({
      card_id: card.id,
      card_nickname: card.nickname,
      amount: paymentAmount,
      original_balance: card.current_balance,
      new_balance: card.current_balance - paymentAmount,
      original_utilization: calculateUtilization(
        card.current_balance,
        card.credit_limit
      ),
      new_utilization: calculateUtilization(
        card.current_balance - paymentAmount,
        card.credit_limit
      ),
    });
    remainingFunds -= paymentAmount;
  }
  return allocations;
};

/**
 * Credit Score Method: Prioritizes payments to cards that most impact credit score (typically high utilization).
 * @param cards Array of CreditCard objects.
 * @param availableFunds Total amount available for payments.
 * @param targetIndividualUtilization Target utilization for individual cards (e.g., 28 for 28%).
 * @returns Array of PaymentAllocation objects.
 */
const creditScoreMethod = (
  cards: CreditCard[],
  availableFunds: number,
  targetIndividualUtilization: number = 28 // Common target for credit score optimization
): PaymentAllocation[] => {
  const allocations: PaymentAllocation[] = [];
  let remainingFunds = availableFunds;

  // Sort by current utilization, highest first
  const sortedCards = [...cards]
    .filter(c => c.is_active && c.current_balance > 0)
    .sort((a, b) => {
      const utilA = calculateUtilization(a.current_balance, a.credit_limit);
      const utilB = calculateUtilization(b.current_balance, b.credit_limit);
      return utilB - utilA || (b.apr || 0) - (a.apr || 0); // Higher APR as tie-breaker
    });

  for (const card of sortedCards) {
    if (remainingFunds <= 0) break;

    const currentUtil = calculateUtilization(
      card.current_balance,
      card.credit_limit
    );
    const targetBalanceForCard =
      (targetIndividualUtilization / 100) * card.credit_limit;
    let paymentAmount = 0;

    if (card.current_balance > targetBalanceForCard) {
      // How much to pay to get to target utilization or clear balance
      paymentAmount = Math.min(
        remainingFunds,
        card.current_balance - targetBalanceForCard
      );
      paymentAmount = Math.min(paymentAmount, card.current_balance); // Don't pay more than balance
    } else {
      // Already at or below target, maybe make a minimum payment if funds allow after others
      // MVP: for now, if below target, we might not allocate from primary funds unless it's the only card or strategy changes.
      // This part could be smarter, e.g. ensuring all cards get at least minimum payment.
    }

    // Ensure payment is positive
    paymentAmount = Math.max(0, paymentAmount);

    if (paymentAmount > 0) {
      allocations.push({
        card_id: card.id,
        card_nickname: card.nickname,
        amount: paymentAmount,
        original_balance: card.current_balance,
        new_balance: card.current_balance - paymentAmount,
        original_utilization: currentUtil,
        new_utilization: calculateUtilization(
          card.current_balance - paymentAmount,
          card.credit_limit
        ),
      });
      remainingFunds -= paymentAmount;
    }
  }

  // If funds still remain after targeting high utilization cards, distribute further (e.g. to highest APR or smallest balance)
  // For MVP, this secondary distribution can be simple or deferred.
  if (remainingFunds > 0) {
    // Example: Apply remaining funds to highest APR card that still has a balance
    const cardsWithRemainingBalance = sortedCards
      .filter(c => {
        const existingAllocation = allocations.find(a => a.card_id === c.id);
        const currentCardBalance = existingAllocation
          ? existingAllocation.new_balance
          : c.current_balance;
        return currentCardBalance > 0;
      })
      .sort((a, b) => (b.apr || 0) - (a.apr || 0));

    for (const card of cardsWithRemainingBalance) {
      if (remainingFunds <= 0) break;
      const existingAllocation = allocations.find(a => a.card_id === card.id);
      const balanceBeforeThisPass = existingAllocation
        ? existingAllocation.new_balance
        : card.current_balance;

      const paymentAmount = Math.min(remainingFunds, balanceBeforeThisPass);
      if (paymentAmount > 0) {
        if (existingAllocation) {
          existingAllocation.amount += paymentAmount;
          existingAllocation.new_balance -= paymentAmount;
          existingAllocation.new_utilization = calculateUtilization(
            existingAllocation.new_balance,
            card.credit_limit
          );
        } else {
          allocations.push({
            card_id: card.id,
            card_nickname: card.nickname,
            amount: paymentAmount,
            original_balance: card.current_balance, // Original balance before any payments this cycle
            new_balance: card.current_balance - paymentAmount,
            original_utilization: calculateUtilization(
              card.current_balance,
              card.credit_limit
            ),
            new_utilization: calculateUtilization(
              card.current_balance - paymentAmount,
              card.credit_limit
            ),
          });
        }
        remainingFunds -= paymentAmount;
      }
    }
  }

  return allocations;
};

/**
 * Main function to generate a payment optimization plan based on selected strategy.
 * @param cards Array of active CreditCard objects.
 * @param availableFunds Total amount available for payments.
 * @param strategy The chosen payment strategy.
 * @param settings App/User settings related to utilization.
 * @returns An OptimizationPlan object.
 */
export const generateOptimizationPlan = (
  allCards: CreditCard[],
  availableFunds: number,
  strategy: PaymentStrategy,
  settings: UtilizationSettings
): OptimizationPlan => {
  const activeCards = allCards.filter(
    c => c.is_active && c.current_balance > 0 && c.credit_limit > 0
  );
  if (activeCards.length === 0) {
    return {
      strategy,
      total_payment_amount: 0,
      allocations: [],
      projected_overall_utilization: 0,
      warnings: ['No active cards with balances to optimize.'],
    };
  }

  let allocations: PaymentAllocation[];

  switch (strategy) {
    case 'avalanche':
      allocations = avalancheMethod(activeCards, availableFunds);
      break;
    case 'snowball':
      allocations = snowballMethod(activeCards, availableFunds);
      break;
    case 'maximize_credit_score':
      allocations = creditScoreMethod(
        activeCards,
        availableFunds,
        settings.target_overall_utilization
      ); // Using overall as proxy for individual target for now
      break;
    case 'minimize_interest': // Often similar to avalanche
      allocations = avalancheMethod(activeCards, availableFunds); // Defaulting to avalanche for interest minimization
      break;
    default:
      allocations = creditScoreMethod(
        activeCards,
        availableFunds,
        settings.target_overall_utilization
      ); // Default strategy
  }

  let totalPaid = 0;
  let totalProjectedNewBalance = 0;
  let totalOriginalBalance = 0;
  let totalLimit = 0;

  activeCards.forEach(card => {
    totalOriginalBalance += card.current_balance;
    totalLimit += card.credit_limit;
    const allocation = allocations.find(a => a.card_id === card.id);
    if (allocation) {
      totalPaid += allocation.amount;
      totalProjectedNewBalance += allocation.new_balance;
    } else {
      // Card didn't receive a payment as part of the plan
      totalProjectedNewBalance += card.current_balance;
    }
  });

  // If totalPaid > availableFunds due to some logic, it should be capped. Here, it's based on allocations.
  // Recalculate totalPaid just from allocations to be sure.
  totalPaid = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

  const projectedOverallUtilization = calculateUtilization(
    totalProjectedNewBalance,
    totalLimit
  );

  const plan: OptimizationPlan = {
    strategy,
    total_payment_amount: totalPaid,
    allocations,
    projected_overall_utilization: projectedOverallUtilization,
    warnings: [],
  };

  if (
    totalPaid < availableFunds &&
    activeCards.some(c => {
      const alloc = allocations.find(a => a.card_id === c.id);
      return alloc ? alloc.new_balance > 0 : c.current_balance > 0;
    })
  ) {
    const unallocatedFunds = availableFunds - totalPaid;
    plan.warnings?.push(
      `$${unallocatedFunds.toFixed(2)} of your available funds were not allocated. You might want to apply this to a card manually or increase your payment.`
    );
  }
  if (totalPaid === 0 && availableFunds > 0 && activeCards.length > 0) {
    plan.warnings?.push(
      'No payments were allocated. Check card balances and limits.'
    );
  }

  return plan;
};

console.log('utils/calculations/optimization.ts loaded');

export {}; // Ensures this is treated as a module
