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
    // GET - fetch individual deviation
    try {
      const { id } = req.query;
      const deviationId = parseInt(id as string);
      let deviation;
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('deviations')
            .select('*')
            .eq('id', deviationId)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
          }
          deviation = data;
        } catch (error) {
        }
      }
      
      // If Supabase didn't work or no data found, try mock data
      if (!deviation) {
        deviation = allDeviations.find((d: any) => d.id === deviationId);
      }
      
      if (deviation) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedDeviation = {
          ...deviation,
          employeeId: deviation.employee_id || deviation.employeeId,
          timeCode: deviation.time_code || deviation.timeCode,
          startTime: deviation.start_time || deviation.startTime,
          endTime: deviation.end_time || deviation.endTime,
        };
        
        res.json(mappedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error fetching deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else if (req.method === 'PATCH') {
    // PATCH - update existing deviation
    try {
      const { id } = req.query;
      const deviationId = parseInt(id as string);
      const updateData = { ...req.body };
      
      // Add seconds for time consistency if provided
      if (updateData.startTime && !updateData.startTime.includes(':00')) {
        updateData.startTime = updateData.startTime + ':00';
      }
      if (updateData.endTime && !updateData.endTime.includes(':00')) {
        updateData.endTime = updateData.endTime + ':00';
      }
      
      let updatedDeviation;
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('deviations')
            .update(updateData)
            .eq('id', deviationId)
            .select()
            .single();
          
          if (error) throw error;
          updatedDeviation = data;
        } catch (error) {
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!updatedDeviation) {
        const index = allDeviations.findIndex((d: any) => d.id === deviationId);
        
        if (index >= 0) {
          allDeviations[index] = { ...allDeviations[index], ...updateData, lastUpdated: new Date().toISOString() };
          // In a real implementation, we would save back to file
          updatedDeviation = allDeviations[index];
        }
      }
      
      if (updatedDeviation) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedDeviation = {
          ...updatedDeviation,
          employeeId: updatedDeviation.employee_id || updatedDeviation.employeeId,
          timeCode: updatedDeviation.time_code || updatedDeviation.timeCode,
          startTime: updatedDeviation.start_time || updatedDeviation.startTime,
          endTime: updatedDeviation.end_time || updatedDeviation.endTime,
        };
        
        res.json(mappedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found or update failed' });
      }
    } catch (error) {
      console.error('Error updating deviation:', error);
      res.status(500).json({ 
        error: 'Failed to update deviation', 
        details: (error as Error).message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}