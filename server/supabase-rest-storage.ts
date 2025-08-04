import { supabase } from './db';
import { getMockData, saveMockData } from './storage';

// Supabase REST API-based storage operations
export class SupabaseRestStorage {
  
  // Helper method to check if Supabase client is available
  private isSupabaseAvailable(): boolean {
    // Use real database if available, fallback to JSON for development
    return supabase !== null;
  }
  
  // Helper method to get data from Supabase with strict database-only mode for production exports
  private async getDataFromSupabase<T>(
    tableName: string,
    filters?: any,
    requireDatabase: boolean = false
  ): Promise<T> {
    if (!this.isSupabaseAvailable()) {
      if (requireDatabase) {
        throw new Error(`🚫 CRITICAL: Database connection required for ${tableName} but Supabase is not available. Mock data fallback is disabled for production exports.`);
      }
      
      console.log(`🔄 Supabase not available for ${tableName}, falling back to JSON files`);
      // Map table name to JSON filename
      const filenameMap: Record<string, string> = {
        'employees': 'employees.json',
        'schedules': 'schedules.json',
        'deviations': 'deviations.json',
        'leave_requests': 'leave-requests.json',
        'time_codes': 'timecodes.json',
        'time_balances': 'timebalances.json',
        'payslips': 'payslips.json'
      };
      
      const filename = filenameMap[tableName];
      if (filename) {
        return await getMockData(filename) as T;
      } else {
        console.warn(`No JSON file mapping for table: ${tableName}`);
        return [] as T;
      }
    }
    
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
      if (requireDatabase) {
        throw new Error(`🚫 CRITICAL: Database query failed for ${tableName} and fallback is disabled for production exports: ${error.message}`);
      }
      
      console.error(`❌ Supabase query failed for ${tableName}, falling back to JSON:`, error.message);
      // Fallback to JSON files
      const filenameMap: Record<string, string> = {
        'employees': 'employees.json',
        'schedules': 'schedules.json',
        'deviations': 'deviations.json',
        'leave_requests': 'leave-requests.json',
        'time_codes': 'timecodes.json',
        'time_balances': 'timebalances.json',
        'payslips': 'payslips.json'
      };
      
      const filename = filenameMap[tableName];
      if (filename) {
        return await getMockData(filename) as T;
      } else {
        throw new Error(`❌ Both Supabase and JSON fallback failed for ${tableName}`);
      }
    }
    
    return data as T;
  }
  
  // Employee operations
  async getEmployees() {
    const employees = await this.getDataFromSupabase('employees');
    return Array.isArray(employees) ? employees.map(this.mapEmployeeFields) : employees;
  }

  async getEmployee(employeeId: string) {
    const employees = await this.getDataFromSupabase('employees', { employee_id: employeeId });
    const employee = Array.isArray(employees) ? employees[0] : employees;
    return employee ? this.mapEmployeeFields(employee) : employee;
  }

  // Helper: Map employee snake_case → camelCase
  private mapEmployeeFields(employee: any) {
    if (!employee) return employee;
    
    const mapped = {
      ...employee,
      // Core fields
      employeeId: employee.employee_id || employee.employeeId,
      firstName: employee.first_name || employee.firstName,
      lastName: employee.last_name || employee.lastName,
      // Contact fields
      phoneNumber: employee.phone_number || employee.phoneNumber,
      workEmail: employee.work_email || employee.workEmail,
      preferredEmail: employee.preferred_email || employee.preferredEmail,
      // Address fields
      careOfAddress: employee.care_of_address || employee.careOfAddress,
      streetAddress: employee.street_address || employee.streetAddress,
      postalCode: employee.postal_code || employee.postalCode,
      // Banking fields
      bankAccountNumber: employee.bank_account_number || employee.bankAccountNumber,
      bankClearingNumber: employee.bank_clearing_number || employee.bankClearingNumber,
      bankBIC: employee.bank_bic || employee.bankBIC,
      bankCountryCode: employee.bank_country_code || employee.bankCountryCode,
      bankIBAN: employee.bank_iban || employee.bankIBAN,
      // Work fields
      scheduleTemplate: employee.schedule_template || employee.scheduleTemplate,
      // Timestamps
      createdAt: employee.created_at || employee.createdAt,
    };
    
    // Remove snake_case duplicates
    delete mapped.employee_id;
    delete mapped.first_name;
    delete mapped.last_name;
    delete mapped.phone_number;
    delete mapped.work_email;
    delete mapped.preferred_email;
    delete mapped.care_of_address;
    delete mapped.street_address;
    delete mapped.postal_code;
    delete mapped.bank_account_number;
    delete mapped.bank_clearing_number;
    delete mapped.bank_bic;
    delete mapped.bank_country_code;
    delete mapped.bank_iban;
    delete mapped.schedule_template;
    delete mapped.created_at;
    
    return mapped;
  }

  // Deviations
  async getDeviations(filters: any = {}) {
    const data = await this.getDataFromSupabase('deviations');
    
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
    
    return filteredData.map(this.mapDeviationFields);
  }
  


  async getDeviation(id: number) {
    const deviations = await this.getDataFromSupabase('deviations');
    const deviation = Array.isArray(deviations) ? deviations.find((d: any) => d.id === id) : null;
    return deviation ? this.mapDeviationFields(deviation) : deviation;
  }

  // 🔒 SECURE VERSION: Get deviations for PAXML export - NO MOCK DATA FALLBACK EVER!
  async getDeviationsForExport(filters: any = {}) {
    console.log('🔒 PAXML EXPORT: Getting deviations from database only (no mock data fallback)');
    
    // This will throw error if Supabase is not available - prevents mock data export
    const data = await this.getDataFromSupabase('deviations', filters, true); // requireDatabase = true
    
    // Apply strict filtering - only database data
    let filteredData = Array.isArray(data) ? data : [];
    
    if (filters.employeeId) {
      filteredData = filteredData.filter((d: any) => 
        (d.employeeId === filters.employeeId) || (d.employee_id === filters.employeeId)
      );
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
    
    // Apply sorting (default newest first)
    filteredData.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const result = filteredData.map(this.mapDeviationFields);
    console.log(`🔒 PAXML EXPORT: Returning ${result.length} deviations from database`);
    
    return result;
  }

  // 🔒 SECURE VERSION: Get employees for PAXML export - NO MOCK DATA FALLBACK EVER!
  async getEmployeesForExport() {
    console.log('🔒 PAXML EXPORT: Getting employees from database only (no mock data fallback)');
    
    // This will throw error if Supabase is not available - prevents mock data export
    const employees = await this.getDataFromSupabase('employees', null, true); // requireDatabase = true
    const result = Array.isArray(employees) ? employees.map(this.mapEmployeeFields) : [];
    
    console.log(`🔒 PAXML EXPORT: Returning ${result.length} employees from database`);
    return result;
  }

  // Helper: Map deviation snake_case → camelCase
  private mapDeviationFields(deviation: any) {
    if (!deviation) return deviation;
    
    const mapped = {
      ...deviation,
      // Core fields
      employeeId: deviation.employee_id || deviation.employeeId,
      timeCode: deviation.time_code || deviation.timeCode,
      periodId: deviation.period_id || deviation.periodId,
      // Time fields
      startTime: deviation.start_time || deviation.startTime,
      endTime: deviation.end_time || deviation.endTime,
      lastUpdated: deviation.last_updated || deviation.lastUpdated,
      // Manager fields
      managerComment: deviation.manager_comment || deviation.managerComment,
      approvedBy: deviation.approved_by || deviation.approvedBy,
      approvedAt: deviation.approved_at || deviation.approvedAt,
      rejectedBy: deviation.rejected_by || deviation.rejectedBy,
      rejectedAt: deviation.rejected_at || deviation.rejectedAt,
      // Timestamps
      createdAt: deviation.created_at || deviation.createdAt,
    };
    
    // Remove snake_case duplicates
    delete mapped.employee_id;
    delete mapped.time_code;
    delete mapped.period_id;
    delete mapped.start_time;
    delete mapped.end_time;
    delete mapped.last_updated;
    delete mapped.manager_comment;
    delete mapped.approved_by;
    delete mapped.approved_at;
    delete mapped.rejected_by;
    delete mapped.rejected_at;
    delete mapped.created_at;
    
    return mapped;
  }

  // Leave requests
  async getLeaveRequests(filters: any = {}) {
    const data = await this.getDataFromSupabase('leave_requests');
    
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
    
    return filteredData.map(this.mapLeaveRequestFields);
  }

  async getLeaveRequest(id: number) {
    const requests = await this.getDataFromSupabase('leave_requests');
    const request = Array.isArray(requests) ? requests.find((lr: any) => lr.id === id) : null;
    return request ? this.mapLeaveRequestFields(request) : request;
  }

  // Helper: Map leave request snake_case → camelCase
  private mapLeaveRequestFields(leave: any) {
    if (!leave) return leave;
    
    const mapped = {
      ...leave,
      // Core fields
      employeeId: leave.employee_id || leave.employeeId,
      startDate: leave.start_date || leave.startDate,
      endDate: leave.end_date || leave.endDate,
      leaveType: leave.leave_type || leave.leaveType,
      // Time fields
      customStartTime: leave.custom_start_time || leave.customStartTime,
      customEndTime: leave.custom_end_time || leave.customEndTime,
      lastUpdated: leave.last_updated || leave.lastUpdated,
      // Manager fields
      managerComment: leave.manager_comment || leave.managerComment,
      approvedBy: leave.approved_by || leave.approvedBy,
      approvedAt: leave.approved_at || leave.approvedAt,
      rejectedBy: leave.rejected_by || leave.rejectedBy,
      rejectedAt: leave.rejected_at || leave.rejectedAt,
      pausedBy: leave.paused_by || leave.pausedBy,
      pausedAt: leave.paused_at || leave.pausedAt,
      pauseReason: leave.pause_reason || leave.pauseReason,
      // Timestamps
      createdAt: leave.created_at || leave.createdAt,
    };
    
    // Remove snake_case duplicates
    delete mapped.employee_id;
    delete mapped.start_date;
    delete mapped.end_date;
    delete mapped.leave_type;
    delete mapped.custom_start_time;
    delete mapped.custom_end_time;
    delete mapped.last_updated;
    delete mapped.manager_comment;
    delete mapped.approved_by;
    delete mapped.approved_at;
    delete mapped.rejected_by;
    delete mapped.rejected_at;
    delete mapped.paused_by;
    delete mapped.paused_at;
    delete mapped.pause_reason;
    delete mapped.created_at;
    
    return mapped;
  }

  // Schedules
  async getSchedules(filters: any = {}) {
    const data = await this.getDataFromSupabase('schedules');
    
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
    const balances = await this.getDataFromSupabase('time_balances');
    const balance = Array.isArray(balances) ? balances.find((tb: any) => 
      (tb.employeeId === employeeId) || (tb.employee_id === employeeId)
    ) : null;
    return balance ? this.mapTimeBalanceFields(balance) : balance;
  }

  // Helper: Map time balance snake_case → camelCase
  private mapTimeBalanceFields(balance: any) {
    if (!balance) return balance;
    
    const mapped = {
      ...balance,
      employeeId: balance.employee_id || balance.employeeId,
      timeBalance: balance.time_balance || balance.timeBalance,
      vacationDays: balance.vacation_days || balance.vacationDays,
      savedVacationDays: balance.saved_vacation_days || balance.savedVacationDays,
      vacationUnit: balance.vacation_unit || balance.vacationUnit,
      compensationTime: balance.compensation_time || balance.compensationTime,
      lastUpdated: balance.last_updated || balance.lastUpdated,
      createdAt: balance.created_at || balance.createdAt,
    };
    
    // Remove snake_case duplicates
    delete mapped.employee_id;
    delete mapped.time_balance;
    delete mapped.vacation_days;
    delete mapped.saved_vacation_days;
    delete mapped.vacation_unit;
    delete mapped.compensation_time;
    delete mapped.last_updated;
    delete mapped.created_at;
    
    return mapped;
  }

  // Payslips
  async getPayslips(employeeId: string) {
    const payslips = await this.getDataFromSupabase('payslips');
    return Array.isArray(payslips) ? payslips.filter((p: any) => 
      (p.employeeId === employeeId) || (p.employee_id === employeeId)
    ) : [];
  }

  // Time codes
  async getTimeCodes() {
    return await this.getDataFromSupabase('time_codes');
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