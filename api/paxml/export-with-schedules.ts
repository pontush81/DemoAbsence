import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (same pattern as working APIs)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// PAXML Types and Constants (inlined to avoid import issues)
interface PAXMLTransaction {
  employeeId: string;
  personnummer: string;
  date: string;
  timeCode: string;
  hours: number;
  comment?: string;
  postId?: number;
}

interface PAXMLScheduleTransaction {
  employeeId: string;
  personnummer: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
}

interface PAXMLSchedule {
  employeeId: string;
  personnummer: string;
  days: PAXMLScheduleTransaction[];
}

// Time code mapping for PAXML export
const TIME_CODE_MAPPING: Record<string, string> = {
  '300': 'SJK', '301': 'HAV', '302': 'FPE', '303': 'PAP',
  '400': 'VAB', '401': 'KON', '402': 'MIL', '403': 'UTB',
  '100': 'SEM', '404': 'TJL', '405': 'ASK', '406': 'FAC',
  '407': 'KOM', '408': 'NÄR', '409': 'PEM', '410': 'PER',
  '411': 'ATK', '412': 'ATF', '413': 'SMB', '414': 'SVE',
  '200': 'ÖT1', '210': 'ÖT2', '220': 'ÖT3',
  '500': 'FR1', '510': 'FR2',
};

// Valid PAXML codes according to XSD 2.2
const VALID_PAXML_TIDKODER = [
  'SJK', 'SJK_KAR', 'SJK_LÖN', 'SJK_ERS', 'SJK_PEN', 'ASK', 'HAV', 'FPE', 'VAB', 'SMB',
  'UTB', 'MIL', 'SVE', 'NÄR', 'TJL', 'SEM', 'SEM_BET', 'SEM_SPA', 'SEM_OBE', 'SEM_FÖR',
  'KOM', 'PEM', 'PER', 'FAC', 'ATK', 'KON', 'PAP', 'ATF', 'FR1', 'FR2', 'FR3', 'FR4', 'FR5',
  'FR6', 'FR7', 'FR8', 'FR9', 'SCH', 'FLX', 'FRX', 'NVX', 'TS1', 'TS2', 'TS3', 'TS4', 'TS5',
  'TS6', 'TS7', 'TS8', 'TS9', 'TID', 'ARB', 'MER', 'ÖT1', 'ÖT2', 'ÖT3', 'ÖT4', 'ÖT5',
  'ÖK1', 'ÖK2', 'ÖK3', 'ÖK4', 'ÖK5', 'OB1', 'OB2', 'OB3', 'OB4', 'OB5', 'OS1', 'OS2',
  'OS3', 'OS4', 'OS5', 'JR1', 'JR2', 'JR3', 'JR4', 'JR5', 'JS1', 'JS2', 'JS3', 'JS4', 'JS5',
  'BE1', 'BE2', 'BE3', 'BE4', 'BE5', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'RE1', 'RE2', 'RE3',
  'RE4', 'RE5', 'HLG', 'SKI', 'LT1', 'LT2', 'LT3', 'LT4', 'LT5', 'LT6', 'LT7', 'LT8', 'LT9',
  'NV1', 'NV2', 'NV3', 'NV4', 'NV5', 'NV6', 'NV7', 'NV8', 'NV9'
];

// Helper functions (inlined to avoid import issues)
function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
}

function mapToPAXMLCode(internalCode: string): string {
  return TIME_CODE_MAPPING[internalCode] || internalCode;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generatePAXMLXMLWithSchedules(transactions: PAXMLTransaction[], schedules: PAXMLSchedule[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="utf-8"?>';
  const paXmlOpen = '<paxml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.paxml.se/2.2/paxml.xsd">';
  const paXmlClose = '</paxml>';
  
  const headerSection = `\t<header>
\t\t<format>LÖNIN</format>
\t\t<version>2.2</version>
\t</header>`;

  const transactionElements = transactions.map(transaction => 
    `\t\t<tidtrans${transaction.postId ? ` postid="${transaction.postId}"` : ''} anstid="${transaction.employeeId}" persnr="${transaction.personnummer}">
\t\t\t<tidkod>${transaction.timeCode}</tidkod>
\t\t\t<datum>${transaction.date}</datum>
\t\t\t<timmar>${transaction.hours.toFixed(2)}</timmar>${transaction.comment ? `
\t\t\t<info>${escapeXML(transaction.comment)}</info>` : ''}
\t\t</tidtrans>`
  ).join('\n');

  const scheduleElements = schedules.map(schedule => {
    const dayElements = schedule.days.map(day => 
      `\t\t\t<dag datum="${day.date}"${day.startTime ? ` starttid="${day.startTime}"` : ''}${day.endTime ? ` sluttid="${day.endTime}"` : ''} timmar="${day.hours.toFixed(2)}" />`
    ).join('\n');
    
    return `\t\t<schema anstid="${schedule.employeeId}" persnr="${schedule.personnummer}">
${dayElements}
\t\t</schema>`;
  }).join('\n');

  const tidtransaktionerSection = transactions.length > 0 ? `\t<tidtransaktioner>
${transactionElements}
\t</tidtransaktioner>` : '';

  const schematransaktionerSection = schedules.length > 0 ? `\t<schematransaktioner>
${scheduleElements}
\t</schematransaktioner>` : '';

  return `${xmlHeader}
${paXmlOpen}
${headerSection}
${tidtransaktionerSection}
${schematransaktionerSection}
${paXmlClose}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug: Check environment variables
  console.log('🔍 PAXML Export with Schedules Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    supabaseClientExists: !!supabase,
    runtime: process.env.VERCEL ? 'VERCEL' : 'LOCAL',
    timestamp: new Date().toISOString()
  });

  if (!supabase) {
    return res.status(500).json({
      error: 'Database configuration error',
      message: 'Supabase configuration is missing. Please check environment variables.',
      details: 'SUPABASE_URL and SUPABASE_ANON_KEY are required.'
    });
  }

  try {
    const { employeeIds, startDate, endDate, includeSchedules = true } = req.body;
    
    console.log('PAXML Export with Schedules Request:', { employeeIds, startDate, endDate, includeSchedules });
    
    // Get approved deviations from database
    let deviations = [];
    try {
      let query = supabase
        .from('deviations')
        .select('*')
        .eq('status', 'approved');
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      deviations = data || [];
      console.log(`Retrieved ${deviations.length} deviations from database`);
    } catch (dbError) {
      console.log('Database error for deviations:', dbError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to retrieve deviations from database',
        details: (dbError as Error).message
      });
    }
    
    // 🚫 NO MOCK FALLBACK: PAXML export with schedules must NEVER use mock data
    console.log(`✅ PAXML Export with Schedules: Found ${deviations.length} approved deviations from database`);
    if (deviations.length === 0) {
      console.warn('⚠️  PAXML Export with Schedules: No approved deviations found - this is acceptable for real data');
    }
    
    // Get employees
    let employees = [];
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (error) {
        throw new Error(`Employee query failed: ${error.message}`);
      }
      
      employees = data || [];
      console.log(`Retrieved ${employees.length} employees from database`);
    } catch (empError) {
      console.error('🚫 CRITICAL: Employee database error for PAXML export:', empError);
      return res.status(500).json({ 
        error: 'Employee database access failed',
        message: 'PAXML export requires real employee data from database.',
        details: (empError as Error).message
      });
    }
    
    // Filter by employee IDs if specified
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employee_id || d.employeeId));
      employees = employees.filter((e: any) => employeeIds.includes(e.employee_id || e.employeeId));
      console.log(`After employee filtering: ${deviations.length} deviations, ${employees.length} employees`);
    }

    // Get schedules if requested
    let schedules = [];
    if (includeSchedules) {
      try {
        let scheduleQuery = supabase
          .from('schedules')
          .select('*');
        
        if (startDate) {
          scheduleQuery = scheduleQuery.gte('date', startDate);
        }
        if (endDate) {
          scheduleQuery = scheduleQuery.lte('date', endDate);
        }
        if (employeeIds?.length === 1) {
          scheduleQuery = scheduleQuery.eq('employee_id', employeeIds[0]);
        }
        
        const { data, error } = await scheduleQuery;
        
        if (error) {
          console.log('Database error for schedules, continuing without schedules:', error);
          schedules = [];
        } else {
          schedules = data || [];
          console.log(`Retrieved ${schedules.length} schedules from database`);
        }
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
      personnummer: e.personal_number || e.personnummer
    }));
    
    // Generate transactions from deviations
    const transactions = transformedDeviations.map((deviation, index) => {
      const employee = transformedEmployees.find(e => e.employeeId === deviation.employeeId);
      if (!employee) {
        throw new Error(`Employee not found for employeeId: ${deviation.employeeId}`);
      }
      const hours = calculateHours(deviation.startTime, deviation.endTime);
      
      // Fix personnummer format: Remove dashes to get exactly 12 digits (ÅÅMMDDNNNN)
      const personnummer12 = employee.personnummer ? employee.personnummer.replace(/-/g, '') : '';
      
      return {
        employeeId: deviation.employeeId,
        personnummer: personnummer12,
        date: deviation.date,
        timeCode: mapToPAXMLCode(deviation.timeCode),
        hours: hours,
        comment: deviation.comment,
        postId: index + 1
      };
    });
    
    // Convert schedules to XML format
    const xmlSchedules: PAXMLSchedule[] = [];
    if (schedules.length > 0) {
      const schedulesByEmployee = schedules.reduce((acc, schedule) => {
        const employeeId = schedule.employee_id || schedule.employeeId;
        if (!acc[employeeId]) {
          acc[employeeId] = [];
        }
        
        const employee = transformedEmployees.find(e => e.employeeId === employeeId);
        if (!employee) {
          return acc;
        }
        
        const personnummer12 = employee.personnummer ? employee.personnummer.replace(/-/g, '') : '';
        
        const workHours = calculateHours(schedule.start_time || schedule.startTime, schedule.end_time || schedule.endTime);
        const breakHours = (schedule.break_start && schedule.break_end) 
          ? calculateHours(schedule.break_start, schedule.break_end) 
          : 0;
        const netHours = workHours - breakHours;
        
        acc[employeeId].push({
          employeeId: employeeId,
          personnummer: personnummer12,
          date: schedule.date,
          startTime: schedule.start_time || schedule.startTime,
          endTime: schedule.end_time || schedule.endTime,
          hours: Math.round(netHours * 100) / 100
        });
        
        return acc;
      }, {} as Record<string, PAXMLScheduleTransaction[]>);
      
      Object.entries(schedulesByEmployee).forEach(([employeeId, days]) => {
        const employee = transformedEmployees.find(e => e.employeeId === employeeId)!;
        const personnummer12 = employee.personnummer ? employee.personnummer.replace(/-/g, '') : '';
        xmlSchedules.push({
          employeeId,
          personnummer: personnummer12,
          days: days as PAXMLScheduleTransaction[]
        });
      });
    }
    
    // Validate transactions
    const validationErrors: string[] = [];
    transactions.forEach((transaction, index) => {
      if (!transaction.employeeId) {
        validationErrors.push(`Transaction ${index + 1}: Missing employeeId`);
      }
      if (!transaction.personnummer) {
        validationErrors.push(`Transaction ${index + 1}: Missing personnummer`);
      }
      if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
        validationErrors.push(`Transaction ${index + 1}: Invalid date format (expected YYYY-MM-DD)`);
      }
      if (!transaction.timeCode) {
        validationErrors.push(`Transaction ${index + 1}: Missing timeCode`);
      } else if (!VALID_PAXML_TIDKODER.includes(transaction.timeCode)) {
        validationErrors.push(`Transaction ${index + 1}: Invalid timeCode '${transaction.timeCode}' - not allowed in PAXML 2.2 XSD`);
      }
      if (transaction.hours <= 0) {
        validationErrors.push(`Transaction ${index + 1}: Hours must be greater than 0`);
      }
      if (transaction.personnummer && !/^\d{12}$/.test(transaction.personnummer)) {
        validationErrors.push(`Transaction ${index + 1}: Invalid personnummer format (expected exactly 12 digits ÅÅMMDDNNNN, got: ${transaction.personnummer})`);
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const paXmlContent = generatePAXMLXMLWithSchedules(transactions, xmlSchedules);
    const filename = `paxml-export-with-schedules-${new Date().toISOString().split('T')[0]}.xml`;
    
    console.log(`Generated PAXML file with schedules: ${filename} with ${transactions.length} transactions and ${xmlSchedules.length} schedule groups`);
    
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