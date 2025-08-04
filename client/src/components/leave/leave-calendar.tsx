import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/apiService';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { getISOWeek } from 'date-fns';
import { calculateVacationDeduction, isWorkingDay, getDateDescription } from '@/lib/vacation-calculator';

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  scope?: string;
  employeeId?: string;
  totalDays: number;
}

export default function LeaveCalendar() {
  const { t } = useI18n();
  const { user } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentUserId = user.currentUser?.employeeId || user.currentUser?.id;
  
  // Fetch leave requests
  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['/api/leave-requests', currentUserId],
    queryFn: () => apiService.getLeaveRequests(currentUserId || ''),
  });

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and calculate calendar grid (European/Swedish standard - Monday start)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  
  // Calculate Monday start (European standard)
  const dayOfWeek = firstDay.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days to Monday
  startDate.setDate(startDate.getDate() + mondayOffset);
  
  const endDate = new Date(lastDay);
  const lastDayOfWeek = lastDay.getDay();
  const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek; // Go forward to Sunday
  endDate.setDate(endDate.getDate() + sundayOffset);
  
  // Generate calendar days grouped by weeks
  const calendarWeeks = [];
  let currentWeek = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    currentWeek.push(new Date(current));
    
    // If it's Sunday (end of week in European calendar), start new week
    if (current.getDay() === 0) {
      calendarWeeks.push(currentWeek);
      currentWeek = [];
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  // Add the last week if it has days
  if (currentWeek.length > 0) {
    calendarWeeks.push(currentWeek);
  }

  // Check if a date has leave (exclude rejected requests and deduplicate)
  const getLeaveForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const matchingLeaves = leaveRequests.filter((leave: LeaveRequest) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const checkDate = new Date(dateStr);
      // Only show approved and pending requests in calendar
      return (checkDate >= start && checkDate <= end) && leave.status !== 'rejected';
    });

    // Deduplicate by grouping same employee + same type + overlapping dates
    const deduplicatedLeaves = matchingLeaves.reduce((acc: LeaveRequest[], current: LeaveRequest) => {
      const existing = acc.find(item => 
        item.employeeId === current.employeeId && 
        item.leaveType === current.leaveType &&
        // Check if they overlap (same day or period)
        (new Date(item.startDate) <= new Date(current.endDate) && 
         new Date(item.endDate) >= new Date(current.startDate))
      );
      
      if (!existing) {
        acc.push(current);
      } else {
        // Keep the most recent/relevant one (approved over pending, higher ID)
        if (current.status === 'approved' && existing.status === 'pending') {
          const index = acc.indexOf(existing);
          acc[index] = current;
        } else if (current.status === existing.status && current.id > existing.id) {
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
      }
      return acc;
    }, []);

    return deduplicatedLeaves;
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case 'vacation':
      case 'semester':
        return '🏖️';
      case 'sick':
      case 'sjuk':
        return '🤒';
      case 'personal':
      case 'vab':
        return '👨‍👩‍👧‍👦';
      case 'parental':
      case 'föräldraledig':
        return '👶';
      default:
        return '📅';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laddar kalender...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 w-full justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={previousMonth}
              className="min-w-[40px] h-8 sm:h-9"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] sm:min-w-[150px] text-center font-medium text-sm sm:text-base px-2">
              {currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextMonth}
              className="min-w-[40px] h-8 sm:h-9"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid with Swedish Week Numbers - Mobile Optimized */}
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-0.5 sm:gap-1 mb-4">
          {/* Header row with week number column - Hidden on mobile */}
          <div className="hidden sm:block p-2 text-center text-sm font-medium text-gray-500">
            v.
          </div>
          {/* Header days - European/Swedish standard (Monday start) */}
          {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day, index) => (
            <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
              {/* Show abbreviated version on mobile */}
              <span className="sm:hidden">{day.substring(0, 1)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
          
          {/* Calendar weeks with week numbers */}
          {calendarWeeks.map((week, weekIndex) => {
            // Get week number from first Monday of the week (ISO 8601 standard)
            const weekNumber = getISOWeek(week[0]); // week[0] is Monday
            
            return (
              <React.Fragment key={weekIndex}>
                {/* Week number column - Hidden on mobile */}
                <div className="hidden sm:flex min-h-[60px] sm:min-h-[80px] p-2 border border-gray-200 bg-gray-50 items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    v.{weekNumber}
                  </span>
                </div>
                
                {/* Days in the week */}
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayLeaves = getLeaveForDate(day);
                  
                  // Add subtle background color for days with leave and indicate working days
                  const hasApprovedLeave = dayLeaves.some(l => l.status === 'approved');
                  const hasPendingLeave = dayLeaves.some(l => l.status === 'pending');
                  const isWorkingDayToday = isWorkingDay(day);
                  const dateDesc = getDateDescription(day);
                  
                  let dayBackgroundClass = '';
                  if (hasApprovedLeave) {
                    dayBackgroundClass = 'bg-green-50';
                  } else if (hasPendingLeave) {
                    dayBackgroundClass = 'bg-yellow-50';
                  } else if (isCurrentMonth) {
                    if (isWorkingDayToday) {
                      dayBackgroundClass = 'bg-white';
                    } else {
                      dayBackgroundClass = 'bg-gray-100'; // Different color for weekends/holidays
                    }
                  } else {
                    dayBackgroundClass = 'bg-gray-50';
                  }
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`
                        min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border border-gray-200 relative
                        ${dayBackgroundClass}
                        ${isToday ? 'ring-1 sm:ring-2 ring-blue-500' : ''}
                        hover:bg-gray-100 transition-colors duration-150
                      `}
                    >
                      <div className={`
                        text-xs sm:text-sm font-medium mb-1
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isToday ? 'text-blue-600 font-bold' : ''}
                        ${!isWorkingDayToday && isCurrentMonth ? 'text-gray-500' : ''}
                      `}>
                        {day.getDate()}
                        {/* Show indicator for non-working days - Simplified on mobile */}
                        {!isWorkingDayToday && isCurrentMonth && (
                          <div className="text-xs text-gray-400 leading-none hidden sm:block" title={dateDesc}>
                            {dateDesc === 'Lördag' || dateDesc === 'Söndag' ? '⌛' : '🎉'}
                          </div>
                        )}
                      </div>
                      
                      {/* Clean status indicator - No dots, use background color + simple text */}
                      {dayLeaves.length > 0 && (
                        <div className="absolute top-1 right-1">
                          <div className={`
                            px-1 py-0.5 rounded text-xs font-medium
                            ${hasApprovedLeave ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}
                          `}>
                            {dayLeaves.length}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Simplified Legend - Focus on essential status info */}
        <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Godkänd ledighet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">⏳</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Väntar på svar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 ring-2 ring-blue-500 bg-blue-50 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Idag</span>
          </div>
        </div>

        {/* Summary Statistics - Improved clarity and visual hierarchy */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Översikt</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {leaveRequests.filter((l: LeaveRequest) => l.status === 'approved').length}
                  </div>
                  <div className="text-sm font-medium text-green-700">Godkända ansökningar</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⏳</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {leaveRequests.filter((l: LeaveRequest) => l.status === 'pending').length}
                  </div>
                  <div className="text-sm font-medium text-yellow-700">Väntar på svar</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📅</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {leaveRequests.reduce((sum: number, l: LeaveRequest) => {
                      if (l.status === 'approved' && l.startDate && l.endDate) {
                        const start = new Date(l.startDate);
                        const end = new Date(l.endDate);
                        const vacationDaysUsed = calculateVacationDeduction(l.leaveType, start, end, l.scope || 'full-day');
                        return sum + vacationDaysUsed;
                      }
                      return sum;
                    }, 0)}
                  </div>
                  <div className="text-sm font-medium text-blue-700">Arbetsdagar använda</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}