import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "./supabaseEnv";

const { url, anonKey } = resolveSupabaseConfig();

if (!url || !anonKey) {
  throw new Error("Supabase configuration is missing!");
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
