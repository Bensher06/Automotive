-- ============================================
-- Create Mechanics Table for MotoZapp
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the mechanics table (for additional mechanic-specific data)
CREATE TABLE IF NOT EXISTS mechanics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  profile_image TEXT,
  specialties TEXT[], -- e.g., ['Engine Repair', 'Brake Service', 'Tire Change']
  experience VARCHAR(50), -- e.g., '5 years'
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  rating DECIMAL(2, 1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  hourly_rate DECIMAL(10, 2),
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view mechanics" ON mechanics;
DROP POLICY IF EXISTS "Mechanics can update their own data" ON mechanics;
DROP POLICY IF EXISTS "Mechanics can insert their own data" ON mechanics;

-- RLS Policies
CREATE POLICY "Anyone can view mechanics" ON mechanics
  FOR SELECT USING (true);

CREATE POLICY "Mechanics can update their own data" ON mechanics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Mechanics can insert their own data" ON mechanics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mechanics_status ON mechanics(status);
CREATE INDEX IF NOT EXISTS idx_mechanics_user_id ON mechanics(user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_mechanics_updated_at ON mechanics;
CREATE TRIGGER update_mechanics_updated_at
  BEFORE UPDATE ON mechanics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample mechanics for testing (with profile images)
INSERT INTO mechanics (name, phone, profile_image, specialties, experience, status, rating, reviews_count, latitude, longitude, address, hourly_rate, bio, verified)
VALUES 
  ('Juan Dela Cruz', '09123456789', 'https://randomuser.me/api/portraits/men/32.jpg', ARRAY['Engine Repair', 'Oil Change', 'Brake Service'], '8 years', 'available', 4.8, 127, 8.4778, 124.6474, 'Cagayan de Oro City', 350.00, 'Expert mechanic with years of experience in all types of motorcycle repairs.', true),
  ('Pedro Santos', '09187654321', 'https://randomuser.me/api/portraits/men/45.jpg', ARRAY['Tire Change', 'Electrical Systems', 'Tune-up'], '5 years', 'available', 4.6, 89, 8.4850, 124.6552, 'CDO Downtown', 300.00, 'Specializing in electrical issues and regular maintenance.', true),
  ('Marco Reyes', '09456789123', 'https://randomuser.me/api/portraits/men/67.jpg', ARRAY['Engine Overhaul', 'Transmission', 'Suspension'], '12 years', 'available', 4.9, 234, 8.4700, 124.6400, 'Lapasan, CDO', 400.00, 'Master mechanic with expertise in major repairs and overhauls.', true),
  ('Alex Rivera', '09321654987', 'https://randomuser.me/api/portraits/men/22.jpg', ARRAY['Quick Fixes', 'Battery Service', 'Chain Adjustment'], '3 years', 'busy', 4.5, 56, 8.4900, 124.6600, 'Bulua, CDO', 250.00, 'Fast and reliable service for quick fixes on the road.', true),
  ('Miguel Torres', '09654321789', 'https://randomuser.me/api/portraits/men/55.jpg', ARRAY['Carburetor', 'Fuel System', 'Ignition'], '7 years', 'available', 4.7, 112, 8.4650, 124.6350, 'Macasandig, CDO', 320.00, 'Fuel system specialist with a track record of solving complex issues.', true)
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'Mechanics table created successfully!' AS status;
SELECT COUNT(*) AS total_mechanics FROM mechanics;

