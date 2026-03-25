import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../config/database.types';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || '';
const dbApiKey = process.env.DATABASE_API_KEY || '';

const supabase = createClient<Database>(
  dbUrl,
  dbApiKey
)

export default supabase;