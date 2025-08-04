import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 🚫 MOCK DATA REMOVED - Manager rejections are LEGALLY-CRITICAL and must use real database data only

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const deviationId = parseInt(id as string);
      
      const updateData = {
        status: 'rejected',
        manager_comment: req.body.comment || 'Rejected',
        rejected_by: req.body.managerId || 'E005',
        rejected_at: new Date().toISOString()
      };
      
      let rejectedDeviation;
      
      // 🔒 CRITICAL: Manager rejections MUST use database only - NO MOCK DATA FALLBACK!
      if (!supabase) {
        console.error('🚫 CRITICAL: Database connection required for manager rejections');
        return res.status(500).json({ 
          error: 'Database connection required',
          message: 'Avslag kräver databasanslutning. Mock data är inte tillåtet för manager-beslut.',
          code: 'REJECTION_DB_REQUIRED'
        });
      }
      
      let rejectedDeviation;
      try {
        const { data, error } = await supabase
          .from('deviations')
          .update(updateData)
          .eq('id', deviationId)
          .select()
          .single();
        
        if (error) {
          console.error('🚫 CRITICAL: Database update failed for deviation rejection:', error);
          return res.status(500).json({ 
            error: 'Database update failed',
            message: 'Kunde inte avslå avvikelse i databasen. Mock data är inte tillåtet för avslag.',
            code: 'REJECTION_DB_UPDATE_FAILED'
          });
        }
        
        rejectedDeviation = data;
        console.log(`✅ MANAGER REJECTION: Rejected deviation ${deviationId} via database`);
      } catch (error) {
        console.error('🚫 CRITICAL: Unexpected error during deviation rejection:', error);
        return res.status(500).json({ 
          error: 'Rejection failed',
          message: 'Ett oväntat fel uppstod vid avslag av avvikelse.',
          code: 'REJECTION_UNEXPECTED_ERROR'
        });
      }
      
      if (rejectedDeviation) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedDeviation = {
          ...rejectedDeviation,
          employeeId: rejectedDeviation.employee_id || rejectedDeviation.employeeId,
          timeCode: rejectedDeviation.time_code || rejectedDeviation.timeCode,
          startTime: rejectedDeviation.start_time || rejectedDeviation.startTime,
          endTime: rejectedDeviation.end_time || rejectedDeviation.endTime,
          managerComment: rejectedDeviation.manager_comment || rejectedDeviation.managerComment,
          rejectedBy: rejectedDeviation.rejected_by || rejectedDeviation.rejectedBy,
          rejectedAt: rejectedDeviation.rejected_at || rejectedDeviation.rejectedAt,
        };
        
        res.json(mappedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error rejecting deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}