import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiService } from '@/lib/apiService';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { Employee, Schedule } from '@shared/schema';
import { formatTime } from '@/lib/utils/date';
import ScheduleImport from '@/components/paxml/schedule-import';

export default function SchedulesPage() {
  const { t } = useI18n();
  const { user } = useStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

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

    // Konvertera till YYYY-MM-DD format
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    // Debug-logging för att verifiera datumen
    console.log(`🗓️ Snabbfilter "${type}":`, {
      från: start.toISOString().split('T')[0],
      till: end.toISOString().split('T')[0],
      startDatum: start.toLocaleDateString('sv-SE'),
      slutDatum: end.toLocaleDateString('sv-SE')
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
    <div className="container mx-auto p-6 space-y-6">
      {/* World-class UX header with enhanced information hierarchy */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Scheman</h1>
          <p className="text-lg text-muted-foreground mt-1">
            {isEmployee 
              ? "Visa dina arbetstider och kommande pass" 
              : "Hantera och visa personalscheman"
            }
          </p>
          <div className="mt-2 text-sm text-gray-500">
            📅 <strong>Tips:</strong> Använd snabbfilter nedan för att visa aktuella veckor
          </div>
          
          {/* Status summary - showing what's currently loaded */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📊 {schedules.length} scheman hittades
            </span>
            {schedules.length > 0 && (
              <span className="text-gray-500">
                🕒 Total arbetstid: {schedules.reduce((total, s) => total + 8, 0)}h
              </span>
            )}
          </div>
        </div>
        {canViewAllSchedules && (
          <Button
            onClick={() => setShowImport(!showImport)}
            variant={showImport ? "secondary" : "default"}
          >
            <span className="material-icons mr-2">
              {showImport ? 'close' : 'upload'}
            </span>
            {showImport ? 'Stäng import' : 'Importera scheman'}
          </Button>
        )}
      </div>

      {/* Next shift highlight - World-class UX "what's next" focus */}
      {schedules.length > 0 && (() => {
        const today = new Date().toISOString().split('T')[0];
        const upcomingSchedules = schedules
          .filter(s => s.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 3);
        
        if (upcomingSchedules.length > 0) {
          const nextShift = upcomingSchedules[0];
          const isToday = nextShift.date === today;
          
          return (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  {isToday ? '🚀 Dagens pass' : '🔜 Nästa pass'}
                  <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                    {isToday ? 'IDAG' : 'KOMMANDE'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">📅</span>
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">
                        {new Date(nextShift.date).toLocaleDateString('sv-SE', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                      <p className="text-sm text-green-700">
                        {isToday ? 'Idag' : `Om ${Math.ceil((new Date(nextShift.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dagar`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">🕐</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatTime(nextShift.startTime)} - {formatTime(nextShift.endTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {calculateWorkHours(nextShift)}h arbetstid
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-xl">☕</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {nextShift.breakStart && nextShift.breakEnd 
                          ? `${formatTime(nextShift.breakStart)} - ${formatTime(nextShift.breakEnd)}`
                          : 'Ingen rast'
                        }
                      </p>
                      <p className="text-sm text-gray-600">Rast</p>
                    </div>
                  </div>
                </div>
                
                {upcomingSchedules.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-2">Kommande pass:</p>
                    <div className="flex flex-wrap gap-2">
                      {upcomingSchedules.slice(1).map((schedule, index) => (
                        <Badge key={index} variant="outline" className="bg-white text-green-700 border-green-300">
                          {new Date(schedule.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} - {formatTime(schedule.startTime)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {showImport && (
        <Card>
          <CardHeader>
            <CardTitle>Importera scheman från PAXML</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleImport />
          </CardContent>
        </Card>
      )}

      {/* Quick filters - World-class UX feature */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">⚡ Snabbfilter</CardTitle>
          <p className="text-sm text-blue-700">Välj en tidsperiod för att snabbt visa relevanta scheman</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickFilter('today')}
              className="bg-white hover:bg-blue-100 border-blue-300"
            >
              📅 Idag
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickFilter('thisWeek')}
              className="bg-white hover:bg-blue-100 border-blue-300"
            >
              📆 Denna vecka
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickFilter('nextWeek')}
              className="bg-white hover:bg-blue-100 border-blue-300"
            >
              📅 Nästa vecka
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickFilter('thisMonth')}
              className="bg-white hover:bg-blue-100 border-blue-300"
            >
              📊 Denna månad
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickFilter('nextMonth')}
              className="bg-white hover:bg-blue-100 border-blue-300"
            >
              📈 Nästa månad
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            🔧 {isEmployee ? 'Anpassa ditt schema' : 'Anpassade filter'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Använd detaljerade filter för specifika datum och anställda
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-1 ${canViewAllSchedules ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            {canViewAllSchedules && (
              <div>
                <Label htmlFor="employee-filter">Anställd (valfritt)</Label>
                <select
                  id="employee-filter"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Alla anställda</option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="start-date">Från datum</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="end-date">Till datum</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={loadSchedules} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="material-icons mr-2 animate-spin">refresh</span>
                  Laddar...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">search</span>
                  Uppdatera
                </>
              )}
            </Button>
            
            {(selectedEmployeeId || startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedEmployeeId('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                <span className="material-icons mr-2">clear</span>
                Rensa filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <span className="material-icons">error</span>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {Object.keys(groupedSchedules).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <span className="material-icons text-gray-400 text-6xl mb-4">schedule</span>
              <p className="text-gray-600">Inga scheman hittades</p>
              <p className="text-sm text-gray-500 mt-1">
                Prova att ändra filtren eller importera scheman från PAXML
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSchedules).map(([employeeId, employeeSchedules]) => (
            <Card key={employeeId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-icons">person</span>
                  {getEmployeeName(employeeId)}
                  <Badge variant="secondary">{employeeSchedules.length} dagar</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Datum</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Starttid</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Sluttid</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Rast</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Arbetstid</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeSchedules
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((schedule, index) => {
                          const today = new Date().toISOString().split('T')[0];
                          const scheduleDate = schedule.date;
                          const isToday = scheduleDate === today;
                          const isPast = scheduleDate < today;
                          const isFuture = scheduleDate > today;
                          
                          return (
                            <tr 
                              key={index} 
                              className={`
                                transition-all duration-200 hover:bg-blue-50 hover:shadow-sm
                                ${isToday ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300 font-semibold' : ''}
                                ${isPast ? 'opacity-75' : ''}
                              `}
                            >
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="flex items-center gap-2">
                                  {isToday && <span className="text-blue-600">📅</span>}
                                  {isFuture && <span className="text-green-600">🔜</span>}
                                  {isPast && <span className="text-gray-400">✅</span>}
                                  <span className={isToday ? 'text-blue-800 font-bold' : ''}>
                                    {new Date(schedule.date).toLocaleDateString('sv-SE', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                  </span>
                                  {isToday && (
                                    <Badge variant="default" className="text-xs bg-blue-600">
                                      IDAG
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span className="font-mono text-sm">
                                  🕐 {formatTime(schedule.startTime)}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span className="font-mono text-sm">
                                  🕕 {formatTime(schedule.endTime)}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span className="text-sm">
                                  {schedule.breakStart && schedule.breakEnd 
                                    ? `☕ ${formatTime(schedule.breakStart)} - ${formatTime(schedule.breakEnd)}` 
                                    : "➖ Ingen rast"
                                  }
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-600">⏱️</span>
                                  <span className="font-bold text-lg">
                                    {calculateWorkHours(schedule)}h
                                  </span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge 
                                  variant={schedule.status === 'active' ? 'default' : 'secondary'}
                                  className={`
                                    ${schedule.status === 'active' 
                                      ? 'bg-green-100 text-green-800 border-green-300' 
                                      : 'bg-gray-100 text-gray-600 border-gray-300'
                                    }
                                  `}
                                >
                                  {schedule.status === 'active' ? '✅ Aktiv' : '⏸️ Inaktiv'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
