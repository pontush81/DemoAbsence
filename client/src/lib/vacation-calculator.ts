/**
 * Vacation Balance Calculator (Frontend version)
 * Handles Swedish business day calculations for vacation deductions
 */

// Swedish holidays (simplified - could be extended with Easter calculations)
function getSwedishHolidays(year: number): Date[] {
  return [
    new Date(year, 0, 1),   // Nyårsdagen
    new Date(year, 0, 6),   // Trettondedag jul  
    new Date(year, 4, 1),   // Första maj
    new Date(year, 5, 6),   // Sveriges nationaldag
    new Date(year, 11, 24), // Julafton
    new Date(year, 11, 25), // Juldagen
    new Date(year, 11, 26), // Annandag jul
    new Date(year, 11, 31), // Nyårsafton
  ];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Söndag eller lördag
}

function isSwedishHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getSwedishHolidays(year);
  return holidays.some(holiday => 
    holiday.toDateString() === date.toDateString()
  );
}

/**
 * Calculate working days between two dates (inclusive)
 * Excludes weekends and Swedish holidays
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let workingDays = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (!isWeekend(currentDate) && !isSwedishHoliday(currentDate)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Calculate vacation days to deduct based on leave request
 * This should match the backend logic in server/lib/vacation-calculator.ts
 */
export function calculateVacationDeduction(
  leaveType: string,
  startDate: Date,
  endDate: Date,
  scope: string = 'full-day'
): number {
  // Only deduct for vacation types
  if (leaveType !== 'vacation') {
    return 0;
  }

  // Validate dates to prevent NaN
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn('Invalid dates in calculateVacationDeduction:', startDate, endDate);
    return 0;
  }

  // Ensure start date is not after end date
  if (startDate > endDate) {
    console.warn('Start date is after end date:', startDate, endDate);
    return 0;
  }

  const workingDays = calculateWorkingDays(startDate, endDate);

  // Safety check for NaN result
  if (isNaN(workingDays)) {
    console.warn('NaN result from calculateWorkingDays:', startDate, endDate);
    return 0;
  }

  // Handle partial days
  if (scope === 'morning' || scope === 'afternoon') {
    return workingDays * 0.5;
  }

  return workingDays;
}

/**
 * Check if a date is a working day (not weekend or holiday)
 */
export function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isSwedishHoliday(date);
}

/**
 * Get a human-readable description of holidays/weekends
 */
export function getDateDescription(date: Date): string {
  if (isWeekend(date)) {
    return date.getDay() === 0 ? 'Söndag' : 'Lördag';
  }
  if (isSwedishHoliday(date)) {
    const year = date.getFullYear();
    const holidays = getSwedishHolidays(year);
    const holiday = holidays.find(h => h.toDateString() === date.toDateString());
    // Map holidays to Swedish names
    const holidayNames: { [key: string]: string } = {
      [`${year}-01-01`]: 'Nyårsdagen',
      [`${year}-01-06`]: 'Trettondedag jul',
      [`${year}-05-01`]: 'Första maj',
      [`${year}-06-06`]: 'Sveriges nationaldag',
      [`${year}-12-24`]: 'Julafton',
      [`${year}-12-25`]: 'Juldagen',
      [`${year}-12-26`]: 'Annandag jul',
      [`${year}-12-31`]: 'Nyårsafton',
    };
    const key = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidayNames[key] || 'Helgdag';
  }
  return 'Arbetsdag';
}