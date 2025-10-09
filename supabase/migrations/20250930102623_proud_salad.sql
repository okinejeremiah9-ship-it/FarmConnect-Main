/*
  # Update Authentication System for OTP Verification

  1. New Tables
    - Update `users` table with OTP fields
    - Add `admin_invites` table for secure admin registration
  
  2. Security
    - Enable RLS on all tables
    - Add policies for user management
    - Add OTP verification policies

  3. Functions
    - Add OTP generation and verification functions
    - Add admin invite token generation
*/

-- Update users table with OTP fields
DO $$
BEGIN
  -- Add OTP fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'otp_code'
  ) THEN
    ALTER TABLE users ADD COLUMN otp_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'otp_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN otp_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'otp_attempts'
  ) THEN
    ALTER TABLE users ADD COLUMN otp_attempts integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Create admin invites table
CREATE TABLE IF NOT EXISTS admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- Admin invites policies
CREATE POLICY "Admins can create invites"
  ON admin_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view invites"
  ON admin_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view valid unused invites"
  ON admin_invites
  FOR SELECT
  TO public
  USING (
    NOT is_used AND expires_at > now()
  );

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_user_otp(user_phone text, provided_otp text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  user_record users%ROWTYPE;
  result json;
BEGIN
  -- Get user record
  SELECT * INTO user_record
  FROM users
  WHERE phone = user_phone;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if already verified
  IF user_record.is_verified THEN
    RETURN json_build_object('success', false, 'error', 'User already verified');
  END IF;

  -- Check attempts limit
  IF user_record.otp_attempts >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'Too many attempts. Please request a new OTP.');
  END IF;

  -- Check if OTP expired
  IF user_record.otp_expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'OTP expired. Please request a new one.');
  END IF;

  -- Check OTP match
  IF user_record.otp_code != provided_otp THEN
    -- Increment attempts
    UPDATE users 
    SET otp_attempts = otp_attempts + 1
    WHERE phone = user_phone;
    
    RETURN json_build_object('success', false, 'error', 'Invalid OTP');
  END IF;

  -- OTP is valid, verify user
  UPDATE users
  SET 
    is_verified = true,
    otp_code = NULL,
    otp_expires_at = NULL,
    otp_attempts = 0
  WHERE phone = user_phone;

  RETURN json_build_object('success', true, 'message', 'User verified successfully');
END;
$$;

-- Function to generate admin invite token
CREATE OR REPLACE FUNCTION generate_admin_invite_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;