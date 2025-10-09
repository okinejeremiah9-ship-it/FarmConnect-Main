/*
  # Add Wallets, Messages, and Disputes Tables

  ## New Tables
  
  ### `wallets`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `balance` (numeric, default 0.00) - simulated wallet balance
  - `total_earned` (numeric, default 0.00)
  - `total_spent` (numeric, default 0.00)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `messages`
  - `id` (uuid, primary key)
  - `booking_id` (uuid, foreign key to bookings)
  - `sender_id` (uuid, foreign key to users)
  - `receiver_id` (uuid, foreign key to users)
  - `message_type` (text) - 'text', 'audio', 'image'
  - `content` (text) - message text or null for media
  - `media_url` (text) - URL for audio/image files
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz)
  
  ### `disputes`
  - `id` (uuid, primary key)
  - `escrow_id` (uuid, foreign key to escrow_wallet)
  - `raised_by` (uuid, foreign key to users)
  - `reason` (text)
  - `details` (text)
  - `status` (text) - 'open', 'investigating', 'resolved'
  - `resolution` (text)
  - `resolved_by` (uuid, foreign key to users - admin)
  - `resolved_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Add appropriate policies for each table
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  balance numeric DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  total_earned numeric DEFAULT 0.00 NOT NULL,
  total_spent numeric DEFAULT 0.00 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('text', 'audio', 'image')),
  content text,
  media_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid REFERENCES escrow_wallet(id) ON DELETE CASCADE NOT NULL,
  raised_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  resolution text,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Wallets policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wallet balance"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = receiver_id::text)
  WITH CHECK (auth.uid()::text = receiver_id::text);

-- Disputes policies
CREATE POLICY "Users can view disputes they are involved in"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escrow_wallet
      WHERE escrow_wallet.id = disputes.escrow_id
      AND (escrow_wallet.farmer_id = auth.uid() OR escrow_wallet.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes for their escrow"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escrow_wallet
      WHERE escrow_wallet.id = escrow_id
      AND (escrow_wallet.farmer_id = auth.uid() OR escrow_wallet.provider_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow_id ON disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Create updated_at trigger for wallets
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallets_timestamp
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();
