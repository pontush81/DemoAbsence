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
    
    let payslips;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payslips')
          .select('*')
          .eq('employee_id', employeeId)
          .order('pay_period_start', { ascending: false });
        
        if (error) throw error;
        payslips = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        const allPayslips = await getMockData('payslips.json');
        payslips = allPayslips.filter((p: any) => 
          (p.employeeId === employeeId || p.employee_id === employeeId)
        );
      }
    } else {
      console.log('Supabase not configured, using mock data');
      const allPayslips = await getMockData('payslips.json');
      payslips = allPayslips.filter((p: any) => 
        (p.employeeId === employeeId || p.employee_id === employeeId)
      );
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