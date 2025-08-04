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
        status: 'returned',
        manager_comment: req.body.comment || 'Needs correction'
      };
      
      let returnedDeviation;
      
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
          returnedDeviation = data;
        } catch (error) {
          console.log('Supabase return failed, using mock data:', error);
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!returnedDeviation) {
        const deviations = await getMockData('deviations.json');
        const index = deviations.findIndex((d: any) => d.id === deviationId);
        
        if (index !== -1) {
          returnedDeviation = {
            ...deviations[index],
            ...updateData,
            lastUpdated: new Date().toISOString()
          };
        }
      }
      
      if (returnedDeviation) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedDeviation = {
          ...returnedDeviation,
          employeeId: returnedDeviation.employee_id || returnedDeviation.employeeId,
          timeCode: returnedDeviation.time_code || returnedDeviation.timeCode,
          startTime: returnedDeviation.start_time || returnedDeviation.startTime,
          endTime: returnedDeviation.end_time || returnedDeviation.endTime,
          managerComment: returnedDeviation.manager_comment || returnedDeviation.managerComment,
        };
        
        res.json(mappedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error returning deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}