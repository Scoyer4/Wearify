import { createClient } from '@supabase/supabase-js';

// Vite utiliza import.meta.env para acceder al archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno de Supabase. Revisa tu archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);