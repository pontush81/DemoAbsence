import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { currentUser } = req.query;

    // 🚨 DEMO SECURITY: Only managers can access bulk employee data
    if (!currentUser) {
      return res.status(400).json({
        error: 'currentUser parameter required',
        message: 'Du måste ange vem du är för att se medarbetardata'
      });
    }

    // Check if currentUser is a manager or payroll admin (can see all employee data)
    const allowedManagerIds = ['E005']; // Mikael is the manager
    const allowedPayrollIds = ['pay-001']; // Lars Johansson is payroll admin
    
    const hasAccess = allowedManagerIds.includes(currentUser as string) || 
                     allowedPayrollIds.includes(currentUser as string);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied - Manager or Payroll admin rights required',
        message: 'Bara chefer och löneadministratörer kan se all medarbetardata'
      });
    }

    // Require Supabase configuration
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: employees, error } = await supabase.from('employees').select('*');
    
    if (error) throw error;
    
    // Map snake_case to camelCase for frontend compatibility - COMPREHENSIVE MAPPING
    const mappedEmployees = employees.map((employee: any) => {
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
    });
    
    res.status(200).json(mappedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
