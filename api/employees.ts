import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { restStorage } from '../server/supabase-rest-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const employees = await restStorage.getEmployees();
    
    // Map snake_case to camelCase for frontend compatibility (same as server/routes.ts)
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
