import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import { apiService } from "@/lib/apiService";
import { useQuery } from "@tanstack/react-query";
// Import types directly - no central types file exists yet
interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface Deviation {  
  id: number;
  employeeId: string;
  date: string;
  timeCode: string;
  status: string;
  [key: string]: any;
}

interface LeaveRequest {
  id: number;
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  [key: string]: any;
}

interface Schedule {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

interface TimeBalance {
  employeeId: string;
  timeBalance: number;
  vacationDays: number;
  [key: string]: any;
}
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "wouter";

interface PayrollEmployeeData {
  employee: Employee;
  deviations: Deviation[];
  leaveRequests: LeaveRequest[];
  schedule: Schedule[];
  timeBalance: TimeBalance | null;
  status: 'ready' | 'needs_review' | 'errors' | 'exported';
  warnings: string[];
  errors: string[];
}

export default function PayrollDashboard() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollData, setPayrollData] = useState<PayrollEmployeeData[]>([]);

  // Fetch all employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: apiService.getAllEmployees
  });

  // Fetch deviations for current month
  const { data: allDeviations = [] } = useQuery({
    queryKey: ['deviations', selectedMonth],
    queryFn: () => apiService.getDeviations("ALL") // Use existing method
  });

  // Fetch leave requests for current month
  const { data: allLeaveRequests = [] } = useQuery({
    queryKey: ['leave-requests', selectedMonth],
    queryFn: () => apiService.getLeaveRequests("ALL") // Use existing method
  });

  // Build payroll data when dependencies change
  useEffect(() => {
    const buildPayrollData = async () => {
      const data: PayrollEmployeeData[] = [];

      for (const employee of employees) {
        try {
          // Get employee-specific data
          const [schedule, timeBalance] = await Promise.all([
            apiService.getEmployeeSchedule(employee.employeeId, selectedMonth + "-01").catch(() => []),
            apiService.getTimeBalance(employee.employeeId).catch(() => null)
          ]);

          // Filter data for selected month
          const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
          const monthEnd = endOfMonth(new Date(selectedMonth + '-01'));

          const employeeDeviations = (allDeviations as Deviation[]).filter((d: Deviation) => 
            d.employeeId === employee.employeeId &&
            new Date(d.date) >= monthStart &&
            new Date(d.date) <= monthEnd
          );

          const employeeLeaveRequests = (allLeaveRequests as LeaveRequest[]).filter((lr: LeaveRequest) => 
            lr.employeeId === employee.employeeId &&
            new Date(lr.startDate) <= monthEnd &&
            new Date(lr.endDate) >= monthStart
          );

          // Calculate status and warnings
          const warnings: string[] = [];
          const errors: string[] = [];

          // Check for common issues
          if (employeeDeviations.some(d => d.status === 'pending')) {
            warnings.push('Ej godkända avvikelser');
          }
          if (employeeLeaveRequests.some(lr => lr.status === 'pending')) {
            warnings.push('Ej godkänd ledighet');
          }
          if (employeeDeviations.some(d => !d.timeCode)) {
            errors.push('Saknar tidkod');
          }
          if (schedule.length === 0) {
            warnings.push('Saknar schema');
          }

          // Determine overall status
          let status: PayrollEmployeeData['status'] = 'ready';
          if (errors.length > 0) {
            status = 'errors';
          } else if (warnings.length > 0) {
            status = 'needs_review';
          }

          data.push({
            employee,
            deviations: employeeDeviations,
            leaveRequests: employeeLeaveRequests,
            schedule,
            timeBalance,
            status,
            warnings,
            errors
          });

        } catch (error) {
          console.error(`Error building payroll data for ${employee.employeeId}:`, error);
        }
      }

      setPayrollData(data);
    };

    if (employees.length > 0) {
      buildPayrollData();
    }
  }, [employees, allDeviations, allLeaveRequests, selectedMonth]);

  // Filter data based on search and status
  const filteredData = payrollData.filter(data => {
    const matchesSearch = 
      data.employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || data.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status counts for overview
  const statusCounts = {
    total: payrollData.length,
    ready: payrollData.filter(d => d.status === 'ready').length,
    needs_review: payrollData.filter(d => d.status === 'needs_review').length,
    errors: payrollData.filter(d => d.status === 'errors').length,
    exported: payrollData.filter(d => d.status === 'exported').length
  };

  const getStatusBadge = (status: PayrollEmployeeData['status']) => {
    const variants = {
      ready: { variant: "default" as const, text: "Klar" },
      needs_review: { variant: "secondary" as const, text: "Behöver granskning" },
      errors: { variant: "destructive" as const, text: "Fel" },
      exported: { variant: "outline" as const, text: "Exporterad" }
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const handleExportToKontekLon = () => {
    // Navigate to PAXML export with payroll context
    window.location.href = '/paxml-export?source=payroll';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Löneöversikt</h1>
          <p className="text-muted-foreground">
            Översikt och validering av lönedata för {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: sv })}
          </p>
        </div>
        <Button onClick={handleExportToKontekLon} size="lg">
          📤 Exportera till Kontek Lön
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klara</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Behöver granskning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.needs_review}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.errors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exporterade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.exported}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter och sök</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Sök anställd (namn eller ID)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrera status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                <SelectItem value="ready">Klara</SelectItem>
                <SelectItem value="needs_review">Behöver granskning</SelectItem>
                <SelectItem value="errors">Fel</SelectItem>
                <SelectItem value="exported">Exporterade</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Anställda - Löneberedning {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: sv })}</CardTitle>
          <CardDescription>
            Klicka på en anställd för att se detaljerad information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga anställda matchar dina filterkriterier
              </p>
            ) : (
              filteredData.map((data) => (
                <Card key={data.employee.employeeId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">
                            {data.employee.firstName} {data.employee.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {data.employee.employeeId}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(data.status)}
                          {data.deviations.length > 0 && (
                            <Badge variant="outline">
                              {data.deviations.length} avvikelser
                            </Badge>
                          )}
                          {data.leaveRequests.length > 0 && (
                            <Badge variant="outline">
                              {data.leaveRequests.length} ledigheter
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/payslips?employee=${data.employee.employeeId}`}>
                          <Button variant="outline" size="sm">
                            Lönespec
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          Detaljer
                        </Button>
                      </div>
                    </div>

                    {/* Warnings and Errors */}
                    {(data.warnings.length > 0 || data.errors.length > 0) && (
                      <div className="mt-3 space-y-2">
                        {data.errors.map((error, index) => (
                          <Alert key={`error-${index}`} variant="destructive">
                            <AlertDescription>❌ {error}</AlertDescription>
                          </Alert>
                        ))}
                        {data.warnings.map((warning, index) => (
                          <Alert key={`warning-${index}`}>
                            <AlertDescription>⚠️ {warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Arbetstimmar:</span>
                        <div className="font-medium">
                          {data.schedule.reduce((total, s) => {
                            if (s.startTime && s.endTime) {
                              const start = new Date(`2000-01-01T${s.startTime}`);
                              const end = new Date(`2000-01-01T${s.endTime}`);
                              return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                            }
                            return total;
                          }, 0).toFixed(1)}h
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Semesterdagar:</span>
                        <div className="font-medium">
                          {data.timeBalance?.vacationDays || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avvikelser:</span>
                        <div className="font-medium">
                          {data.deviations.length}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ledigheter:</span>
                        <div className="font-medium">
                          {data.leaveRequests.length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/manager">👨‍💼 Hantera godkännanden</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/paxml-export">📤 PAXML Export</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/schedules">📅 Scheman</Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              🔄 Uppdatera data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}