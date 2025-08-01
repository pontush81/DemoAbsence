import 'dotenv/config';
import type { VercelRequest, VercelResponse } from "@vercel/node";
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
    const { employeeId } = req.query;
    let timeBalance;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('time_balances')
          .select('*')
          .eq('employee_id', employeeId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        timeBalance = data;
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
      }
    }
    
    // If Supabase didn't work or no data found, try mock data
    if (!timeBalance) {
      console.log('Using mock data for time balance');
      const mockTimeBalances = await getMockData('timebalances.json');
      timeBalance = mockTimeBalances.find((tb: any) => 
        tb.employeeId === employeeId || tb.employee_id === employeeId
      );
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
    } else {
      res.status(404).json({ message: 'Time balance not found' });
    }
  } catch (error) {
    console.error('Error fetching time balance:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
