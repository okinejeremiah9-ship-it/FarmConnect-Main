// Location: src/lib/supabase.ts
// Purpose: Supabase client setup with better environment validation and typed exports

import { createClient } from '@supabase/supabase-js';

// ✅ Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  throw new Error('Supabase configuration missing. Check your .env file.');
}

// ✅ Create Supabase client (handles auth, storage, and real-time channels)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 5, // limits socket events for better performance
    },
  },
});

// ✅ Storage bucket constants (optional use)
export const STORAGE_BUCKETS = {
  AUDIO: 'audio-messages',
  IMAGES: 'message-images',
  PROFILES: 'profile-pictures',
};

// ✅ File upload helper
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('File upload failed:', error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ✅ File deletion helper
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('File deletion failed:', error.message);
    throw new Error(`Delete failed: ${error.message}`);
  }
}
