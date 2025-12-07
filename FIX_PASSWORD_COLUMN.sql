-- ============================================
-- FIX PASSWORD COLUMN IN PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if password column exists
-- (Run this first to verify)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'password';

-- Step 2: Add password column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS password TEXT;

-- Step 3: Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- IMPORTANT: Check RLS Policies
-- ============================================

-- Check current RLS policies on profiles table
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- If the INSERT policy doesn't allow password, you may need to update it
-- The password field should be included in the insert

-- ============================================
-- Test: Check if password is being saved
-- ============================================

-- After signup, run this to check if password was saved:
-- SELECT id, email, password, role 
-- FROM profiles 
-- WHERE email = 'your-email@example.com';

-- Note: Passwords will be in plain text (as required for mobile app compatibility)

