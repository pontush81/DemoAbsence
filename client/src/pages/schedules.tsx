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
import { Employee, Schedule } from '@shared/schema';
import ScheduleImport from '@/components/paxml/schedule-import';

export default function SchedulesPage() {
  const { t } = useI18n();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadSchedules();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedEmployeeId, startDate, endDate]);

  const loadEmployees = async () => {
    try {
      const employeesData = await apiService.getEmployees();
      setEmployees(employeesData);
    } catch (err) {
      setError('Kunde inte ladda anställda');
    }
  };

  const loadSchedules = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedEmployeeId) params.append('employeeId', selectedEmployeeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/schedules?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load schedules');
      }

      const schedulesData = await response.json();
      setSchedules(schedulesData);
    } catch (err) {
      setError('Kunde inte ladda scheman');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const calculateWorkHours = (schedule: Schedule) => {
    const start = new Date(`2000-01-01T${schedule.startTime}`);
    const end = new Date(`2000-01-01T${schedule.endTime}`);
    const breakStart = new Date(`2000-01-01T${schedule.breakStart}`);
    const breakEnd = new Date(`2000-01-01T${schedule.breakEnd}`);
    
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakMinutes;
    
    return (workMinutes / 60).toFixed(1);
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
          <p className="text-gray-600 mt-1">Hantera och visa anställdas arbetstidsscheman</p>
        </div>
        <Button
          onClick={() => setShowImport(!showImport)}
          variant={showImport ? "secondary" : "default"}
        >
          <span className="material-icons mr-2">
            {showImport ? 'close' : 'upload'}
          </span>
          {showImport ? 'Stäng import' : 'Importera scheman'}
        </Button>
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
          <CardTitle>Filtrera scheman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              {formatTime(schedule.breakStart)} - {formatTime(schedule.breakEnd)}
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
