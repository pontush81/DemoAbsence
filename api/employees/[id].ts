import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id, currentUser } = req.query;
    
    // Require Supabase configuration
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (req.method === 'GET') {
      // Get employee - no security needed for this in our demo
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
    } else if (req.method === 'PATCH') {
      // 🚨 DEMO SECURITY: Prevent IDOR - can only update own employee data
      if (!currentUser) {
        return res.status(400).json({
          error: 'currentUser parameter required',
          message: 'Du måste ange vem du är för att uppdatera medarbetardata'
        });
      }
      
      if (currentUser !== id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Du kan bara uppdatera din egen medarbetardata'
        });
      }
      
      // Update employee data
      const updateData: any = {};
      
      // Map camelCase fields to snake_case for database
      if (req.body.firstName) updateData.first_name = req.body.firstName;
      if (req.body.lastName) updateData.last_name = req.body.lastName;
      if (req.body.phoneNumber) updateData.phone_number = req.body.phoneNumber;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.workEmail) updateData.work_email = req.body.workEmail;
      if (req.body.preferredEmail) updateData.preferred_email = req.body.preferredEmail;
      if (req.body.streetAddress) updateData.street_address = req.body.streetAddress;
      if (req.body.postalCode) updateData.postal_code = req.body.postalCode;
      if (req.body.city) updateData.city = req.body.city;
      if (req.body.country) updateData.country = req.body.country;
      if (req.body.bankClearingNumber) updateData.bank_clearing_number = req.body.bankClearingNumber;
      if (req.body.bankAccountNumber) updateData.bank_account_number = req.body.bankAccountNumber;
      if (req.body.bankCountryCode) updateData.bank_country_code = req.body.bankCountryCode;
      
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('employee_id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (updatedEmployee) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedEmployee = {
          ...updatedEmployee,
          employeeId: updatedEmployee.employee_id || updatedEmployee.employeeId,
          firstName: updatedEmployee.first_name || updatedEmployee.firstName,
          lastName: updatedEmployee.last_name || updatedEmployee.lastName,
        };
        
        res.json(mappedEmployee);
      } else {
        res.status(404).json({ message: 'Employee not found' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with employee:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}