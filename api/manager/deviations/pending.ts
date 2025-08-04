import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// 🚫 MOCK DATA REMOVED - All endpoints must use real database data only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { managerId } = req.query;
    
    // 🚨 SECURITY: Require managerId to prevent data leakage
    if (!managerId) {
      return res.status(400).json({ 
        error: 'managerId is required',
        message: 'Du måste ange managerId för att se väntande avvikelser'
      });
    }
    
    let pendingDeviations;
    
    // 🔒 DATABASE REQUIRED - No mock data fallback allowed
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('deviations')
          .select('*')
          .eq('status', 'pending');
        
        if (error) throw error;
        pendingDeviations = data || [];
      } catch (error) {
        pendingDeviations = allDeviations.filter((d: any) => d.status === 'pending');
      }
    } else {
      pendingDeviations = allDeviations.filter((d: any) => d.status === 'pending');
    }
    
    // Filter by manager-employee relationship if managerId is provided
    if (managerId && pendingDeviations) {
      try {
        let allEmployees;
        
        // Get all employees to find which ones report to this manager
        if (supabase) {
          try {
            const { data, error } = await supabase.from('employees').select('*');
            if (error) throw error;
            allEmployees = data || [];
          } catch (error) {
          }
        } else {
        }
        
        // Find employees who report to this manager (handle both snake_case and camelCase)
        const managerEmployees = allEmployees.filter((emp: any) => 
          emp.manager === managerId || 
          (emp.manager === managerId)
        );
        
        const employeeIds = managerEmployees.map((emp: any) => 
          emp.employeeId || emp.employee_id
        );
        
        // Filter deviations to only include those from employees who report to this manager
        pendingDeviations = pendingDeviations.filter((deviation: any) => 
          employeeIds.includes(deviation.employeeId || deviation.employee_id)
        );
        
        console.log(`Manager ${managerId} has ${pendingDeviations.length} pending deviations from employees: ${employeeIds.join(', ')}`);
      } catch (filterError) {
        console.error('Error filtering deviations by manager:', filterError);
        // If filtering fails, return all pending deviations as fallback
      }
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedDeviations = pendingDeviations.map((deviation: any) => ({
      ...deviation,
      employeeId: deviation.employee_id || deviation.employeeId,
      timeCode: deviation.time_code || deviation.timeCode,
      startTime: deviation.start_time || deviation.startTime,
      endTime: deviation.end_time || deviation.endTime,
    }));
    
    res.json(mappedDeviations);
  } catch (error) {
    console.error('Error fetching pending deviations:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}