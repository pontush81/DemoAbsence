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
    let timeCodes;
    
    // Try Supabase first, fallback to mock data
    if (supabase) {
      try {
        const { data, error } = await supabase.from('time_codes').select('*');
        if (error) throw error;
        timeCodes = data || [];
      } catch (error) {
        console.log('Supabase failed, using mock data:', error);
        timeCodes = await getMockData('timecodes.json');
      }
    } else {
      console.log('Supabase not configured, using mock data');
      timeCodes = await getMockData('timecodes.json');
    }
    
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