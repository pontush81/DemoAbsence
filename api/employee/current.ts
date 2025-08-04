import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - All endpoints must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🔒 DATABASE REQUIRED: Current employee must be from real database only
    if (!supabase) {
      console.error('🚫 Database connection required for employee access');
      return res.status(500).json({ 
        error: 'Database connection required',
        message: 'Medarbetarupplysningar kräver databasanslutning.',
        code: 'EMPLOYEE_DB_REQUIRED'
      });
    }
    
    let employees;
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) {
        console.error('🚫 Database query failed for employees:', error);
        return res.status(500).json({ 
          error: 'Database query failed',
          message: 'Kunde inte hämta medarbetarupplysningar från databasen.',
          code: 'EMPLOYEE_DB_QUERY_FAILED'
        });
      }
      employees = data || [];
      console.log(`✅ EMPLOYEE ACCESS: Retrieved ${employees.length} employees from database`);
    } catch (error) {
      console.error('🚫 Unexpected error accessing employees:', error);
      return res.status(500).json({ 
        error: 'Database access failed',
        message: 'Ett oväntat fel uppstod vid hämtning av medarbetarupplysningar.',
        code: 'EMPLOYEE_UNEXPECTED_ERROR'
      });
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