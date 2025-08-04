import type { VercelRequest, VercelResponse } from '@vercel/node';
import { restStorage } from '../../server/supabase-rest-storage';
import { 
  generatePAXMLTransactions, 
  validatePAXMLData, 
  generatePAXMLXMLWithSchedules,
  convertAppScheduleToXMLSchedule
} from '../../server/lib/paxml';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeIds, startDate, endDate, includeSchedules = true } = req.body;
    
    console.log('PAXML Export with Schedules Request:', { employeeIds, startDate, endDate, includeSchedules });
    
    // Get approved deviations from database
    let deviations = [];
    try {
      deviations = await restStorage.getDeviations({ 
        status: 'approved',
        startDate,
        endDate 
      });
      console.log(`Retrieved ${deviations.length} deviations from database`);
    } catch (dbError) {
      console.log('Database error for deviations:', dbError);
      deviations = [];
    }
    
    // 🚫 NO MOCK FALLBACK: PAXML export with schedules must NEVER use mock data
    console.log(`✅ PAXML Export with Schedules: Found ${deviations.length} approved deviations from database (mock fallback eliminated)`);
    if (deviations.length === 0) {
      console.warn('⚠️  PAXML Export with Schedules: No approved deviations found for the specified period - this is acceptable for real data');
    }
    
    // Get employees
    let employees = [];
    try {
      employees = await restStorage.getEmployees();
      console.log(`Retrieved ${employees.length} employees from database`);
    } catch (empError) {
      console.error('🚫 CRITICAL: Employee database error for PAXML export:', empError);
      return res.status(500).json({ 
        error: 'Employee database access failed',
        message: 'PAXML export requires real employee data from database. Mock data is not allowed.',
        details: empError.message
      });
    }
    
    // Filter by employee IDs if specified
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employeeId || d.employee_id));
      employees = employees.filter((e: any) => employeeIds.includes(e.employeeId || e.employee_id));
      console.log(`After employee filtering: ${deviations.length} deviations, ${employees.length} employees`);
    }

    // Get schedules if requested
    let schedules = [];
    if (includeSchedules) {
      try {
        schedules = await restStorage.getSchedules({
          startDate,
          endDate,
          employeeId: employeeIds?.length === 1 ? employeeIds[0] : undefined
        });
        console.log(`Retrieved ${schedules.length} schedules from database`);
      } catch (schedError) {
        console.log('Database error for schedules, continuing without schedules:', schedError);
        schedules = [];
      }
    }
    
    // Transform database format to PAXML expected format
    const transformedDeviations = deviations.map((d: any) => ({
      ...d,
      employeeId: d.employee_id || d.employeeId,
      timeCode: d.time_code || d.timeCode,
      startTime: d.start_time || d.startTime,
      endTime: d.end_time || d.endTime
    }));
    
    const transformedEmployees = employees.map((e: any) => ({
      ...e,
      employeeId: e.employee_id || e.employeeId,
      personnummer: e.personnummer || e.personal_number
    }));
    
    const transactions = generatePAXMLTransactions(transformedDeviations, transformedEmployees);
    const xmlSchedules = convertAppScheduleToXMLSchedule(schedules, transformedEmployees);
    
    const validationErrors = validatePAXMLData(transactions);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const paXmlContent = generatePAXMLXMLWithSchedules(transactions, xmlSchedules);
    const filename = `paxml-export-with-schedules-${new Date().toISOString().split('T')[0]}.xml`;
    
    console.log(`Generated PAXML file with schedules: ${filename}`);
    
    // Note: File saving to disk is skipped in serverless environment
    // The XML content is returned directly to the client
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(paXmlContent);
    
  } catch (error) {
    console.error('PAXML Export with Schedules Error:', error);
    res.status(500).json({ 
      error: 'Internal server error during PAXML export with schedules',
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}