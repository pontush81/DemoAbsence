import { db } from './db';
import { 
  employees, deviations, leaveRequests, timeCodes, schedules, 
  timeBalances, payslips, activityLogs, periods, reminders
} from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// Supabase-based storage operations
export class SupabaseStorage {
  
  // Employee operations
  async getEmployees() {
    return await db.select().from(employees);
  }

  async getEmployee(employeeId: string) {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async updateEmployee(employeeId: string, updates: any) {
    const [updated] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.employeeId, employeeId))
      .returning();
    return updated;
  }

  // Deviation operations
  async getDeviations(filters: any = {}) {
    let query = db.select().from(deviations);
    
    if (filters.employeeId) {
      query = query.where(eq(deviations.employeeId, filters.employeeId));
    }
    
    if (filters.status && filters.status !== 'all') {
      query = query.where(eq(deviations.status, filters.status));
    }
    
    if (filters.timeCode && filters.timeCode !== 'all') {
      query = query.where(eq(deviations.timeCode, filters.timeCode));
    }
    
    if (filters.startDate) {
      query = query.where(gte(deviations.date, filters.startDate));
    }
    
    if (filters.endDate) {
      query = query.where(lte(deviations.date, filters.endDate));
    }
    
    return await query.orderBy(desc(deviations.lastUpdated));
  }

  async getDeviation(id: number) {
    const [deviation] = await db.select().from(deviations).where(eq(deviations.id, id));
    return deviation;
  }

  async createDeviation(data: any) {
    const [created] = await db
      .insert(deviations)
      .values({
        ...data,
        lastUpdated: new Date().toISOString()
      })
      .returning();
    return created;
  }

  async updateDeviation(id: number, updates: any) {
    const [updated] = await db
      .update(deviations)
      .set({
        ...updates,
        lastUpdated: new Date().toISOString()
      })
      .where(eq(deviations.id, id))
      .returning();
    return updated;
  }

  async deleteDeviation(id: number) {
    const result = await db.delete(deviations).where(eq(deviations.id, id));
    return result.rowCount > 0;
  }

  // Leave request operations
  async getLeaveRequests(filters: any = {}) {
    let query = db.select().from(leaveRequests);
    
    if (filters.employeeId) {
      query = query.where(eq(leaveRequests.employeeId, filters.employeeId));
    }
    
    if (filters.status && filters.status !== 'all') {
      query = query.where(eq(leaveRequests.status, filters.status));
    }
    
    return await query.orderBy(desc(leaveRequests.lastUpdated));
  }

  async getLeaveRequest(id: number) {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request;
  }

  async createLeaveRequest(data: any) {
    const [created] = await db
      .insert(leaveRequests)
      .values({
        ...data,
        lastUpdated: new Date().toISOString()
      })
      .returning();
    return created;
  }

  async updateLeaveRequest(id: number, updates: any) {
    const [updated] = await db
      .update(leaveRequests)
      .set({
        ...updates,
        lastUpdated: new Date().toISOString()
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated;
  }

  async deleteLeaveRequest(id: number) {
    const result = await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return result.rowCount > 0;
  }

  // Time codes
  async getTimeCodes() {
    return await db.select().from(timeCodes);
  }

  // Schedules
  async getSchedules(filters: any = {}) {
    let query = db.select().from(schedules);
    
    if (filters.employeeId) {
      query = query.where(eq(schedules.employeeId, filters.employeeId));
    }
    
    if (filters.date) {
      query = query.where(eq(schedules.date, filters.date));
    }
    
    if (filters.startDate) {
      query = query.where(gte(schedules.date, filters.startDate));
    }
    
    if (filters.endDate) {
      query = query.where(lte(schedules.date, filters.endDate));
    }
    
    return await query;
  }

  // Time balances
  async getTimeBalance(employeeId: string) {
    const [balance] = await db.select().from(timeBalances).where(eq(timeBalances.employeeId, employeeId));
    return balance;
  }

  // Payslips
  async getPayslips(employeeId: string) {
    return await db.select().from(payslips)
      .where(eq(payslips.employeeId, employeeId))
      .orderBy(desc(payslips.year), desc(payslips.month));
  }

  // Activity logs
  async getActivityLogs(employeeId: string) {
    return await db.select().from(activityLogs)
      .where(eq(activityLogs.employeeId, employeeId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async createActivityLog(data: any) {
    const [created] = await db
      .insert(activityLogs)
      .values(data)
      .returning();
    return created;
  }
}

export const storage = new SupabaseStorage(); 