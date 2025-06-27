/**
 * Contains utility functions for formatting dates for display.
 */

/**
 * Formats a date object or string into a user-friendly string (e.g., 'Jan 1, 2023').
 * @param date The date to format (Date object, ISO string, or timestamp number).
 * @param locale The locale for formatting (e.g., 'en-CA', 'fr-CA'). Defaults to 'en-CA'.
 * @param options Intl.DateTimeFormatOptions to customize the output.
 *                Defaults to { year: 'numeric', month: 'short', day: 'numeric' }.
 * @returns Formatted date string, or an empty string/placeholder if date is invalid.
 */
export const formatDate = (
  date: Date | string | number | undefined | null,
  locale: string = 'en-CA',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return 'N/A'; // Or some other placeholder for undefined/null dates

  let dateObj: Date;
  if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'; // Placeholder for invalid date objects
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (e) {
    // Fallback for unsupported locale or options
    console.error('[Formatting] Error formatting date:', e);
    // Basic ISO format as a fallback, stripping time
    try {
      return dateObj.toISOString().split('T')[0];
    } catch {
      return 'Error Date';
    }
  }
};

/**
 * Formats a date into a relative time string (e.g., '2 hours ago', 'in 3 days', 'yesterday').
 * @param date The date to format (Date object, ISO string, or timestamp number).
 * @param locale The locale for formatting. Defaults to 'en-CA'.
 * @param baseDate The date to compare against (defaults to now).
 * @returns Relative time string or formatted date if beyond a certain threshold.
 */
export const formatRelativeTime = (
  date: Date | string | number | undefined | null,
  locale: string = 'en-CA',
  baseDate: Date = new Date()
): string => {
  if (!date) return 'N/A';

  let dateObj: Date;
  if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const seconds = Math.round((dateObj.getTime() - baseDate.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Average days in month
  const years = Math.round(days / 365.25); // Average days in year

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(years) >= 1) {
      return rtf.format(years, 'year');
    }
    if (Math.abs(months) >= 1) {
      return rtf.format(months, 'month');
    }
    if (Math.abs(weeks) >= 1) {
      return rtf.format(weeks, 'week');
    }
    if (Math.abs(days) >= 1) {
      return rtf.format(days, 'day');
    }
    if (Math.abs(hours) >= 1) {
      return rtf.format(hours, 'hour');
    }
    if (Math.abs(minutes) >= 1) {
      return rtf.format(minutes, 'minute');
    }
    if (Math.abs(seconds) >= 10) {
      return rtf.format(seconds, 'second');
    }
    return rtf.format(0, 'second'); // 'now' or equivalent
  } catch (e) {
    console.error('[Formatting] Error formatting relative time:', e);
    return formatDate(dateObj, locale); // Fallback to standard date format
  }
};

/**
 * Formats a date to a YYYY-MM-DD string, useful for inputs or API calls.
 * @param date The date to format (Date object, ISO string, or timestamp number).
 * @returns Date string in YYYY-MM-DD format or empty string if invalid.
 */
export const formatDateISO = (
  date: Date | string | number | undefined | null
): string => {
  if (!date) return '';

  let dateObj: Date;
  if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Formats a date to a Month YYYY string (e.g., "January 2023").
 * @param date The date to format.
 * @param locale Locale for formatting.
 * @returns Formatted string like "Month Year".
 */
export const formatMonthYear = (
  date: Date | string | number | undefined | null,
  locale: string = 'en-CA'
): string => {
  return formatDate(date, locale, { month: 'long', year: 'numeric' });
};

/**
 * Formats a date to a short month and day (e.g., "Jan 1").
 * @param date The date to format.
 * @param locale Locale for formatting.
 * @returns Formatted string like "ShortMonth Day".
 */
export const formatShortMonthDay = (
  date: Date | string | number | undefined | null,
  locale: string = 'en-CA'
): string => {
  return formatDate(date, locale, { month: 'short', day: 'numeric' });
};

console.log('utils/formatting/dates.ts loaded');

export {}; // Ensures this is treated as a module
