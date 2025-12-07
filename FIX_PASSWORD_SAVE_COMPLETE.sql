-- ============================================
-- COMPLETE FIX FOR PASSWORD NOT SAVING
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add password column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS password TEXT;

-- Step 2: Verify column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'password';

-- Step 3: Check current RLS policies (should allow INSERT with password)
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Step 4: Update INSERT policy if needed to ensure password is allowed
-- Drop existing INSERT policy if it's too restrictive
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public email check for login" ON profiles;

-- Create new permissive INSERT policy
CREATE POLICY "Allow profile insertion"
ON profiles
FOR INSERT
WITH CHECK (true);

-- Step 5: Ensure SELECT policy allows reading password (for login)
-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Allow public email check for login" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;

-- Create new SELECT policy that allows checking email/password for login
CREATE POLICY "Allow public profile read for login"
ON profiles
FOR SELECT
USING (true); -- Allow anyone to read profiles (needed for login)

-- Step 6: Verify policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- TEST: After running this, try signing up again
-- Then check if password was saved:
-- ============================================

-- SELECT id, email, password, role, full_name 
-- FROM profiles 
-- WHERE email = 'test@example.com';

-- If password is NULL, there's still an issue
-- If password has a value, it's working! ✅

