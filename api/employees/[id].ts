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
    const { id } = req.query;
    let employee;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        employee = data;
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
      }
    }
    
    // If Supabase didn't work or no data found, try mock data
    if (!employee) {
      console.log('Using mock data for employee');
      const allEmployees = await getMockData('employees.json');
      employee = allEmployees.find((emp: any) => 
        emp.employeeId === id || emp.employee_id === id || emp.id === id
      );
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