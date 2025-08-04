import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from "@tanstack/react-query";
import { apiService } from '@/lib/apiService';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { Employee, Schedule, TimeBalance } from '@shared/schema';
import { formatTime, formatDuration } from '@/lib/utils/date';
import ScheduleImport from '@/components/paxml/schedule-import';
import { InfoTooltip, BadgeWithTooltip } from '@/components/ui/mobile-tooltip';
import { useIsMobile } from '@/hooks/use-is-mobile';

export default function SchedulesPage() {
  const { t } = useI18n();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId || user.currentUser?.id;
  const isMobile = useIsMobile();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Fetch time balance using same API as dashboard
  const { data: timeBalance, isLoading: isLoadingTimeBalance } = useQuery({
    queryKey: ['/api/time-balances', employeeId],
    queryFn: () => employeeId
      ? apiService.getTimeBalance(employeeId)
      : Promise.resolve(null),
    enabled: !!employeeId,
  });

  // Quick filter functions for world-class UX - FIXAD datumlogik
  const setQuickFilter = (type: 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'today') => {
    const today = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'thisWeek':
        // Skapa nya datum-objekt för att undvika mutation
        const thisWeekToday = new Date(today);
        const dayOfWeek = thisWeekToday.getDay(); // 0 = söndag, 1 = måndag, etc.
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Om söndag, gå 6 dagar bakåt
        
        start = new Date(thisWeekToday);
        start.setDate(thisWeekToday.getDate() + mondayOffset); // Måndag denna vecka
        
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Söndag denna vecka
        break;
      case 'nextWeek':
        // Skapa nya datum-objekt
        const nextWeekToday = new Date(today);
        const nextDayOfWeek = nextWeekToday.getDay();
        const nextMondayOffset = nextDayOfWeek === 0 ? 1 : 8 - nextDayOfWeek; // Nästa måndag
        
        start = new Date(nextWeekToday);
        start.setDate(nextWeekToday.getDate() + nextMondayOffset); // Måndag nästa vecka
        
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Söndag nästa vecka
        break;
      case 'thisMonth':
        // Första dagen i månaden
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        // Sista dagen i månaden (dag 0 i nästa månad = sista dagen i denna månad)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'nextMonth':
        // Första dagen i nästa månad
        start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        // Sista dagen i nästa månad
        end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      default:
        return;
    }

    // Konvertera till YYYY-MM-DD format (lokal tid, inte UTC)
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatLocalDate(start));
    setEndDate(formatLocalDate(end));
    
    // Debug-logging för att verifiera datumen
    console.log(`🗓️ Snabbfilter "${type}":`, {
      från: formatLocalDate(start),
      till: formatLocalDate(end),
      startDatum: start.toLocaleDateString('sv-SE'),
      slutDatum: end.toLocaleDateString('sv-SE'),
      gamlaUTC: {
        från: start.toISOString().split('T')[0], 
        till: end.toISOString().split('T')[0]
      }
    });
  };

  // Rollbaserade behörigheter
  const currentRole = user.currentRole;
  const currentUser = user.currentUser;
  const canViewAllSchedules = ['manager', 'hr', 'payroll'].includes(currentRole);
  const isEmployee = currentRole === 'employee';

  useEffect(() => {
    loadEmployees();
    loadSchedules();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedEmployeeId, startDate, endDate]);

  // Ladda om anställda när rollen ändras
  useEffect(() => {
    loadEmployees();
  }, [currentRole, currentUser]);

  const loadEmployees = async () => {
    try {
      const employeesData = await apiService.getEmployees();
      
      // Filtrera anställda baserat på roll
      let filteredEmployees = employeesData;
      
      if (isEmployee && currentUser) {
        // Medarbetare kan bara se sitt eget schema
        filteredEmployees = employeesData.filter(emp => emp.employeeId === currentUser.employeeId);
        // Sätt automatiskt den aktuella användaren som vald
        setSelectedEmployeeId(currentUser.employeeId);
      } else if (!canViewAllSchedules) {
        // Fallback: om rollen inte är definierad, visa bara egen
        if (currentUser) {
          filteredEmployees = employeesData.filter(emp => emp.employeeId === currentUser.employeeId);
          setSelectedEmployeeId(currentUser.employeeId);
        }
      }
      
      setEmployees(filteredEmployees);
    } catch (err) {
      setError('Kunde inte ladda anställda');
    }
  };

  const loadSchedules = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: any = {};
      if (selectedEmployeeId) filters.employeeId = selectedEmployeeId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      // Use apiService instead of direct fetch to get proper snake_case→camelCase mapping
      const schedulesData = await apiService.getSchedules(filters);
      setSchedules(schedulesData);
    } catch (err) {
      setError('Kunde inte ladda scheman');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => 
      (e.employeeId === employeeId) || (e.employee_id === employeeId)
    );
    const firstName = employee?.firstName || (employee as any)?.first_name;
    const lastName = employee?.lastName || (employee as any)?.last_name;
    return firstName && lastName ? `${firstName} ${lastName}` : employeeId;
  };

  const calculateWorkHours = (schedule: Schedule) => {
    try {
      // Check if required times are available
      if (!schedule.startTime || !schedule.endTime) {
        return '0.0';
      }
      
      const start = new Date(`2000-01-01T${schedule.startTime}`);
      const end = new Date(`2000-01-01T${schedule.endTime}`);
      
      // Calculate total work time
      const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      
      // Subtract break time if available
      let breakMinutes = 0;
      if (schedule.breakStart && schedule.breakEnd) {
        const breakStart = new Date(`2000-01-01T${schedule.breakStart}`);
        const breakEnd = new Date(`2000-01-01T${schedule.breakEnd}`);
        breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
      }
      
      const workMinutes = Math.max(0, totalMinutes - breakMinutes);
      return (workMinutes / 60).toFixed(1);
    } catch (error) {
      console.warn('Error calculating work hours:', error);
      return '0.0';
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = schedule.employeeId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Simplified header for salaried employees */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Arbetstid & Avvikelser</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Hantera dina arbetstider och registrera avvikelser
          </p>
        </div>
      </div>

      {/* Simplified view for salaried employees */}
      {/* Basic Work Schedule Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
              <span className="material-icons text-xl">schedule</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Din ordinarie arbetstid
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  🕐 08:00 - 17:00
                </span>
                <span className="flex items-center gap-1">
                  📅 Måndag - Fredag
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ 8h per dag
                </span>
                <span className="flex items-center gap-1">
                  ☕ 12:00 - 13:00 lunch
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action - Report Deviation */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
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
                  Registrera sjukdom, semester, övertid eller andra avvikelser från din ordinarie arbetstid
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent-dark text-white px-8 py-3 text-lg"
              onClick={() => {
                // Navigate to deviations page
                window.location.href = '/new-deviation';
              }}
            >
              <span className="material-icons mr-2">add</span>
              {t('action.newDeviation')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Balances Overview - Using real API data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="border-blue-200">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
               <span className="material-icons text-blue-600">beach_access</span>
               Semestersaldo
               <InfoTooltip 
                 content={
                   <div>
                     <p className="font-semibold mb-1">🏖️ Semestersaldo</p>
                     <p className="text-xs">Antal tillgängliga semesterdagar du kan ansöka om som semester</p>
                     <p className="text-xs mt-1">• Minskar när semester godkänns och tas ut</p>
                   </div>
                 }
                 position="bottom"
               />
             </CardTitle>
           </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                {isLoadingTimeBalance ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {timeBalance ? timeBalance.vacationDays : 0}
                  </span>
                )}
                <span className="text-sm text-gray-500">dagar</span>
              </div>
              {isLoadingTimeBalance ? (
                <Skeleton className="h-3 w-32" />
              ) : timeBalance?.savedVacationDays ? (
                <div className="text-xs text-gray-500">
                  Sparade dagar: {Object.values(timeBalance.savedVacationDays).reduce((a, b) => a + (b as number), 0)}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Aktuellt saldo</div>
              )}
            </div>
          </CardContent>
        </Card>

                 <Card className="border-orange-200">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
               <span className="material-icons text-orange-600">hourglass_top</span>
               Tidssaldo
               <InfoTooltip 
                 content={
                   <div>
                     <p className="font-semibold mb-1">⏰ Tidssaldo (Flextid)</p>
                     <p className="text-xs">Din ackumulerade flex-balans från över- och undertid</p>
                     <p className="text-xs mt-1">• <span className="text-green-600">Positivt:</span> Du har jobbat mer än ordinarie tid</p>
                     <p className="text-xs">• <span className="text-red-600">Negativt:</span> Du har en skuld att jobba ikapp</p>
                   </div>
                 }
                 position="bottom"
               />
             </CardTitle>
           </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                {isLoadingTimeBalance ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className={`text-2xl font-bold ${
                    timeBalance && timeBalance.timeBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {timeBalance ? formatDuration(timeBalance.timeBalance ?? 0) : '0h'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {timeBalance && timeBalance.timeBalance >= 0 ? 'Positiv flexbalans' : 'Negativ flexbalans'}
              </div>
            </div>
          </CardContent>
        </Card>

                 <Card className="border-purple-200">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
               <span className="material-icons text-purple-600">trending_up</span>
               Kompensationstid
               <InfoTooltip 
                 content={
                   <div>
                     <p className="font-semibold mb-1">💪 Kompensationstid</p>
                     <p className="text-xs">Övertid som ännu inte kompenserats med ledighet</p>
                     <p className="text-xs mt-1">• Uppstår vid övertidsarbete utöver ordinarie arbetstid</p>
                     <p className="text-xs">• Kan tas ut som kompledighet eller betalas ut</p>
                   </div>
                 }
                 position="bottom"
               />
             </CardTitle>
           </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                {isLoadingTimeBalance ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-bold text-purple-600">
                    {timeBalance ? formatDuration(timeBalance.compensationTime ?? 0) : '0h'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">Ej kompenserad övertid</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deviations/Leave */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="material-icons text-gray-600">event</span>
            Kommande avvikelser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
                  <span className="material-icons text-sm">beach_access</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Semester</p>
                  <p className="text-sm text-gray-600">5-9 augusti (5 dagar)</p>
                </div>
              </div>
                             <BadgeWithTooltip
                 badge={
                   <Badge variant="secondary" className="bg-green-100 text-green-800">
                     Godkänd
                   </Badge>
                 }
                 tooltipContent={
                   <div>
                     <p className="font-semibold mb-1">✅ Godkänd</p>
                     <p className="text-xs">Denna ansökan har godkänts av din chef och kommer att påverka din lön/arbetstid</p>
                   </div>
                 }
                 position="top"
               />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  <span className="material-icons text-sm">local_hospital</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Läkarbesök</p>
                  <p className="text-sm text-gray-600">15 augusti 14:00-15:00</p>
                </div>
              </div>
                             <BadgeWithTooltip
                 badge={
                   <Badge variant="outline" className="border-orange-300 text-orange-700">
                     Väntar på godkännande
                   </Badge>
                 }
                 tooltipContent={
                   <div>
                     <p className="font-semibold mb-1">⏳ Väntar på godkännande</p>
                     <p className="text-xs">Din chef har ännu inte behandlat denna ansökan</p>
                     <p className="text-xs mt-1">• Du får en notifikation när den behandlas</p>
                     <p className="text-xs">• Du kan fortfarande redigera eller ta bort ansökan</p>
                   </div>
                 }
                 position="top"
               />
            </div>

            <div className="text-center py-4">
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                onClick={() => window.location.href = '/deviations'}
              >
                <span className="material-icons mr-2">visibility</span>
                Visa alla avvikelser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>




    </div>
  );
}
