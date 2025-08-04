import 'dotenv/config';
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - Time balances are SALARY-CRITICAL and must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Route to appropriate handler based on method
  if (req.method === 'PATCH') {
    return patchHandler(req, res);
  }
  
  try {
    const { employeeId } = req.query;
    const { currentUser } = req.query;

    // 🚨 DEMO SECURITY: Prevent IDOR - can only view own time balance
    if (!currentUser) {
      return res.status(400).json({
        error: 'currentUser parameter required',
        message: 'Du måste ange vem du är för att se tidssaldo'
      });
    }

    // 🚨 DEMO SECURITY: Allow payroll admins to access all employee time balances
    const allowedPayrollIds = ['pay-001']; // Lars Johansson is payroll admin
    const isPayrollAdmin = allowedPayrollIds.includes(currentUser as string);
    const isRequestingOwnPayrollBalance = isPayrollAdmin && employeeId === currentUser;
    
    if (currentUser !== employeeId && !isPayrollAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: isPayrollAdmin ? 'Payroll admin access granted' : 'Du kan bara se ditt eget tidssaldo'
      });
    }

    // 🔒 CRITICAL: Time balances MUST use database only - NO MOCK DATA FALLBACK!
    // Time balances affect salary calculations and must be accurate
    if (!supabase) {
      console.error('🚫 CRITICAL: Database connection required for time balance access');
      return res.status(500).json({ 
        error: 'Database connection required',
        message: 'Tidssaldo kräver databasanslutning. Mock data är inte tillåtet för tidssaldon som påverkar löner.',
        code: 'TIME_BALANCE_DB_REQUIRED'
      });
    }
    
    let timeBalance;
    try {
      const { data, error } = await supabase
        .from('time_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned is OK
        console.error('🚫 CRITICAL: Database query failed for time balance:', error);
        return res.status(500).json({ 
          error: 'Database query failed',
          message: 'Kunde inte hämta tidssaldo från databasen. Mock data är inte tillåtet för tidssaldon.',
          code: 'TIME_BALANCE_DB_QUERY_FAILED'
        });
      }
      
      timeBalance = data;
      console.log(`✅ TIME BALANCE ACCESS: Retrieved time balance from database for ${employeeId}`);
    } catch (error) {
      console.error('🚫 CRITICAL: Unexpected error accessing time balance:', error);
      return res.status(500).json({ 
        error: 'Database access failed',
        message: 'Ett oväntat fel uppstod vid hämtning av tidssaldo från databasen.',
        code: 'TIME_BALANCE_UNEXPECTED_ERROR'
      });
    }
    
    if (timeBalance) {
      // Map snake_case to camelCase for frontend compatibility
      const mappedTimeBalance = {
        ...timeBalance,
        employeeId: timeBalance.employee_id || timeBalance.employeeId,
        timeBalance: timeBalance.time_balance || timeBalance.timeBalance,
        vacationDays: timeBalance.vacation_days || timeBalance.vacationDays,
        savedVacationDays: timeBalance.saved_vacation_days || timeBalance.savedVacationDays,
        vacationUnit: timeBalance.vacation_unit || timeBalance.vacationUnit,
        compensationTime: timeBalance.compensation_time || timeBalance.compensationTime,
        lastUpdated: timeBalance.last_updated || timeBalance.lastUpdated,
      };
      
      res.json(mappedTimeBalance);
    } else if (isRequestingOwnPayrollBalance) {
      // Payroll admins may not have time balance records (they don't track hours like regular employees)
      console.log(`💼 PAYROLL ADMIN: No time balance found for ${employeeId}, returning default structure`);
      res.json({
        employeeId: employeeId,
        timeBalance: 0,
        vacationDays: 0,
        savedVacationDays: 0,
        vacationUnit: 'days',
        compensationTime: 0,
        lastUpdated: new Date().toISOString(),
        isPayrollAdmin: true
      });
    } else {
      res.status(404).json({ message: 'Time balance not found' });
    }
  } catch (error) {
    console.error('Error fetching time balance:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}

// PATCH method to update time balance
export async function patchHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { employeeId } = req.query;
    const { currentUser } = req.query;
    const updateData = req.body;

    // 🚨 DEMO SECURITY: Only payroll admins can update time balances
    const allowedPayrollIds = ['pay-001'];
    const isPayrollAdmin = allowedPayrollIds.includes(currentUser as string);
    
    if (!isPayrollAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Bara löneadministratörer kan uppdatera tidssaldon'
      });
    }

    if (!supabase) {
      return res.status(500).json({ 
        error: 'Database connection required',
        message: 'Tidssaldo uppdatering kräver databasanslutning.'
      });
    }

    // Map camelCase to snake_case for database
    const dbUpdateData: any = {};
    if (updateData.vacationDays !== undefined) dbUpdateData.vacation_days = updateData.vacationDays;
    if (updateData.timeBalance !== undefined) dbUpdateData.time_balance = updateData.timeBalance;
    if (updateData.compensationTime !== undefined) dbUpdateData.compensation_time = updateData.compensationTime;
    if (updateData.savedVacationDays !== undefined) dbUpdateData.saved_vacation_days = updateData.savedVacationDays;
    if (updateData.vacationUnit !== undefined) dbUpdateData.vacation_unit = updateData.vacationUnit;
    
    // Always update last_updated
    dbUpdateData.last_updated = new Date().toISOString();

    const { data, error } = await supabase
      .from('time_balances')
      .update(dbUpdateData)
      .eq('employee_id', employeeId)
      .select()
      .single();

    if (error) throw error;

    // Map response back to camelCase
    const response = {
      ...data,
      employeeId: data.employee_id,
      timeBalance: data.time_balance,
      vacationDays: data.vacation_days,
      savedVacationDays: data.saved_vacation_days,
      vacationUnit: data.vacation_unit,
      compensationTime: data.compensation_time,
      lastUpdated: data.last_updated,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating time balance:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
