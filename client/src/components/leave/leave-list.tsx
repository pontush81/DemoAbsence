import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { apiService } from "@/lib/apiService";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LeaveRequest } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeaveListProps {
  onSelect?: (id: number) => void;
}

const LeaveList = ({ onSelect }: LeaveListProps) => {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId;
  
  // Filters
  const [filters, setFilters] = useState({
    period: 'all',
    status: 'all',
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
                <SelectItem value="all">{t('deviations.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('deviations.pending')}</SelectItem>
                <SelectItem value="approved">{t('deviations.approved')}</SelectItem>
                <SelectItem value="rejected">{t('deviations.rejected')}</SelectItem>
                <SelectItem value="draft">{t('deviations.draft')}</SelectItem>
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
        {renderFilters()}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden responsive-table-card mt-6">
          <div className="responsive-table-wrapper">
            <Table className="responsive-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap date-cell">{t('leave.period')}</TableHead>
                  <TableHead className="whitespace-nowrap type-cell">{t('leave.leaveType')}</TableHead>
                  <TableHead className="whitespace-nowrap scope-cell">{t('leave.scope')}</TableHead>
                  <TableHead className="whitespace-nowrap status-cell">{t('deviations.status')}</TableHead>
                  <TableHead className="comment-cell">{t('deviations.comment')}</TableHead>
                  <TableHead className="text-right whitespace-nowrap actions-cell">{t('deviations.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell data-label={t('leave.period')}>
                      <span><Skeleton className="h-4 w-36" /></span>
                    </TableCell>
                    <TableCell data-label={t('leave.leaveType')}>
                      <span><Skeleton className="h-4 w-32" /></span>
                    </TableCell>
                    <TableCell data-label={t('leave.scope')}>
                      <span><Skeleton className="h-4 w-24" /></span>
                    </TableCell>
                    <TableCell data-label={t('deviations.status')}>
                      <span><Skeleton className="h-5 w-20 rounded-full" /></span>
                    </TableCell>
                    <TableCell data-label={t('deviations.comment')}>
                      <span><Skeleton className="h-4 w-48" /></span>
                    </TableCell>
                    <TableCell data-label={t('deviations.actions')} className="text-right">
                      <span><Skeleton className="h-4 w-16 ml-auto" /></span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <p className="text-destructive">{t('leave.loadError')}: {(error as Error)?.message || 'Unknown error'}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            {t('action.retry')}
          </Button>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!leaveRequests || leaveRequests.length === 0) {
    return (
      <div>
        {renderFilters()}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6 text-center">
          <span className="material-icons text-4xl text-muted-foreground mb-2">event_busy</span>
          <h3 className="text-lg font-medium">{t('leave.noLeaveRequests')}</h3>
          <p className="text-muted-foreground">{t('leave.noLeaveRequestsDescription')}</p>
          <Link href="/leave/new">
            <Button className="mt-4 bg-accent hover:bg-accent-dark text-white">
              <span className="material-icons mr-2">add</span>
              {t('leave.newLeaveRequest')}
            </Button>
          </Link>
        </div>
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
  
  // Function to get translated scope
  const getScopeLabel = (scope: string) => {
    const scopeMap: Record<string, string> = {
      'full-day': t('leave.fullDay'),
      'morning': t('leave.morning'),
      'afternoon': t('leave.afternoon'),
      'custom': t('leave.customTime')
    };
    return scopeMap[scope] || scope;
  };
  
  return (
    <div>
      {renderFilters()}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden responsive-table-card mt-6">
        <div className="responsive-table-wrapper">
          <Table className="responsive-table">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap date-cell">{t('leave.period')}</TableHead>
                <TableHead className="whitespace-nowrap type-cell">{t('leave.leaveType')}</TableHead>
                <TableHead className="whitespace-nowrap scope-cell">{t('leave.scope')}</TableHead>
                <TableHead className="whitespace-nowrap status-cell">{t('deviations.status')}</TableHead>
                <TableHead className="comment-cell">{t('deviations.comment')}</TableHead>
                <TableHead className="text-right whitespace-nowrap actions-cell">{t('deviations.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((leave) => (
                <TableRow 
                  key={leave.id} 
                  className="hover:bg-background-dark transition-colors cursor-pointer"
                  onClick={() => handleRowClick(leave)}
                >
                  <TableCell className="whitespace-nowrap date-cell" data-label={t('leave.period')}>
                    <span>
                      {leave.startDate === leave.endDate 
                        ? leave.startDate 
                        : `${leave.startDate} - ${leave.endDate}`}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap type-cell" data-label={t('leave.leaveType')}>
                    <span>{getLeaveTypeLabel(leave.leaveType)}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap scope-cell" data-label={t('leave.scope')}>
                    <span>{getScopeLabel(leave.scope || '')}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap status-cell" data-label={t('deviations.status')}>
                    <StatusBadge status={leave.status as any} />
                  </TableCell>
                  <TableCell className="comment-cell truncate-text" data-label={t('deviations.comment')}>
                    <span>{leave.comment || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap actions-cell" data-label={t('deviations.actions')}>
                    {leave.status === 'draft' ? (
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary-dark"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/leave/edit/${leave.id}`);
                        }}
                      >
                        {t('action.edit')}
                      </Button>
                    ) : (
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary-dark"
                      >
                        {t('action.view')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination (simplified) */}
        <div className="px-4 py-3 bg-background-dark flex items-center justify-between border-t border-border">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pagination.showing')} <span className="font-medium">1</span> {t('pagination.to')} <span className="font-medium">{leaveRequests.length}</span> {t('pagination.of')} <span className="font-medium">{leaveRequests.length}</span> {t('pagination.results')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveList;