/**
 * Contains validation functions for credit card input fields.
 * Ensures data like card numbers (last four), limits, dates are in correct format and range.
 */

import { CreditCard } from '../../services/storage/dataModels'; // Adjust path as necessary

export interface CardValidationErrors {
  nickname?: string;
  last_four?: string;
  credit_limit?: string;
  statement_day?: string;
  payment_due_days?: string;
  apr?: string;
  bank_name?: string;
  // Add other fields as necessary
}

/**
 * Validates the last four digits of a credit card.
 * @param lastFour The last four digits string.
 * @returns Error message or null if valid.
 */
export const validateLastFour = (lastFour: string): string | null => {
  if (!lastFour) return 'Last four digits are required.';
  if (!/^\d{4}$/.test(lastFour)) {
    return 'Must be exactly 4 digits.';
  }
  return null;
};

/**
 * Validates the credit limit.
 * @param limit The credit limit (number or string).
 * @returns Error message or null if valid.
 */
export const validateCreditLimit = (limit: number | string): string | null => {
  const numLimit = Number(limit);
  if (limit === '' || limit === null || limit === undefined)
    return 'Credit limit is required.';
  if (isNaN(numLimit)) {
    return 'Credit limit must be a number.';
  }
  if (numLimit <= 0) {
    return 'Credit limit must be greater than 0.';
  }
  if (numLimit > 500000) {
    // Arbitrary upper sanity check
    return 'Credit limit seems unusually high.';
  }
  return null;
};

/**
 * Validates the statement day.
 * @param day The statement day (number or string).
 * @returns Error message or null if valid.
 */
export const validateStatementDay = (day: number | string): string | null => {
  const numDay = Number(day);
  if (day === '' || day === null || day === undefined)
    return 'Statement day is required.';
  if (isNaN(numDay) || !Number.isInteger(numDay)) {
    return 'Statement day must be a whole number.';
  }
  if (numDay < 1 || numDay > 31) {
    return 'Statement day must be between 1 and 31.';
  }
  return null;
};

/**
 * Validates the payment due days (grace period).
 * @param days The payment due days (number or string).
 * @returns Error message or null if valid.
 */
export const validatePaymentDueDays = (
  days: number | string
): string | null => {
  const numDays = Number(days);
  if (days === '' || days === null || days === undefined)
    return 'Payment due days are required.';
  if (isNaN(numDays) || !Number.isInteger(numDays)) {
    return 'Payment due days must be a whole number.';
  }
  if (numDays < 0 || numDays > 60) {
    // Typical grace periods are 20-30 days, 60 is a generous upper bound
    return 'Payment due days typically range from 0 to 60.';
  }
  return null;
};

/**
 * Validates the APR (Annual Percentage Rate).
 * @param apr The APR (number or string).
 * @returns Error message or null if valid.
 */
export const validateApr = (
  apr: number | string | undefined
): string | null => {
  if (apr === undefined || apr === '' || apr === null) return null; // APR is optional
  const numApr = Number(apr);
  if (isNaN(numApr)) {
    return 'APR must be a number.';
  }
  if (numApr < 0 || numApr > 100) {
    // APRs are percentages
    return 'APR should be between 0 and 100.';
  }
  return null;
};

/**
 * Validates the card nickname.
 * @param nickname The card nickname string.
 * @returns Error message or null if valid.
 */
export const validateNickname = (nickname: string): string | null => {
  if (!nickname || nickname.trim().length === 0) return 'Nickname is required.';
  if (nickname.length > 50) {
    return 'Nickname should be 50 characters or less.';
  }
  return null;
};

/**
 * Validates the bank name.
 * @param bankName The bank name string.
 * @returns Error message or null if valid.
 */
export const validateBankName = (bankName: string): string | null => {
  if (!bankName || bankName.trim().length === 0)
    return 'Bank name is required.';
  if (bankName.length > 50) {
    return 'Bank name should be 50 characters or less.';
  }
  return null;
};

/**
 * Validates all fields for a credit card form.
 * @param cardData Partial or full CreditCard data from a form.
 * @returns An object containing error messages for each field, or an empty object if all valid.
 */
export const validateCreditCardForm = (
  cardData: Partial<CreditCard>
): CardValidationErrors => {
  const errors: CardValidationErrors = {};

  const nicknameError = validateNickname(cardData.nickname || '');
  if (nicknameError) errors.nickname = nicknameError;

  const lastFourError = validateLastFour(cardData.last_four || '');
  if (lastFourError) errors.last_four = lastFourError;

  const creditLimitError = validateCreditLimit(
    cardData.credit_limit === undefined ? '' : cardData.credit_limit
  );
  if (creditLimitError) errors.credit_limit = creditLimitError;

  const statementDayError = validateStatementDay(
    cardData.statement_day === undefined ? '' : cardData.statement_day
  );
  if (statementDayError) errors.statement_day = statementDayError;

  const paymentDueDaysError = validatePaymentDueDays(
    cardData.payment_due_days === undefined ? '' : cardData.payment_due_days
  );
  if (paymentDueDaysError) errors.payment_due_days = paymentDueDaysError;

  const aprError = validateApr(cardData.apr);
  if (aprError) errors.apr = aprError;

  const bankNameError = validateBankName(cardData.bank_name || '');
  if (bankNameError) errors.bank_name = bankNameError;

  return errors;
};

console.log('utils/validation/cards.ts loaded');

export {}; // Ensures this is treated as a module
