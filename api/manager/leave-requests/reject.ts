import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - Leave request rejections are LEGALLY-CRITICAL and must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const leaveRequestId = parseInt(id as string);
      
      const updateData = {
        status: 'rejected',
        manager_comment: req.body.comment || 'Rejected',
        rejected_by: req.body.managerId || 'E005',
        rejected_at: new Date().toISOString()
      };
      
      // 🔒 CRITICAL: Leave request rejections MUST use database only - NO MOCK DATA FALLBACK!
      if (!supabase) {
        console.error('🚫 CRITICAL: Database connection required for leave request rejections');
        return res.status(500).json({ 
          error: 'Database connection required',
          message: 'Avslag av ledighet kräver databasanslutning. Mock data är inte tillåtet för manager-beslut.',
          code: 'LEAVE_REJECTION_DB_REQUIRED'
        });
      }
      
      let rejectedLeaveRequest;
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .update(updateData)
          .eq('id', leaveRequestId)
          .select()
          .single();
        
        if (error) {
          console.error('🚫 CRITICAL: Database update failed for leave request rejection:', error);
          return res.status(500).json({ 
            error: 'Database update failed',
            message: 'Kunde inte avslå ledighetsansökan i databasen. Mock data är inte tillåtet för avslag.',
            code: 'LEAVE_REJECTION_DB_UPDATE_FAILED'
          });
        }
        
        rejectedLeaveRequest = data;
        console.log(`✅ MANAGER REJECTION: Rejected leave request ${leaveRequestId} via database`);
      } catch (error) {
        console.error('🚫 CRITICAL: Unexpected error during leave request rejection:', error);
        return res.status(500).json({ 
          error: 'Rejection failed',
          message: 'Ett oväntat fel uppstod vid avslag av ledighetsansökan.',
          code: 'LEAVE_REJECTION_UNEXPECTED_ERROR'
        });
      }
      
      if (rejectedLeaveRequest) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedLeaveRequest = {
          ...rejectedLeaveRequest,
          employeeId: rejectedLeaveRequest.employee_id || rejectedLeaveRequest.employeeId,
          startDate: rejectedLeaveRequest.start_date || rejectedLeaveRequest.startDate,
          endDate: rejectedLeaveRequest.end_date || rejectedLeaveRequest.endDate,
          leaveType: rejectedLeaveRequest.leave_type || rejectedLeaveRequest.leaveType,
          managerComment: rejectedLeaveRequest.manager_comment || rejectedLeaveRequest.managerComment,
          rejectedBy: rejectedLeaveRequest.rejected_by || rejectedLeaveRequest.rejectedBy,
          rejectedAt: rejectedLeaveRequest.rejected_at || rejectedLeaveRequest.rejectedAt,
        };
        
        res.json(mappedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}