import { supabase } from './db';
import { getMockData } from './storage';

// Supabase REST API-based storage operations
export class SupabaseRestStorage {
  
  // Helper method to check if Supabase client is available
  private isSupabaseAvailable(): boolean {
    return supabase !== null;
  }
  
  // Helper method to get data with fallback to JSON
  private async getDataWithFallback<T>(
    tableName: string, 
    fallbackFile: string,
    filters?: any
  ): Promise<T> {
    if (!this.isSupabaseAvailable()) {
      console.log(`Supabase not available, falling back to ${fallbackFile}`);
      return await getMockData(fallbackFile) as T;
    }
    
    try {
      let query = supabase!.from(tableName).select('*');
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as T;
    } catch (error) {
      console.error(`Supabase REST API error for ${tableName}, falling back to ${fallbackFile}:`, error);
      return await getMockData(fallbackFile) as T;
    }
  }
  
  // Employee operations
  async getEmployees() {
    return await this.getDataWithFallback('employees', 'employees.json');
  }

  async getEmployee(employeeId: string) {
    const employees = await this.getDataWithFallback('employees', 'employees.json', { employeeId });
    return Array.isArray(employees) ? employees[0] : employees;
  }

  // Deviations
  async getDeviations(filters: any = {}) {
    const data = await this.getDataWithFallback('deviations', 'deviations.json');
    
    // Apply client-side filtering for JSON fallback
    let filteredData = Array.isArray(data) ? data : [];
    
    if (filters.employeeId) {
      filteredData = filteredData.filter((d: any) => d.employeeId === filters.employeeId);
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter((d: any) => d.status === filters.status);
    }
    
    if (filters.startDate) {
      filteredData = filteredData.filter((d: any) => d.date >= filters.startDate);
    }
    
    if (filters.endDate) {
      filteredData = filteredData.filter((d: any) => d.date <= filters.endDate);
    }
    
    return filteredData;
  }

  async getDeviation(id: number) {
    const deviations = await this.getDataWithFallback('deviations', 'deviations.json');
    return Array.isArray(deviations) ? deviations.find((d: any) => d.id === id) : null;
  }

  // Leave requests
  async getLeaveRequests(filters: any = {}) {
    const data = await this.getDataWithFallback('leave_requests', 'leave-requests.json');
    
    // Apply client-side filtering for JSON fallback
    let filteredData = Array.isArray(data) ? data : [];
    
    if (filters.employeeId) {
      filteredData = filteredData.filter((lr: any) => lr.employeeId === filters.employeeId);
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter((lr: any) => lr.status === filters.status);
    }
    
    return filteredData;
  }

  async getLeaveRequest(id: number) {
    const requests = await this.getDataWithFallback('leave_requests', 'leave-requests.json');
    return Array.isArray(requests) ? requests.find((lr: any) => lr.id === id) : null;
  }

  // Schedules
  async getSchedules(filters: any = {}) {
    const data = await this.getDataWithFallback('schedules', 'schedules.json');
    
    // Apply client-side filtering for JSON fallback
    let filteredData = Array.isArray(data) ? data : [];
    
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
  }

  // Time balances
  async getTimeBalance(employeeId: string) {
    const balances = await this.getDataWithFallback('time_balances', 'timebalances.json');
    return Array.isArray(balances) ? balances.find((tb: any) => tb.employeeId === employeeId) : null;
  }

  // Payslips
  async getPayslips(employeeId: string) {
    const payslips = await this.getDataWithFallback('payslips', 'payslips.json');
    return Array.isArray(payslips) ? payslips.filter((p: any) => p.employeeId === employeeId) : [];
  }

  // Time codes
  async getTimeCodes() {
    return await this.getDataWithFallback('time_codes', 'timecodes.json');
  }
}

// Create and export instance
export const restStorage = new SupabaseRestStorage();