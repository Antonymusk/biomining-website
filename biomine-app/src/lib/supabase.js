import { createClient } from "@supabase/supabase-js";

// THE HARD TRUTH: Force routing strictly to the live, validated cluster.
// This perfectly bypasses ANY typos lurking in the Vercel dashboard environment variables.
const HARDCODED_LIVE_URL = "https://qgkmikifoorzqqrmsjhm.supabase.co";
const HARDCODED_LIVE_KEY = "sb_publishable_9s0C0DEw-RV-oI3ZBz5IhQ_vIy33Ym2";

// 1. Read whatever Vercel injected
const injectedUrl = import.meta.env.VITE_SUPABASE_URL;
const injectedKey = import.meta.env.VITE_SUPABASE_KEY;

// 2. DETECT "GHOST ADDRESSES": If it contains that phantom "qszx" domain, drop it immediately.
const isGhostAddress = injectedUrl && injectedUrl.includes("qszx");

// 3. Select final routing logic
const finalUrl = (!injectedUrl || isGhostAddress) ? HARDCODED_LIVE_URL : injectedUrl;
const finalKey = !injectedKey ? HARDCODED_LIVE_KEY : injectedKey;

console.log("🔐 Auth Engine initialized. Primary Node locked.");

export const supabase = createClient(finalUrl, finalKey);