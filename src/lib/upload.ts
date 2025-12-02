// src/lib/upload.ts
import { supabase } from "./supabase";

/**
 * NEW REQUIRED FORMAT (for Provider Completion Modal)
 * uploadFile(bucket, fullPath, file)
 *
 * This is the version you specifically asked for.
 */
export async function uploadFile(
  bucket: string,
  fullPath: string,
  file: File
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("❌ File upload failed:", err);
    throw err;
  }
}

/**
 * OLD GENERAL-PURPOSE UPLOAD FUNCTION
 * (Used by chat, audio uploads, etc.)
 * Kept intact to avoid breaking existing flows.
 */
export async function uploadUserFile(
  bucketName: string,
  userId: string,
  file: File
) {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("❌ File upload failed:", uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * COMPLETION IMAGES UPLOAD (Legacy support)
 * Now uses the new bucket name: completion_photos
 * Still preserved to avoid breaking older calls.
 */
export async function uploadCompletionImage(file: File, bookingId: string) {
  const filePath = `completion/${bookingId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("completion_photos")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("completion_photos")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload profile photos into profile-pictures/<userId>/<timestamp>.<ext>
 */
export async function uploadProfileImage(file: File, userId: string) {
  const ext = file.name.split(".").pop();
  const filePath = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // ✅ FIXED (was true)
    });

  if (uploadError) {
    console.error("❌ Profile upload failed:", uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
