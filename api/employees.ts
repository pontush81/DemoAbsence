import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Require Supabase configuration
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: employees, error } = await supabase.from('employees').select('*');
    
    if (error) throw error;
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedEmployees = employees.map((employee: any) => ({
      ...employee,
      employeeId: employee.employee_id || employee.employeeId,
      firstName: employee.first_name || employee.firstName,
      lastName: employee.last_name || employee.lastName,
    }));
    
    res.status(200).json(mappedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
