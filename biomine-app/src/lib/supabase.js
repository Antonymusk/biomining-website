import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("CONFIGURATION WARNING: Supabase API credentials not found in environment. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are configured correctly in your production hosting dashboard.");
}

export const supabase = createClient(
  supabaseUrl || 'https://MISSING-URL-VERIFY-ENV-VARS.supabase.co', 
  supabaseKey || 'MISSING-KEY-VERIFY-ENV-VARS'
);