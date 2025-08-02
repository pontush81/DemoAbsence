/**
 * Vacation Balance Calculator
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

  const workingDays = calculateWorkingDays(startDate, endDate);

  // Handle partial days
  if (scope === 'morning' || scope === 'afternoon') {
    return workingDays * 0.5;
  }

  return workingDays;
}

/**
 * Update employee vacation balance
 */
export async function updateVacationBalance(
  employeeId: string,
  daysToDeduct: number,
  supabase?: any
): Promise<void> {
  if (daysToDeduct <= 0) return;

  let supabaseSuccess = false;

  try {
    if (supabase) {
      // Update in Supabase
      const { error } = await supabase
        .from('time_balances')
        .update({
          vacation_days: supabase.raw(`vacation_days - ${daysToDeduct}`),
          last_updated: new Date().toISOString()
        })
        .eq('employee_id', employeeId);

      if (error) throw error;
      console.log(`🎯 Updated vacation balance in Supabase for ${employeeId}: -${daysToDeduct} days`);
      supabaseSuccess = true;
    }
  } catch (error) {
    console.error('Failed to update vacation balance in Supabase:', error);
  }

  // Fallback: Update mock data if Supabase failed or not available
  if (!supabaseSuccess) {
    try {
      console.log(`📁 Falling back to mock data update for ${employeeId}`);
      const { getMockData, saveMockData } = await import('../storage.js');
      
      const timeBalances = await getMockData('timebalances.json');
      let updated = false;

      // Update all entries for this employee (there might be multiple)
      for (let i = 0; i < timeBalances.length; i++) {
        if (timeBalances[i].employeeId === employeeId) {
          timeBalances[i].vacationDays = Math.max(0, timeBalances[i].vacationDays - daysToDeduct);
          timeBalances[i].lastUpdated = new Date().toISOString();
          updated = true;
          console.log(`📁 Updated mock data for ${employeeId}: ${timeBalances[i].vacationDays} days remaining`);
        }
      }

      if (updated) {
        await saveMockData('timebalances.json', timeBalances);
        console.log(`✅ Mock data saved successfully for ${employeeId}`);
      } else {
        console.warn(`⚠️ No time balance found for employee ${employeeId} in mock data`);
      }
    } catch (mockError) {
      console.error('Failed to update mock data vacation balance:', mockError);
    }
  }
}