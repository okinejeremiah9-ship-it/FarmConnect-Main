import { createClient } from "@supabase/supabase-js";

import { resolveSupabaseConfig } from "./supabaseEnv";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
