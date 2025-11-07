import { createClient } from "@supabase/supabase-js";

import { resolveSupabaseConfig } from "./supabaseEnv";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
});

export const STORAGE_BUCKETS = {
  AUDIO: "audio-messages",
  IMAGES: "message-images",
  PROFILES: "profile-pictures",
};

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("File upload failed:", error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("File deletion failed:", error.message);
    throw new Error(`Delete failed: ${error.message}`);
  }
}
