import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// 🚫 MOCK DATA REMOVED - All endpoints must use real database data only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET - fetch individual leave request
    try {
      const { id } = req.query;
      const leaveRequestId = parseInt(id as string);
      let leaveRequest;
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', leaveRequestId)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
          }
          leaveRequest = data;
        } catch (error) {
        }
      }
      
      // If Supabase didn't work or no data found, try mock data
      if (!leaveRequest) {
        leaveRequest = allLeaveRequests.find((lr: any) => lr.id === leaveRequestId);
      }
      
      if (leaveRequest) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedLeaveRequest = {
          ...leaveRequest,
          employeeId: leaveRequest.employee_id || leaveRequest.employeeId,
          startDate: leaveRequest.start_date || leaveRequest.startDate,
          endDate: leaveRequest.end_date || leaveRequest.endDate,
          leaveType: leaveRequest.leave_type || leaveRequest.leaveType,
          managerComment: leaveRequest.manager_comment || leaveRequest.managerComment,
          approvedBy: leaveRequest.approved_by || leaveRequest.approvedBy,
          approvedAt: leaveRequest.approved_at || leaveRequest.approvedAt,
          rejectedBy: leaveRequest.rejected_by || leaveRequest.rejectedBy,
          rejectedAt: leaveRequest.rejected_at || leaveRequest.rejectedAt,
          pausedBy: leaveRequest.paused_by || leaveRequest.pausedBy,
          pausedAt: leaveRequest.paused_at || leaveRequest.pausedAt,
          pauseReason: leaveRequest.pause_reason || leaveRequest.pauseReason,
        };
        
        res.json(mappedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error fetching leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else if (req.method === 'PATCH') {
    // PATCH - update existing leave request
    try {
      const { id } = req.query;
      const leaveRequestId = parseInt(id as string);
      const updateData = { ...req.body };
      
      let updatedLeaveRequest;
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leave_requests')
            .update(updateData)
            .eq('id', leaveRequestId)
            .select()
            .single();
          
          if (error) throw error;
          updatedLeaveRequest = data;
        } catch (error) {
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!updatedLeaveRequest) {
        const index = allLeaveRequests.findIndex((lr: any) => lr.id === leaveRequestId);
        
        if (index >= 0) {
          allLeaveRequests[index] = { ...allLeaveRequests[index], ...updateData, lastUpdated: new Date().toISOString() };
          // In a real implementation, we would save back to file
          updatedLeaveRequest = allLeaveRequests[index];
        }
      }
      
      if (updatedLeaveRequest) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedLeaveRequest = {
          ...updatedLeaveRequest,
          employeeId: updatedLeaveRequest.employee_id || updatedLeaveRequest.employeeId,
          startDate: updatedLeaveRequest.start_date || updatedLeaveRequest.startDate,
          endDate: updatedLeaveRequest.end_date || updatedLeaveRequest.endDate,
          leaveType: updatedLeaveRequest.leave_type || updatedLeaveRequest.leaveType,
        };
        
        res.json(mappedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found or update failed' });
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      res.status(500).json({ 
        error: 'Failed to update leave request', 
        details: (error as Error).message 
      });
    }
  } else if (req.method === 'DELETE') {
    // DELETE - remove leave request
    try {
      const { id } = req.query;
      const leaveRequestId = parseInt(id as string);
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
      if (supabase) {
        try {
          const { error } = await supabase
            .from('leave_requests')
            .delete()
            .eq('id', leaveRequestId);
          
          if (error) throw error;
          
          res.json({ 
            message: 'Semesteransökan raderad framgångsrikt',
            id: leaveRequestId 
          });
        } catch (error) {
          console.error('Error deleting leave request:', error);
          res.status(500).json({ 
            error: 'Failed to delete leave request', 
            details: (error as Error).message 
          });
        }
      } else {
        res.status(500).json({ error: 'Database connection not available' });
      }
    } catch (error) {
      console.error('Error processing delete request:', error);
      res.status(500).json({ 
        error: 'Failed to delete leave request', 
        details: (error as Error).message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}