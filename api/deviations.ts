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
    // GET - fetch deviations with filtering
    try {
      const { employeeId, period, status, timeCode, sortBy } = req.query;
      let deviations;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        let query = supabase.from('deviations').select('*');
        
        // Apply filters
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        
        if (status && status !== 'all') {
          // Handle the new "needs-action" combined filter (UX improvement)
          if (status === 'needs-action') {
            query = query.in('status', ['pending', 'returned', 'draft']); // Items that need user action
          } else {
            query = query.eq('status', status);
          }
        }
        
        if (timeCode && timeCode !== 'all') {
          query = query.eq('time_code', timeCode);
        }
        
        // Handle period filtering with date ranges
        if (period) {
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth(); // 0-indexed
          
          if (period === 'current-month') {
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            
            query = query.gte('date', startDate).lte('date', endDate);
          } else if (period === 'last-month') {
            const lastMonthYear = month === 0 ? year - 1 : year;
            const lastMonth = month === 0 ? 12 : month;
            
            const startDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(lastMonthYear, lastMonth, 0).getDate();
            const endDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            
            query = query.gte('date', startDate).lte('date', endDate);
          }
          // For 'all-time', don't add date filters
        }
        
        // Apply sorting
        if (sortBy === 'date-desc') {
          query = query.order('date', { ascending: false });
        } else if (sortBy === 'date-asc') {
          query = query.order('date', { ascending: true });
        } else if (sortBy === 'status') {
          query = query.order('status');
        } else {
          // Default sort by date descending
          query = query.order('date', { ascending: false });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        deviations = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        deviations = await getMockData('deviations.json');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      deviations = await getMockData('deviations.json');
    }
    
    // Apply client-side filtering for mock data
    if (!supabase || deviations.length === 0) {
      let filteredDeviations = [...deviations];
      
      // Filter by employeeId
      if (employeeId) {
        filteredDeviations = filteredDeviations.filter((d: any) => 
          (d.employeeId === employeeId || d.employee_id === employeeId)
        );
      }
      
      // Filter by status  
      if (status && status !== 'all') {
        if (status === 'needs-action') {
          filteredDeviations = filteredDeviations.filter((d: any) => 
            ['pending', 'returned', 'draft'].includes(d.status)
          );
        } else {
          filteredDeviations = filteredDeviations.filter((d: any) => d.status === status);
        }
      }
      
      // Filter by timeCode
      if (timeCode && timeCode !== 'all') {
        filteredDeviations = filteredDeviations.filter((d: any) => 
          (d.timeCode === timeCode || d.time_code === timeCode)
        );
      }
      
      // Filter by period
      if (period) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed
        
        if (period === 'current-month') {
          const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(year, month + 1, 0).getDate();
          const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          
          filteredDeviations = filteredDeviations.filter((d: any) => 
            d.date >= startDate && d.date <= endDate
          );
        } else if (period === 'last-month') {
          const lastMonthYear = month === 0 ? year - 1 : year;
          const lastMonth = month === 0 ? 12 : month;
          
          const startDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
          const lastDay = new Date(lastMonthYear, lastMonth, 0).getDate();
          const endDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          
          filteredDeviations = filteredDeviations.filter((d: any) => 
            d.date >= startDate && d.date <= endDate
          );
        }
        // For 'all-time', don't filter by date
      }
      
      // Apply client-side sorting for mock data
      if (sortBy === 'date-desc') {
        filteredDeviations.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (sortBy === 'date-asc') {
        filteredDeviations.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (sortBy === 'status') {
        filteredDeviations.sort((a: any, b: any) => a.status.localeCompare(b.status));
      } else {
        // Default sort by date descending
        filteredDeviations.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      deviations = filteredDeviations;
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedDeviations = deviations.map((deviation: any) => ({
      ...deviation,
      employeeId: deviation.employee_id || deviation.employeeId,
      timeCode: deviation.time_code || deviation.timeCode,
      startTime: deviation.start_time || deviation.startTime,
      endTime: deviation.end_time || deviation.endTime,
    }));
    
      res.json(mappedDeviations);
    } catch (error) {
      console.error('Error fetching deviations:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else if (req.method === 'POST') {
    // POST - create new deviation
    try {
      // Get time codes to check if approval is required
      const timeCodes = await getMockData('timecodes.json');
      const timeCode = timeCodes.find((tc: any) => tc.code === req.body.timeCode);
      
      // Determine status based on Swedish HR praxis
      let status = req.body.status;
      if (!status) {
        // If no status provided, determine based on time code
        if (timeCode && timeCode.requiresApproval === false) {
          // Sjukdom (300) and VAB (400) don't require approval - auto-approve
          status = 'approved';
        } else {
          // Other types (semester, övertid) require approval
          status = 'pending';
        }
      }
      
      const deviationData = {
        ...req.body,
        startTime: req.body.startTime && !req.body.startTime.includes(':00') ? req.body.startTime + ':00' : req.body.startTime,
        endTime: req.body.endTime && !req.body.endTime.includes(':00') ? req.body.endTime + ':00' : req.body.endTime,
        status: status
      };
      
      let newDeviation;
      
      // Try Supabase first, fallback to mock data
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('deviations')
            .insert([deviationData])
            .select()
            .single();
          
          if (error) throw error;
          newDeviation = data;
          console.log('Created new deviation via Supabase:', newDeviation);
        } catch (error) {
          console.log('Supabase creation failed, using mock data:', error);
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!newDeviation) {
        const mockDeviations = await getMockData('deviations.json');
        const newId = Math.max(...mockDeviations.map((d: any) => d.id || 0)) + 1;
        newDeviation = {
          id: newId,
          ...deviationData,
          lastUpdated: new Date().toISOString(),
          submitted: new Date().toISOString()
        };
        // In a real implementation, we would save back to file
        console.log('Created new deviation via mock fallback:', newDeviation);
      }
      
      // Map snake_case to camelCase for frontend compatibility
      const mappedDeviation = {
        ...newDeviation,
        employeeId: newDeviation.employee_id || newDeviation.employeeId,
        timeCode: newDeviation.time_code || newDeviation.timeCode,
        startTime: newDeviation.start_time || newDeviation.startTime,
        endTime: newDeviation.end_time || newDeviation.endTime,
      };
      
      res.status(201).json(mappedDeviation);
    } catch (error) {
      console.error('Error creating deviation:', error);
      res.status(500).json({ 
        error: 'Failed to create deviation', 
        details: (error as Error).message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}