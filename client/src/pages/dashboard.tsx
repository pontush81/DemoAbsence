import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusCard from "@/components/dashboard/status-card";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { apiService } from "@/lib/apiService";
import { formatDateWithDay, formatTime, formatDuration } from "@/lib/utils/date";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";


export default function Dashboard() {
  const { t } = useI18n();
  const [showDeviationDetails, setShowDeviationDetails] = useState(false);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId;
  const currentUser = user.currentUser;
  const isManager = user.currentRole === 'manager';
  const isEmployee = user.currentRole === 'employee';
  
  // Get current date and format it
  const currentDate = new Date();
  const formattedDate = formatDateWithDay(currentDate);
  
  // Fetch schedule
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['/api/schedules', employeeId, currentDate.toISOString().split('T')[0]],
    queryFn: () => employeeId
      ? apiService.getEmployeeSchedule(employeeId, currentDate.toISOString().split('T')[0])
      : Promise.resolve([]),
    enabled: !!employeeId,
  });
  
  // Fetch time balance
  const { data: timeBalance, isLoading: isLoadingTimeBalance } = useQuery({
    queryKey: ['/api/time-balances', employeeId],
    queryFn: () => employeeId
      ? apiService.getTimeBalance(employeeId)
      : Promise.resolve(null),
    enabled: !!employeeId,
  });
  
  // Fetch pending approvals (for manager)
  const { data: pendingDeviations, isLoading: isLoadingPendingDeviations } = useQuery({
    queryKey: ['/api/manager/deviations/pending', employeeId],
    queryFn: () => apiService.getPendingDeviations(employeeId),
    enabled: isManager && !!employeeId,
  });

  // Fetch pending leave requests (for manager)
  const { data: pendingLeaveRequests, isLoading: isLoadingPendingLeaveRequests } = useQuery({
    queryKey: ['/api/manager/leave-requests/pending'],
    queryFn: () => apiService.getPendingLeaveRequests(),
    enabled: isManager,
  });

  // Fetch monthly deviations for time reporting (for employees)
  const currentMonth = format(currentDate, 'yyyy-MM');
  const { data: monthlyDeviations, isLoading: isLoadingMonthlyDeviations } = useQuery({
    queryKey: ['/api/deviations', employeeId, currentMonth],
    queryFn: () => employeeId 
      ? apiService.getDeviations(employeeId)
      : Promise.resolve([]),
    enabled: isEmployee && !!employeeId,
  });

  // Fetch monthly leave requests for time reporting (for employees)
  const { data: monthlyLeaveRequests, isLoading: isLoadingMonthlyLeaveRequests } = useQuery({
    queryKey: ['/api/leave-requests', employeeId, currentMonth],
    queryFn: () => employeeId 
      ? apiService.getLeaveRequests(employeeId)
      : Promise.resolve([]),
    enabled: isEmployee && !!employeeId,
  });

  // Fetch time codes for displaying readable names
  const { data: timeCodes = [] } = useQuery({
    queryKey: ['timeCodes'],
    queryFn: () => apiService.getTimeCodes()
  });
  
  // Get today's schedule
  const todaySchedule = schedule && schedule.length > 0 ? schedule[0] : null;

  // Calculate time reporting status for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Filter deviations and leave requests for current month
  const currentMonthDeviations = (monthlyDeviations || []).filter(d => {
    const deviationDate = new Date(d.date);
    return deviationDate >= monthStart && deviationDate <= monthEnd;
  });
  
  const currentMonthLeaveRequests = (monthlyLeaveRequests || []).filter(lr => {
    const startDate = new Date(lr.startDate);
    const endDate = new Date(lr.endDate);
    return startDate <= monthEnd && endDate >= monthStart;
  });

  // Check if user has any deviations or leave for current month
  const hasMonthlyDeviations = currentMonthDeviations.length > 0 || currentMonthLeaveRequests.length > 0;
  const hasPendingItems = [...currentMonthDeviations, ...currentMonthLeaveRequests].some(item => item.status === 'pending');

  // Helper function to get time code name
  const getTimeCodeName = (code: string) => {
    const timeCode = timeCodes.find(tc => tc.code === code);
    return timeCode?.nameSV || code;
  };
  
  // Handle time reporting submission
  const handleSubmitTimeReport = async (hasDeviations: boolean) => {
    if (hasDeviations) {
      // Redirect to deviations page to register deviations
      window.location.href = '/deviations';
    } else {
      // Submit time report according to scheduled hours
      console.log('Submitting time report without deviations for month:', currentMonth);
      // TODO: Implement API call to submit time report
      alert(`Tidrapport för ${format(monthStart, 'MMMM yyyy', { locale: sv })} har skickats in enligt schema!`);
    }
  };
  
  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t('dashboard.greeting')}, {currentUser?.firstName || ''}!
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/deviations/new">
            <Button className="inline-flex items-center bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded font-medium shadow-sm transition-colors">
              <span className="material-icons mr-2">add</span>
              {t('action.newDeviation')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Work Schedule Card */}
        <StatusCard
          title={t('dashboard.workSchedule')}
          value={
            isLoadingSchedule ? (
              <Skeleton className="h-6 w-36" />
            ) : todaySchedule ? (
              `${formatTime(todaySchedule.startTime)} - ${formatTime(todaySchedule.endTime)}`
            ) : (
              t('dashboard.noSchedule')
            )
          }
          icon="schedule"
          footer={
            isLoadingSchedule ? (
              <Skeleton className="h-4 w-32" />
            ) : todaySchedule?.breakStart && todaySchedule?.breakEnd ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.break')}: {formatTime(todaySchedule.breakStart)} - {formatTime(todaySchedule.breakEnd)}
              </p>
            ) : null
          }
        />

        {/* Time Balance Card */}
        <StatusCard
          title={t('dashboard.timeBalance')}
          value={
            isLoadingTimeBalance ? (
              <Skeleton className="h-6 w-24" />
            ) : timeBalance ? (
              formatDuration(timeBalance.timeBalance ?? 0)
            ) : (
              "0"
            )
          }
          icon="hourglass_top"
          footer={
            isLoadingTimeBalance ? (
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : timeBalance?.compensationTime ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dashboard.compensationTime')}:</span>
                <span>{formatDuration(timeBalance.compensationTime)}</span>
              </div>
            ) : null
          }
        />

        {/* Vacation Balance Card */}
        <StatusCard
          title={t('dashboard.vacationBalance')}
          value={
            isLoadingTimeBalance ? (
              <Skeleton className="h-6 w-24" />
            ) : timeBalance ? (
              `${timeBalance.vacationDays} ${t('days')}`
            ) : (
              "0 " + t('days')
            )
          }
          icon="beach_access"
          footer={
            isLoadingTimeBalance ? (
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : timeBalance?.savedVacationDays ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dashboard.savedDays')}:</span>
                <span>
                  {Object.values(timeBalance.savedVacationDays).reduce((a, b) => a + (b as number), 0)} {t('days')}
                </span>
              </div>
            ) : null
          }
        />

        {/* Pending Deviations Card (only for managers) */}
        {isManager && (
          <StatusCard
            title={t('dashboard.pendingDeviations')}
            value={
              isLoadingPendingDeviations ? (
                <Skeleton className="h-6 w-24" />
              ) : pendingDeviations ? (
                `${pendingDeviations.length} ${t('items')}`
              ) : (
                "0 " + t('items')
              )
            }
            icon="pending_actions"
            className="bg-[#FFC107] bg-opacity-5"
            footer={
              <Link href="/manager">
                <div className="text-sm text-primary flex items-center cursor-pointer">
                  {t('dashboard.viewAll')}
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </div>
              </Link>
            }
          />
        )}

        {/* Pending Leave Requests Card (only for managers) */}
        {isManager && (
          <StatusCard
            title={t('dashboard.pendingLeaveRequests')}
            value={
              isLoadingPendingLeaveRequests ? (
                <Skeleton className="h-6 w-24" />
              ) : pendingLeaveRequests ? (
                `${pendingLeaveRequests.length} ${t('items')}`
              ) : (
                "0 " + t('items')
              )
            }
            icon="event_available"
            className="bg-[#4CAF50] bg-opacity-5"
            footer={
              <Link href="/manager">
                <div className="text-sm text-primary flex items-center cursor-pointer">
                  {t('dashboard.viewAll')}
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </div>
              </Link>
            }
          />
        )}
      </div>

      {/* Monthly Time Reporting Section (only for employees) */}
      {isEmployee && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold flex items-center mb-2">
                <span className="material-icons mr-2">schedule_send</span>
                Månatlig tidrapportering
              </h2>
              <p className="text-muted-foreground">
                {format(monthStart, 'MMMM yyyy', { locale: sv })} - Skicka in din tidrapport för månaden
              </p>
            </div>

            {/* Status alerts */}
            {hasPendingItems && (
              <Alert className="mb-4">
                <AlertDescription>
                  ⚠️ Du har väntande godkännanden som behöver behandlas innan du kan skicka in din tidrapport.
                </AlertDescription>
              </Alert>
            )}

            {/* Status summary */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Månadens tidrapport</div>
                  <div className="flex flex-col space-y-2">
                    {currentMonthDeviations.length > 0 && (
                      <Collapsible open={showDeviationDetails} onOpenChange={setShowDeviationDetails}>
                        <CollapsibleTrigger className="text-sm hover:text-primary cursor-pointer flex items-center">
                          📝 {currentMonthDeviations.length} avvikelser
                          <span className={`ml-1 ${
                            currentMonthDeviations.some(d => d.status === 'pending') 
                              ? 'text-orange-600' 
                              : 'text-green-600'
                          }`}>
                            ({currentMonthDeviations.some(d => d.status === 'pending') ? 'väntande' : 'godkända'})
                          </span>
                          <span className="material-icons text-sm ml-1">
                            {showDeviationDetails ? 'expand_less' : 'expand_more'}
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 pl-4 border-l-2 border-muted">
                          <div className="space-y-1">
                            {currentMonthDeviations.map(deviation => (
                              <div key={deviation.id} className="text-xs text-muted-foreground flex justify-between">
                                <span>
                                  {format(new Date(deviation.date), 'MMM dd', { locale: sv })} - {getTimeCodeName(deviation.timeCode)}
                                </span>
                                <Badge variant={
                                  deviation.status === 'pending' ? 'secondary' :
                                  deviation.status === 'approved' ? 'default' : 'destructive'
                                } className="text-xs px-1 py-0">
                                  {deviation.status === 'pending' ? 'Väntande' :
                                   deviation.status === 'approved' ? 'Godkänd' : 'Avvisad'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    
                    {currentMonthLeaveRequests.length > 0 && (
                      <Collapsible open={showLeaveDetails} onOpenChange={setShowLeaveDetails}>
                        <CollapsibleTrigger className="text-sm hover:text-primary cursor-pointer flex items-center">
                          🏖️ {currentMonthLeaveRequests.length} ledigheter  
                          <span className={`ml-1 ${
                            currentMonthLeaveRequests.some(lr => lr.status === 'pending') 
                              ? 'text-orange-600' 
                              : 'text-green-600'
                          }`}>
                            ({currentMonthLeaveRequests.some(lr => lr.status === 'pending') ? 'väntande' : 'godkända'})
                          </span>
                          <span className="material-icons text-sm ml-1">
                            {showLeaveDetails ? 'expand_less' : 'expand_more'}
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 pl-4 border-l-2 border-muted">
                          <div className="space-y-1">
                            {currentMonthLeaveRequests.map(leave => (
                              <div key={leave.id} className="text-xs text-muted-foreground flex justify-between">
                                <span>
                                  {format(new Date(leave.startDate), 'MMM dd', { locale: sv })} - 
                                  {leave.startDate !== leave.endDate 
                                    ? format(new Date(leave.endDate), 'MMM dd', { locale: sv })
                                    : ''
                                  } {leave.leaveType}
                                </span>
                                <Badge variant={
                                  leave.status === 'pending' ? 'secondary' :
                                  leave.status === 'approved' ? 'default' : 'destructive'
                                } className="text-xs px-1 py-0">
                                  {leave.status === 'pending' ? 'Väntande' :
                                   leave.status === 'approved' ? 'Godkänd' : 'Avvisad'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    
                    {!hasMonthlyDeviations && (
                      <span className="text-sm text-green-600">✅ Enligt ordinarie schema</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={hasPendingItems ? "destructive" : hasMonthlyDeviations ? "secondary" : "default"}>
                    {hasPendingItems ? "Väntande godkännanden" : hasMonthlyDeviations ? "Med avvikelser" : "Klar att skicka"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {hasMonthlyDeviations ? (
                // User already has deviations - just submit the report
                <Button
                  size="lg"
                  variant="default"
                  onClick={() => handleSubmitTimeReport(true)}
                  disabled={hasPendingItems || isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                  className="flex-1"
                >
                  <span className="material-icons mr-2">send</span>
                  Skicka tidrapport
                </Button>
              ) : (
                // User has no deviations - give them options
                <>
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => handleSubmitTimeReport(false)}
                    disabled={hasPendingItems || isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                    className="flex-1"
                  >
                    <span className="material-icons mr-2">check_circle</span>
                    Jag har inga avvikelser
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleSubmitTimeReport(true)}
                    disabled={isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                    className="flex-1"
                  >
                    <span className="material-icons mr-2">add</span>
                    Registrera avvikelser
                  </Button>
                </>
              )}
            </div>

            {/* Helper text */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="material-icons text-sm mr-1">info</span>
                {hasMonthlyDeviations 
                  ? hasPendingItems 
                    ? "Väntande avvikelser/ledigheter måste godkännas av chef innan tidrapport kan skickas."
                    : "Alla dina avvikelser och ledigheter är godkända. Tidrapporten är redo att skickas för lönekörning."
                  : "Välj första alternativet om du arbetat enligt schema. Andra alternativet för att registrera övertid, sjukfrånvaro eller VAB."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </section>
  );
}
