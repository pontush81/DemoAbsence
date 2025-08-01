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
    let employees;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        employees = data;
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        employees = await getMockData('employees.json');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      employees = await getMockData('employees.json');
    }
    
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
