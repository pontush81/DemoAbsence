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
    const { employeeId, startDate, endDate } = req.query;
    let schedules;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        let query = supabase.from('schedules').select('*');
        
        // Apply filters
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }
        
        // Default sort by date
        query = query.order('date', { ascending: true });
        
        const { data, error } = await query;
        if (error) throw error;
        schedules = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        schedules = await getMockData('schedules.json');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      schedules = await getMockData('schedules.json');
    }
    
    // Apply client-side filtering for mock data
    if (!supabase || schedules.length === 0) {
      let filteredSchedules = [...schedules];
      
      // Filter by employeeId
      if (employeeId) {
        filteredSchedules = filteredSchedules.filter((s: any) => 
          (s.employeeId === employeeId || s.employee_id === employeeId)
        );
      }
      
      // Filter by date range
      if (startDate) {
        filteredSchedules = filteredSchedules.filter((s: any) => s.date >= startDate);
      }
      if (endDate) {
        filteredSchedules = filteredSchedules.filter((s: any) => s.date <= endDate);
      }
      
      // Sort by date
      filteredSchedules.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      schedules = filteredSchedules;
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