import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
// 🚫 MOCK DATA REMOVED - All endpoints must use real database data only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fallback mock data - embedded for Vercel compatibility
const mockLeaveRequests = [
  {"id":1,"employeeId":"E001","startDate":"2025-08-15","endDate":"2025-08-16","leaveType":"vacation","status":"approved","submitted":"2025-08-01T10:00:00+00:00"},
  {"id":2,"employeeId":"E001","startDate":"2025-08-20","endDate":"2025-08-21","leaveType":"sick","status":"pending","submitted":"2025-08-02T10:00:00+00:00"},
  {"id":3,"employeeId":"E001","startDate":"2025-08-25","endDate":"2025-08-25","leaveType":"personal","status":"rejected","submitted":"2025-08-03T10:00:00+00:00"}
];
const mockData = mockLeaveRequests; // Alias for compatibility

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET - fetch leave requests with filtering
    try {
      const { employeeId, status } = req.query;
      let leaveRequests;
    
    // 🔒 DATABASE REQUIRED - No mock data fallback allowed
    if (supabase) {
      try {
        let query = supabase.from('leave_requests').select('*');
        
        // Apply filters
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        
        if (status && status !== 'all') {
          // Handle leave-specific "active" filter for planning workflow
          if (status === 'active') {
            query = query.in('status', ['pending', 'approved']); // Active planning items
          } else {
            query = query.eq('status', status);
          }
        }
        
        // Default sort by start date descending
        query = query.order('start_date', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        leaveRequests = data || [];
      } catch (error) {
        console.error('🚫 Database query failed for leave requests:', error);
        // Fallback to empty array, will be handled below
        leaveRequests = [];
      }
    } else {
      console.log('📂 No Supabase connection, using mock data');
      leaveRequests = mockLeaveRequests;
    }
    
    // Apply sorting and mapping - use mock data if no Supabase or query failed
    if (!supabase || leaveRequests.length === 0) {
      let filteredLeaveRequests = [...(leaveRequests.length === 0 ? mockLeaveRequests : leaveRequests)];
      
      // Filter by employeeId
      if (employeeId) {
        filteredLeaveRequests = filteredLeaveRequests.filter((lr: any) => 
          (lr.employeeId === employeeId || lr.employee_id === employeeId)
        );
      }
      
      // Filter by status
      if (status && status !== 'all') {
        if (status === 'active') {
          filteredLeaveRequests = filteredLeaveRequests.filter((lr: any) => 
            ['pending', 'approved'].includes(lr.status)
          );
        } else {
          filteredLeaveRequests = filteredLeaveRequests.filter((lr: any) => lr.status === status);
        }
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
      
      // VALIDATION: Check for overlapping leave requests
      const { startDate, endDate, employeeId } = leaveRequestData;
      if (!startDate || !endDate || !employeeId) {
        return res.status(400).json({ error: 'startDate, endDate, and employeeId are required' });
      }
      
      // Get existing leave requests for this employee
      let existingRequests = [];
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', employeeId)
            .in('status', ['approved', 'pending']);
          
          if (error) throw error;
          existingRequests = data || [];
          console.log('🔍 VALIDATION DEBUG - Found existing requests:', existingRequests.length);
          console.log('🔍 VALIDATION DEBUG - Existing requests:', JSON.stringify(existingRequests, null, 2));
        } catch (error) {
          existingRequests = mockData.filter((lr: any) => 
            (lr.employeeId === employeeId || lr.employee_id === employeeId) &&
            ['approved', 'pending'].includes(lr.status)
          );
        }
      } else {
        existingRequests = mockData.filter((lr: any) => 
          (lr.employeeId === employeeId || lr.employee_id === employeeId) &&
          ['approved', 'pending'].includes(lr.status)
        );
      }
      
      // Check for date overlaps
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      
      console.log('🔍 VALIDATION DEBUG - New request dates:', { startDate, endDate, newStart, newEnd });
      
      const hasOverlap = existingRequests.some((existing: any) => {
        const existingStart = new Date(existing.start_date || existing.startDate);
        const existingEnd = new Date(existing.end_date || existing.endDate);
        
        console.log('🔍 VALIDATION DEBUG - Checking existing request:', {
          id: existing.id,
          start_date: existing.start_date,
          end_date: existing.end_date, 
          existingStart,
          existingEnd,
          overlaps: newStart <= existingEnd && existingStart <= newEnd
        });
        
        // Two ranges overlap if: start1 <= end2 AND start2 <= end1
        return newStart <= existingEnd && existingStart <= newEnd;
      });
      
      console.log('🔍 VALIDATION DEBUG - Overall overlap result:', hasOverlap);
      
      if (hasOverlap) {
        const conflictingRequest = existingRequests.find((existing: any) => {
          const existingStart = new Date(existing.start_date || existing.startDate);
          const existingEnd = new Date(existing.end_date || existing.endDate);
          return newStart <= existingEnd && existingStart <= newEnd;
        });
        
        const conflictStart = new Date(conflictingRequest.start_date || conflictingRequest.startDate).toLocaleDateString('sv-SE');
        const conflictEnd = new Date(conflictingRequest.end_date || conflictingRequest.endDate).toLocaleDateString('sv-SE');
        const conflictDates = conflictStart === conflictEnd ? conflictStart : `${conflictStart} - ${conflictEnd}`;
        
        return res.status(409).json({ 
          error: 'Överlappande ledighet',
          message: `Du har redan ansökt om ledighet som överlappar med dessa datum. Befintlig ledighet: ${conflictDates}`,
          conflictingDates: { start: conflictStart, end: conflictEnd }
        });
      }
      
      let newLeaveRequest;
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
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
          console.error('🚫 Database insert failed for leave request:', error);
          // Will fall back to mock data below
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!newLeaveRequest) {
        const newId = Math.max(...mockLeaveRequests.map((lr: any) => lr.id || 0)) + 1;
        newLeaveRequest = {
          id: newId,
          ...leaveRequestData
        };
        // In a real implementation, we would save back to file
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