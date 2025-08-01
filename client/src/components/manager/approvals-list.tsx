import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { useI18n } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils/date";
import DeviationDetails from "@/components/deviations/deviation-details";
import { getWorkflowInfo, getManagerActionText, getStatusText } from "@/lib/approvalWorkflows";
import type { TimeCode } from "@shared/schema";

type ApprovalType = 'deviations' | 'leaveRequests';

interface ApprovalsListProps {
  type: ApprovalType;
}

const ApprovalsList = ({ type }: ApprovalsListProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  
  // Fetch pending approvals
  const { user } = useStore();
  const managerId = user.currentUser?.employeeId;
  
  const { data: pendingItems = [], isLoading, error, refetch } = useQuery({
    queryKey: [`/api/manager/${type}/pending`, managerId],
    queryFn: async () => {
      if (type === 'deviations') {
        return await apiService.getPendingDeviations(managerId);
      } else {
        return await apiService.getPendingLeaveRequests();
      }
    },
  });

  // Fetch time codes to determine workflow types
  const { data: timeCodes = [] } = useQuery({
    queryKey: ['/api/timecodes'],
    queryFn: () => apiService.getTimeCodes(),
  });

  // Helper function to get time code for a deviation
  const getTimeCodeForDeviation = (timeCodeStr: string): TimeCode | undefined => {
    return timeCodes.find(tc => tc.code === timeCodeStr);
  };
  
  // Approve all mutation
  const approveAllMutation = useMutation({
    mutationFn: async () => {
      if (!pendingItems || pendingItems.length === 0) return;
      
      const promises = pendingItems.map((item) => {
        const endpoint = type === 'deviations' 
          ? `/api/manager/deviations/${item.id}/approve` 
          : `/api/manager/leave-requests/${item.id}/approve`;
          
        return apiRequest('POST', endpoint, {});
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manager/${type}/pending`] });
      toast({
        title: t('manager.approveAllSuccess'),
        description: t('manager.approveAllSuccessDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('manager.approveAllError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  const handleApproveAll = () => {
    if (window.confirm(t('manager.confirmApproveAll'))) {
      approveAllMutation.mutate();
    }
  };
  
  const handleSelectItem = (id: number) => {
    setSelectedItemId(id);
  };
  
  const handleBackToList = () => {
    setSelectedItemId(null);
    refetch();
  };
  
  // Show deviation details if an item is selected
  if (selectedItemId !== null) {
    if (type === 'deviations') {
      return <DeviationDetails deviationId={selectedItemId} onBack={handleBackToList} />;
    }
    
    // TODO: Add LeaveRequestDetails component when implemented
    return (
      <Card className="p-6">
        <Button onClick={handleBackToList}>{t('action.back')}</Button>
      </Card>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('manager.employee')}</TableHead>
                <TableHead>{type === 'deviations' ? t('deviations.date') : t('leave.period')}</TableHead>
                <TableHead>{type === 'deviations' ? t('deviations.timeCode') : t('leave.leaveType')}</TableHead>
                <TableHead>{type === 'deviations' ? t('deviations.time') : t('leave.scope')}</TableHead>
                <TableHead>{t('deviations.comment')}</TableHead>
                <TableHead className="text-right">{t('deviations.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-destructive">
          {t(type === 'deviations' ? 'manager.loadDeviationsError' : 'manager.loadLeaveRequestsError')}: 
          {(error as Error).message}
        </p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="mt-4"
        >
          {t('action.retry')}
        </Button>
      </div>
    );
  }
  
  // Show empty state
  if (!pendingItems || pendingItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <span className="material-icons text-4xl text-muted-foreground mb-2">task_alt</span>
        <h3 className="text-lg font-medium">
          {t(type === 'deviations' ? 'manager.noDeviations' : 'manager.noLeaveRequests')}
        </h3>
        <p className="text-muted-foreground">
          {t(type === 'deviations' ? 'manager.noDeviationsDescription' : 'manager.noLeaveRequestsDescription')}
        </p>
      </div>
    );
  }
  
  // Render the appropriate list based on type
  if (type === 'deviations') {
    return (
      <>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('manager.employee')}</TableHead>
                  <TableHead>{t('deviations.date')}</TableHead>
                  <TableHead>{t('deviations.timeCode')}</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>{t('deviations.time')}</TableHead>
                  <TableHead>{t('deviations.comment')}</TableHead>
                  <TableHead className="text-right">{t('deviations.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pendingItems as any[]).map((deviation: any) => {
                  const timeCode = getTimeCodeForDeviation(deviation.timeCode);
                  const workflow = timeCode ? getWorkflowInfo(timeCode) : null;
                  const actionText = workflow ? getManagerActionText(workflow.type) : { approveText: 'Godkänn', rejectText: 'Avslå' };
                  
                  return (
                    <TableRow 
                      key={deviation.id} 
                      className="hover:bg-background-dark transition-colors cursor-pointer"
                      onClick={() => handleSelectItem(deviation.id)}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 bg-primary bg-opacity-10">
                            <AvatarFallback className="text-primary">
                              {deviation.employeeId ? deviation.employeeId.substring(0, 2).toUpperCase() : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium">{deviation.employeeId}</div>
                            <div className="text-sm text-muted-foreground">ID: {deviation.employeeId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{deviation.date}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{deviation.timeCode}</div>
                          <div className="text-xs text-muted-foreground">{timeCode?.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {workflow && (
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-sm text-muted-foreground">
                              {workflow.icon}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${workflow.color}`}>
                              {workflow.title}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTime(deviation.startTime)} - {formatTime(deviation.endTime)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate-text">
                        {deviation.comment || '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button 
                          variant="link" 
                          className="text-[#4CAF50] hover:text-green-600 mr-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItem(deviation.id);
                          }}
                        >
                          {actionText.approveText}
                        </Button>
                        <Button 
                          variant="link" 
                          className="text-destructive hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItem(deviation.id);
                          }}
                        >
                          {actionText.rejectText}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="bg-background-dark px-4 py-3 text-right">
            <Button 
              className="bg-primary hover:bg-primary-dark text-white"
              onClick={handleApproveAll}
              disabled={approveAllMutation.isPending}
            >
              {t('action.approveAll')}
            </Button>
          </div>
        </div>
      </>
    );
  }
  
  // Leave requests list
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('manager.employee')}</TableHead>
                <TableHead>{t('leave.period')}</TableHead>
                <TableHead>{t('leave.leaveType')}</TableHead>
                <TableHead>{t('leave.scope')}</TableHead>
                <TableHead>{t('deviations.comment')}</TableHead>
                <TableHead className="text-right">{t('deviations.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pendingItems as any[]).map((leave: any) => (
                <TableRow 
                  key={leave.id} 
                  className="hover:bg-background-dark transition-colors cursor-pointer"
                  onClick={() => handleSelectItem(leave.id)}
                >
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 bg-primary bg-opacity-10">
                        <AvatarFallback className="text-primary">
                          {leave.employeeId.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{leave.employeeId}</div>
                        <div className="text-sm text-muted-foreground">ID: {leave.employeeId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {leave.startDate === leave.endDate 
                      ? leave.startDate 
                      : `${leave.startDate} - ${leave.endDate}`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{leave.leaveType}</TableCell>
                  <TableCell className="whitespace-nowrap">{leave.scope}</TableCell>
                  <TableCell className="max-w-xs truncate-text">
                    {leave.comment || '-'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button 
                      variant="link" 
                      className="text-[#4CAF50] hover:text-green-600 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(leave.id);
                      }}
                    >
                      {t('action.approve')}
                    </Button>
                    <Button 
                      variant="link" 
                      className="text-destructive hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(leave.id);
                      }}
                    >
                      {t('action.reject')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="bg-background-dark px-4 py-3 text-right">
          <Button 
            className="bg-primary hover:bg-primary-dark text-white"
            onClick={handleApproveAll}
            disabled={approveAllMutation.isPending}
          >
            {t('action.approveAll')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ApprovalsList;
