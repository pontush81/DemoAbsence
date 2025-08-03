import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;
    
    // Require Supabase configuration
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    if (employee) {
      // Map snake_case to camelCase for frontend compatibility
      const mappedEmployee = {
        ...employee,
        employeeId: employee.employee_id || employee.employeeId,
        firstName: employee.first_name || employee.firstName,
        lastName: employee.last_name || employee.lastName,
      };
      
      res.json(mappedEmployee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}