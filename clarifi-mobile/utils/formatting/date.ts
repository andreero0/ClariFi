/**
 * Utility functions for formatting dates in transaction displays.
 */

export interface DateFormatOptions {
  includeYear?: boolean;
  includeTime?: boolean;
  locale?: string;
  relative?: boolean;
}

/**
 * Formats a date string for display in transaction lists.
 * @param dateString ISO date string (YYYY-MM-DD or full ISO)
 * @param options Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: DateFormatOptions = {}
): string => {
  const {
    includeYear = false,
    includeTime = false,
    locale = 'en-CA',
    relative = true,
  } = options;

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const transactionDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Calculate difference in days
    const diffTime = today.getTime() - transactionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Use relative formatting for recent dates
    if (relative) {
      if (diffDays === 0) {
        return includeTime ? `Today, ${formatTime(date)}` : 'Today';
      } else if (diffDays === 1) {
        return includeTime ? `Yesterday, ${formatTime(date)}` : 'Yesterday';
      } else if (diffDays > 1 && diffDays <= 7) {
        const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
        return includeTime ? `${dayName}, ${formatTime(date)}` : dayName;
      }
    }

    // Standard date formatting
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (includeYear || date.getFullYear() !== now.getFullYear()) {
      formatOptions.year = 'numeric';
    }

    let formatted = date.toLocaleDateString(locale, formatOptions);

    if (includeTime) {
      formatted += `, ${formatTime(date)}`;
    }

    return formatted;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fallback to original string
  }
};

/**
 * Formats time portion of a date.
 * @param date Date object
 * @param locale Locale for formatting
 * @returns Formatted time string
 */
export const formatTime = (date: Date, locale: string = 'en-CA'): string => {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a date for use in date range displays.
 * @param startDate ISO date string
 * @param endDate ISO date string
 * @param locale Locale for formatting
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: string,
  endDate: string,
  locale: string = 'en-CA'
): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid date range';
    }

    const isSameYear = start.getFullYear() === end.getFullYear();
    const isSameMonth = isSameYear && start.getMonth() === end.getMonth();

    if (isSameMonth && start.getDate() === end.getDate()) {
      // Same day
      return start.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (isSameMonth) {
      // Same month, different days
      return `${start.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      })} - ${end.toLocaleDateString(locale, {
        day: 'numeric',
        year: 'numeric',
      })}`;
    }

    if (isSameYear) {
      // Same year, different months
      return `${start.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      })} - ${end.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }

    // Different years
    return `${start.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} - ${end.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return `${startDate} - ${endDate}`;
  }
};

/**
 * Converts a date to ISO string (YYYY-MM-DD format).
 * @param date Date object or date string
 * @returns ISO date string
 */
export const toISODateString = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error converting to ISO date string:', error);
    return '';
  }
};
