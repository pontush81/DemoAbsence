import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Require Supabase configuration
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('🚨 CRITICAL: Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: timeCodes, error } = await supabase.from('time_codes').select('*');
    
    if (error) throw error;
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedTimeCodes = timeCodes.map((timeCode: any) => ({
      ...timeCode,
      nameSv: timeCode.name_sv || timeCode.nameSv,
      nameEn: timeCode.name_en || timeCode.nameEn,
    }));
    
    res.json(mappedTimeCodes);
  } catch (error) {
    console.error('Error fetching time codes:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}