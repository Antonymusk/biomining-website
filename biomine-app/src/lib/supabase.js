import { createClient } from "@supabase/supabase-js";

// Read environment variables (injected by Vite / Vercel)
const injectedUrl = import.meta.env.VITE_SUPABASE_URL;
const injectedKey = import.meta.env.VITE_SUPABASE_KEY;

// Fallback to the correct project details if environment variables are not set on Vercel
const FALLBACK_URL = "https://avjjuyrobxgwblpagscl.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2amp1eXJvYnhnd2JscGFnc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzY3OTEsImV4cCI6MjA5NDIxMjc5MX0.j2L_aUjdSTQ3WetC3OiaapkyO-dXwUKzbn19cjgD7tw";

const finalUrl = injectedUrl || FALLBACK_URL;
const finalKey = injectedKey || FALLBACK_KEY;

console.log("🔐 Auth Engine initialized.");

export const supabase = createClient(finalUrl, finalKey);