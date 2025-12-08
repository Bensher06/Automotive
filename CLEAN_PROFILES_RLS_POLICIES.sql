-- ============================================
-- CLEAN UP PROFILES TABLE RLS POLICIES
-- Run this in Supabase SQL Editor
-- Removes all conflicting policies and creates clean ones
-- ============================================

-- Step 1: Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile insertion" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON profiles;
DROP POLICY IF EXISTS "Allow public profile read for login" ON profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "public_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "public_select_profiles" ON profiles;
DROP POLICY IF EXISTS "public_update_profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public email check for login" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view customer profiles" ON profiles;

-- Step 2: Enable RLS (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SINGLE permissive SELECT policy for login
-- This allows anyone to query profiles by email+role for login
CREATE POLICY "profiles_select_all"
ON profiles
FOR SELECT
USING (true);

-- Step 4: Create SINGLE permissive INSERT policy for signup
CREATE POLICY "profiles_insert_all"
ON profiles
FOR INSERT
WITH CHECK (true);

-- Step 5: Create SINGLE permissive UPDATE policy for profile updates
CREATE POLICY "profiles_update_all"
ON profiles
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Step 6: Verify only 3 policies exist now
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- TEST QUERY: Verify login query works
-- ============================================
-- This should return results without errors
SELECT id, email, role, password IS NOT NULL as has_password
FROM profiles
WHERE email = 'benh19193@gmail.com' AND role = 'store_owner'
LIMIT 1;

-- ============================================
-- SUMMARY:
-- ✅ Only 3 clean policies (SELECT, INSERT, UPDATE)
-- ✅ All policies are permissive (allow all operations)
-- ✅ Login queries will now work
-- ============================================

