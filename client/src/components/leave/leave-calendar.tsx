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

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  totalDays: number;
}

export default function LeaveCalendar() {
  const { t } = useI18n();
  const { user } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Fetch leave requests
  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['/api/leave-requests', user.currentUser?.employeeId],
    queryFn: () => apiService.getLeaveRequests(user.currentUser?.employeeId || ''),
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

  // Check if a date has leave (exclude rejected requests)
  const getLeaveForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return leaveRequests.filter((leave: LeaveRequest) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const checkDate = new Date(dateStr);
      // Only show approved and pending requests in calendar
      return (checkDate >= start && checkDate <= end) && leave.status !== 'rejected';
    });
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
          <span className="flex items-center gap-2">
            📅 Kalenderöversikt
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid with Swedish Week Numbers */}
        <div className="grid grid-cols-8 gap-1 mb-4">
          {/* Header row with week number column */}
          <div className="p-2 text-center text-sm font-medium text-gray-500">
            v.
          </div>
          {/* Header days - European/Swedish standard (Monday start) */}
          {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar weeks with week numbers */}
          {calendarWeeks.map((week, weekIndex) => {
            // Get week number from first Monday of the week (ISO 8601 standard)
            const weekNumber = getISOWeek(week[0]); // week[0] is Monday
            
            return (
              <React.Fragment key={weekIndex}>
                {/* Week number column */}
                <div className="min-h-[80px] p-2 border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    v.{weekNumber}
                  </span>
                </div>
                
                {/* Days in the week */}
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayLeaves = getLeaveForDate(day);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`
                        min-h-[80px] p-1 border border-gray-200 relative
                        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isToday ? 'text-blue-600 font-bold' : ''}
                      `}>
                        {day.getDate()}
                      </div>
                      
                      {/* Leave indicators */}
                      <div className="space-y-1">
                        {dayLeaves.slice(0, 2).map((leave: LeaveRequest, idx) => (
                          <div
                            key={idx}
                            className={`
                              text-xs px-1 py-0.5 rounded text-center
                              ${getStatusColor(leave.status)}
                            `}
                            title={`${leave.leaveType} - ${leave.status}`}
                          >
                            <span className="mr-1">{getLeaveTypeIcon(leave.leaveType)}</span>
                            {leave.leaveType === 'vacation' || leave.leaveType === 'semester' ? 'Semester' : 
                             leave.leaveType === 'sick' || leave.leaveType === 'sjuk' ? 'Sjuk' :
                             leave.leaveType}
                          </div>
                        ))}
                        {dayLeaves.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayLeaves.length - 2} mer
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Godkänd</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Väntar på svar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 ring-2 ring-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Idag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">v.</span>
            </div>
            <span className="text-sm text-gray-600">Veckonummer (ISO 8601)</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {leaveRequests.filter((l: LeaveRequest) => l.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Godkända</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {leaveRequests.filter((l: LeaveRequest) => l.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Väntar på svar</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {leaveRequests.reduce((sum: number, l: LeaveRequest) => 
                  l.status === 'approved' ? sum + (l.totalDays || 0) : sum, 0
                )}
              </div>
              <div className="text-sm text-gray-500">Dagar använda</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}