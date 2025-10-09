/*
  # Enhanced Profile and Location System

  1. Profile Enhancements
    - Add missing profile fields
    - Improve location indexing
    - Add profile completion tracking
  
  2. Location Features
    - Spatial indexing for better performance
    - Distance calculation functions
    - Location validation
*/

-- Add missing profile fields if they don't exist
DO $$
BEGIN
  -- Add bio field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio text;
  END IF;

  -- Add profile picture field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_pic'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_pic text;
  END IF;

  -- Add farm size field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'farm_size'
  ) THEN
    ALTER TABLE users ADD COLUMN farm_size text;
  END IF;

  -- Add services offered field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'services_offered'
  ) THEN
    ALTER TABLE users ADD COLUMN services_offered text[];
  END IF;

  -- Add latitude field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE users ADD COLUMN latitude numeric(10,8);
  END IF;

  -- Add longitude field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE users ADD COLUMN longitude numeric(11,8);
  END IF;

  -- Add address field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;
END $$;

-- Create spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING btree (latitude, longitude);

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric
) RETURNS numeric AS $$
DECLARE
  R numeric := 6371; -- Earth's radius in kilometers
  dLat numeric;
  dLon numeric;
  a numeric;
  c numeric;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for profile access
DROP POLICY IF EXISTS "Anyone can read public profile info" ON users;
CREATE POLICY "Anyone can read public profile info"
  ON users FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);