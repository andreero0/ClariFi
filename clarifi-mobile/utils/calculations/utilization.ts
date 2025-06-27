/**
 * Contains utility functions for calculating credit utilization,
 * statement dates, payment due dates, and related metrics.
 * These are crucial for Features 4, 5, and 6.
 */

import { CreditCard, Transaction } from '../../services/storage/dataModels'; // Assuming dataModels are centrally located

/**
 * Calculates the credit utilization percentage for a single card.
 * @param currentBalance The current balance on the card.
 * @param creditLimit The total credit limit of the card.
 * @returns Utilization percentage (e.g., 30 for 30%). Returns 0 if limit is 0.
 */
export const calculateUtilization = (
  currentBalance: number,
  creditLimit: number
): number => {
  if (creditLimit <= 0) {
    return 0; // Avoid division by zero; or could return 100 if balance > 0, depending on desired handling
  }
  const utilization = (currentBalance / creditLimit) * 100;
  return Math.max(0, Math.min(utilization, 100)); // Cap at 0-100%
};

/**
 * Calculates the overall utilization across multiple cards.
 * @param cards Array of CreditCard objects.
 * @returns Overall utilization percentage.
 */
export const calculateOverallUtilization = (cards: CreditCard[]): number => {
  let totalBalance = 0;
  let totalLimit = 0;

  cards.forEach(card => {
    if (card.is_active) {
      totalBalance += card.current_balance;
      totalLimit += card.credit_limit;
    }
  });

  return calculateUtilization(totalBalance, totalLimit);
};

/**
 * Calculates the next statement date for a card.
 * @param card The credit card object.
 * @param fromDate The date from which to calculate the next statement date (defaults to today).
 * @returns The next statement date as a Date object.
 */
export const getNextStatementDate = (
  card: CreditCard,
  fromDate: Date = new Date()
): Date => {
  const today = new Date(fromDate); // Use a copy to avoid modifying the original fromDate
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const statementDay = card.statement_day;
  let year = today.getFullYear();
  let month = today.getMonth(); // 0-indexed

  // Helper to get days in a month
  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

  // Effective statement day, capped by actual days in month
  const effectiveStatementDay = Math.min(
    statementDay,
    daysInMonth(month, year)
  );

  let nextStatement = new Date(year, month, effectiveStatementDay);

  if (today.getDate() >= effectiveStatementDay) {
    // If today is on or after this month's statement day, move to next month
    month += 1;
    if (month > 11) {
      // Month is 0-indexed, so 11 is December
      month = 0;
      year += 1;
    }
    const nextMonthEffectiveDay = Math.min(
      statementDay,
      daysInMonth(month, year)
    );
    nextStatement = new Date(year, month, nextMonthEffectiveDay);
  } else {
    // Statement day is still upcoming this month
    nextStatement = new Date(year, month, effectiveStatementDay);
  }

  // If statement day was, e.g. 31, but current month (for next statement) only has 30 days
  // it should correctly be the last day of that month.
  const finalDayInNextStatementMonth = daysInMonth(
    nextStatement.getMonth(),
    nextStatement.getFullYear()
  );
  if (
    statementDay > finalDayInNextStatementMonth &&
    nextStatement.getDate() !== finalDayInNextStatementMonth
  ) {
    nextStatement.setDate(finalDayInNextStatementMonth);
  }

  nextStatement.setHours(0, 0, 0, 0); // Normalize to start of day
  return nextStatement;
};

/**
 * Calculates the payment due date based on the statement date and grace period.
 * @param statementDate The statement date.
 * @param paymentDueDays The number of days after the statement date the payment is due.
 * @returns The payment due date as a Date object.
 */
export const getPaymentDueDate = (
  statementDate: Date,
  paymentDueDays: number
): Date => {
  const dueDate = new Date(statementDate);
  dueDate.setDate(dueDate.getDate() + paymentDueDays);
  dueDate.setHours(23, 59, 59, 999); // Typically end of day for due dates
  return dueDate;
};

/**
 * Estimates utilization on a future statement date based on recurring transactions.
 * This is a simplified projection.
 * @param card The credit card.
 * @param transactions Array of all transactions (to find recurring ones).
 * @param futureStatementDate The future statement date to project to.
 * @returns Projected balance on the future statement date.
 */
export const projectUtilizationForFutureStatement = (
  card: CreditCard
  // transactions: Transaction[], // This would be needed for more advanced projection
  // futureStatementDate: Date
): { projectedBalance: number; projectedUtilization: number } => {
  // MVP: Simple projection, can be enhanced later.
  // For now, assumes current balance carries forward unless a payment is manually logged.
  // A more complex version would:
  // 1. Take current balance.
  // 2. Add known recurring charges expected before futureStatementDate.
  // 3. Subtract scheduled/expected payments.

  // Simplified: just return current utilization if no complex projection logic yet.
  const currentBalance = card.current_balance;
  const utilization = calculateUtilization(currentBalance, card.credit_limit);

  console.warn(
    '[Calculations] projectUtilizationForFutureStatement is simplified for MVP.'
  );
  return {
    projectedBalance: currentBalance,
    projectedUtilization: utilization,
  };
};

/**
 * Determines the number of days until the next statement date.
 * @param card The credit card object.
 * @param fromDate The date from which to calculate (defaults to today).
 * @returns Number of days until the next statement date.
 */
export const daysUntilNextStatement = (
  card: CreditCard,
  fromDate: Date = new Date()
): number => {
  const nextStatement = getNextStatementDate(card, fromDate);
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);
  const diffTime = nextStatement.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Ensure it's not negative if on the same day
};

/**
 * Determines the number of days until the payment is due.
 * @param card The credit card object.
 * @param fromDate The date from which to calculate (defaults to today).
 * @returns Number of days until the payment due date.
 */
export const daysUntilPaymentDue = (
  card: CreditCard,
  fromDate: Date = new Date()
): number => {
  const nextStatement = getNextStatementDate(card, fromDate);
  const paymentDueDate = getPaymentDueDate(
    nextStatement,
    card.payment_due_days
  );
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  if (paymentDueDate < today) return 0; // Past due or due today

  const diffTime = paymentDueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

console.log('utils/calculations/utilization.ts loaded');

export {}; // Ensures this is treated as a module
