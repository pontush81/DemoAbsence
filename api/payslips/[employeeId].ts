import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - Payslips are SALARY-CRITICAL and must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { employeeId, currentUser } = req.query;
    
    // 🚨 DEMO SECURITY: Prevent IDOR - can only view own payslips
    if (!currentUser) {
      return res.status(400).json({ 
        error: 'currentUser parameter required',
        message: 'Du måste ange vem du är för att se lönebesked'
      });
    }
    
    if (currentUser !== employeeId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Du kan bara se dina egna lönebesked'
      });
    }
    
    // 🔒 CRITICAL: Payslips MUST use database only - NO MOCK DATA FALLBACK!
    if (!supabase) {
      console.error('🚫 CRITICAL: Database connection required for payslips access');
      return res.status(500).json({ 
        error: 'Database connection required',
        message: 'Lönebesked kräver databasanslutning. Mock data är inte tillåtet för löneuppgifter.',
        code: 'PAYSLIP_DB_REQUIRED'
      });
    }
    
    let payslips;
    try {
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('pay_period_start', { ascending: false });
      
      if (error) {
        console.error('🚫 CRITICAL: Database query failed for payslips:', error);
        return res.status(500).json({ 
          error: 'Database query failed',
          message: 'Kunde inte hämta lönebesked från databasen. Mock data är inte tillåtet för löneuppgifter.',
          code: 'PAYSLIP_DB_QUERY_FAILED'
        });
      }
      
      payslips = data || [];
      console.log(`✅ PAYSLIP ACCESS: Retrieved ${payslips.length} payslips from database for ${employeeId}`);
    } catch (error) {
      console.error('🚫 CRITICAL: Unexpected error accessing payslips:', error);
      return res.status(500).json({ 
        error: 'Database access failed',
        message: 'Ett oväntat fel uppstod vid hämtning av lönebesked från databasen.',
        code: 'PAYSLIP_UNEXPECTED_ERROR'
      });
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedPayslips = payslips.map((payslip: any) => ({
      ...payslip,
      employeeId: payslip.employee_id || payslip.employeeId,
      payPeriodStart: payslip.pay_period_start || payslip.payPeriodStart,
      payPeriodEnd: payslip.pay_period_end || payslip.payPeriodEnd,
      payDate: payslip.pay_date || payslip.payDate,
      grossSalary: payslip.gross_salary || payslip.grossSalary,
      netSalary: payslip.net_salary || payslip.netSalary,
      totalDeductions: payslip.total_deductions || payslip.totalDeductions,
      totalTaxes: payslip.total_taxes || payslip.totalTaxes,
    }));
    
    res.json(mappedPayslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}