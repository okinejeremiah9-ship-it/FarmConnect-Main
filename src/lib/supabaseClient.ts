import { createClient } from "@supabase/supabase-js";

import { resolveSupabaseConfig } from "./supabaseEnv";

const supabaseConfig = resolveSupabaseConfig();
const { url: supabaseUrl, anonKey: supabaseAnonKey } = supabaseConfig;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
