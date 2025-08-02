import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusCard from "@/components/dashboard/status-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
import { useToast } from "@/hooks/use-toast";


export default function Dashboard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      window.location.href = '/new-deviation';
    } else {
      // Submit time report according to scheduled hours
      console.log('Submitting time report without deviations for month:', currentMonth);
      // TODO: Implement API call to submit time report
      alert(`Tidrapport för ${format(monthStart, 'MMMM yyyy', { locale: sv })} har skickats in enligt schema!`);
    }
  };

  // Quick Sick Registration Mutation
  const quickSickMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch('/api/deviations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to create deviation');
        }
        return response.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deviations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deviations', employeeId] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid registrering",
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle quick sick registration
  const handleQuickSick = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const sickData = {
      employeeId: employeeId,
      date: today,
      timeCode: "300", // Sick leave code
      startTime: "08:00",
      endTime: "16:00", // 8 hours work time (excluding lunch)
      comment: "",
      status: "pending",
      submitted: new Date().toISOString(),
    };

    // Show immediate feedback
    toast({
      title: "🤒 Sjukdom registrerad!",
      description: `För ${format(new Date(), 'dd MMMM', { locale: sv })} - Skickas för godkännande...`,
    });

    // Submit to API
    quickSickMutation.mutate(sickData);
  };
  
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t('dashboard.greeting')}, {currentUser?.firstName || ''}!
        </h1>
        <p className="text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Enhanced Work Schedule Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
              <span className="material-icons text-xl">schedule</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Din ordinarie arbetstid
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  🕐 08:00 - 17:00 <span className="text-xs text-gray-500">(närvaro)</span>
                </span>
                <span className="flex items-center gap-1">
                  📅 Måndag - Fredag
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ 08:00 - 16:00 <span className="text-xs text-gray-500">(arbetstid)</span>
                </span>
                <span className="flex items-center gap-1">
                  ☕ 12:00 - 13:00 <span className="text-xs text-gray-500">(lunch, ej arbetstid)</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action - Report Deviation */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white">
                <span className="material-icons text-2xl">add_alert</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Anmäl avvikelse
                </h3>
                <p className="text-gray-600">
                  <span className="font-medium text-orange-600">Sjuk?</span> Klicka bara på orange knappen! 
                  <br className="hidden sm:inline" />För andra avvikelser, använd den vita knappen.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleQuickSick}
                disabled={quickSickMutation.isPending}
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span className="text-xl mr-2">🤒</span>
                <span className="hidden sm:inline">Sjuk idag</span>
                <span className="sm:hidden">Sjuk</span>
              </Button>
              
              <Link href="/new-deviation">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white border-2 border-accent text-accent hover:bg-accent hover:text-white px-6 py-3 text-base font-semibold transition-all duration-200"
                >
                  <span className="material-icons mr-2">add</span>
                  <span className="hidden sm:inline">Annan avvikelse</span>
                  <span className="sm:hidden">Annan</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards Row */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

          {/* Time Balance Card with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
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
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2">
                <p><strong>🕐 Tidssaldo:</strong> Din totala arbetstidsbalans</p>
                <p className="text-sm">• <strong>Positivt:</strong> Du har jobbat mer än schema</p>
                <p className="text-sm">• <strong>Negativt:</strong> Du har jobbat mindre än schema</p>
                {timeBalance?.compensationTime && (
                  <>
                    <hr className="my-2" />
                    <p><strong>⏰ Kompsaldo:</strong> Tid du kan ta ut som ledighet</p>
                    <p className="text-sm">Kommer från godkänd övertid som blivit kompensationsledighet</p>
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Vacation Balance Card with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
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
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2">
                <p><strong>🏖️ Semestersaldo:</strong> Dina tillgängliga semesterdagar</p>
                <p className="text-sm">• Antalet dagar du kan ansöka om som semester</p>
                <p className="text-sm">• Minskar när semester godkänns och tas ut</p>
                {timeBalance?.savedVacationDays && Object.values(timeBalance.savedVacationDays).reduce((a, b) => a + (b as number), 0) > 0 && (
                  <>
                    <hr className="my-1" />
                    <p className="text-sm"><strong>Sparade dagar:</strong> Semester från tidigare år som du ännu inte tagit</p>
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Pending Deviations Card (only for managers) with Tooltip */}
          {isManager && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
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
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2">
                  <p><strong>⏳ Väntande avvikelser:</strong> Behöver ditt godkännande</p>
                  <p className="text-sm">• Avvikelser som medarbetare skickat in</p>
                  <p className="text-sm">• Klicka för att granska och godkänna/avvisa</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pending Leave Requests Card (only for managers) with Tooltip */}
          {isManager && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
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
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2">
                  <p><strong>🏖️ Väntande ledighet:</strong> Behöver ditt godkännande</p>
                  <p className="text-sm">• Semesteransökningar från medarbetare</p>
                  <p className="text-sm">• Klicka för att granska och godkänna/avvisa</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

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

            {/* Status alerts - Consolidated warning with action */}
            {hasPendingItems && (
              <Alert className="mb-4 border-orange-200 bg-orange-50">
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    ⚠️ <strong>{currentMonthDeviations.filter(d => d.status === 'pending').length + currentMonthLeaveRequests.filter(lr => lr.status === 'pending').length} väntande godkännanden</strong> blockerar tidrapport
                  </div>
                  <Link href="/manager" className="text-orange-600 hover:text-orange-800 text-sm font-medium underline">
                    Hantera nu →
                  </Link>
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
                          <span className={`flex items-center gap-1 ${
                            currentMonthDeviations.some(d => d.status === 'pending') 
                              ? 'text-orange-600' 
                              : 'text-green-600'
                          }`}>
                            📝 {currentMonthDeviations.length} avvikelser
                            {currentMonthDeviations.some(d => d.status === 'pending') && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                          </span>
                          <span className="material-icons text-sm ml-auto">
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
                          <span className={`flex items-center gap-1 ${
                            currentMonthLeaveRequests.some(lr => lr.status === 'pending') 
                              ? 'text-orange-600' 
                              : 'text-green-600'
                          }`}>
                            🏖️ {currentMonthLeaveRequests.length} ledigheter
                            {currentMonthLeaveRequests.some(lr => lr.status === 'pending') && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                          </span>
                          <span className="material-icons text-sm ml-auto">
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
                  variant={hasPendingItems ? "secondary" : "default"}
                  onClick={() => handleSubmitTimeReport(true)}
                  disabled={hasPendingItems || isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                  className="flex-1"
                >
                  <span className="material-icons mr-2">{hasPendingItems ? 'block' : 'send'}</span>
                  {hasPendingItems ? 'Väntande godkännanden först' : 'Skicka tidrapport'}
                </Button>
              ) : (
                // User has no deviations - give them options
                <>
                  <Button
                    size="lg"
                    variant={hasPendingItems ? "secondary" : "default"}
                    onClick={() => handleSubmitTimeReport(false)}
                    disabled={hasPendingItems || isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                    className="flex-1"
                  >
                    <span className="material-icons mr-2">{hasPendingItems ? 'block' : 'check_circle'}</span>
                    {hasPendingItems ? 'Hantera godkännanden först' : 'Jag har inga avvikelser'}
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

            {/* Simplified helper text - only when no blocking issues */}
            {!hasPendingItems && !hasMonthlyDeviations && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Välj första alternativet om du arbetat enligt schema, andra för att registrera avvikelser
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </section>
  );
}
