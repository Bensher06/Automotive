-- ============================================
-- FIX ADMIN ACCESS TO SHOPS TABLE
-- ============================================
-- IMPORTANT: Hardcoded admin accounts bypass Supabase auth,
-- so auth.uid() is NULL for them. We need to allow anonymous
-- SELECT access for admin dashboard to work.
-- ============================================

-- Step 1: Drop existing shop policies
DROP POLICY IF EXISTS "Anyone can view verified shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can update their own shops" ON shops;
DROP POLICY IF EXISTS "Admins can view all shops" ON shops;
DROP POLICY IF EXISTS "Admins can update all shops" ON shops;
DROP POLICY IF EXISTS "Anyone can view all shops" ON shops;
DROP POLICY IF EXISTS "Enable read access for all shops" ON shops;

-- Step 2: Enable RLS on shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies

-- CRITICAL: Allow anonymous SELECT on all shops
-- This is needed because hardcoded admins don't have Supabase auth
CREATE POLICY "Enable read access for all shops" ON shops
  FOR SELECT
  USING (true);  -- Allow all SELECT operations

-- Shop owners can insert their own shops
CREATE POLICY "Shop owners can insert their own shops" ON shops
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Shop owners can update their own shops
CREATE POLICY "Shop owners can update their own shops" ON shops
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Allow anonymous UPDATE for admin operations
-- (Since admin is hardcoded, we need this for verify/reject)
CREATE POLICY "Allow shop status updates" ON shops
  FOR UPDATE
  USING (true);  -- Allow all UPDATE operations

-- Step 4: Verify policies
SELECT 
  '✅ Policies Created:' AS info,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'shops';

-- Step 5: Check current shops
SELECT 
  '📋 Current Shops:' AS info,
  id,
  name,
  owner_name,
  status,
  created_at
FROM shops
ORDER BY created_at DESC;

-- ============================================
-- After running this:
-- 1. Admin dashboard can fetch all shops
-- 2. Shop owners can still insert their own shops
-- 3. Status updates will work for verification
-- ============================================
