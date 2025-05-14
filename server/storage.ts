import { 
  Employee, type InsertEmployee,
  Schedule, type InsertSchedule,
  TimeCode, type InsertTimeCode,
  Deviation, type InsertDeviation,
  LeaveRequest, type InsertLeaveRequest,
  TimeBalance, type InsertTimeBalance,
  Payslip, type InsertPayslip,
  ActivityLog, type InsertActivityLog
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | undefined>;
  
  // Schedule operations
  getSchedules(employeeId: string, date?: string): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  
  // TimeCode operations
  getTimeCodes(): Promise<TimeCode[]>;
  getTimeCode(id: number): Promise<TimeCode | undefined>;
  getTimeCodeByCode(code: string): Promise<TimeCode | undefined>;
  
  // Deviation operations
  getDeviations(filters?: { employeeId?: string, status?: string, timeCode?: string }): Promise<Deviation[]>;
  getDeviation(id: number): Promise<Deviation | undefined>;
  createDeviation(deviation: InsertDeviation): Promise<Deviation>;
  updateDeviation(id: number, updates: Partial<Deviation>): Promise<Deviation | undefined>;
  deleteDeviation(id: number): Promise<boolean>;
  
  // LeaveRequest operations
  getLeaveRequests(filters?: { employeeId?: string, status?: string, leaveType?: string }): Promise<LeaveRequest[]>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;
  deleteLeaveRequest(id: number): Promise<boolean>;
  
  // TimeBalance operations
  getTimeBalance(employeeId: string): Promise<TimeBalance | undefined>;
  updateTimeBalance(employeeId: string, updates: Partial<TimeBalance>): Promise<TimeBalance | undefined>;
  
  // Payslip operations
  getPayslips(employeeId: string): Promise<Payslip[]>;
  getPayslip(id: number): Promise<Payslip | undefined>;
  
  // ActivityLog operations
  getActivityLogs(employeeId: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private schedules: Map<number, Schedule>;
  private timeCodes: Map<number, TimeCode>;
  private deviations: Map<number, Deviation>;
  private leaveRequests: Map<number, LeaveRequest>;
  private timeBalances: Map<number, TimeBalance>;
  private payslips: Map<number, Payslip>;
  private activityLogs: Map<number, ActivityLog>;
  
  private employeeIdCounter: number;
  private scheduleIdCounter: number;
  private timeCodeIdCounter: number;
  private deviationIdCounter: number;
  private leaveRequestIdCounter: number;
  private timeBalanceIdCounter: number;
  private payslipIdCounter: number;
  private activityLogIdCounter: number;
  
  constructor() {
    this.employees = new Map();
    this.schedules = new Map();
    this.timeCodes = new Map();
    this.deviations = new Map();
    this.leaveRequests = new Map();
    this.timeBalances = new Map();
    this.payslips = new Map();
    this.activityLogs = new Map();
    
    this.employeeIdCounter = 1;
    this.scheduleIdCounter = 1;
    this.timeCodeIdCounter = 1;
    this.deviationIdCounter = 1;
    this.leaveRequestIdCounter = 1;
    this.timeBalanceIdCounter = 1;
    this.payslipIdCounter = 1;
    this.activityLogIdCounter = 1;
  }
  
  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }
  
  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.employeeId === employeeId
    );
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const newEmployee: Employee = { ...employee, id };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }
  
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | undefined> {
    const employee = await this.getEmployeeByEmployeeId(employeeId);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(employee.id, updatedEmployee);
    return updatedEmployee;
  }
  
  // Schedule operations
  async getSchedules(employeeId: string, date?: string): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => {
      if (schedule.employeeId !== employeeId) return false;
      if (date && schedule.date !== date) return false;
      return true;
    });
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }
  
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleIdCounter++;
    const newSchedule: Schedule = { ...schedule, id };
    this.schedules.set(id, newSchedule);
    return newSchedule;
  }
  
  // TimeCode operations
  async getTimeCodes(): Promise<TimeCode[]> {
    return Array.from(this.timeCodes.values());
  }
  
  async getTimeCode(id: number): Promise<TimeCode | undefined> {
    return this.timeCodes.get(id);
  }
  
  async getTimeCodeByCode(code: string): Promise<TimeCode | undefined> {
    return Array.from(this.timeCodes.values()).find(
      (timeCode) => timeCode.code === code
    );
  }
  
  // Deviation operations
  async getDeviations(filters?: { employeeId?: string, status?: string, timeCode?: string }): Promise<Deviation[]> {
    return Array.from(this.deviations.values()).filter(deviation => {
      if (filters?.employeeId && deviation.employeeId !== filters.employeeId) return false;
      if (filters?.status && deviation.status !== filters.status) return false;
      if (filters?.timeCode && deviation.timeCode !== filters.timeCode) return false;
      return true;
    });
  }
  
  async getDeviation(id: number): Promise<Deviation | undefined> {
    return this.deviations.get(id);
  }
  
  async createDeviation(deviation: InsertDeviation): Promise<Deviation> {
    const id = this.deviationIdCounter++;
    const newDeviation: Deviation = { 
      ...deviation, 
      id,
      lastUpdated: new Date().toISOString()
    };
    this.deviations.set(id, newDeviation);
    return newDeviation;
  }
  
  async updateDeviation(id: number, updates: Partial<Deviation>): Promise<Deviation | undefined> {
    const deviation = this.deviations.get(id);
    if (!deviation) return undefined;
    
    const updatedDeviation = { 
      ...deviation, 
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    this.deviations.set(id, updatedDeviation);
    return updatedDeviation;
  }
  
  async deleteDeviation(id: number): Promise<boolean> {
    return this.deviations.delete(id);
  }
  
  // LeaveRequest operations
  async getLeaveRequests(filters?: { employeeId?: string, status?: string, leaveType?: string }): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(request => {
      if (filters?.employeeId && request.employeeId !== filters.employeeId) return false;
      if (filters?.status && request.status !== filters.status) return false;
      if (filters?.leaveType && request.leaveType !== filters.leaveType) return false;
      return true;
    });
  }
  
  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }
  
  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = this.leaveRequestIdCounter++;
    const newLeaveRequest: LeaveRequest = { 
      ...leaveRequest, 
      id,
      lastUpdated: new Date().toISOString()
    };
    this.leaveRequests.set(id, newLeaveRequest);
    return newLeaveRequest;
  }
  
  async updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;
    
    const updatedLeaveRequest = { 
      ...leaveRequest, 
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    this.leaveRequests.set(id, updatedLeaveRequest);
    return updatedLeaveRequest;
  }
  
  async deleteLeaveRequest(id: number): Promise<boolean> {
    return this.leaveRequests.delete(id);
  }
  
  // TimeBalance operations
  async getTimeBalance(employeeId: string): Promise<TimeBalance | undefined> {
    return Array.from(this.timeBalances.values()).find(
      (timeBalance) => timeBalance.employeeId === employeeId
    );
  }
  
  async updateTimeBalance(employeeId: string, updates: Partial<TimeBalance>): Promise<TimeBalance | undefined> {
    const timeBalance = await this.getTimeBalance(employeeId);
    if (!timeBalance) return undefined;
    
    const updatedTimeBalance = { 
      ...timeBalance, 
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    this.timeBalances.set(timeBalance.id, updatedTimeBalance);
    return updatedTimeBalance;
  }
  
  // Payslip operations
  async getPayslips(employeeId: string): Promise<Payslip[]> {
    return Array.from(this.payslips.values()).filter(
      (payslip) => payslip.employeeId === employeeId
    );
  }
  
  async getPayslip(id: number): Promise<Payslip | undefined> {
    return this.payslips.get(id);
  }
  
  // ActivityLog operations
  async getActivityLogs(employeeId: string): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values()).filter(
      (log) => log.employeeId === employeeId
    );
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const newLog: ActivityLog = { 
      ...log, 
      id,
      timestamp: log.timestamp || new Date().toISOString()
    };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
}

export const storage = new MemStorage();
