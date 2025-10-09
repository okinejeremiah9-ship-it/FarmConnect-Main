/*
  # Escrow Wallet System for Agricultural Services Platform

  1. New Tables
    - `users` - User accounts (farmers, providers, admins)
    - `services` - Service listings by providers
    - `bookings` - Service booking requests
    - `escrow_wallet` - Escrow payment transactions
    - `notifications` - System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Secure escrow transaction handling

  3. Functions
    - Automatic notification triggers
    - Escrow status validation
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('farmer', 'provider', 'admin')),
  location text,
  rating decimal(3,2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  paystack_customer_code text,
  paystack_recipient_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('machinery', 'mechanic', 'extension', 'labour')),
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  price_unit text NOT NULL CHECK (price_unit IN ('hour', 'day', 'session', 'fixed')),
  availability text NOT NULL CHECK (availability IN ('available', 'busy', 'unavailable')),
  location text NOT NULL,
  district text,
  equipment text[],
  specializations text[],
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled')),
  scheduled_date timestamptz NOT NULL,
  duration integer NOT NULL, -- in hours
  total_price decimal(10,2) NOT NULL,
  service_location text NOT NULL,
  notes text,
  farmer_rating integer CHECK (farmer_rating >= 1 AND farmer_rating <= 5),
  provider_rating integer CHECK (provider_rating >= 1 AND provider_rating <= 5),
  farmer_review text,
  provider_review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Escrow wallet table
CREATE TABLE IF NOT EXISTS escrow_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  farmer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'completed', 'disputed', 'released', 'refunded')),
  paystack_reference text UNIQUE,
  paystack_transaction_id text,
  paystack_transfer_code text,
  dispute_reason text,
  dispute_details text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('booking', 'payment', 'dispute', 'system')),
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read public user info" ON users
  FOR SELECT USING (true);

-- RLS Policies for services
CREATE POLICY "Anyone can read services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Providers can manage own services" ON services
  FOR ALL USING (auth.uid() = provider_id);

-- RLS Policies for bookings
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = farmer_id OR auth.uid() = provider_id);

CREATE POLICY "Farmers can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Providers can update bookings" ON bookings
  FOR UPDATE USING (auth.uid() = provider_id);

-- RLS Policies for escrow_wallet
CREATE POLICY "Users can read own escrow transactions" ON escrow_wallet
  FOR SELECT USING (auth.uid() = farmer_id OR auth.uid() = provider_id);

CREATE POLICY "System can manage escrow" ON escrow_wallet
  FOR ALL USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(district);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_escrow_booking_id ON escrow_wallet(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_wallet(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for booking status changes
CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify farmer when booking is accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    PERFORM create_notification(
      NEW.farmer_id,
      'Booking Accepted',
      'Your service request has been accepted by the provider.',
      'booking',
      jsonb_build_object('booking_id', NEW.id)
    );
    
    -- Notify provider about escrow
    PERFORM create_notification(
      NEW.provider_id,
      'Escrow Secured',
      'Payment has been secured in escrow for your service.',
      'payment',
      jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  
  -- Notify admin when service is completed
  IF OLD.status = 'in-progress' AND NEW.status = 'completed' THEN
    -- Get admin users
    INSERT INTO notifications (user_id, title, message, type, metadata)
    SELECT 
      id,
      'Service Completed - Pending Release',
      'A service has been completed and is pending escrow release.',
      'system',
      jsonb_build_object('booking_id', NEW.id)
    FROM users 
    WHERE role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for escrow status changes
CREATE OR REPLACE FUNCTION handle_escrow_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when escrow is funded
  IF OLD.status = 'pending' AND NEW.status = 'funded' THEN
    PERFORM create_notification(
      NEW.provider_id,
      'Payment Secured',
      'Escrow payment has been secured for your service.',
      'payment',
      jsonb_build_object('escrow_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  -- Notify when dispute is raised
  IF OLD.status != 'disputed' AND NEW.status = 'disputed' THEN
    -- Notify provider
    PERFORM create_notification(
      NEW.provider_id,
      'Dispute Raised',
      'A dispute has been raised for your service. Please contact support.',
      'dispute',
      jsonb_build_object('escrow_id', NEW.id)
    );
    
    -- Notify admins
    INSERT INTO notifications (user_id, title, message, type, metadata)
    SELECT 
      id,
      'New Dispute',
      'A new dispute has been raised and requires attention.',
      'dispute',
      jsonb_build_object('escrow_id', NEW.id)
    FROM users 
    WHERE role = 'admin';
  END IF;
  
  -- Notify when funds are released
  IF OLD.status != 'released' AND NEW.status = 'released' THEN
    PERFORM create_notification(
      NEW.provider_id,
      'Payment Released',
      'Your payment has been released from escrow.',
      'payment',
      jsonb_build_object('escrow_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;
CREATE TRIGGER booking_status_change_trigger
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_status_change();

DROP TRIGGER IF EXISTS escrow_status_change_trigger ON escrow_wallet;
CREATE TRIGGER escrow_status_change_trigger
  AFTER UPDATE OF status ON escrow_wallet
  FOR EACH ROW
  EXECUTE FUNCTION handle_escrow_status_change();

-- Insert sample data
INSERT INTO users (id, name, email, phone, role, location) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Farmer', 'farmer@test.com', '+233123456789', 'farmer', 'Kumasi, Ashanti'),
  ('22222222-2222-2222-2222-222222222222', 'Jane Provider', 'provider@test.com', '+233987654321', 'provider', 'Accra, Greater Accra'),
  ('33333333-3333-3333-3333-333333333333', 'Admin User', 'admin@test.com', '+233555666777', 'admin', 'Accra, Greater Accra');

INSERT INTO services (id, provider_id, category, title, description, price, price_unit, availability, location, district) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'machinery', 'John Deere Tractor Rental', 'Modern 75HP tractor for land preparation', 150.00, 'day', 'available', 'Accra, Greater Accra', 'Accra');