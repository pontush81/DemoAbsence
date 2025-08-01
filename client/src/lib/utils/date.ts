// Date utility functions for formatting and handling dates

/**
 * Format a date to a localized string
 * @param date Date to format
 * @param locale Locale to use
 * @returns Formatted date string (e.g., "15 april 2023")
 */
export function formatDate(date: Date | string, locale: string = 'sv-SE'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format a date to include the day of week
 * @param date Date to format
 * @param locale Locale to use
 * @returns Formatted date string with day of week (e.g., "Måndag 15 april 2023")
 */
export function formatDateWithDay(date: Date | string, locale: string = 'sv-SE'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format a time string to a localized time
 * @param timeString Time string in format "HH:MM:SS"
 * @param locale Locale to use
 * @returns Formatted time string (e.g., "08:00")
 */
export function formatTime(timeString?: string | null, locale: string = 'sv-SE'): string {
  // Handle undefined/null values
  if (!timeString) {
    return '--:--';
  }
  
  // Simple substring approach for HH:MM:SS format
  if (timeString.includes(':')) {
    return timeString.substring(0, 5); // Remove seconds if present (HH:MM:SS -> HH:MM)
  }
  
  // Convert time string to Date object (fallback for other formats)
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.warn('Invalid time format:', timeString);
    return '--:--';
  }
}

/**
 * Calculate the duration between two time strings
 * @param startTime Start time string in format "HH:MM:SS"
 * @param endTime End time string in format "HH:MM:SS"
 * @returns Duration in hours (e.g., 2.5)
 */
export function calculateDuration(startTime: string, endTime: string): number {
  // Handle null/undefined values
  if (!startTime || !endTime) {
    return 0;
  }
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;
  
  // Calculate duration in minutes
  const durationMinutes = endMinutesTotal - startMinutesTotal;
  
  // Convert to hours
  return durationMinutes / 60;
}

/**
 * Format a timestamp to a relative time string
 * @param timestamp Timestamp to format
 * @param locale Locale to use
 * @returns Relative time string (e.g., "Idag, 09:45")
 */
export function formatRelativeTime(timestamp: string | Date, locale: string = 'sv-SE'): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  // Check if the date is today
  if (date.toDateString() === now.toDateString()) {
    return `Idag, ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  
  // Check if the date is yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Igår, ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  
  // For other dates, format as "15 april, 09:45"
  return `${date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}, ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes Duration in minutes
 * @param locale Locale to use
 * @returns Formatted duration string (e.g., "+4.5 timmar" or "-1 timme")
 */
export function formatDuration(minutes: number, locale: string = 'sv-SE'): string {
  const hours = minutes / 60;
  const absHours = Math.abs(hours);
  const sign = hours >= 0 ? '+' : '-';
  
  const hourText = locale === 'sv-SE' 
    ? (absHours === 1 ? 'timme' : 'timmar') 
    : (absHours === 1 ? 'hour' : 'hours');
  
  return `${sign}${absHours.toFixed(1)} ${hourText}`;
}

/**
 * Get month name from month number
 * @param month Month number (1-12)
 * @param locale Locale to use
 * @returns Month name
 */
export function getMonthName(month: number, locale: string = 'sv-SE'): string {
  const date = new Date();
  date.setMonth(month - 1);
  
  return date.toLocaleDateString(locale, { month: 'long' });
}
