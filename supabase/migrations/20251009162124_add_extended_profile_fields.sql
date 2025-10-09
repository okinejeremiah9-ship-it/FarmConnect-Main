/*
  # Extended Profile Fields

  1. New Columns Added to Users Table
    - `crop_types` (text array) - For farmers to list their crop types
    - `num_workers` (integer) - Number of workers on the farm (farmers)
    - `business_name` (text) - Business or provider name (providers)
    - `contact_person` (text) - Contact person name (providers)
    - `service_categories` (text array) - Service categories offered (providers)
    - `service_description` (text) - Detailed service description (providers)
    - `service_availability` (text) - Service availability schedule (providers)
    - `pricing_info` (text) - Pricing information (providers)
    - `equipment_list` (text array) - List of equipment (providers)
    - `years_experience` (integer) - Years of experience (providers)
    - `profile_completed` (boolean) - Whether profile has been completed
    
  2. Security
    - Users can update their own profile data
    - Public can read public profile information
    
  3. Notes
    - All new fields are optional to allow gradual profile completion
    - profile_completed flag helps track if user finished initial setup
*/

-- Add new profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS crop_types text[],
ADD COLUMN IF NOT EXISTS num_workers integer CHECK (num_workers >= 0),
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS service_categories text[],
ADD COLUMN IF NOT EXISTS service_description text,
ADD COLUMN IF NOT EXISTS service_availability text,
ADD COLUMN IF NOT EXISTS pricing_info text,
ADD COLUMN IF NOT EXISTS equipment_list text[],
ADD COLUMN IF NOT EXISTS years_experience integer CHECK (years_experience >= 0),
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Create index for profile completion status
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users (profile_completed);

-- Update policies (if they don't exist already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON users
      FOR UPDATE
      TO authenticated
      USING (id = (SELECT id FROM users WHERE id = auth.uid()))
      WITH CHECK (id = (SELECT id FROM users WHERE id = auth.uid()));
  END IF;
END $$;