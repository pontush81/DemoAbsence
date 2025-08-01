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
      
      let approvedDeviation;
      
      // Try Supabase first, fallback to mock data
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('deviations')
            .update(updateData)
            .eq('id', deviationId)
            .select()
            .single();
          
          if (error) throw error;
          approvedDeviation = data;
          console.log('Approved deviation via Supabase:', approvedDeviation);
        } catch (error) {
          console.log('Supabase approval failed, using mock data:', error);
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!approvedDeviation) {
        const deviations = await getMockData('deviations.json');
        const index = deviations.findIndex((d: any) => d.id === deviationId);
        
        if (index !== -1) {
          approvedDeviation = {
            ...deviations[index],
            ...updateData,
            lastUpdated: new Date().toISOString()
          };
          // In a real implementation, we would save back to file
          console.log('Approved deviation via mock fallback:', approvedDeviation);
        }
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