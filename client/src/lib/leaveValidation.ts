import { LeaveRequest } from '@shared/schema';

export interface DateOverlapResult {
  hasOverlap: boolean;
  conflictingRequests: LeaveRequest[];
  message?: string;
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const startDate1 = new Date(start1);
  const endDate1 = new Date(end1);
  const startDate2 = new Date(start2);
  const endDate2 = new Date(end2);
  
  // Two ranges overlap if: start1 <= end2 AND start2 <= end1
  return startDate1 <= endDate2 && startDate2 <= endDate1;
}

/**
 * Check for date overlaps in leave requests
 */
export function checkLeaveRequestOverlap(
  newRequest: { startDate: string; endDate: string; employeeId: string },
  existingRequests: LeaveRequest[],
  excludeRequestId?: number
): DateOverlapResult {
  // Only check against approved and pending requests for the same employee
  const relevantRequests = existingRequests.filter(request => 
    request.employeeId === newRequest.employeeId &&
    ['approved', 'pending'].includes(request.status) &&
    (excludeRequestId ? request.id !== excludeRequestId : true)
  );
  
  const conflictingRequests = relevantRequests.filter(request =>
    doDateRangesOverlap(
      newRequest.startDate,
      newRequest.endDate,
      request.startDate,
      request.endDate
    )
  );
  
  if (conflictingRequests.length > 0) {
    const conflictDates = conflictingRequests.map(req => {
      const start = new Date(req.startDate).toLocaleDateString('sv-SE');
      const end = new Date(req.endDate).toLocaleDateString('sv-SE');
      return start === end ? start : `${start} - ${end}`;
    }).join(', ');
    
    return {
      hasOverlap: true,
      conflictingRequests,
      message: `Överlappning med befintlig ledighet: ${conflictDates}. Du kan inte ansöka om ledighet för dagar som redan är bokade.`
    };
  }
  
  return {
    hasOverlap: false,
    conflictingRequests: []
  };
}

/**
 * Get all dates in a date range
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Check if a specific date has existing leave
 */
export function isDateBooked(
  date: string,
  existingRequests: LeaveRequest[],
  employeeId: string
): boolean {
  return existingRequests.some(request =>
    request.employeeId === employeeId &&
    ['approved', 'pending'].includes(request.status) &&
    date >= request.startDate &&
    date <= request.endDate
  );
}