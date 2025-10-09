/*
  # Create Reviews and Ratings System

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `reviewer_id` (uuid, references users)
      - `reviewee_id` (uuid, references users)
      - `booking_id` (uuid, references bookings)
      - `service_id` (uuid, references services)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for reviewers and reviewees to read/write reviews
    - Add constraints for rating values

  3. Functions
    - Function to update user average ratings
    - Trigger to automatically update ratings when reviews are added
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read reviews about them or by them"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can create reviews for completed bookings"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND status = 'completed'
      AND (farmer_id = auth.uid() OR provider_id = auth.uid())
    )
  );

-- Prevent duplicate reviews for the same booking
ALTER TABLE reviews ADD CONSTRAINT unique_review_per_booking_user 
  UNIQUE (booking_id, reviewer_id);

-- Function to update user ratings
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the reviewee's rating and review count
  UPDATE users 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating::numeric), 0)
      FROM reviews 
      WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
    )
  WHERE id = COALESCE(NEW.reviewee_id, OLD.reviewee_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings when reviews are added/updated/deleted
DROP TRIGGER IF EXISTS update_user_rating_trigger ON reviews;
CREATE TRIGGER update_user_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();