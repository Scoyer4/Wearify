import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../config/database.types';

dotenv.config();

const dbUrl = process.env.SUPABASE_URL || '';
const dbApiKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient<Database>(
  dbUrl,
  dbApiKey
)

export default supabase;