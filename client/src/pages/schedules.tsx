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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheman</h1>
          <p className="text-gray-600 mt-1">
            {isEmployee 
              ? "Visa dina arbetstidsscheman" 
              : "Hantera och visa anställdas arbetstidsscheman"
            }
          </p>
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

      <Card>
        <CardHeader>
          <CardTitle>
            {isEmployee ? t('schedules.filterYourSchedules') : t('schedules.filterSchedules')}
          </CardTitle>
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
                        .map((schedule, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              {new Date(schedule.date).toLocaleDateString('sv-SE')}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {formatTime(schedule.startTime)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {formatTime(schedule.endTime)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {schedule.breakStart && schedule.breakEnd ? `${formatTime(schedule.breakStart)} - ${formatTime(schedule.breakEnd)}` : "-"}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 font-medium">
                              {calculateWorkHours(schedule)}h
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <Badge 
                                variant={schedule.status === 'active' ? 'default' : 'secondary'}
                              >
                                {schedule.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
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
