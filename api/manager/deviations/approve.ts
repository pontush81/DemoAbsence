import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - Manager approvals are LEGALLY-CRITICAL and must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const deviationId = parseInt(id as string);
      
      const updateData = {
        status: 'approved',
        manager_comment: req.body.comment || 'Approved',
        approved_by: req.body.managerId || 'E005', // Manager ID from request or default
        approved_at: new Date().toISOString()
      };
      
      // 🔒 CRITICAL: Manager approvals MUST use database only - NO MOCK DATA FALLBACK!
      // Approvals have legal and financial implications and must be auditable
      if (!supabase) {
        console.error('🚫 CRITICAL: Database connection required for manager approvals');
        return res.status(500).json({ 
          error: 'Database connection required',
          message: 'Godkännanden kräver databasanslutning. Mock data är inte tillåtet för manager-beslut.',
          code: 'APPROVAL_DB_REQUIRED'
        });
      }
      
      let approvedDeviation;
      try {
        const { data, error } = await supabase
          .from('deviations')
          .update(updateData)
          .eq('id', deviationId)
          .select()
          .single();
        
        if (error) {
          console.error('🚫 CRITICAL: Database update failed for deviation approval:', error);
          return res.status(500).json({ 
            error: 'Database update failed',
            message: 'Kunde inte godkänna avvikelse i databasen. Mock data är inte tillåtet för godkännanden.',
            code: 'APPROVAL_DB_UPDATE_FAILED'
          });
        }
        
        approvedDeviation = data;
        console.log(`✅ MANAGER APPROVAL: Approved deviation ${deviationId} via database`);
      } catch (error) {
        console.error('🚫 CRITICAL: Unexpected error during deviation approval:', error);
        return res.status(500).json({ 
          error: 'Approval failed',
          message: 'Ett oväntat fel uppstod vid godkännande av avvikelse.',
          code: 'APPROVAL_UNEXPECTED_ERROR'
        });
      }
      
      if (approvedDeviation) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedDeviation = {
          ...approvedDeviation,
          employeeId: approvedDeviation.employee_id || approvedDeviation.employeeId,
          timeCode: approvedDeviation.time_code || approvedDeviation.timeCode,
          startTime: approvedDeviation.start_time || approvedDeviation.startTime,
          endTime: approvedDeviation.end_time || approvedDeviation.endTime,
          managerComment: approvedDeviation.manager_comment || approvedDeviation.managerComment,
          approvedBy: approvedDeviation.approved_by || approvedDeviation.approvedBy,
          approvedAt: approvedDeviation.approved_at || approvedDeviation.approvedAt,
        };
        
        res.json(mappedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error approving deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}