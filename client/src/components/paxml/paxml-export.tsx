import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/apiService';
import { Employee, Deviation } from '@shared/schema';
import { usePAXMLValidation } from '@/hooks/usePAXMLValidation';
import { ValidationStatusImproved as ValidationStatus } from './validation-status-improved';

interface PAXMLExportProps {
  employees: Employee[];
  deviations: Deviation[];
}

export default function PAXMLExport({ employees, deviations }: PAXMLExportProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeSchedules, setIncludeSchedules] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    filename?: string;
  } | null>(null);

  // Fetch time codes for validation
  const { data: timeCodes = [], isLoading: isLoadingTimeCodes } = useQuery({
    queryKey: ['/api/timecodes'],
    queryFn: () => apiService.getTimeCodes(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const approvedDeviations = deviations.filter(d => d.status === 'approved');
  
  const getFilteredDeviations = () => {
    let filtered = approvedDeviations;
    
    if (selectedEmployees.length > 0) {
      filtered = filtered.filter(d => selectedEmployees.includes(d.employeeId));
    }
    
    if (startDate) {
      filtered = filtered.filter(d => d.date >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(d => d.date <= endDate);
    }
    
    return filtered;
  };

  const filteredDeviations = getFilteredDeviations();

  // Run validation on filtered deviations
  const validation = usePAXMLValidation(filteredDeviations, employees, timeCodes);

  const handleExport = async () => {
    // Block export if there are critical errors
    if (validation.hasErrors) {
      setExportResult({
        success: false,
        message: 'Export blockerad: Fixa kritiska fel innan export till Kontek Lön',
      });
      return;
    }
    setIsExporting(true);
    setExportResult(null);

    try {
      const exportFilters = {
        employeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      let blob: Blob;
      let filename: string;

      if (includeSchedules) {
        const response = await fetch('/api/paxml/export-with-schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...exportFilters,
            includeSchedules: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to export PAXML with schedules');
        }

        blob = await response.blob();
        filename = `paxml-export-with-schedules-${new Date().toISOString().split('T')[0]}.xml`;
      } else {
        blob = await apiService.exportPAXML(exportFilters);
        filename = `paxml-export-${new Date().toISOString().split('T')[0]}.xml`;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportResult({
        success: true,
        message: includeSchedules 
          ? `PAXML-fil med scheman exporterad framgångsrikt (${filteredDeviations.length} transaktioner)`
          : `PAXML-fil exporterad framgångsrikt (${filteredDeviations.length} transaktioner)`,
        filename,
      });
    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Ett fel uppstod vid export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      // If all are selected, deselect all
      setSelectedEmployees([]);
    } else {
      // Select all employees
      setSelectedEmployees(employees.map(emp => emp.employeeId));
    }
  };

  const isAllSelected = selectedEmployees.length === employees.length && employees.length > 0;
  const isIndeterminate = selectedEmployees.length > 0 && selectedEmployees.length < employees.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-icons">file_download</span>
              PAXML Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Exportera godkända avvikelser till PAXML-format för import i Kontek Lön.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="employees">Anställda (valfritt)</Label>
                  {selectedEmployees.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedEmployees.length} av {employees.length} valda
                    </Badge>
                  )}
                </div>
                
                {/* Master Select All Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-md border-b">
                    <input
                      type="checkbox"
                      id="select-all-employees"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="select-all-employees" className="text-sm font-medium cursor-pointer flex-1">
                      {isAllSelected ? 'Avmarkera alla' : 'Markera alla'} ({employees.length} anställda)
                    </Label>
                  </div>
                  
                  {/* Quick Selection Buttons */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const employeesWithDeviations = employees.filter(emp => 
                          filteredDeviations.some(dev => dev.employeeId === emp.employeeId)
                        );
                        setSelectedEmployees(employeesWithDeviations.map(emp => emp.employeeId));
                      }}
                      className="h-7 text-xs"
                    >
                      Bara med avvikelser ({filteredDeviations.reduce((acc, dev) => {
                        if (!acc.includes(dev.employeeId)) acc.push(dev.employeeId);
                        return acc;
                      }, [] as string[]).length})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployees([])}
                      className="h-7 text-xs"
                    >
                      Rensa alla
                    </Button>
                  </div>
                </div>

                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {employees.map((employee) => (
                    <div key={employee.employeeId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`employee-${employee.employeeId}`}
                        checked={selectedEmployees.includes(employee.employeeId)}
                        onChange={() => handleEmployeeToggle(employee.employeeId)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`employee-${employee.employeeId}`} className="text-sm cursor-pointer">
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedEmployees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedEmployees.map((employeeId) => (
                      <Badge key={employeeId} variant="secondary">
                        {getEmployeeName(employeeId)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-schedules"
                    checked={includeSchedules}
                    onChange={(e) => setIncludeSchedules(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="include-schedules" className="text-sm">
                    Inkludera schematransaktioner i exporten
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  När aktiverat kommer både tidtransaktioner och schematransaktioner att exporteras i samma PAXML-fil
                </p>
              </div>

              {/* Månadsval */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Månadsval</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth() + 1; // Convert to 1-indexed month
                      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
                      const lastDay = new Date(year, month, 0).getDate(); // Last day of current month
                      const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                      setStartDate(startOfMonth);
                      setEndDate(endOfMonth);
                    }}
                  >
                    Denna månad
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth(); // Previous month (0-indexed)
                      const prevYear = month === 0 ? year - 1 : year;
                      const prevMonth = month === 0 ? 12 : month;
                      const startOfLastMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
                      const lastDay = new Date(prevYear, prevMonth, 0).getDate(); // Last day of previous month
                      const endOfLastMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                      setStartDate(startOfLastMonth);
                      setEndDate(endOfLastMonth);
                    }}
                  >
                    Föregående månad
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const startOfYear = `${year}-01-01`;
                      const endOfYear = `${year}-12-31`;
                      setStartDate(startOfYear);
                      setEndDate(endOfYear);
                    }}
                  >
                    Hela året
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                  >
                    Rensa
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Från datum (valfritt)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Till datum (valfritt)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Future Date Filtering Warning */}
            <Alert className="border-orange-200 bg-orange-50">
              <span className="material-icons text-orange-600">schedule</span>
              <AlertDescription className="text-orange-800 text-sm">
                <strong>🚨 Automatisk säkerhetsfiltrering:</strong> Framtida datum filtreras automatiskt bort från löneexporten.
                <br />Du betalar endast för arbetstid som redan utförts (datum ≤ idag).
                <br /><em>Detta förhindrar att du betalar för arbetstid som inte utförts än.</em>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleExport}
              disabled={
                isExporting || 
                filteredDeviations.length === 0 || 
                validation.hasErrors ||
                isLoadingTimeCodes
              }
              className={`w-full ${
                validation.hasErrors 
                  ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed' 
                  : validation.hasWarnings 
                    ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' 
                    : ''
              }`}
              size="lg"
            >
              {isExporting ? (
                <>
                  <span className="material-icons mr-2 animate-spin">refresh</span>
                  Exporterar...
                </>
              ) : validation.hasErrors ? (
                <>
                  <span className="material-icons mr-2">block</span>
                  Export blockerad ({validation.issues.filter(i => i.type === 'error').length} fel)
                </>
              ) : isLoadingTimeCodes ? (
                <>
                  <span className="material-icons mr-2 animate-spin">refresh</span>
                  Validerar...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">
                    {validation.hasWarnings ? 'warning' : 'file_download'}
                  </span>
                  {validation.hasWarnings ? 'Exportera med varningar' : 'Exportera PAXML'}
                  {includeSchedules ? ' med scheman' : ''} ({filteredDeviations.length} transaktioner)
                </>
              )}
            </Button>

            {exportResult && (
              <Alert className={exportResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <span className={`material-icons ${exportResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {exportResult.success ? 'check_circle' : 'error'}
                </span>
                <AlertDescription className={exportResult.success ? 'text-green-800' : 'text-red-800'}>
                  {exportResult.message}
                  {exportResult.filename && (
                    <div className="mt-1 text-xs opacity-75">
                      Fil: {exportResult.filename}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-icons">summarize</span>
                Exportöversikt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Totalt godkända avvikelser:
                </p>
                <p className="text-2xl font-bold text-primary">
                  {approvedDeviations.length}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">
                  Kommer att exporteras:
                </p>
                <p className={`text-2xl font-bold ${
                  validation.hasErrors ? 'text-red-600' : 
                  validation.hasWarnings ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {filteredDeviations.length}
                </p>
              </div>

              <Separator />

              {/* Export Readiness Status */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Export status:</p>
                {validation.isValid ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <span className="material-icons text-sm">check_circle</span>
                    <span className="font-medium">Redo för Kontek Lön</span>
                  </div>
                ) : validation.hasErrors ? (
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <span className="material-icons text-sm">error</span>
                    <span className="font-medium">Export blockerad</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <span className="material-icons text-sm">info</span>
                    <span className="font-medium">Validerar...</span>
                  </div>
                )}
              </div>

              {filteredDeviations.length === 0 && approvedDeviations.length > 0 && (
                <Alert>
                  <span className="material-icons">info</span>
                  <AlertDescription>
                    Inga avvikelser matchar de valda filtren.
                  </AlertDescription>
                </Alert>
              )}

              {approvedDeviations.length === 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <span className="material-icons text-yellow-600">warning</span>
                  <AlertDescription className="text-yellow-800">
                    Inga godkända avvikelser finns att exportera.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Validation Status - After controls for better UX flow */}
      <ValidationStatus 
        validation={validation} 
        isLoading={isLoadingTimeCodes && filteredDeviations.length > 0}
        deviations={filteredDeviations}
      />
    </div>
  );
}
