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
      // First try the expected payslips table structure
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('published', { ascending: false });
      
      if (error) {
        console.log('No payslips table with employee_id, trying employeeId field...');
        // Fallback: try with employeeId field instead
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('payslips')
          .select('*')
          .eq('employeeId', employeeId)
          .order('published', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        payslips = fallbackData || [];
      } else {
        payslips = data || [];
      }
      console.log(`✅ PAYSLIP ACCESS: Retrieved ${payslips.length} payslips from database for ${employeeId}`);
    } catch (error) {
      console.error('🚫 CRITICAL: Unexpected error accessing payslips:', error);
      return res.status(500).json({ 
        error: 'Database access failed',
        message: 'Ett oväntat fel uppstod vid hämtning av lönebesked från databasen.',
        code: 'PAYSLIP_UNEXPECTED_ERROR'
      });
    }
    
    // Map fields for frontend compatibility (handle both metadata and detail formats)
    const mappedPayslips = payslips.map((payslip: any) => ({
      ...payslip,
      employeeId: payslip.employee_id || payslip.employeeId,
      // Handle payslip metadata format (year/month style)
      payPeriodStart: payslip.pay_period_start || (payslip.year && payslip.month ? `${payslip.year}-${String(payslip.month).padStart(2, '0')}-01` : payslip.payPeriodStart),
      payPeriodEnd: payslip.pay_period_end || payslip.payPeriodEnd,
      payDate: payslip.pay_date || payslip.published || payslip.payDate,
      // Handle salary fields (may not exist in metadata format)
      grossSalary: payslip.gross_salary || payslip.grossSalary,
      netSalary: payslip.net_salary || payslip.netSalary,
      totalDeductions: payslip.total_deductions || payslip.totalDeductions,
      totalTaxes: payslip.total_taxes || payslip.totalTaxes,
      // Metadata-specific fields
      fileName: payslip.fileName,
      fileUrl: payslip.fileUrl,
      year: payslip.year,
      month: payslip.month,
      published: payslip.published
    }));
    
    res.json(mappedPayslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}