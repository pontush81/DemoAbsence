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
  const employeeId = user.currentUser?.employeeId || user.currentUser?.id;
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
    queryFn: () => apiService.getPendingDeviations(employeeId), // employeeId is the manager's ID
    enabled: isManager && !!employeeId,
  });

  // Fetch pending leave requests (for manager)
  const { data: pendingLeaveRequests, isLoading: isLoadingPendingLeaveRequests } = useQuery({
    queryKey: ['/api/manager/leave-requests/pending', employeeId],
    queryFn: () => apiService.getPendingLeaveRequests(employeeId), // Pass managerId
    enabled: isManager && !!employeeId,
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
    queryKey: ['/api/timecodes'], // Consistent key with other components
    queryFn: () => apiService.getTimeCodes(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 2, // Extra retry for timecodes
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
              const timeCode = Array.isArray(timeCodes) ? timeCodes.find(tc => tc.code === code) : null;
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
      // Don't set status - let API determine it based on timeCode (will be auto-approved for sick leave)
      submitted: new Date().toISOString(),
    };

    // Show immediate feedback - updated message for Swedish law
    toast({
      title: "🤒 Sjukdom anmäld!",
      description: `För ${format(new Date(), 'dd MMMM', { locale: sv })} - Automatiskt godkänd enligt svensk lag`,
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
                  🕐 08:00 - 17:00
                </span>
                <span className="flex items-center gap-1">
                  📅 Måndag - Fredag
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
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-4">
              <Button 
                onClick={handleQuickSick}
                disabled={quickSickMutation.isPending}
                size="lg" 
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 sm:py-3 text-xl sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 min-h-[72px] sm:min-h-[48px] rounded-xl sm:rounded-lg"
              >
                <span className="text-3xl sm:text-xl mr-4 sm:mr-2">🤒</span>
                <span className="hidden sm:inline">Sjuk idag</span>
                <span className="sm:hidden text-xl font-bold">Sjuk idag</span>
              </Button>
              
              <Link href="/new-deviation" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full bg-white border-2 border-accent text-accent hover:bg-accent hover:text-white px-8 py-6 sm:py-3 text-xl sm:text-base font-bold transition-all duration-200 min-h-[72px] sm:min-h-[48px] rounded-xl sm:rounded-lg"
                >
                  <span className="material-icons mr-4 sm:mr-2 text-2xl sm:text-base">add</span>
                  <span className="hidden sm:inline">Annan avvikelse</span>
                  <span className="sm:hidden text-xl font-bold">Annan avvikelse</span>
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

            {hasPendingItems ? (
              /* COMPACT WAITING STATE - Perplexity's "reduce unnecessary whitespace" */
              <div className="flex items-center justify-between p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-4">
                  {/* Subtle icon */}
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-icons text-xl text-blue-600">schedule</span>
                  </div>
                  
                  {/* Status message */}
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      Väntar på chefens godkännande
                    </div>
                    {/* Collapsed details available */}
                    {!isManager && (
                      <Collapsible>
                        <CollapsibleTrigger className="text-sm text-gray-600 hover:text-gray-800 underline decoration-1 underline-offset-2">
                          Se status
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 text-xs text-gray-600">
                          <div className="space-y-1">
                            {currentMonthDeviations.filter(d => d.status === 'pending').length > 0 && (
                              <p>• {currentMonthDeviations.filter(d => d.status === 'pending').length} avvikelse{currentMonthDeviations.filter(d => d.status === 'pending').length > 1 ? 'r' : ''} väntar</p>
                            )}
                            {currentMonthLeaveRequests.filter(lr => lr.status === 'pending').length > 0 && (
                              <p>• {currentMonthLeaveRequests.filter(lr => lr.status === 'pending').length} ledighetsansöka{currentMonthLeaveRequests.filter(lr => lr.status === 'pending').length > 1 ? 'n' : 'n'} väntar</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
      </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3">
                  {/* Disabled button - compact version */}
                  <Button
                    size="default"
                    variant="secondary"
                    disabled={true}
                    className="bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                  >
                    <span className="material-icons mr-2 text-sm">schedule</span>
                    <span className="hidden sm:inline">Skicka tidrapport</span>
                    <span className="sm:hidden">Skicka</span>
                  </Button>
                  
                  {/* Manager action */}
                  {isManager && (
                    <Link href="/manager" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Godkänn →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              /* COMPACT ACTIONABLE STATE - matching visual weight */
              <div className="space-y-4">
                {/* Status indicator - compact */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="material-icons text-lg text-green-600">check_circle</span>
                    </div>
                    <div>
                      <div className="font-medium text-green-900">Klar att skicka</div>
                      <div className="text-sm text-green-700">
                        {hasMonthlyDeviations ? "Med avvikelser" : "Inga avvikelser"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Redo
                  </Badge>
                </div>

                {/* Show deviation details when user wants to see what will be submitted */}
                {hasMonthlyDeviations && (
                  <div className="mt-4">
                    <Collapsible>
                      <CollapsibleTrigger className="text-sm text-blue-600 hover:text-blue-700 underline decoration-1 underline-offset-2 flex items-center gap-1">
                        <span className="material-icons text-sm">list</span>
                        Visa avvikelser som skickas in ({currentMonthDeviations.length + currentMonthLeaveRequests.length} st)
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-3">
                          {/* Deviations */}
                          {currentMonthDeviations.length > 0 && (
                            <div>
                              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-1">
                                <span className="material-icons text-sm">schedule</span>
                                Avvikelser ({currentMonthDeviations.length} st)
                              </h4>
                              <div className="space-y-2">
                                {currentMonthDeviations.map((deviation, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                      <span className="font-medium">{format(new Date(deviation.date), 'dd MMM', { locale: sv })}</span>
                                      <span>{getTimeCodeName(deviation.timeCode)}</span>
                                      {deviation.description && (
                                        <span className="text-gray-600">- {deviation.description}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      {deviation.duration && <span>{deviation.duration}h</span>}
                                      <Badge 
                                        variant={deviation.status === 'approved' ? 'default' : 'secondary'}
                                        className={
                                          deviation.status === 'approved' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : deviation.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }
                                      >
                                        {deviation.status === 'approved' ? 'Godkänd' : 
                                         deviation.status === 'pending' ? 'Väntar' : 
                                         deviation.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Leave Requests */}
                          {currentMonthLeaveRequests.length > 0 && (
                            <div>
                              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-1">
                                <span className="material-icons text-sm">event</span>
                                Ledighet ({currentMonthLeaveRequests.length} st)
                              </h4>
                              <div className="space-y-2">
                                {currentMonthLeaveRequests.map((leave, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                      <span className="font-medium">
                                        {format(new Date(leave.startDate), 'dd MMM', { locale: sv })}
                                        {leave.startDate !== leave.endDate && (
                                          <span> - {format(new Date(leave.endDate), 'dd MMM', { locale: sv })}</span>
                                        )}
                                      </span>
                                      <span>{leave.leaveType}</span>
                                      {leave.description && (
                                        <span className="text-gray-600">- {leave.description}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span>
                                        {leave.scope === 'full-day' ? 'Heldag' : 
                                         leave.scope === 'morning' ? 'Förmiddag' :
                                         leave.scope === 'afternoon' ? 'Eftermiddag' : 
                                         'Anpassad'}
                                      </span>
                                      <Badge 
                                        variant={leave.status === 'approved' ? 'default' : 'secondary'}
                                        className={
                                          leave.status === 'approved' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : leave.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }
                                      >
                                        {leave.status === 'approved' ? 'Godkänd' : 
                                         leave.status === 'pending' ? 'Väntar' : 
                                         leave.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Summary */}
                          <div className="pt-2 border-t border-blue-200">
                            <p className="text-xs text-blue-700">
                              💡 Alla dessa avvikelser och ledigheter kommer att inkluderas i din tidrapport för {format(monthStart, 'MMMM yyyy', { locale: sv })}.
                            </p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Action buttons - proportional to content importance */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  {hasMonthlyDeviations ? (
                    <Button
                      size="lg"
                      onClick={() => handleSubmitTimeReport(true)}
                      disabled={isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                      className="flex-1 min-w-[120px] py-4 text-base font-semibold"
                    >
                      <span className="material-icons mr-2">send</span>
                      <span className="hidden sm:inline">Skicka tidrapport</span>
                      <span className="sm:hidden">Skicka</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => handleSubmitTimeReport(false)}
                        disabled={isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                        className="flex-1 min-w-[120px] py-4 text-base font-semibold"
                      >
                        <span className="material-icons mr-2">check_circle</span>
                        <span className="hidden sm:inline">Jag har inga avvikelser</span>
                        <span className="sm:hidden">Inga</span>
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleSubmitTimeReport(true)}
                        disabled={isLoadingMonthlyDeviations || isLoadingMonthlyLeaveRequests}
                        className="flex-1 min-w-[120px] py-4 text-base font-semibold"
                      >
                        <span className="material-icons mr-2">add</span>
                        <span className="hidden sm:inline">Registrera avvikelser</span>
                        <span className="sm:hidden">Avvikelser</span>
                      </Button>
                    </>
                  )}
                </div>

                {/* Helper text only when actionable - minimal */}
                {!hasMonthlyDeviations && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Välj första alternativet om du arbetat enligt schema
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </section>
  );
}
