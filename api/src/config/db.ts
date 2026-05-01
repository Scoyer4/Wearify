import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../config/database.types';

dotenv.config();

const dbUrl = process.env.SUPABASE_URL || '';
const dbApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient<Database>(dbUrl, dbApiKey, {
  auth: { persistSession: false }
})

export default supabase;