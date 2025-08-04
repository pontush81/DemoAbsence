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

// Time code mapping for PAXML export
const TIME_CODE_MAPPING: Record<string, string> = {
  '300': 'SJK', // Sjukdom
  '301': 'HAV', // Havandeskap
  '302': 'FPE', // Föräldraledig
  '303': 'PAP', // Pappaledig
  '400': 'VAB', // Vård av barn
  '401': 'KON', // Kontaktdagar
  '402': 'MIL', // Repövning
  '403': 'UTB', // Utbildning (semestergrundande)
  '100': 'SEM', // Semester
  '404': 'TJL', // Tjänstledig
  '405': 'ASK', // Arbetsskada
  '406': 'FAC', // Facklig verksamhet
  '407': 'KOM', // Kompledig
  '408': 'NÄR', // Närståendevård
  '409': 'PEM', // Permission
  '410': 'PER', // Permitterad
  '411': 'ATK', // Arbetstidskonto
  '412': 'ATF', // Arbetstidsförkortning
  '413': 'SMB', // Smittbärare
  '414': 'SVE', // Svenskundervisning för invandrare
  '200': 'ÖT1', // Övertid första nivå
  '210': 'ÖT2', // Övertid andra nivå
  '220': 'ÖT3', // Övertid tredje nivå
  '500': 'FR1', // Sen ankomst
  '510': 'FR2', // Tidig avgång
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
  return diffMs / (1000 * 60 * 60); // Convert to hours
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

function generatePAXMLTransactions(deviations: any[], employees: any[]): PAXMLTransaction[] {
  const approvedDeviations = deviations.filter(d => d.status === 'approved');
  
  return approvedDeviations.map((deviation, index) => {
    const employee = employees.find(e => e.employeeId === deviation.employeeId);
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
}

function validatePAXMLData(transactions: PAXMLTransaction[]): string[] {
  const errors: string[] = [];
  
  transactions.forEach((transaction, index) => {
    if (!transaction.employeeId) {
      errors.push(`Transaction ${index + 1}: Missing employeeId`);
    }
    if (!transaction.personnummer) {
      errors.push(`Transaction ${index + 1}: Missing personnummer`);
    }
    if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      errors.push(`Transaction ${index + 1}: Invalid date format (expected YYYY-MM-DD)`);
    }
    if (!transaction.timeCode) {
      errors.push(`Transaction ${index + 1}: Missing timeCode`);
    } else if (!VALID_PAXML_TIDKODER.includes(transaction.timeCode)) {
      errors.push(`Transaction ${index + 1}: Invalid timeCode '${transaction.timeCode}' - not allowed in PAXML 2.2 XSD`);
    }
    if (transaction.hours <= 0) {
      errors.push(`Transaction ${index + 1}: Hours must be greater than 0`);
    }
    // Validate personnummer format: Exactly 12 digits (ÅÅMMDDNNNN) as per PAXML XSD
    if (transaction.personnummer && !/^\d{12}$/.test(transaction.personnummer)) {
      errors.push(`Transaction ${index + 1}: Invalid personnummer format (expected exactly 12 digits ÅÅMMDDNNNN, got: ${transaction.personnummer})`);
    }
  });
  
  return errors;
}

function generatePAXMLXML(transactions: PAXMLTransaction[]): string {
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

  return `${xmlHeader}
${paXmlOpen}
${headerSection}
\t<tidtransaktioner>
${transactionElements}
\t</tidtransaktioner>
${paXmlClose}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug: Check environment variables
  console.log('🔍 PAXML Export Environment check:', {
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
    const { employeeIds, startDate, endDate } = req.body;
    
    console.log('PAXML Export Request:', { employeeIds, startDate, endDate });
    
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
    
    // Security check: No mock data fallback for PAXML export
    if (deviations.length <= 1) {
      return res.status(400).json({
        error: '🚫 CRITICAL: Insufficient data for PAXML export',
        message: 'PAXML export found insufficient approved deviations. Mock fallback is disabled for security.',
        details: `Found ${deviations.length} approved deviations. At least 2 are required for export.`
      });
    }
    
    // Filter by employee IDs if specified
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employee_id || d.employeeId));
      console.log(`After employee filtering: ${deviations.length} deviations`);
    }

    // 🚨 CRITICAL PAYROLL SECURITY: Filter out future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const beforeCount = deviations.length;
    
    const futureDeviations = deviations.filter((d: any) => new Date(d.date) > today);
    deviations = deviations.filter((d: any) => new Date(d.date) <= today);
    
    console.log(`🚨 PAYROLL SECURITY: Filtered out ${futureDeviations.length} future-dated deviations`);
    console.log(`After future date filtering: ${deviations.length} deviations (was ${beforeCount})`);
    
    if (deviations.length === 0) {
      return res.status(400).json({
        error: 'No valid deviations found',
        message: 'No valid deviations found for export after filtering (future dates removed)',
        details: 'All deviations were either in the future or filtered out by your criteria.'
      });
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
    
    const transactions = generatePAXMLTransactions(transformedDeviations, transformedEmployees);
    
    const validationErrors = validatePAXMLData(transactions);
    if (validationErrors.length > 0) {
      console.error('PAXML validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const paXmlContent = generatePAXMLXML(transactions);
    const filename = `paxml-export-${new Date().toISOString().split('T')[0]}.xml`;
    
    console.log(`Generated PAXML file: ${filename} with ${transactions.length} transactions`);
    
    // Note: File saving to disk is skipped in serverless environment
    // The XML content is returned directly to the client
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(paXmlContent);
    
  } catch (error) {
    console.error('PAXML Export Error:', error);
    res.status(500).json({ 
      error: 'Internal server error during PAXML export',
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
}