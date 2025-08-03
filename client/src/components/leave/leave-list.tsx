import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { apiService } from "@/lib/apiService";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LeaveRequest } from "@shared/schema";

interface LeaveListProps {
  onSelect?: (id: number) => void;
}

const LeaveList = ({ onSelect }: LeaveListProps) => {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId;
  
  // Filters - show all periods by default so users see their submitted requests immediately
  const [filters, setFilters] = useState({
    period: 'all', // Show all periods - users want to see their submitted requests immediately
    status: 'all', // Show all leave requests - complete overview for users
    leaveType: 'all',
  });
  
  // Fetch leave requests
  const { data: leaveRequests, isLoading, error } = useQuery({
    queryKey: ['/api/leave-requests', employeeId, filters],
    queryFn: () => employeeId 
      ? apiService.getLeaveRequests(employeeId, filters)
      : Promise.resolve([]),
    enabled: !!employeeId,
  });
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleRowClick = (leave: LeaveRequest) => {
    if (onSelect) {
      onSelect(leave.id);
    } else {
      setLocation(`/leave/${leave.id}`);
    }
  };
  
  // Render filters
  const renderFilters = () => (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="filter-period" className="block text-sm font-medium text-secondary mb-2">
              {t('deviations.period')}
            </label>
            <Select
              value={filters.period}
              onValueChange={(value) => handleFilterChange('period', value)}
            >
              <SelectTrigger id="filter-period">
                <SelectValue placeholder={t('deviations.period')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('leave.allPeriods')}</SelectItem>
                <SelectItem value="upcoming">{t('leave.upcoming')}</SelectItem>
                <SelectItem value="past">{t('leave.past')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="filter-status" className="block text-sm font-medium text-secondary mb-2">
              {t('deviations.status')}
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder={t('deviations.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📋 Alla statusar</SelectItem>
                <SelectItem value="pending">⏳ Väntande</SelectItem>
                <SelectItem value="approved">✅ Godkända</SelectItem>
                <SelectItem value="rejected">❌ Avslagna</SelectItem>
                <SelectItem value="draft">📝 Utkast</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="filter-type" className="block text-sm font-medium text-secondary mb-2">
              {t('leave.leaveType')}
            </label>
            <Select
              value={filters.leaveType}
              onValueChange={(value) => handleFilterChange('leaveType', value)}
            >
              <SelectTrigger id="filter-type">
                <SelectValue placeholder={t('leave.leaveType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('leave.allTypes')}</SelectItem>
                <SelectItem value="vacation">{t('leave.vacation')}</SelectItem>
                <SelectItem value="comp-leave">{t('leave.compLeave')}</SelectItem>
                <SelectItem value="unpaid-leave">{t('leave.unpaidLeave')}</SelectItem>
                <SelectItem value="parental-leave">{t('leave.parentalLeave')}</SelectItem>
                <SelectItem value="study-leave">{t('leave.studyLeave')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => {}} // Already updating on select change
            className="bg-primary hover:bg-primary-dark text-white h-10"
          >
            {t('action.filter')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render loading state
  if (isLoading) {
    return (
      <div>
        {/* Loading info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Laddar din ledighetsplanering
              </h3>
              <p className="mt-1 text-sm text-blue-600">
                Vi hämtar kommande och pågående ledighetsansökningar för bästa översikt
              </p>
            </div>
          </div>
        </div>
        
        {renderFilters()}
        
        {/* Loading skeleton cards */}
        <div className="mt-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32" />
              <div className="flex-1 h-px bg-gray-200"></div>
              <Skeleton className="h-4 w-20" />
            </div>
            
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-l-4 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div>
        {renderFilters()}
        <Card className="mt-6 text-center p-8">
          <CardContent className="space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900">Ett fel uppstod</h3>
            <p className="text-red-600">{t('leave.loadError')}: {(error as Error)?.message || 'Unknown error'}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              <span className="mr-2">🔄</span>
              {t('action.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render empty state
  if (!leaveRequests || leaveRequests.length === 0) {
    return (
      <div>
        {renderFilters()}
        <Card className="mt-6 text-center p-8">
          <CardContent className="space-y-4">
            <div className="text-6xl mb-4">🏖️</div>
            <h3 className="text-lg font-medium text-gray-900">{t('leave.noLeaveRequests')}</h3>
            <p className="text-gray-600">{t('leave.noLeaveRequestsDescription')}</p>
            <Link href="/leave/new">
              <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3">
                <span className="mr-2">📅</span>
                {t('leave.newLeaveRequest')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Function to get translated leave type
  const getLeaveTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'vacation': t('leave.vacation'),
      'comp-leave': t('leave.compLeave'),
      'unpaid-leave': t('leave.unpaidLeave'),
      'parental-leave': t('leave.parentalLeave'),
      'study-leave': t('leave.studyLeave')
    };
    return typeMap[type] || type;
  };
  
  // Function to get smart duration label instead of just "Heldag"
  const getDurationLabel = (leave: any) => {
    const scope = leave.scope || 'full-day';
    
    // For non-full-day leaves, show the traditional scope
    if (scope !== 'full-day') {
      const scopeMap: Record<string, string> = {
        'morning': t('leave.morning'),
        'afternoon': t('leave.afternoon'),
        'custom': t('leave.customTime')
      };
      return scopeMap[scope] || scope;
    }
    
    // For full-day leaves, calculate and show duration intelligently
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end day
    
    if (daysDiff === 1) {
      return '1 dag';
    } else if (daysDiff === 5) {
      return '1 vecka (5 dagar)';
    } else if (daysDiff === 10) {
      return '2 veckor (10 dagar)';
    } else if (daysDiff === 15) {
      return '3 veckor (15 dagar)';
    } else if (daysDiff === 20) {
      return '4 veckor (20 dagar)';
    } else if (daysDiff === 25) {
      return '5 veckor (25 dagar)';
    } else if (daysDiff > 20) {
      const weeks = Math.floor(daysDiff / 5);
      return `${weeks} veckor (${daysDiff} dagar)`;
    } else {
      return `${daysDiff} dagar`;
    }
  };
  
  // Sort leave requests by date (newest first) for better UX
  const sortedLeaveRequests = leaveRequests?.slice().sort((a, b) => {
    // Sort by startDate in descending order (newest first)
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  }) || [];
  
  // Helper function to get leave type icon
  const getLeaveTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'vacation': '🏖️',
      'comp-leave': '⚖️',
      'unpaid-leave': '💸',
      'parental-leave': '👶',
      'study-leave': '📚'
    };
    return iconMap[type] || '📅';
  };

  // Helper function to get status color and icon
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; icon: string; text: string }> = {
      'approved': { color: 'text-green-700', bg: 'bg-green-100', icon: '✅', text: 'Godkänd' },
      'pending': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳', text: 'Väntande' },
      'rejected': { color: 'text-red-700', bg: 'bg-red-100', icon: '❌', text: 'Ej godkänd' },
      'draft': { color: 'text-gray-700', bg: 'bg-gray-100', icon: '📝', text: 'Utkast' },
      'paused': { color: 'text-blue-700', bg: 'bg-blue-100', icon: '⏸️', text: 'Pausad' }
    };
    return statusMap[status] || statusMap['pending'];
  };

  // Group leave requests by month for better organization
  const groupLeavesByMonth = (leaves: typeof sortedLeaveRequests) => {
    const groups: Record<string, typeof leaves> = {};
    
    leaves.forEach(leave => {
      const date = new Date(leave.startDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(leave);
    });

    // Sort months in descending order (newest first)
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(monthKey => {
        const date = new Date(monthKey + '-01');
        const monthName = date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
        return {
          monthKey,
          monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          leaves: groups[monthKey].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        };
      });
  };

  const groupedLeaves = groupLeavesByMonth(sortedLeaveRequests);

  return (
    <div>
      {renderFilters()}
      
      <div className="mt-6 space-y-8">
        {groupedLeaves.map(({ monthKey, monthName, leaves }) => (
          <div key={monthKey} className="space-y-4">
            {/* Month Header */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">📅 {monthName}</h3>
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-500">{leaves.length} ansökningar</span>
            </div>

            {/* Leave Cards */}
            <div className="grid gap-4">
              {leaves.map((leave) => {
                const statusInfo = getStatusInfo(leave.status);
                const leaveIcon = getLeaveTypeIcon(leave.leaveType);
                
                return (
                  <Card 
                    key={leave.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
                    style={{ borderLeftColor: statusInfo.color.includes('green') ? '#10b981' : 
                                               statusInfo.color.includes('yellow') ? '#f59e0b' :
                                               statusInfo.color.includes('red') ? '#ef4444' : '#6b7280' }}
                    onClick={() => handleRowClick(leave)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        {/* Main Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{leaveIcon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getLeaveTypeLabel(leave.leaveType)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {leave.startDate === leave.endDate 
                                  ? leave.startDate 
                                  : `${leave.startDate} - ${leave.endDate}`}
                              </p>
                            </div>
                          </div>

                          {/* Duration and Comment */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>⏱️ {getDurationLabel(leave)}</span>
                            {leave.comment && (
                              <span className="truncate max-w-xs">💬 {leave.comment}</span>
                            )}
                          </div>
                        </div>

                        {/* Status and Action */}
                        <div className="flex flex-col items-end gap-2">
                          <span 
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                          >
                            <span>{statusInfo.icon}</span>
                            {statusInfo.text}
                          </span>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (leave.status === 'draft') {
                                setLocation(`/leave/edit/${leave.id}`);
                              } else {
                                handleRowClick(leave);
                              }
                            }}
                          >
                            {leave.status === 'draft' ? '✏️ Redigera' : '👁️ Visa'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Summary Footer */}
        {sortedLeaveRequests.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              📊 Totalt <span className="font-medium">{sortedLeaveRequests.length}</span> ledighetsansökningar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveList;