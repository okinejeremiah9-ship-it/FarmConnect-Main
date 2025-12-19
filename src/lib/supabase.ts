// 📍 Location: src/lib/supabase.ts
// ⚙️ Purpose: Centralized Supabase client setup + Storage + Chat + Bookings + Driver GPS

import { createClient } from "@supabase/supabase-js";

// -------------------------------------------
// ✅ Initialize Supabase Client (single source of truth)
// -------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables.");
  throw new Error("Missing Supabase env vars");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // ✅ IMPORTANT: store session in browser localStorage
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// -------------------------------------------
// ✅ STORAGE BUCKETS (Expanded + Unified)
// -------------------------------------------
// Your actual buckets (from Supabase): profile-pictures, completion_photos, chat_uploads, audio_messages
// Keep legacy keys for compatibility, but point them to real buckets.
export const STORAGE_BUCKETS = {
  // 🔥 Current buckets (active)
  CHAT_IMAGES: "chat_uploads",
  CHAT_AUDIO: "audio_messages",
  COMPLETION_IMAGES: "completion_photos",

  // 🧩 Legacy buckets (kept for compatibility — DO NOT REMOVE)
  // Map old names to the buckets that actually exist now.
  AUDIO: "audio_messages",
  IMAGES: "chat_uploads",
  PROFILES: "profile-pictures",
};

// -------------------------------------------
// ✅ Bucket Normalizer (prevents "Bucket not found")
// -------------------------------------------
function normalizeBucketName(bucket: string): string {
  if (!bucket) return bucket;

  // If someone passes legacy physical bucket names directly, map them too:
  if (bucket === "audio-messages") return STORAGE_BUCKETS.AUDIO;
  if (bucket === "message-images") return STORAGE_BUCKETS.IMAGES;
  if (bucket === "profile-pictures") return STORAGE_BUCKETS.PROFILES;

  return bucket;
}

// -------------------------------------------
// ✅ File Upload (Supports all buckets)
// -------------------------------------------
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string> {
  const safeBucket = normalizeBucketName(bucket);

  // Optional: make sure the user has a session (helps debug RLS errors clearly)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("❌ Upload blocked: No active Supabase session (not logged in).");
    throw new Error("Upload failed: You are not logged in.");
  }

  const contentType =
    file instanceof File ? file.type : (file as any)?.type || "application/octet-stream";

  const { data, error } = await supabase.storage.from(safeBucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (error) {
    // This is the exact error you hit: "new row violates row-level security policy"
    // That means your Storage RLS policy is blocking INSERT for this bucket.
    console.error("❌ File upload failed:", error.message, {
      bucket: safeBucket,
      originalBucket: bucket,
      path,
    });
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(safeBucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// -------------------------------------------
// ✅ Delete File
// -------------------------------------------
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const safeBucket = normalizeBucketName(bucket);

  const { error } = await supabase.storage.from(safeBucket).remove([path]);
  if (error) {
    console.error("❌ File deletion failed:", error.message);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// -------------------------------------------
// ✅ Fetch Provider Services
// -------------------------------------------
export async function fetchProviderServices() {
  const { data, error } = await supabase
    .from("provider_services")
    .select(
      `
      id,
      provider_id,
      title,
      description,
      category,
      price,
      price_unit,
      location,
      district,
      gps_enabled,
      available_dates,
      equipment,
      specializations,
      created_at,
      updated_at,
      profiles:provider_id (
        id,
        business_name,
        name,
        email,
        phone,
        service_description
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching provider services:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// -------------------------------------------
// 🚚 DRIVER GPS TRACKING
// -------------------------------------------
export async function saveDriverLocation(locationData: {
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  battery_level?: number;
  recorded_at: string;
}) {
  const { error } = await supabase.from("driver_locations").insert([locationData]);

  if (error) {
    console.error("❌ Error saving driver location:", error.message);
    throw new Error(error.message);
  }
}

export function subscribeToDriverLocation(
  sessionId: string,
  onUpdate: (location: any) => void
) {
  return supabase
    .channel(`driver_location:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "driver_locations",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe();
}

// -------------------------------------------
// 💬 CHAT SYSTEM
// -------------------------------------------
export async function getOrCreateChatSession(farmerId: string, providerId: string) {
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("farmer_id", farmerId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (existing) return existing;

  const { data: newSession, error } = await supabase
    .from("chat_sessions")
    .insert([{ farmer_id: farmerId, provider_id: providerId }])
    .select()
    .single();

  if (error) throw error;

  return newSession;
}

export async function sendMessage(
  sessionId: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: string = "text",
  mediaUrl?: string
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([
      {
        session_id: sessionId,
        sender_id: senderId,
        receiver_id: receiverId,
        message_type: type,
        content,
        media_url: mediaUrl || null,
      },
    ])
    .select();

  if (error) {
    console.error("❌ Error sending message:", error.message);
    throw error;
  }

  return data;
}

export async function getChatMessages(sessionId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error fetching messages:", error.message);
    throw error;
  }

  return data;
}

export function subscribeToMessages(sessionId: string, callback: (msg: any) => void) {
  return supabase
    .channel(`chat_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

// -------------------------------------------
// 📅 BOOKINGS (direct client helper; still available if you need it)
// -------------------------------------------
export async function createBooking(bookingData: any) {
  const { data, error } = await supabase.from("bookings").insert([bookingData]).select().single();

  if (error) {
    console.error("❌ Error creating booking:", error.message);
    throw error;
  }

  return data;
}
