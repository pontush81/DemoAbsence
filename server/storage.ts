import { 
  Employee, type InsertEmployee,
  Schedule, type InsertSchedule,
  TimeCode, type InsertTimeCode,
  Deviation, type InsertDeviation,
  LeaveRequest, type InsertLeaveRequest,
  TimeBalance, type InsertTimeBalance,
  Payslip, type InsertPayslip,
  ActivityLog, type InsertActivityLog,
  Period, type InsertPeriod,
  Reminder, type InsertReminder,
  employees, schedules, timeCodes, deviations, leaveRequests, timeBalances, payslips, activityLogs,
  periods, reminders
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for all storage operations
export interface IStorage {
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | undefined>;
  
  // Period operations
  getPeriods(filters?: { employeeId?: string, status?: string, year?: number, month?: number }): Promise<Period[]>;
  getPeriod(id: number): Promise<Period | undefined>;
  createPeriod(period: InsertPeriod): Promise<Period>;
  updatePeriod(id: number, updates: Partial<Period>): Promise<Period | undefined>;
  
  // Schedule operations
  getSchedules(employeeId: string, date?: string): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  
  // TimeCode operations
  getTimeCodes(): Promise<TimeCode[]>;
  getTimeCode(id: number): Promise<TimeCode | undefined>;
  getTimeCodeByCode(code: string): Promise<TimeCode | undefined>;
  
  // Deviation operations
  getDeviations(filters?: { employeeId?: string, status?: string, timeCode?: string, periodId?: number }): Promise<Deviation[]>;
  getDeviation(id: number): Promise<Deviation | undefined>;
  createDeviation(deviation: InsertDeviation): Promise<Deviation>;
  updateDeviation(id: number, updates: Partial<Deviation>): Promise<Deviation | undefined>;
  deleteDeviation(id: number): Promise<boolean>;
  assignDeviationsToPeriod(deviationIds: number[], periodId: number): Promise<boolean>;
  
  // LeaveRequest operations
  getLeaveRequests(filters?: { employeeId?: string, status?: string, leaveType?: string }): Promise<LeaveRequest[]>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;
  deleteLeaveRequest(id: number): Promise<boolean>;
  pauseLeaveRequest(id: number, pausedBy: string, pauseReason: string): Promise<LeaveRequest | undefined>;
  
  // Reminder operations
  getReminders(employeeId: string, isRead?: boolean): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  markReminderAsRead(id: number): Promise<Reminder | undefined>;
  
  // TimeBalance operations
  getTimeBalance(employeeId: string): Promise<TimeBalance | undefined>;
  updateTimeBalance(employeeId: string, updates: Partial<TimeBalance>): Promise<TimeBalance | undefined>;
  
  // Payslip operations
  getPayslips(employeeId: string): Promise<Payslip[]>;
  getPayslip(id: number): Promise<Payslip | undefined>;
  
  // ActivityLog operations
  getActivityLogs(employeeId: string, filters?: { type?: string, referenceId?: string }): Promise<ActivityLog[]>;
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
  private periods: Map<number, Period>;
  private reminders: Map<number, Reminder>;
  
  private employeeIdCounter: number;
  private scheduleIdCounter: number;
  private timeCodeIdCounter: number;
  private deviationIdCounter: number;
  private leaveRequestIdCounter: number;
  private timeBalanceIdCounter: number;
  private payslipIdCounter: number;
  private activityLogIdCounter: number;
  private periodIdCounter: number;
  private reminderIdCounter: number;
  
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

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    const result = await db.select().from(employees);
    return result;
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.id, id));
    return result;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return result;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [result] = await db.insert(employees).values(employee).returning();
    return result;
  }

  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee | undefined> {
    const [result] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.employeeId, employeeId))
      .returning();
    return result;
  }
  
  // Schedule operations
  async getSchedules(employeeId: string, date?: string): Promise<Schedule[]> {
    let query = db.select().from(schedules).where(eq(schedules.employeeId, employeeId));
    
    if (date) {
      query = query.where(eq(schedules.date, date));
    }
    
    return await query;
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [result] = await db.select().from(schedules).where(eq(schedules.id, id));
    return result;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [result] = await db.insert(schedules).values(schedule).returning();
    return result;
  }
  
  // TimeCode operations
  async getTimeCodes(): Promise<TimeCode[]> {
    return await db.select().from(timeCodes);
  }

  async getTimeCode(id: number): Promise<TimeCode | undefined> {
    const [result] = await db.select().from(timeCodes).where(eq(timeCodes.id, id));
    return result;
  }

  async getTimeCodeByCode(code: string): Promise<TimeCode | undefined> {
    const [result] = await db.select().from(timeCodes).where(eq(timeCodes.code, code));
    return result;
  }
  
  // Deviation operations
  async getDeviations(filters?: { employeeId?: string, status?: string, timeCode?: string }): Promise<Deviation[]> {
    let query = db.select().from(deviations);
    
    if (filters?.employeeId) {
      query = query.where(eq(deviations.employeeId, filters.employeeId));
    }
    
    if (filters?.status) {
      query = query.where(eq(deviations.status, filters.status));
    }
    
    if (filters?.timeCode) {
      query = query.where(eq(deviations.timeCode, filters.timeCode));
    }
    
    return await query;
  }

  async getDeviation(id: number): Promise<Deviation | undefined> {
    const [result] = await db.select().from(deviations).where(eq(deviations.id, id));
    return result;
  }

  async createDeviation(deviation: InsertDeviation): Promise<Deviation> {
    const [result] = await db.insert(deviations).values(deviation).returning();
    return result;
  }

  async updateDeviation(id: number, updates: Partial<Deviation>): Promise<Deviation | undefined> {
    const [result] = await db
      .update(deviations)
      .set(updates)
      .where(eq(deviations.id, id))
      .returning();
    return result;
  }

  async deleteDeviation(id: number): Promise<boolean> {
    const result = await db.delete(deviations).where(eq(deviations.id, id));
    return result.rowCount > 0;
  }
  
  // LeaveRequest operations
  async getLeaveRequests(filters?: { employeeId?: string, status?: string, leaveType?: string }): Promise<LeaveRequest[]> {
    let query = db.select().from(leaveRequests);
    
    if (filters?.employeeId) {
      query = query.where(eq(leaveRequests.employeeId, filters.employeeId));
    }
    
    if (filters?.status) {
      query = query.where(eq(leaveRequests.status, filters.status));
    }
    
    if (filters?.leaveType) {
      query = query.where(eq(leaveRequests.leaveType, filters.leaveType));
    }
    
    return await query;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [result] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return result;
  }

  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const [result] = await db.insert(leaveRequests).values(leaveRequest).returning();
    return result;
  }

  async updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const [result] = await db
      .update(leaveRequests)
      .set(updates)
      .where(eq(leaveRequests.id, id))
      .returning();
    return result;
  }

  async deleteLeaveRequest(id: number): Promise<boolean> {
    const result = await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return result.rowCount > 0;
  }
  
  // TimeBalance operations
  async getTimeBalance(employeeId: string): Promise<TimeBalance | undefined> {
    const [result] = await db.select().from(timeBalances).where(eq(timeBalances.employeeId, employeeId));
    return result;
  }

  async updateTimeBalance(employeeId: string, updates: Partial<TimeBalance>): Promise<TimeBalance | undefined> {
    const [result] = await db
      .update(timeBalances)
      .set(updates)
      .where(eq(timeBalances.employeeId, employeeId))
      .returning();
    return result;
  }
  
  // Payslip operations
  async getPayslips(employeeId: string): Promise<Payslip[]> {
    return await db.select().from(payslips).where(eq(payslips.employeeId, employeeId));
  }

  async getPayslip(id: number): Promise<Payslip | undefined> {
    const [result] = await db.select().from(payslips).where(eq(payslips.id, id));
    return result;
  }
  
  // ActivityLog operations
  async getActivityLogs(employeeId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).where(eq(activityLogs.employeeId, employeeId));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
