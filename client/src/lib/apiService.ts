import { 
  Employee, 
  Schedule, 
  TimeCode, 
  Deviation, 
  LeaveRequest, 
  TimeBalance, 
  Payslip,
  InsertDeviation,
  InsertLeaveRequest
} from '@shared/schema';

// Simulate API delays
const MOCK_DELAY = 500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API error class
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// API Service that mocks actual API calls
class ApiService {
  // --------------- Employee APIs ---------------
  
  async getAllEmployees(): Promise<Employee[]> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch employees: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((emp: any) => ({
        ...emp,
        employeeId: emp.employee_id || emp.employeeId,
        firstName: emp.first_name || emp.firstName,
        lastName: emp.last_name || emp.lastName,
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }
  
  async getCurrentEmployee(): Promise<Employee> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/employee/current');
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch current employee: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching current employee:', error);
      throw error;
    }
  }
  
  async updateEmployeeInfo(employeeId: string, updateData: Partial<Employee>): Promise<Employee> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to update employee info: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating employee info:', error);
      throw error;
    }
  }
  
  // --------------- Schedule APIs ---------------
  
  async getEmployeeSchedule(employeeId: string, date: string): Promise<Schedule[]> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/schedules/${employeeId}?date=${date}`);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch employee schedule: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((schedule: any) => ({
        ...schedule,
        employeeId: schedule.employee_id || schedule.employeeId,
        startTime: schedule.start_time || schedule.startTime,
        endTime: schedule.end_time || schedule.endTime,
        breakStart: schedule.break_start || schedule.breakStart,
        breakEnd: schedule.break_end || schedule.breakEnd,
      }));
    } catch (error) {
      console.error('Error fetching employee schedule:', error);
      throw error;
    }
  }
  
  // --------------- Time Codes APIs ---------------
  
  async getTimeCodes(): Promise<TimeCode[]> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/timecodes');
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch time codes: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((tc: any) => ({
        ...tc,
        nameSV: tc.name_sv || tc.nameSV,
        nameEN: tc.name_en || tc.nameEN,
      }));
    } catch (error) {
      console.error('Error fetching time codes:', error);
      throw error;
    }
  }
  
  // --------------- Deviations APIs ---------------
  
  async getAllDeviations(filters?: { 
    period?: string, 
    status?: string, 
    timeCode?: string 
  }): Promise<Deviation[]> {
    try {
      await delay(MOCK_DELAY);
      let url = '/api/deviations';
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.period) params.append('period', filters.period);
        if (filters.status) params.append('status', filters.status);
        if (filters.timeCode) params.append('timeCode', filters.timeCode);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch all deviations: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((dev: any) => ({
        ...dev,
        employeeId: dev.employee_id || dev.employeeId,
        timeCode: dev.time_code || dev.timeCode,
      }));
    } catch (error) {
      console.error('Error fetching all deviations:', error);
      throw error;
    }
  }
  
  async getDeviations(employeeId: string, filters?: {
    period?: string, 
    status?: string, 
    timeCode?: string,
    sortBy?: string
  }): Promise<Deviation[]> {
    try {
      await delay(MOCK_DELAY);
      let url = `/api/deviations?employeeId=${employeeId}`;
      
      if (filters) {
        if (filters.period) url += `&period=${filters.period}`;
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.timeCode) url += `&timeCode=${filters.timeCode}`;
        if (filters.sortBy) url += `&sortBy=${filters.sortBy}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch deviations: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((dev: any) => ({
        ...dev,
        employeeId: dev.employee_id || dev.employeeId,
        timeCode: dev.time_code || dev.timeCode,
      }));
    } catch (error) {
      console.error('Error fetching deviations:', error);
      throw error;
    }
  }
  
  async getDeviation(id: number): Promise<Deviation> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/deviations/${id}`);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch deviation: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching deviation with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createDeviation(deviation: InsertDeviation): Promise<Deviation> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/deviations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviation),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to create deviation: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating deviation:', error);
      throw error;
    }
  }
  
  async updateDeviation(id: number, updates: Partial<Deviation>): Promise<Deviation> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/deviations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to update deviation: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating deviation with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteDeviation(id: number): Promise<void> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/deviations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to delete deviation: ${response.statusText}`, response.status);
      }
    } catch (error) {
      console.error(`Error deleting deviation with ID ${id}:`, error);
      throw error;
    }
  }
  
  // --------------- Manager Approvals APIs ---------------
  
  async getPendingDeviations(managerId?: string): Promise<Deviation[]> {
    try {
      await delay(MOCK_DELAY);
      let url = '/api/manager/deviations/pending';
      if (managerId) {
        url += `?managerId=${encodeURIComponent(managerId)}`;
      }
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch pending deviations: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending deviations:', error);
      throw error;
    }
  }
  
  async approveDeviation(id: number, comment?: string): Promise<Deviation> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/manager/deviations/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to approve deviation: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error approving deviation with ID ${id}:`, error);
      throw error;
    }
  }
  
  async rejectDeviation(id: number, comment: string): Promise<Deviation> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/manager/deviations/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to reject deviation: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error rejecting deviation with ID ${id}:`, error);
      throw error;
    }
  }
  
  async returnDeviation(id: number, comment: string): Promise<Deviation> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/manager/deviations/${id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to return deviation: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error returning deviation with ID ${id}:`, error);
      throw error;
    }
  }
  
  // --------------- Leave Request APIs ---------------
  
  async getLeaveRequests(employeeId: string, filters?: { 
    period?: string, 
    status?: string, 
    leaveType?: string 
  }): Promise<LeaveRequest[]> {
    try {
      await delay(MOCK_DELAY);
      let url = `/api/leave-requests?employeeId=${employeeId}`;
      
      if (filters) {
        if (filters.period) url += `&period=${filters.period}`;
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.leaveType) url += `&leaveType=${filters.leaveType}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch leave requests: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((leave: any) => ({
        ...leave,
        employeeId: leave.employee_id || leave.employeeId,
        leaveType: leave.leave_type || leave.leaveType,
      }));
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      throw error;
    }
  }
  
  async getLeaveRequest(id: number): Promise<LeaveRequest> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/leave-requests/${id}`);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch leave request: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching leave request with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaveRequest),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to create leave request: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }
  
  async updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to update leave request: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating leave request with ID ${id}:`, error);
      throw error;
    }
  }
  
  async deleteLeaveRequest(id: number): Promise<void> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to delete leave request: ${response.statusText}`, response.status);
      }
    } catch (error) {
      console.error(`Error deleting leave request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // --------------- Manager Leave Approvals APIs ---------------
  
  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/manager/leave-requests/pending');
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch pending leave requests: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending leave requests:', error);
      throw error;
    }
  }
  
  async approveLeaveRequest(id: number, comment?: string): Promise<LeaveRequest> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/manager/leave-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to approve leave request: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error approving leave request with ID ${id}:`, error);
      throw error;
    }
  }
  
  async rejectLeaveRequest(id: number, comment: string): Promise<LeaveRequest> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/manager/leave-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to reject leave request: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error rejecting leave request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // --------------- Time Balance APIs ---------------
  
  async getTimeBalance(employeeId: string): Promise<TimeBalance> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/time-balances/${employeeId}`);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch time balance: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return {
        ...rawData,
        employeeId: rawData.employee_id || rawData.employeeId,
        timeBalance: rawData.time_balance || rawData.timeBalance,
        vacationDays: rawData.vacation_days || rawData.vacationDays,
        savedVacationDays: rawData.saved_vacation_days || rawData.savedVacationDays,
        vacationUnit: rawData.vacation_unit || rawData.vacationUnit,
        compensationTime: rawData.compensation_time || rawData.compensationTime,
        lastUpdated: rawData.last_updated || rawData.lastUpdated,
      };
    } catch (error) {
      console.error('Error fetching time balance:', error);
      throw error;
    }
  }
  
  // --------------- Payslip APIs ---------------
  
  async getPayslips(employeeId: string): Promise<Payslip[]> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/payslips/${employeeId}`);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch payslips: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((payslip: any) => ({
        ...payslip,
        employeeId: payslip.employee_id || payslip.employeeId,
      }));
    } catch (error) {
      console.error('Error fetching payslips:', error);
      throw error;
    }
  }
  
  async getPayslipFile(payslipId: number): Promise<Blob> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch(`/api/payslips/file/${payslipId}`);
      
      if (!response.ok) {
        throw new ApiError(`Failed to fetch payslip file: ${response.statusText}`, response.status);
      }
      
      return await response.blob();
    } catch (error) {
      console.error(`Error fetching payslip file with ID ${payslipId}:`, error);
      throw error;
    }
  }

  // --------------- PAXML Export APIs ---------------
  
  async exportPAXML(filters?: {
    employeeIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/paxml/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters || {}),
      });
      
      if (!response.ok) {
        throw new ApiError(`Failed to export PAXML: ${response.statusText}`, response.status);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting PAXML:', error);
      throw error;
    }
  }

  // --------------- Schedule APIs ---------------

  async getSchedules(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Schedule[]> {
    try {
      await delay(MOCK_DELAY);
      const params = new URLSearchParams();
      if (filters?.employeeId) {
        params.append('employeeId', filters.employeeId);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/schedules?${params.toString()}`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch schedules: ${response.statusText}`, response.status);
      }
      
      const rawData = await response.json();
      
      // Map snake_case fields to camelCase for TypeScript compatibility
      return rawData.map((schedule: any) => ({
        ...schedule,
        employeeId: schedule.employee_id || schedule.employeeId,
        startTime: schedule.start_time || schedule.startTime,
        endTime: schedule.end_time || schedule.endTime,
        breakStart: schedule.break_start || schedule.breakStart,
        breakEnd: schedule.break_end || schedule.breakEnd,
      }));
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }

  async importSchedulesFromXML(xmlContent: string): Promise<{
    message: string;
    schedules: any[];
    count: number;
  }> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/paxml/import-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.error || 'Failed to import schedules', response.status);
      }

      return response.json();
    } catch (error) {
      console.error('Error importing schedules from XML:', error);
      throw error;
    }
  }

  async exportPAXMLWithSchedules(filters?: {
    employeeIds?: string[];
    startDate?: string;
    endDate?: string;
    includeSchedules?: boolean;
  }): Promise<Blob> {
    try {
      await delay(MOCK_DELAY);
      const response = await fetch('/api/paxml/export-with-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters || {}),
      });

      if (!response.ok) {
        throw new ApiError(`Failed to export PAXML with schedules: ${response.statusText}`, response.status);
      }

      return response.blob();
    } catch (error) {
      console.error('Error exporting PAXML with schedules:', error);
      throw error;
    }
  }

  async getEmployees(): Promise<Employee[]> {
    return this.getAllEmployees();
  }
}

export const apiService = new ApiService();
