/*
  # Add audio_url to disputes table

  ## Changes
  - Add `audio_url` column to disputes table for audio evidence
  - Allow NULL values as audio is optional
  
  ## Purpose
  - Enable users to submit audio recordings as dispute evidence
  - Store audio files in Supabase Storage and reference via URL
*/

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS audio_url text;

COMMENT ON COLUMN disputes.audio_url IS 'URL to audio recording evidence stored in Supabase Storage';
