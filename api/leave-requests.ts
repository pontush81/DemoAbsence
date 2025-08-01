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
  if (req.method === 'GET') {
    // GET - fetch leave requests with filtering
    try {
      const { employeeId, status } = req.query;
      let leaveRequests;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        let query = supabase.from('leave_requests').select('*');
        
        // Apply filters
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        
        // Default sort by start date descending
        query = query.order('start_date', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        leaveRequests = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        leaveRequests = await getMockData('leave-requests.json');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      leaveRequests = await getMockData('leave-requests.json');
    }
    
    // Apply client-side filtering for mock data
    if (!supabase || leaveRequests.length === 0) {
      let filteredLeaveRequests = [...leaveRequests];
      
      // Filter by employeeId
      if (employeeId) {
        filteredLeaveRequests = filteredLeaveRequests.filter((lr: any) => 
          (lr.employeeId === employeeId || lr.employee_id === employeeId)
        );
      }
      
      // Filter by status
      if (status && status !== 'all') {
        filteredLeaveRequests = filteredLeaveRequests.filter((lr: any) => lr.status === status);
      }
      
      // Sort by start date descending
      filteredLeaveRequests.sort((a: any, b: any) => {
        const dateA = new Date(a.startDate || a.start_date);
        const dateB = new Date(b.startDate || b.start_date);
        return dateB.getTime() - dateA.getTime();
      });
      
      leaveRequests = filteredLeaveRequests;
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedLeaveRequests = leaveRequests.map((leave: any) => ({
      ...leave,
      employeeId: leave.employee_id || leave.employeeId,
      startDate: leave.start_date || leave.startDate,
      endDate: leave.end_date || leave.endDate,
      leaveType: leave.leave_type || leave.leaveType,
    }));
    
      res.json(mappedLeaveRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else if (req.method === 'POST') {
    // POST - create new leave request
    try {
      const now = new Date();
      const leaveRequestData = {
        ...req.body,
        status: req.body.status || 'pending',
        submitted: now.toISOString(),
        lastUpdated: now.toISOString()
      };
      
      let newLeaveRequest;
      
      // Try Supabase first, fallback to mock data
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leave_requests')
            .insert([leaveRequestData])
            .select()
            .single();
          
          if (error) throw error;
          newLeaveRequest = data;
          console.log('Created new leave request via Supabase:', newLeaveRequest);
        } catch (error) {
          console.log('Supabase creation failed, using mock data:', error);
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!newLeaveRequest) {
        const mockLeaveRequests = await getMockData('leave-requests.json');
        const newId = Math.max(...mockLeaveRequests.map((lr: any) => lr.id || 0)) + 1;
        newLeaveRequest = {
          id: newId,
          ...leaveRequestData
        };
        // In a real implementation, we would save back to file
        console.log('Created new leave request via mock fallback:', newLeaveRequest);
      }
      
      // Map snake_case to camelCase for frontend compatibility
      const mappedLeaveRequest = {
        ...newLeaveRequest,
        employeeId: newLeaveRequest.employee_id || newLeaveRequest.employeeId,
        startDate: newLeaveRequest.start_date || newLeaveRequest.startDate,
        endDate: newLeaveRequest.end_date || newLeaveRequest.endDate,
        leaveType: newLeaveRequest.leave_type || newLeaveRequest.leaveType,
      };
      
      res.status(201).json(mappedLeaveRequest);
    } catch (error) {
      console.error('Error creating leave request:', error);
      res.status(500).json({ 
        error: 'Failed to create leave request', 
        details: (error as Error).message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}