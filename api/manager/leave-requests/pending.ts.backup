import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to read mock data
async function getMockData(filename: string) {
  try {
    const filePath = path.join(process.cwd(), 'mock-data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading mock data ${filename}:`, error);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { managerId } = req.query;
    
    // 🚨 SECURITY: Require managerId to prevent data leakage
    if (!managerId) {
      return res.status(400).json({ 
        error: 'managerId is required',
        message: 'Du måste ange managerId för att se väntande ansökningar'
      });
    }
    
    let pendingLeaveRequests;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('status', 'pending')
          .order('start_date', { ascending: false });
        
        if (error) throw error;
        pendingLeaveRequests = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        const allLeaveRequests = await getMockData('leave-requests.json');
        pendingLeaveRequests = allLeaveRequests.filter((lr: any) => lr.status === 'pending');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      const allLeaveRequests = await getMockData('leave-requests.json');
      pendingLeaveRequests = allLeaveRequests.filter((lr: any) => lr.status === 'pending');
    }

    // ⚠️ CRITICAL: Filter out manager's own leave requests and only show subordinates'
    if (managerId && pendingLeaveRequests) {
      try {
        let allEmployees;
        
        // Get all employees to find which ones report to this manager
        if (supabase) {
          try {
            const { data, error } = await supabase.from('employees').select('*');
            if (error) throw error;
            allEmployees = data || [];
          } catch (error) {
            console.log('Supabase employees failed, using mock data:', error);
            allEmployees = await getMockData('employees.json');
          }
        } else {
          allEmployees = await getMockData('employees.json');
        }
        
        // Find employees who report to this manager
        const managerEmployees = allEmployees.filter((emp: any) => emp.manager === managerId);
        const employeeIds = managerEmployees.map((emp: any) => emp.employeeId || emp.employee_id);
        
        // Filter leave requests to EXCLUDE manager's own requests and ONLY include subordinates
        pendingLeaveRequests = pendingLeaveRequests.filter((leave: any) => {
          const leaveEmployeeId = leave.employee_id || leave.employeeId;
          // Include only subordinates' requests, exclude manager's own requests
          return employeeIds.includes(leaveEmployeeId) && leaveEmployeeId !== managerId;
        });
        
        console.log(`Manager ${managerId} has ${pendingLeaveRequests.length} pending leave requests from employees: ${employeeIds.join(', ')} (excluding own requests)`);
      } catch (filterError) {
        console.error('Error filtering leave requests by manager:', filterError);
        // If filtering fails, return empty array for security (better to show nothing than manager's own requests)
        pendingLeaveRequests = [];
      }
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedLeaveRequests = pendingLeaveRequests.map((leave: any) => ({
      ...leave,
      employeeId: leave.employee_id || leave.employeeId,
      startDate: leave.start_date || leave.startDate,
      endDate: leave.end_date || leave.endDate,
      leaveType: leave.leave_type || leave.leaveType,
    }));
    
    res.json(mappedLeaveRequests);
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}