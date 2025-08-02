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
import { useStore } from "@/lib/store";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils/date";
import DeviationDetails from "@/components/deviations/deviation-details";
import { getWorkflowInfo, getManagerActionText, getStatusText } from "@/lib/approvalWorkflows";
import type { TimeCode } from "@shared/schema";

type ApprovalType = 'deviations' | 'leaveRequests' | 'history';

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
    queryKey: [`/api/manager/${type}${type === 'history' ? '' : '/pending'}`, managerId],
    queryFn: async () => {
      if (type === 'deviations') {
        return await apiService.getPendingDeviations(managerId);
      } else if (type === 'leaveRequests') {
        return await apiService.getPendingLeaveRequests();
      } else if (type === 'history') {
        // Fetch both approved and rejected items separately
        const [
          approvedDeviations,
          rejectedDeviations,
          approvedLeaveRequests,
          rejectedLeaveRequests
        ] = await Promise.all([
          apiService.getAllDeviations({ status: 'approved' }),
          apiService.getAllDeviations({ status: 'rejected' }),
          apiService.getAllLeaveRequests({ status: 'approved' }),
          apiService.getAllLeaveRequests({ status: 'rejected' })
        ]);
        
        // Combine all items and sort by decision date (newest first)
        const combined = [
          ...approvedDeviations.map((d: any) => ({ ...d, itemType: 'deviation' })),
          ...rejectedDeviations.map((d: any) => ({ ...d, itemType: 'deviation' })),
          ...approvedLeaveRequests.map((l: any) => ({ ...l, itemType: 'leaveRequest' })),
          ...rejectedLeaveRequests.map((l: any) => ({ ...l, itemType: 'leaveRequest' }))
        ].sort((a, b) => {
          const dateA = new Date(a.approvedAt || a.approved_at || a.rejectedAt || a.rejected_at || a.lastUpdated || a.last_updated);
          const dateB = new Date(b.approvedAt || b.approved_at || b.rejectedAt || b.rejected_at || b.lastUpdated || b.last_updated);
          return dateB.getTime() - dateA.getTime();
        });
        
        return combined;
      }
      return [];
    },
  });

  // Fetch time codes to determine workflow types
  const { data: timeCodes = [] } = useQuery({
    queryKey: ['/api/timecodes'],
    queryFn: () => apiService.getTimeCodes(),
  });

  // Fetch employees to display names instead of just IDs
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiService.getAllEmployees(),
  });

  // Helper function to get employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e: any) => 
      (e.employeeId === employeeId) || (e.employee_id === employeeId)
    );
    const firstName = (employee as any)?.firstName || (employee as any)?.first_name;
    const lastName = (employee as any)?.lastName || (employee as any)?.last_name;
    return firstName && lastName 
      ? `${firstName} ${lastName}` 
      : employeeId;
  };

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
  
  // Single item approve mutation
  const approveSingleMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = type === 'deviations' 
        ? `/api/manager/deviations/${id}/approve` 
        : `/api/manager/leave-requests/${id}/approve`;
      return apiRequest('POST', endpoint, { comment: 'Approved from list' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manager/${type}/pending`] });
      toast({
        title: t('manager.approveSuccess'),
        description: t('manager.approveSuccessDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('manager.approveError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });

  // Single item reject mutation
  const rejectSingleMutation = useMutation({
    mutationFn: async (id: number) => {
      const comment = window.prompt(t('manager.enterRejectionReason'));
      if (!comment) throw new Error('Rejection cancelled');
      
      const endpoint = type === 'deviations' 
        ? `/api/manager/deviations/${id}/reject` 
        : `/api/manager/leave-requests/${id}/reject`;
      return apiRequest('POST', endpoint, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manager/${type}/pending`] });
      toast({
        title: t('manager.rejectSuccess'),
        description: t('manager.rejectSuccessDescription'),
      });
    },
    onError: (error) => {
      if ((error as Error).message !== 'Rejection cancelled') {
        toast({
          title: t('manager.rejectError'),
          description: (error as Error).message,
          variant: 'destructive',
        });
      }
    }
  });
  
  const handleSelectItem = (id: number) => {
    setSelectedItemId(id);
  };
  
  const handleApproveItem = (id: number) => {
    approveSingleMutation.mutate(id);
  };
  
  const handleRejectItem = (id: number) => {
    rejectSingleMutation.mutate(id);
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
          {t(type === 'deviations' ? 'manager.noDeviations' : 
             type === 'leaveRequests' ? 'manager.noLeaveRequests' : 
             'manager.noHistory')}
        </h3>
        <p className="text-muted-foreground">
          {t(type === 'deviations' ? 'manager.noDeviationsDescription' : 
             type === 'leaveRequests' ? 'manager.noLeaveRequestsDescription' :
             'manager.noHistoryDescription')}
        </p>
      </div>
    );
  }
  
  // Render the appropriate list based on type
  if (type === 'history') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('manager.employee')}</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Datum/Period</TableHead>
                <TableHead>Detaljer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beslutsdatum</TableHead>
                <TableHead>{t('deviations.comment')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pendingItems as any[]).map((item: any) => {
                const isDeviation = item.itemType === 'deviation';
                const employeeId = item.employeeId || item.employee_id;
                const status = item.status;
                const isApproved = status === 'approved';
                const decisionDate = item.approvedAt || item.rejectedAt || item.lastUpdated;
                
                return (
                  <TableRow key={`${item.itemType}-${item.id}`} className="hover:bg-background-dark transition-colors">
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 bg-primary bg-opacity-10">
                          <AvatarFallback className="text-primary">
                            {(() => {
                              const employee = employees.find((e: any) => 
                                (e.employeeId === employeeId) || (e.employee_id === employeeId)
                              );
                              const firstName = (employee as any)?.firstName || (employee as any)?.first_name;
                              const lastName = (employee as any)?.lastName || (employee as any)?.last_name;
                              return firstName && lastName 
                                ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
                                : employeeId?.substring(0, 2).toUpperCase() || '??';
                            })()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{getEmployeeName(employeeId)}</div>
                          <div className="text-sm text-muted-foreground">ID: {employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-sm text-muted-foreground">
                          {isDeviation ? 'schedule' : 'beach_access'}
                        </span>
                        <span className="text-sm font-medium">
                          {isDeviation ? 'Avvikelse' : 'Ledighet'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {isDeviation ? 
                        item.date : 
                        `${item.startDate || item.start_date} - ${item.endDate || item.end_date}`
                      }
                    </TableCell>
                    <TableCell>
                      {isDeviation ? (
                        <div>
                          <div className="font-medium">{item.timeCode || item.time_code}</div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const startTime = item.startTime || item.start_time;
                              const endTime = item.endTime || item.end_time;
                              return startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : '';
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{item.leaveType || item.leave_type}</div>
                          <div className="text-xs text-muted-foreground">{item.scope}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isApproved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isApproved ? 'Godkänd' : 'Avvisad'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {decisionDate ? new Date(decisionDate).toLocaleDateString('sv-SE') : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate-text">
                      {item.comment || item.managerComment || item.manager_comment || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  } else if (type === 'deviations') {
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
                  const timeCodeStr = deviation.timeCode || deviation.time_code;
                  const timeCode = getTimeCodeForDeviation(timeCodeStr);
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
                              {(() => {
                                const employeeId = deviation.employeeId || deviation.employee_id;
                                const employee = employees.find((e: any) => 
                                  (e.employeeId === employeeId) || (e.employee_id === employeeId)
                                );
                                const firstName = (employee as any)?.firstName || (employee as any)?.first_name;
                                const lastName = (employee as any)?.lastName || (employee as any)?.last_name;
                                return firstName && lastName 
                                  ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
                                  : employeeId?.substring(0, 2).toUpperCase() || '??';
                              })()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium">{getEmployeeName(deviation.employeeId || deviation.employee_id)}</div>
                            <div className="text-sm text-muted-foreground">ID: {deviation.employeeId || deviation.employee_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{deviation.date}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{timeCodeStr}</div>
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
                        {(() => {
                          const startTime = deviation.startTime || deviation.start_time;
                          const endTime = deviation.endTime || deviation.end_time;
                          return startTime && endTime ? (
                            `${formatTime(startTime)} - ${formatTime(endTime)}`
                          ) : '-';
                        })()}
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
                            handleApproveItem(deviation.id);
                          }}
                          disabled={approveSingleMutation.isPending}
                        >
                          {actionText.approveText}
                        </Button>
                        <Button 
                          variant="link" 
                          className="text-destructive hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectItem(deviation.id);
                          }}
                          disabled={rejectSingleMutation.isPending}
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
                          {(() => {
                            const employeeId = leave.employeeId || leave.employee_id;
                            const employee = employees.find((e: any) => 
                              (e.employeeId === employeeId) || ((e as any).employee_id === employeeId)
                            );
                            const firstName = (employee as any)?.firstName || (employee as any)?.first_name;
                            const lastName = (employee as any)?.lastName || (employee as any)?.last_name;
                            return firstName && lastName 
                              ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
                              : employeeId?.substring(0, 2);
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{getEmployeeName(leave.employeeId || leave.employee_id)}</div>
                        <div className="text-sm text-muted-foreground">ID: {leave.employeeId || leave.employee_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {(() => {
                      const startDate = leave.startDate || leave.start_date;
                      const endDate = leave.endDate || leave.end_date;
                      return startDate === endDate 
                        ? startDate 
                        : `${startDate} - ${endDate}`;
                    })()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{leave.leaveType || leave.leave_type}</TableCell>
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
                        handleApproveItem(leave.id);
                      }}
                      disabled={approveSingleMutation.isPending}
                    >
                      {t('action.approve')}
                    </Button>
                    <Button 
                      variant="link" 
                      className="text-destructive hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectItem(leave.id);
                      }}
                      disabled={rejectSingleMutation.isPending}
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
