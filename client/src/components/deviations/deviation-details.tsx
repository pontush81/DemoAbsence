import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiService } from "@/lib/apiService";
import { queryClient } from "@/lib/queryClient";
import { formatTime, formatRelativeTime, calculateDuration } from "@/lib/utils/date";
import { useStore } from "@/lib/store";
import { apiRequest } from "@/lib/queryClient";

interface DeviationDetailsProps {
  deviationId: number;
  onBack?: () => void;
}

const DeviationDetails = ({ deviationId, onBack }: DeviationDetailsProps) => {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { user } = useStore();
  const isManager = user.currentRole === 'manager';
  
  // Fetch deviation
  const { data: deviation, isLoading, error } = useQuery({
    queryKey: ['/api/deviations', deviationId],
    queryFn: () => apiService.getDeviation(deviationId),
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/deviations/${deviationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      toast({
        title: t('deviations.deleteSuccess'),
        description: t('deviations.deleteSuccessDescription'),
      });
      if (onBack) {
        onBack();
      } else {
        setLocation('/deviations');
      }
    },
    onError: (error) => {
      toast({
        title: t('deviations.deleteError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  // Manager approve mutation
  const approveMutation = useMutation({
    mutationFn: (comment?: string) => 
      apiRequest('POST', `/api/manager/deviations/${deviationId}/approve`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/deviations/pending'] });
      toast({
        title: t('manager.approveSuccess'),
        description: t('manager.approveSuccessDescription'),
      });
      if (onBack) {
        onBack();
      } else {
        setLocation('/manager');
      }
    },
    onError: (error) => {
      toast({
        title: t('manager.approveError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  // Manager reject mutation
  const rejectMutation = useMutation({
    mutationFn: (comment: string) => 
      apiRequest('POST', `/api/manager/deviations/${deviationId}/reject`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/deviations/pending'] });
      toast({
        title: t('manager.rejectSuccess'),
        description: t('manager.rejectSuccessDescription'),
      });
      if (onBack) {
        onBack();
      } else {
        setLocation('/manager');
      }
    },
    onError: (error) => {
      toast({
        title: t('manager.rejectError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  // Manager return deviation mutation
  const returnMutation = useMutation({
    mutationFn: (comment: string) => 
      apiRequest('POST', `/api/manager/deviations/${deviationId}/return`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/deviations/pending'] });
      toast({
        title: t('manager.returnSuccess'),
        description: t('manager.returnSuccessDescription'),
      });
      if (onBack) {
        onBack();
      } else {
        setLocation('/manager');
      }
    },
    onError: (error) => {
      toast({
        title: t('manager.returnError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation('/deviations');
    }
  };
  
  const handleDelete = () => {
    if (window.confirm(t('deviations.confirmDelete'))) {
      deleteMutation.mutate();
    }
  };
  
  const handleApprove = () => {
    approveMutation.mutate('');
  };
  
  const handleReject = () => {
    const comment = window.prompt(t('manager.enterRejectionReason'));
    if (comment) {
      rejectMutation.mutate(comment);
    }
  };
  
  const handleReturn = () => {
    const comment = window.prompt(t('manager.enterReturnReason'));
    if (comment) {
      returnMutation.mutate(comment);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-6 mt-6 border-t">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !deviation) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">{t('deviations.loadError')}: {(error as Error)?.message || t('deviations.notFound')}</p>
          <Button 
            onClick={handleBack} 
            variant="outline" 
            className="mt-4"
          >
            {t('action.back')}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const duration = calculateDuration(deviation.startTime, deviation.endTime);
  const isPending = deviation.status === 'pending';
  const isDraft = deviation.status === 'draft';
  const isReturned = deviation.status === 'returned';
  const canEdit = isDraft || isReturned;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold">{t('deviations.deviationDetails')}</h2>
            <p className="text-muted-foreground">
              {deviation.date} - {t(`timecode.${deviation.timeCode}`)}
            </p>
          </div>
          {isManager && isPending && (
            <div className="flex">
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 text-muted-foreground"
                onClick={handleReturn}
              >
                <span className="material-icons text-sm mr-1">reply</span>
                {t('action.return')}
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{t('deviations.date')}</p>
              <p className="font-medium">{deviation.date}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{t('deviations.time')}</p>
              <p className="font-medium">
                {formatTime(deviation.startTime)} - {formatTime(deviation.endTime)} ({duration.toFixed(1)}h)
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{t('deviations.timeCode')}</p>
              <p className="font-medium">{deviation.timeCode}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{t('deviations.comment')}</p>
              <p className="font-medium">{deviation.comment || '-'}</p>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{t('manager.registered')}</p>
              <p className="font-medium">
                {deviation.submitted ? formatRelativeTime(deviation.submitted) : '-'}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{t('deviations.status')}</p>
              <p className="inline-flex items-center font-medium">
                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                  deviation.status === 'approved' ? 'bg-[#4CAF50]' :
                  deviation.status === 'pending' ? 'bg-[#FFC107]' :
                  deviation.status === 'rejected' ? 'bg-[#F44336]' :
                  deviation.status === 'returned' ? 'bg-[#F44336]' :
                  'bg-gray-400'
                }`}></span>
                {t(`status.${deviation.status}`)}
              </p>
            </div>
            {deviation.managerComment && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{t('manager.comment')}</p>
                <p className="font-medium">{deviation.managerComment}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-6 mt-6 border-t">
          <div className="flex flex-col-reverse md:flex-row md:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="mt-3 md:mt-0"
            >
              {t('action.back')}
            </Button>
            
            <div className="flex flex-col md:flex-row">
              {canEdit && (
                <>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    className="md:mr-3"
                  >
                    {t('action.delete')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={() => setLocation(`/deviations/edit/${deviation.id}`)}
                    className="mt-3 md:mt-0"
                  >
                    {t('action.edit')}
                  </Button>
                </>
              )}
              
              {isManager && isPending && (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive/10 md:mr-3"
                    onClick={handleReject}
                  >
                    {t('action.reject')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="default" 
                    className="mt-3 md:mt-0 bg-[#4CAF50] hover:bg-[#388E3C] text-white"
                    onClick={handleApprove}
                  >
                    {t('action.approve')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviationDetails;
