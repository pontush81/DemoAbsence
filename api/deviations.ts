import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
// 🚫 MOCK DATA REMOVED - All endpoints must use real database data only
// Force deployment refresh
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Production: Only use Supabase, no mock data fallback

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug: Check environment variables
  console.log('🔍 Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    supabaseClientExists: !!supabase,
    runtime: process.env.VERCEL ? 'VERCEL' : 'LOCAL',
    nodeVersion: process.version,
    supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'MISSING'
  });
  if (req.method === 'GET') {
    // GET - fetch deviations with filtering
    try {
      const { employeeId, period, status, timeCode, sortBy } = req.query;
      let deviations;
    
    // 🔒 DATABASE REQUIRED - No mock data fallback allowed
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
        console.error('🚫 Database query failed for deviations:', error);
        return res.status(500).json({ 
          error: 'Database query failed',
          message: 'Kunde inte hämta avvikelser från databasen.',
          code: 'DEVIATIONS_DB_QUERY_FAILED'
        });
      }
    } else {
      console.error('🚫 Supabase credentials missing');
      return res.status(500).json({ 
        error: 'Database configuration missing',
        message: 'Supabase credentials krävs. Kontrollera SUPABASE_URL och SUPABASE_ANON_KEY.',
        code: 'SUPABASE_CONFIG_REQUIRED'
      });
    }
    
    // Data already filtered and sorted by Supabase query above
    
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
      // Get time codes from Supabase to check if approval is required
      let timeCode = null;
      if (supabase) {
        console.log('🔍 Looking up time code:', req.body.timeCode);
        try {
          const { data: timeCodesData, error: timeCodeError } = await supabase.from('time_codes').select('*').eq('code', req.body.timeCode).single();
          if (timeCodeError) {
            console.warn('⚠️  Time code lookup error:', timeCodeError);
          }
          timeCode = timeCodesData;
          console.log('✅ Time code found:', timeCode);
        } catch (timeCodeLookupError) {
          console.error('❌ Time code lookup failed:', timeCodeLookupError);
        }
      }
      
      // Determine status based on Swedish HR law compliance
      let status = req.body.status;
      if (!status) {
        // If no status provided, determine based on time code requirements
        if (timeCode && timeCode.requiresApproval === false) {
          // Auto-approve only if explicitly configured as no approval required
          status = 'approved';
        } else {
          // All types require manager approval per Swedish labor law
          status = 'pending';
        }
      }
      
      // Use EXACT same structure as working createDeviation method
      const deviationData = {
        employee_id: req.body.employeeId,
        date: req.body.date,
        start_time: req.body.startTime && !req.body.startTime.includes(':00') ? req.body.startTime + ':00' : req.body.startTime,
        end_time: req.body.endTime && !req.body.endTime.includes(':00') ? req.body.endTime + ':00' : req.body.endTime,
        time_code: req.body.timeCode,
        comment: req.body.comment,
        status: status || 'pending',
        manager_comment: req.body.managerComment || null,
        submitted: req.body.submitted || new Date().toISOString(),
        approved_by: req.body.approvedBy || null,
        approved_at: req.body.approvedAt || null,
        rejected_by: req.body.rejectedBy || null,
        rejected_at: req.body.rejectedAt || null
      };
      
      let newDeviation;
      
      // 🔒 DATABASE REQUIRED - No mock data fallback allowed
      if (!supabase) {
        console.error('🚫 CRITICAL: Supabase client is null - environment variables missing');
        return res.status(500).json({ 
          error: 'Database configuration error', 
          message: 'Supabase connection not configured. Check environment variables.',
          details: `URL: ${!!process.env.SUPABASE_URL}, KEY: ${!!process.env.SUPABASE_ANON_KEY}`
        });
      }

      console.log('🔍 Attempting to insert deviation data:', JSON.stringify(deviationData, null, 2));
      console.log('🔍 Supabase client info:', {
        clientUrl: supabase?.supabaseUrl?.substring(0, 20) + '...',
        clientKey: supabase?.supabaseKey?.substring(0, 10) + '...',
        hasAuth: !!supabase?.auth,
        hasStorage: !!supabase?.storage
      });
      try {
        const { data, error } = await supabase
          .from('deviations')
          .insert([deviationData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Supabase insert error details:', error);
          throw error;
        }
        newDeviation = data;
        console.log('✅ Created new deviation via Supabase:', newDeviation);
      } catch (error) {
        console.error('🚫 Database insert failed for deviation:', error);
        return res.status(500).json({ 
          error: 'Database insert failed', 
          message: 'Kunde inte skapa avvikelse i databasen.',
          details: (error as Error).message
        });
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