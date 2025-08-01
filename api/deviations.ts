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
          query = query.eq('status', status);
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
        filteredDeviations = filteredDeviations.filter((d: any) => d.status === status);
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
}