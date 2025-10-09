/*
  # Add Profile and Location Fields

  1. New Columns
    - Add profile fields to users table: bio, profile_pic, farm_size, services_offered
    - Add location coordinates: latitude, longitude
    - Add location string field for address

  2. Security
    - Update RLS policies to allow profile updates
    - Ensure users can only update their own profiles

  3. Indexes
    - Add spatial index for location-based queries
*/

-- Add profile and location fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS profile_pic text,
ADD COLUMN IF NOT EXISTS farm_size text,
ADD COLUMN IF NOT EXISTS services_offered text[],
ADD COLUMN IF NOT EXISTS latitude decimal(10, 8),
ADD COLUMN IF NOT EXISTS longitude decimal(11, 8),
ADD COLUMN IF NOT EXISTS address text;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users (latitude, longitude);

-- Update RLS policy to allow profile updates
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Add policy for public profile viewing
CREATE POLICY "Anyone can read public profile info"
  ON users
  FOR SELECT
  TO public
  USING (true);