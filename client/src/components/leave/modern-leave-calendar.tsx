import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/apiService';
import { useStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  getISOWeek,
  isWeekend
} from 'date-fns';
import { sv } from 'date-fns/locale';

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: 'pending' | 'approved' | 'rejected';
  scope?: string;
  employeeId?: string;
  totalDays: number;
  comment?: string;
}

const LEAVE_TYPE_COLORS = {
  vacation: { 
    bg: 'bg-emerald-100 hover:bg-emerald-200', 
    border: 'border-emerald-300', 
    text: 'text-emerald-800',
    icon: '🏖️'
  },
  sick: { 
    bg: 'bg-red-100 hover:bg-red-200', 
    border: 'border-red-300', 
    text: 'text-red-800',
    icon: '🤒'
  },
  parental: { 
    bg: 'bg-purple-100 hover:bg-purple-200', 
    border: 'border-purple-300', 
    text: 'text-purple-800',
    icon: '👶'
  },
  personal: { 
    bg: 'bg-blue-100 hover:bg-blue-200', 
    border: 'border-blue-300', 
    text: 'text-blue-800',
    icon: '📋'
  }
};

const STATUS_STYLES = {
  pending: { opacity: 'opacity-75', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  approved: { opacity: 'opacity-100', badge: 'bg-green-100 text-green-800 border-green-300' },
  rejected: { opacity: 'opacity-50', badge: 'bg-red-100 text-red-800 border-red-300' }
};

export default function ModernLeaveCalendar() {
  const { t } = useI18n();
  const { user } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredRange, setHoveredRange] = useState<{ start: Date; end: Date } | null>(null);
  const currentUserId = user.currentUser?.employeeId || user.currentUser?.id;
  
  // Fetch leave requests
  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['/api/leave-requests', currentUserId],
    queryFn: () => apiService.getLeaveRequests(currentUserId || ''),
  });

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group leave requests by date for quick lookup
  const leaveByDate = useMemo(() => {
    const map = new Map<string, LeaveRequest[]>();
    
    leaveRequests.forEach((leave: LeaveRequest) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = eachDayOfInterval({ start, end });
      
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(leave);
      });
    });
    
    return map;
  }, [leaveRequests]);

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  // Get leave requests for a specific day (exclude rejected)
  const getDayLeaves = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayLeaves = leaveByDate.get(dateKey) || [];
    // Filter out rejected leave requests
    return dayLeaves.filter(leave => leave.status !== 'rejected');
  };

  // Check if day has any leaves
  const hasLeave = (day: Date) => getDayLeaves(day).length > 0;

  // Get primary leave for day (first one)
  const getPrimaryLeave = (day: Date) => getDayLeaves(day)[0];

  // Render calendar day
  const renderDay = (day: Date, dayIndex: number) => {
    const dayLeaves = getDayLeaves(day);
    const primaryLeave = dayLeaves[0];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isCurrentDay = isToday(day);
    const isWeekendDay = isWeekend(day);
    const hasMultipleLeaves = dayLeaves.length > 1;

    // Get styling based on leave type and status
    const getLeaveStyle = () => {
      if (!primaryLeave) return null;
      
      const typeStyle = LEAVE_TYPE_COLORS[primaryLeave.leaveType as keyof typeof LEAVE_TYPE_COLORS] || LEAVE_TYPE_COLORS.personal;
      const statusStyle = STATUS_STYLES[primaryLeave.status];
      
      return {
        ...typeStyle,
        opacity: statusStyle.opacity
      };
    };

    const leaveStyle = getLeaveStyle();

    return (
      <div 
        key={dayIndex}
        className={`
          relative min-h-[80px] p-2 border border-gray-100 transition-all duration-200 cursor-pointer
          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
          ${isCurrentDay ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${isWeekendDay && isCurrentMonth ? 'bg-gray-50' : ''}
          ${leaveStyle ? `${leaveStyle.bg} ${leaveStyle.border}` : 'hover:bg-gray-50'}
          ${!isCurrentMonth ? 'opacity-40' : ''}
        `}
        onClick={() => {
          if (isCurrentMonth) {
            // TODO: Open leave application modal
            console.log('Open leave application for', format(day, 'yyyy-MM-dd'));
          }
        }}
      >
        {/* Day number */}
        <div className={`
          text-sm font-medium mb-1
          ${isCurrentDay ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
          ${leaveStyle ? leaveStyle.text : 'text-gray-900'}
          ${!isCurrentMonth ? 'text-gray-400' : ''}
        `}>
          {format(day, 'd')}
        </div>

        {/* Leave indicator */}
        {primaryLeave && (
          <div className="space-y-1">
            <div className={`
              text-xs px-2 py-1 rounded-md font-medium truncate
              ${leaveStyle?.bg} ${leaveStyle?.text}
              ${STATUS_STYLES[primaryLeave.status].opacity}
            `}>
              <span className="mr-1">{LEAVE_TYPE_COLORS[primaryLeave.leaveType as keyof typeof LEAVE_TYPE_COLORS]?.icon || '📋'}</span>
              {t(`leave.${primaryLeave.leaveType}`) || primaryLeave.leaveType}
            </div>
            
            {/* Status badge - only show if pending */}
            {primaryLeave.status === 'pending' && (
              <Badge className={`
                text-xs px-1 py-0.5 h-auto
                ${STATUS_STYLES[primaryLeave.status].badge}
              `}>
                {t(`status.${primaryLeave.status}`)}
              </Badge>
            )}

            {/* Multiple leaves indicator */}
            {hasMultipleLeaves && (
              <div className="text-xs text-gray-500">
                +{dayLeaves.length - 1} mer
              </div>
            )}
          </div>
        )}

        {/* Week number (Monday only) */}
        {format(day, 'E', { locale: sv }) === 'mån' && (
          <div className="absolute -left-10 top-2 text-xs text-gray-400 font-medium">
            v.{getISOWeek(day)}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <Card className="shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {format(currentDate, 'MMMM yyyy', { locale: sv })}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Hantera och ansök om ledighet
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-9 w-9 p-0 hover:bg-white/80 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 hover:bg-white/80 transition-colors"
              >
                Idag
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-9 w-9 p-0 hover:bg-white/80 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              
              <Button 
                className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ansök om ledighet
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar grid */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            <div className="w-12 text-xs text-gray-400 text-center py-2">Vecka</div> {/* Space for week numbers */}
            {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day, index) => (
              <div key={day} className={`
                text-center text-sm font-semibold py-2
                ${index >= 5 ? 'text-gray-400' : 'text-gray-700'}
              `}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="relative">
            <div className="grid grid-cols-7 gap-2">
              <div className="w-12"></div> {/* Empty space for week number column */}
              {calendarDays.map((day, index) => renderDay(day, index))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="font-medium text-gray-700">Förklaring:</div>
            {Object.entries(LEAVE_TYPE_COLORS).map(([type, style]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${style.bg} ${style.border} border`}></div>
                <span>{style.icon} {t(`leave.${type}`) || type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {leaveRequests.filter((l: LeaveRequest) => l.status === 'approved').length}
                </div>
                <div className="text-sm text-green-600">Godkända ansökningar</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <span className="text-xl">⏳</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-700">
                  {leaveRequests.filter((l: LeaveRequest) => l.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-600">Väntar på svar</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {leaveRequests.reduce((sum: number, l: LeaveRequest) => {
                    if (l.status === 'approved') {
                      // Safety check for NaN
                      const totalDays = l.totalDays || 0;
                      if (isNaN(totalDays)) {
                        console.warn('NaN totalDays in leave request:', l);
                        return sum;
                      }
                      return sum + totalDays;
                    }
                    return sum;
                  }, 0)}
                </div>
                <div className="text-sm text-blue-600">Semesterdagar använda</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}