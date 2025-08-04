import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiService } from '@/lib/apiService';
import { Employee, Deviation } from '@shared/schema';

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

  const handleExport = async () => {
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

  return (
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
                <Label htmlFor="employees">Anställda (valfritt)</Label>
                <div className="mt-2 space-y-2">
                  {employees.map((employee) => (
                    <div key={employee.employeeId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`employee-${employee.employeeId}`}
                        checked={selectedEmployees.includes(employee.employeeId)}
                        onChange={() => handleEmployeeToggle(employee.employeeId)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`employee-${employee.employeeId}`} className="text-sm">
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

              {/* Snabba månadsval */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Snabba månadsval</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      setStartDate(startOfMonth.toISOString().split('T')[0]);
                      setEndDate(endOfMonth.toISOString().split('T')[0]);
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
                      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                      setStartDate(startOfLastMonth.toISOString().split('T')[0]);
                      setEndDate(endOfLastMonth.toISOString().split('T')[0]);
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
                      const startOfYear = new Date(now.getFullYear(), 0, 1);
                      const endOfYear = new Date(now.getFullYear(), 11, 31);
                      setStartDate(startOfYear.toISOString().split('T')[0]);
                      setEndDate(endOfYear.toISOString().split('T')[0]);
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

            <Button
              onClick={handleExport}
              disabled={isExporting || filteredDeviations.length === 0}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <span className="material-icons mr-2 animate-spin">refresh</span>
                  Exporterar...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">file_download</span>
                  Exportera PAXML{includeSchedules ? ' med scheman' : ''} ({filteredDeviations.length} transaktioner)
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
            <CardTitle>Exportöversikt</CardTitle>
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
              <p className="text-2xl font-bold text-green-600">
                {filteredDeviations.length}
              </p>
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
  );
}
