-- ============================================
-- Add Vehicle Columns to Profiles Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add vehicle information columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_brand VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 'Vehicle columns added successfully!' AS status;

