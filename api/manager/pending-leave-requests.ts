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
    let pendingLeaveRequests;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('status', 'pending')
          .order('start_date', { ascending: false });
        
        if (error) throw error;
        pendingLeaveRequests = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        const allLeaveRequests = await getMockData('leave-requests.json');
        pendingLeaveRequests = allLeaveRequests.filter((lr: any) => lr.status === 'pending');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      const allLeaveRequests = await getMockData('leave-requests.json');
      pendingLeaveRequests = allLeaveRequests.filter((lr: any) => lr.status === 'pending');
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedLeaveRequests = pendingLeaveRequests.map((leave: any) => ({
      ...leave,
      employeeId: leave.employee_id || leave.employeeId,
      startDate: leave.start_date || leave.startDate,
      endDate: leave.end_date || leave.endDate,
      leaveType: leave.leave_type || leave.leaveType,
    }));
    
    res.json(mappedLeaveRequests);
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}