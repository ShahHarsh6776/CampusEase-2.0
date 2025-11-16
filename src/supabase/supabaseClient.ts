import { createClient } from '@supabase/supabase-js'

// Read from .env (Vite prefixes must be `VITE_`)
const supabaseUrl = "https://jfricqlqhddznvliwwpt.supabase.co";
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmljcWxxaGRkem52bGl3d3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTAzMDMsImV4cCI6MjA3ODc4NjMwM30.tLq8jgbKmm02qi-5eXXkgdlpYD-oy_mH7TiQKg5-5l0";

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
