/**
 * Contains validation functions for transaction input fields.
 * Ensures data like amount, date, description are in correct format and sensible.
 */

import { Transaction } from '../../services/storage/dataModels'; // Adjust path as necessary

export interface TransactionValidationErrors {
  amount?: string;
  date?: string;
  description?: string;
  category_id?: string;
  merchant_name?: string;
  // Add other fields as necessary
}

/**
 * Validates the transaction amount.
 * @param amount The transaction amount (number or string).
 * @returns Error message or null if valid.
 */
export const validateTransactionAmount = (
  amount: number | string
): string | null => {
  const numAmount = Number(amount);
  if (amount === '' || amount === null || amount === undefined)
    return 'Amount is required.';
  if (isNaN(numAmount)) {
    return 'Amount must be a number.';
  }
  if (numAmount === 0) {
    return 'Amount cannot be zero.'; // Or allow if it makes sense for certain transaction types
  }
  // Check for an unusually large amount, e.g. > $1,000,000 as a sanity check
  if (Math.abs(numAmount) > 1000000) {
    return 'Amount seems unusually large.';
  }
  return null;
};

/**
 * Validates the transaction date.
 * @param dateString The transaction date as a string (e.g., YYYY-MM-DD).
 * @returns Error message or null if valid.
 */
export const validateTransactionDate = (dateString: string): string | null => {
  if (!dateString) return 'Date is required.';

  const date = new Date(dateString);
  // Check if dateString is a valid date format that results in a valid Date object
  if (isNaN(date.getTime())) {
    return 'Invalid date format. Please use YYYY-MM-DD.';
  }

  // Check if the parsed date matches the input string components to catch invalid dates like 2023-02-30
  const [year, month, day] = dateString.split('-').map(Number);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return 'Invalid date. Please check day, month, and year.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only
  // Allow dates up to 10 years in the past and not in the future
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);
  tenYearsAgo.setHours(0, 0, 0, 0);

  if (date > today) {
    return 'Date cannot be in the future.';
  }
  if (date < tenYearsAgo) {
    return 'Date is too far in the past (max 10 years).';
  }
  return null;
};

/**
 * Validates the transaction description.
 * @param description The transaction description string.
 * @returns Error message or null if valid.
 */
export const validateTransactionDescription = (
  description: string
): string | null => {
  if (!description || description.trim().length === 0)
    return 'Description is required.';
  if (description.length > 255) {
    // Max length for a typical database varchar
    return 'Description should be 255 characters or less.';
  }
  // Potentially check for disallowed characters or patterns if necessary
  return null;
};

/**
 * Validates the category ID for a transaction.
 * @param categoryId The category ID string.
 * @param availableCategories Optional: Array of valid category IDs to check against.
 * @returns Error message or null if valid.
 */
export const validateTransactionCategoryId = (
  categoryId: string | undefined
  // availableCategories?: string[]
): string | null => {
  if (!categoryId || categoryId.trim().length === 0)
    return 'Category is required.';
  // if (availableCategories && !availableCategories.includes(categoryId)) {
  //   return 'Invalid category selected.';
  // }
  return null;
};

/**
 * Validates the merchant name for a transaction (optional field).
 * @param merchantName The merchant name string.
 * @returns Error message or null if valid.
 */
export const validateMerchantName = (
  merchantName: string | undefined
): string | null => {
  if (merchantName && merchantName.length > 100) {
    return 'Merchant name should be 100 characters or less.';
  }
  return null;
};

/**
 * Validates all fields for a transaction form.
 * @param transactionData Partial or full Transaction data from a form.
 * @returns An object containing error messages for each field, or an empty object if all valid.
 */
export const validateTransactionForm = (
  transactionData: Partial<Transaction>
): TransactionValidationErrors => {
  const errors: TransactionValidationErrors = {};

  const amountError = validateTransactionAmount(
    transactionData.amount === undefined ? '' : transactionData.amount
  );
  if (amountError) errors.amount = amountError;

  const dateError = validateTransactionDate(transactionData.date || '');
  if (dateError) errors.date = dateError;

  const descriptionError = validateTransactionDescription(
    transactionData.description || ''
  );
  if (descriptionError) errors.description = descriptionError;

  const categoryIdError = validateTransactionCategoryId(
    transactionData.category_id
  );
  if (categoryIdError) errors.category_id = categoryIdError;

  const merchantNameError = validateMerchantName(transactionData.merchant_name);
  if (merchantNameError) errors.merchant_name = merchantNameError;

  // Add validation for other fields like tags, is_recurring, etc. as needed

  return errors;
};

console.log('utils/validation/transactions.ts loaded');

export {}; // Ensures this is treated as a module
