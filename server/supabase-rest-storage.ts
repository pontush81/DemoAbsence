import { supabase } from './db';
import { getMockData, saveMockData } from './storage';

// Supabase REST API-based storage operations
export class SupabaseRestStorage {
  
  // Helper method to check if Supabase client is available
  private isSupabaseAvailable(): boolean {
    // Use real database if available, fallback to JSON for development
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
    const employees = await this.getDataWithFallback('employees', 'employees.json', { employee_id: employeeId });
    return Array.isArray(employees) ? employees[0] : employees;
  }

  // Deviations
  async getDeviations(filters: any = {}) {
    const data = await this.getDataWithFallback('deviations', 'deviations.json');
    
    // Apply client-side filtering for JSON fallback
    let filteredData = Array.isArray(data) ? data : [];
    
    if (filters.employeeId) {
      filteredData = filteredData.filter((d: any) => 
        (d.employeeId === filters.employeeId) || (d.employee_id === filters.employeeId)
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter((d: any) => d.status === filters.status);
    }
    
    // Handle new "needs-action" combined filter (statusIn array)
    if (filters.statusIn && Array.isArray(filters.statusIn)) {
      filteredData = filteredData.filter((d: any) => 
        filters.statusIn.includes(d.status)
      );
    }
    
    if (filters.startDate) {
      filteredData = filteredData.filter((d: any) => d.date >= filters.startDate);
    }
    
    if (filters.endDate) {
      filteredData = filteredData.filter((d: any) => d.date <= filters.endDate);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      filteredData.sort((a: any, b: any) => {
        switch (filters.sortBy) {
          case 'date-desc':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime(); // Default to newest first
        }
      });
    } else {
      // Default sort by newest first
      filteredData.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
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
      filteredData = filteredData.filter((lr: any) => 
        (lr.employeeId === filters.employeeId) || (lr.employee_id === filters.employeeId)
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter((lr: any) => lr.status === filters.status);
    }
    
    // Handle "active" combined filter for leave planning (statusIn array)
    if (filters.statusIn && Array.isArray(filters.statusIn)) {
      filteredData = filteredData.filter((lr: any) => 
        filters.statusIn.includes(lr.status)
      );
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
      filteredData = filteredData.filter((s: any) => 
        (s.employeeId === filters.employeeId) || (s.employee_id === filters.employeeId)
      );
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
    return Array.isArray(balances) ? balances.find((tb: any) => 
      (tb.employeeId === employeeId) || (tb.employee_id === employeeId)
    ) : null;
  }

  // Payslips
  async getPayslips(employeeId: string) {
    const payslips = await this.getDataWithFallback('payslips', 'payslips.json');
    return Array.isArray(payslips) ? payslips.filter((p: any) => 
      (p.employeeId === employeeId) || (p.employee_id === employeeId)
    ) : [];
  }

  // Time codes
  async getTimeCodes() {
    return await this.getDataWithFallback('time_codes', 'timecodes.json');
  }

  // === WRITE OPERATIONS ===

  // Create deviation
  async createDeviation(data: any) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase not available for create operations');
    }

    try {
      const { data: created, error } = await supabase!
        .from('deviations')
        .insert({
          employee_id: data.employeeId,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          time_code: data.timeCode,
          comment: data.comment,
          status: data.status || 'pending',
          manager_comment: data.managerComment,
          submitted: data.submitted || new Date().toISOString(),
          approved_by: data.approvedBy,
          approved_at: data.approvedAt,
          rejected_by: data.rejectedBy,
          rejected_at: data.rejectedAt
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    } catch (error) {
      console.error('REST create deviation error:', error);
      throw error;
    }
  }

  // Update deviation
  async updateDeviation(id: number, updates: any) {
    if (!this.isSupabaseAvailable()) {
      // Fallback to mock data update when Supabase not available
      const deviations = await getMockData('deviations.json');
      const index = deviations.findIndex((d: any) => d.id === id);
      
      if (index === -1) {
        throw new Error(`Deviation with id ${id} not found`);
      }
      
      // Update the deviation in mock data
      const updatedDeviation = {
        ...deviations[index],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      deviations[index] = updatedDeviation;
      await saveMockData('deviations.json', deviations);
      
      return updatedDeviation;
    }

    try {
      const updateData: any = {};
      
      // Map camelCase to snake_case for database
      if (updates.employeeId) updateData.employee_id = updates.employeeId;
      if (updates.startTime) updateData.start_time = updates.startTime;
      if (updates.endTime) updateData.end_time = updates.endTime;
      if (updates.timeCode) updateData.time_code = updates.timeCode;
      if (updates.managerComment) updateData.manager_comment = updates.managerComment;
      if (updates.approvedBy) updateData.approved_by = updates.approvedBy;
      if (updates.approvedAt) updateData.approved_at = updates.approvedAt;
      if (updates.rejectedBy) updateData.rejected_by = updates.rejectedBy;
      if (updates.rejectedAt) updateData.rejected_at = updates.rejectedAt;
      
      // Direct mapping for these fields
      ['date', 'comment', 'status', 'submitted'].forEach(field => {
        if (updates[field] !== undefined) updateData[field] = updates[field];
      });

      const { data: updated, error } = await supabase!
        .from('deviations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('REST update deviation error:', error);
      throw error;
    }
  }

  // Delete deviation
  async deleteDeviation(id: number) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase not available for delete operations');
    }

    try {
      const { error } = await supabase!
        .from('deviations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('REST delete deviation error:', error);
      throw error;
    }
  }

  // === LEAVE REQUEST OPERATIONS ===

  // Create leave request
  async createLeaveRequest(data: any) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase not available for create operations');
    }

    try {
      const { data: created, error } = await supabase!
        .from('leave_requests')
        .insert({
          employee_id: data.employeeId,
          start_date: data.startDate,
          end_date: data.endDate,
          leave_type: data.leaveType,
          reason: data.reason,
          status: data.status || 'pending',
          submitted: data.submitted || new Date().toISOString(),
          last_updated: data.lastUpdated || new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    } catch (error) {
      console.error('REST create leave request error:', error);
      throw error;
    }
  }

  // Update leave request
  async updateLeaveRequest(id: number, updates: any) {
    if (!this.isSupabaseAvailable()) {
      // Fallback to mock data update when Supabase not available
      const leaveRequests = await getMockData('leave-requests.json');
      const index = leaveRequests.findIndex((lr: any) => lr.id === id);
      
      if (index === -1) {
        throw new Error(`Leave request with id ${id} not found`);
      }
      
      // Update the leave request in mock data
      const updatedLeaveRequest = {
        ...leaveRequests[index],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      leaveRequests[index] = updatedLeaveRequest;
      await saveMockData('leave-requests.json', leaveRequests);
      
      return updatedLeaveRequest;
    }

    try {
      const updateData: any = {};
      
      // Map camelCase to snake_case for database
      if (updates.employeeId) updateData.employee_id = updates.employeeId;
      if (updates.startDate) updateData.start_date = updates.startDate;
      if (updates.endDate) updateData.end_date = updates.endDate;
      if (updates.leaveType) updateData.leave_type = updates.leaveType;
      if (updates.lastUpdated) updateData.last_updated = updates.lastUpdated;
      
      // Manager-related fields (CRITICAL: These were missing!)
      if (updates.managerComment !== undefined) updateData.manager_comment = updates.managerComment;
      if (updates.manager_comment !== undefined) updateData.manager_comment = updates.manager_comment;
      if (updates.approvedBy !== undefined) updateData.approved_by = updates.approvedBy;
      if (updates.approved_by !== undefined) updateData.approved_by = updates.approved_by;
      if (updates.approvedAt !== undefined) updateData.approved_at = updates.approvedAt;
      if (updates.approved_at !== undefined) updateData.approved_at = updates.approved_at;
      if (updates.rejectedBy !== undefined) updateData.rejected_by = updates.rejectedBy;
      if (updates.rejected_by !== undefined) updateData.rejected_by = updates.rejected_by;
      if (updates.rejectedAt !== undefined) updateData.rejected_at = updates.rejectedAt;
      if (updates.rejected_at !== undefined) updateData.rejected_at = updates.rejected_at;
      if (updates.pausedBy !== undefined) updateData.paused_by = updates.pausedBy;
      if (updates.paused_by !== undefined) updateData.paused_by = updates.paused_by;
      if (updates.pausedAt !== undefined) updateData.paused_at = updates.pausedAt;
      if (updates.paused_at !== undefined) updateData.paused_at = updates.paused_at;
      if (updates.pauseReason !== undefined) updateData.pause_reason = updates.pauseReason;
      if (updates.pause_reason !== undefined) updateData.pause_reason = updates.pause_reason;
      
      // Direct mapping for these fields
      ['reason', 'status', 'submitted'].forEach(field => {
        if (updates[field] !== undefined) updateData[field] = updates[field];
      });

      const { data: updated, error } = await supabase!
        .from('leave_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('REST update leave request error:', error);
      throw error;
    }
  }

  // Delete leave request
  async deleteLeaveRequest(id: number) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase not available for delete operations');
    }

    try {
      const { error } = await supabase!
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('REST delete leave request error:', error);
      throw error;
    }
  }

  // === EMPLOYEE OPERATIONS ===

  // Update employee
  async updateEmployee(employeeId: string, updates: any) {
    if (!this.isSupabaseAvailable()) {
      throw new Error('Supabase not available for update operations');
    }

    try {
      const updateData: any = {};
      
      // Map camelCase to snake_case for database
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.streetAddress) updateData.street_address = updates.streetAddress;
      if (updates.postalCode) updateData.postal_code = updates.postalCode;
      if (updates.phoneNumber) updateData.phone_number = updates.phoneNumber;
      if (updates.workEmail) updateData.work_email = updates.workEmail;
      if (updates.preferredEmail) updateData.preferred_email = updates.preferredEmail;
      if (updates.bankClearingNumber) updateData.bank_clearing_number = updates.bankClearingNumber;
      if (updates.bankAccountNumber) updateData.bank_account_number = updates.bankAccountNumber;
      if (updates.bankBic) updateData.bank_bic = updates.bankBic;
      if (updates.bankCountryCode) updateData.bank_country_code = updates.bankCountryCode;
      if (updates.bankIban) updateData.bank_iban = updates.bankIban;
      if (updates.scheduleTemplate) updateData.schedule_template = updates.scheduleTemplate;
      if (updates.careOfAddress) updateData.care_of_address = updates.careOfAddress;
      
      // Direct mapping for these fields
      ['personnummer', 'city', 'country', 'email', 'status', 'role', 'department', 'position', 'manager'].forEach(field => {
        if (updates[field] !== undefined) updateData[field] = updates[field];
      });

      const { data: updated, error } = await supabase!
        .from('employees')
        .update(updateData)
        .eq('employee_id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('REST update employee error:', error);
      throw error;
    }
  }
}

// Create and export instance
export const restStorage = new SupabaseRestStorage();