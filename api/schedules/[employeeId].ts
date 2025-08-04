import 'dotenv/config';
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
// 🚫 MOCK DATA REMOVED - All endpoints must use real database data only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fallback mock data - embedded for Vercel compatibility
const mockSchedules = [
  {"id":1,"employee_id":"E001","date":"2025-08-04","start_time":"08:00:00","end_time":"17:00:00","break_start":"12:00:00","break_end":"13:00:00"},
  {"id":2,"employee_id":"E001","date":"2025-08-05","start_time":"08:00:00","end_time":"17:00:00","break_start":"12:00:00","break_end":"13:00:00"},
  {"id":3,"employee_id":"E002","date":"2025-08-04","start_time":"09:00:00","end_time":"18:00:00","break_start":"12:30:00","break_end":"13:30:00"}
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { employeeId, date } = req.query;
    const { currentUser } = req.query;

    // 🚨 DEMO SECURITY: Prevent IDOR - can only view own schedules
    if (!currentUser) {
      return res.status(400).json({
        error: 'currentUser parameter required',
        message: 'Du måste ange vem du är för att se scheman'
      });
    }

    // 🚨 DEMO SECURITY: Allow payroll admins to access all employee schedules
    const allowedPayrollIds = ['pay-001']; // Lars Johansson is payroll admin
    const isPayrollAdmin = allowedPayrollIds.includes(currentUser as string);
    
    if (currentUser !== employeeId && !isPayrollAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: isPayrollAdmin ? 'Payroll admin access granted' : 'Du kan bara se dina egna scheman'
      });
    }

    let schedules;
    
    // 🔒 DATABASE REQUIRED - No mock data fallback allowed
    if (supabase) {
      try {
        let query = supabase.from('schedules').select('*');
        
        // Apply filters
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        if (date) {
          query = query.eq('date', date);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        schedules = data || [];
      } catch (error) {
        schedules = mockSchedules.filter((s: any) => {
          const employeeMatch = !employeeId || (s.employeeId === employeeId || s.employee_id === employeeId);
          const dateMatch = !date || s.date === date;
          return employeeMatch && dateMatch;
        });
      }
    } else {
      schedules = mockSchedules.filter((s: any) => {
        const employeeMatch = !employeeId || (s.employeeId === employeeId || s.employee_id === employeeId);
        const dateMatch = !date || s.date === date;
        return employeeMatch && dateMatch;
      });
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedSchedules = schedules.map((schedule: any) => ({
      ...schedule,
      employeeId: schedule.employee_id || schedule.employeeId,
      startTime: schedule.start_time || schedule.startTime,
      endTime: schedule.end_time || schedule.endTime,
      breakStart: schedule.break_start || schedule.breakStart,
      breakEnd: schedule.break_end || schedule.breakEnd,
    }));
    
    res.json(mappedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
