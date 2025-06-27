/**
 * Utility functions for formatting currency values in Canadian dollars.
 */

export interface CurrencyFormatOptions {
  showCents?: boolean;
  showSymbol?: boolean;
  locale?: string;
}

/**
 * Formats a number as Canadian currency.
 * @param amount The amount to format
 * @param options Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  options: CurrencyFormatOptions = {}
): string => {
  const { showCents = true, showSymbol = true, locale = 'en-CA' } = options;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    });

    let formatted = formatter.format(Math.abs(amount));

    if (!showSymbol) {
      // Remove currency symbol
      formatted = formatted.replace(/[^\d.,\s]/g, '').trim();
    }

    return formatted;
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback formatting
    const absAmount = Math.abs(amount);
    if (showCents) {
      return showSymbol ? `$${absAmount.toFixed(2)}` : absAmount.toFixed(2);
    } else {
      return showSymbol
        ? `$${Math.round(absAmount)}`
        : Math.round(absAmount).toString();
    }
  }
};

/**
 * Formats a currency amount with a sign indicator.
 * @param amount The amount to format (positive for income, negative for expense)
 * @param options Formatting options
 * @returns Formatted currency string with sign
 */
export const formatCurrencyWithSign = (
  amount: number,
  options: CurrencyFormatOptions = {}
): string => {
  const formatted = formatCurrency(Math.abs(amount), options);

  if (amount === 0) {
    return formatted;
  }

  return amount > 0 ? `+${formatted}` : `-${formatted}`;
};

/**
 * Formats a currency amount in a compact format for small spaces.
 * @param amount The amount to format
 * @param options Formatting options
 * @returns Compact formatted currency string
 */
export const formatCurrencyCompact = (
  amount: number,
  options: CurrencyFormatOptions = {}
): string => {
  const absAmount = Math.abs(amount);

  if (absAmount >= 1000000) {
    return (
      formatCurrency(absAmount / 1000000, { ...options, showCents: false }) +
      'M'
    );
  } else if (absAmount >= 1000) {
    return (
      formatCurrency(absAmount / 1000, { ...options, showCents: false }) + 'K'
    );
  } else {
    return formatCurrency(absAmount, options);
  }
};

/**
 * Parses a currency string back to a number.
 * @param currencyString The currency string to parse
 * @returns The parsed number or null if invalid
 */
export const parseCurrency = (currencyString: string): number | null => {
  if (!currencyString || typeof currencyString !== 'string') {
    return null;
  }

  // Remove currency symbols, spaces, and non-numeric characters except decimal point and minus
  const cleanString = currencyString.replace(/[^\d.,-]/g, '').replace(/,/g, ''); // Remove commas

  const parsed = parseFloat(cleanString);

  return isNaN(parsed) ? null : parsed;
};

/**
 * Validates if a string represents a valid currency amount.
 * @param currencyString The string to validate
 * @returns True if valid currency format
 */
export const isValidCurrency = (currencyString: string): boolean => {
  const parsed = parseCurrency(currencyString);
  return parsed !== null && isFinite(parsed);
};
