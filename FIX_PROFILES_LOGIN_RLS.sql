-- ============================================
-- FIX PROFILES TABLE RLS FOR LOGIN
-- Run this in Supabase SQL Editor
-- This ensures login queries work from profiles table
-- ============================================

-- Step 1: Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Allow public email check for login" ON profiles;
DROP POLICY IF EXISTS "Allow public profile read for login" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile insertion" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view customer profiles" ON profiles;

-- Step 2: Enable RLS (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create permissive SELECT policy for login
-- This allows anyone to query profiles by email+role for login
CREATE POLICY "Allow public profile read for login"
ON profiles
FOR SELECT
USING (true); -- Allow anyone to read profiles (needed for login authentication)

-- Step 4: Create INSERT policy for signup
CREATE POLICY "Allow profile insertion"
ON profiles
FOR INSERT
WITH CHECK (true); -- Allow anyone to insert profiles during signup

-- Step 5: Create UPDATE policy for profile updates
CREATE POLICY "Allow profile updates"
ON profiles
FOR UPDATE
USING (true) -- Allow update
WITH CHECK (true);

-- Step 6: Verify policies were created
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- TEST QUERY: Verify you can query profiles
-- ============================================
-- This should return results without errors
SELECT id, email, role, password IS NOT NULL as has_password
FROM profiles
WHERE email = 'benh19193@gmail.com' AND role = 'store_owner'
LIMIT 1;

-- ============================================
-- SUMMARY:
-- ✅ SELECT policy allows login queries
-- ✅ INSERT policy allows signup
-- ✅ UPDATE policy allows profile updates
-- ============================================

