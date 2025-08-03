import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    // Require Supabase configuration
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
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
    
    const { data: schedules, error } = await query;
    if (error) throw error;
    
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