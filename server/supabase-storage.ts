import { db } from './db';
import { getMockData } from './storage';
import { 
  employees, deviations, leaveRequests, timeCodes, schedules, 
  timeBalances, payslips, activityLogs, periods, reminders
} from '@shared/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

// Supabase-based storage operations
export class SupabaseStorage {
  
  // Helper method to check if database is available
  private isDatabaseAvailable(): boolean {
    return db !== null;
  }
  
  // Helper method to get data with fallback
  private async getDataWithFallback<T>(operation: () => Promise<T>, fallbackFile: string): Promise<T> {
    if (!this.isDatabaseAvailable()) {
      console.log(`Database not available, falling back to ${fallbackFile}`);
      return await getMockData(fallbackFile) as T;
    }
    
    try {
      return await operation();
    } catch (error) {
      console.error(`Database error, falling back to ${fallbackFile}:`, error);
      return await getMockData(fallbackFile) as T;
    }
  }
  
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
    const conditions = [];
    
    if (filters.employeeId) {
      conditions.push(eq(deviations.employeeId, filters.employeeId));
    }
    
    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(deviations.status, filters.status));
    }
    
    if (filters.timeCode && filters.timeCode !== 'all') {
      conditions.push(eq(deviations.timeCode, filters.timeCode));
    }
    
    if (filters.startDate) {
      conditions.push(gte(deviations.date, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(deviations.date, filters.endDate));
    }
    
    // Determine sort order
    let orderClause;
    switch (filters.sortBy) {
      case 'date-desc':
        orderClause = desc(deviations.date);
        break;
      case 'date-asc':
        orderClause = asc(deviations.date);
        break;
      case 'status':
        orderClause = asc(deviations.status);
        break;
      default:
        orderClause = desc(deviations.date); // Default to newest first
        break;
    }
    
    if (conditions.length > 0) {
      return await db.select().from(deviations)
        .where(and(...conditions))
        .orderBy(orderClause);
    }
    
    return await db.select().from(deviations)
      .orderBy(orderClause);
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
        lastUpdated: data.lastUpdated || new Date()
      })
      .returning();
    return created;
  }

  async updateDeviation(id: number, updates: any) {
    const [updated] = await db
      .update(deviations)
      .set({
        ...updates,
        lastUpdated: new Date()
      })
      .where(eq(deviations.id, id))
      .returning();
    return updated;
  }

  async deleteDeviation(id: number) {
    const result = await db.delete(deviations).where(eq(deviations.id, id));
    return result.count > 0;
  }

  // Leave request operations
  async getLeaveRequests(filters: any = {}) {
    const conditions = [];
    
    if (filters.employeeId) {
      conditions.push(eq(leaveRequests.employeeId, filters.employeeId));
    }
    
    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(leaveRequests.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(leaveRequests)
        .where(and(...conditions))
        .orderBy(desc(leaveRequests.lastUpdated));
    }
    
    return await db.select().from(leaveRequests)
      .orderBy(desc(leaveRequests.lastUpdated));
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
        lastUpdated: new Date()
      })
      .returning();
    return created;
  }

  async updateLeaveRequest(id: number, updates: any) {
    const [updated] = await db
      .update(leaveRequests)
      .set({
        ...updates,
        lastUpdated: new Date()
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated;
  }

  async deleteLeaveRequest(id: number) {
    const result = await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return result.count > 0;
  }

  // Time codes
  async getTimeCodes() {
    return await db.select().from(timeCodes);
  }

  // Schedules
  async getSchedules(filters: any = {}) {
    return await this.getDataWithFallback(
      async () => {
        const conditions = [];
        
        if (filters.employeeId) {
          conditions.push(eq(schedules.employeeId, filters.employeeId));
        }
        
        if (filters.date) {
          conditions.push(eq(schedules.date, filters.date));
        }
        
        if (filters.startDate) {
          conditions.push(gte(schedules.date, filters.startDate));
        }
        
        if (filters.endDate) {
          conditions.push(lte(schedules.date, filters.endDate));
        }
        
        if (conditions.length > 0) {
          return await db!.select().from(schedules)
            .where(and(...conditions));
        }
        
        return await db!.select().from(schedules);
      },
      'schedules.json'
    ).then((data: any) => {
      // Apply client-side filtering for JSON fallback
      let filteredData = data;
      
      if (filters.employeeId) {
        filteredData = filteredData.filter((s: any) => s.employeeId === filters.employeeId);
      }
      
      if (filters.date) {
        filteredData = filteredData.filter((s: any) => s.date === filters.date);
      }
      
      if (filters.startDate) {
        filteredData = filteredData.filter((s: any) => s.date >= filters.startDate);
      }
      
      if (filters.endDate) {
        filteredData = filteredData.filter((s: any) => s.date <= filters.endDate);
      }
      
      return filteredData;
    });
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