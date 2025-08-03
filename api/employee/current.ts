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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let employees;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        employees = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        employees = await getMockData('employees.json');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      employees = await getMockData('employees.json');
    }
    
    // Return the first employee as the current user
    if (employees && employees.length > 0) {
      // Map snake_case to camelCase for consistency
      const employee = employees[0];
      const mappedEmployee = {
        ...employee,
        employeeId: employee.employee_id || employee.employeeId,
        firstName: employee.first_name || employee.firstName,
        lastName: employee.last_name || employee.lastName,
        phoneNumber: employee.phone_number || employee.phoneNumber,
        workEmail: employee.work_email || employee.workEmail,
        preferredEmail: employee.preferred_email || employee.preferredEmail,
        careOfAddress: employee.care_of_address || employee.careOfAddress,
        streetAddress: employee.street_address || employee.streetAddress,
        postalCode: employee.postal_code || employee.postalCode,
        bankAccountNumber: employee.bank_account_number || employee.bankAccountNumber,
        bankClearingNumber: employee.bank_clearing_number || employee.bankClearingNumber,
        bankBIC: employee.bank_bic || employee.bankBIC,
        bankCountryCode: employee.bank_country_code || employee.bankCountryCode,
        bankIBAN: employee.bank_iban || employee.bankIBAN,
        scheduleTemplate: employee.schedule_template || employee.scheduleTemplate,
        createdAt: employee.created_at || employee.createdAt,
      };
      
      // Remove snake_case duplicates
      delete mappedEmployee.employee_id;
      delete mappedEmployee.first_name;
      delete mappedEmployee.last_name;
      delete mappedEmployee.phone_number;
      delete mappedEmployee.work_email;
      delete mappedEmployee.preferred_email;
      delete mappedEmployee.care_of_address;
      delete mappedEmployee.street_address;
      delete mappedEmployee.postal_code;
      delete mappedEmployee.bank_account_number;
      delete mappedEmployee.bank_clearing_number;
      delete mappedEmployee.bank_bic;
      delete mappedEmployee.bank_country_code;
      delete mappedEmployee.bank_iban;
      delete mappedEmployee.schedule_template;
      delete mappedEmployee.created_at;
      
      res.json(mappedEmployee);
    } else {
      res.status(404).json({ message: 'No employee found' });
    }
  } catch (error) {
    console.error('Error fetching current employee:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}