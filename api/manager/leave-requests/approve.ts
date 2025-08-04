import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - Leave request approvals are LEGALLY-CRITICAL and must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const leaveRequestId = parseInt(id as string);
      
      const updateData = {
        status: 'approved',
        manager_comment: req.body.comment || 'Approved',
        approved_by: req.body.managerId || 'E005',
        approved_at: new Date().toISOString()
      };
      
      // 🔒 CRITICAL: Leave request approvals MUST use database only - NO MOCK DATA FALLBACK!
      if (!supabase) {
        console.error('🚫 CRITICAL: Database connection required for leave request approvals');
        return res.status(500).json({ 
          error: 'Database connection required',
          message: 'Godkännande av ledighet kräver databasanslutning. Mock data är inte tillåtet för manager-beslut.',
          code: 'LEAVE_APPROVAL_DB_REQUIRED'
        });
      }
      
      let approvedLeaveRequest;
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .update(updateData)
          .eq('id', leaveRequestId)
          .select()
          .single();
        
        if (error) {
          console.error('🚫 CRITICAL: Database update failed for leave request approval:', error);
          return res.status(500).json({ 
            error: 'Database update failed',
            message: 'Kunde inte godkänna ledighetsansökan i databasen. Mock data är inte tillåtet för godkännanden.',
            code: 'LEAVE_APPROVAL_DB_UPDATE_FAILED'
          });
        }
        
        approvedLeaveRequest = data;
        console.log(`✅ MANAGER APPROVAL: Approved leave request ${leaveRequestId} via database`);
      } catch (error) {
        console.error('🚫 CRITICAL: Unexpected error during leave request approval:', error);
        return res.status(500).json({ 
          error: 'Approval failed',
          message: 'Ett oväntat fel uppstod vid godkännande av ledighetsansökan.',
          code: 'LEAVE_APPROVAL_UNEXPECTED_ERROR'
        });
      }
      
      if (approvedLeaveRequest) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedLeaveRequest = {
          ...approvedLeaveRequest,
          employeeId: approvedLeaveRequest.employee_id || approvedLeaveRequest.employeeId,
          startDate: approvedLeaveRequest.start_date || approvedLeaveRequest.startDate,
          endDate: approvedLeaveRequest.end_date || approvedLeaveRequest.endDate,
          leaveType: approvedLeaveRequest.leave_type || approvedLeaveRequest.leaveType,
          managerComment: approvedLeaveRequest.manager_comment || approvedLeaveRequest.managerComment,
          approvedBy: approvedLeaveRequest.approved_by || approvedLeaveRequest.approvedBy,
          approvedAt: approvedLeaveRequest.approved_at || approvedLeaveRequest.approvedAt,
        };
        
        res.json(mappedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}