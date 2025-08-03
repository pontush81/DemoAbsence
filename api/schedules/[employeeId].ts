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
    const { employeeId, date } = req.query;
    const { currentUser } = req.query;

    // 🚨 DEMO SECURITY: Prevent IDOR - can only view own schedules
    if (!currentUser) {
      return res.status(400).json({
        error: 'currentUser parameter required',
        message: 'Du måste ange vem du är för att se scheman'
      });
    }

    if (currentUser !== employeeId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Du kan bara se dina egna scheman'
      });
    }

    let schedules;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        let query = supabase.from('schedules').select('*');
        
        // Apply filters
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        if (date) {
          query = query.eq('date', date);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        schedules = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        const mockSchedules = await getMockData('schedules.json');
        schedules = mockSchedules.filter((s: any) => {
          const employeeMatch = !employeeId || (s.employeeId === employeeId || s.employee_id === employeeId);
          const dateMatch = !date || s.date === date;
          return employeeMatch && dateMatch;
        });
      }
    } else {
      console.log('Supabase not configured, using mock data');
      const mockSchedules = await getMockData('schedules.json');
      schedules = mockSchedules.filter((s: any) => {
        const employeeMatch = !employeeId || (s.employeeId === employeeId || s.employee_id === employeeId);
        const dateMatch = !date || s.date === date;
        return employeeMatch && dateMatch;
      });
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedSchedules = schedules.map((schedule: any) => ({
      ...schedule,
      employeeId: schedule.employee_id || schedule.employeeId,
      startTime: schedule.start_time || schedule.startTime,
      endTime: schedule.end_time || schedule.endTime,
      breakStart: schedule.break_start || schedule.breakStart,
      breakEnd: schedule.break_end || schedule.breakEnd,
    }));
    
    res.json(mappedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
