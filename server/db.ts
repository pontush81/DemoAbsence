import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Supabase configuration - optional for development
const hasDatabase = process.env.DATABASE_URL && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!hasDatabase) {
  console.warn('⚠️ Database credentials not found. Running in JSON fallback mode.');
  console.warn('To use database features, set DATABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in .env file');
}

// Create Supabase client (for auth, storage, etc.) - only if credentials exist
export const supabase = hasDatabase ? createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
) : null;

// Create Drizzle client with postgres driver - only if DATABASE_URL exists
const client = hasDatabase ? postgres(process.env.DATABASE_URL!, { prepare: false }) : null;
export const db = hasDatabase && client ? drizzle(client, { schema }) : null;
