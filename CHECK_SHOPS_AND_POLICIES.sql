-- ============================================
-- CHECK SHOPS TABLE AND RLS POLICIES
-- ============================================
-- Run this to diagnose why verifications aren't showing
-- ============================================

-- Step 1: Check if there are any shops in the database
SELECT 
  'All Shops in Database:' AS info,
  id,
  name,
  owner_name,
  status,
  created_at
FROM shops
ORDER BY created_at DESC;

-- Step 2: Check pending shops specifically
SELECT 
  'Pending Shops (should appear in Verifications):' AS info,
  id,
  name,
  owner_name,
  owner_id,
  status
FROM shops
WHERE status = 'pending';

-- Step 3: Check RLS policies on shops table
SELECT 
  'RLS Policies on shops table:' AS info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'shops';

-- Step 4: Check if RLS is enabled on shops
SELECT 
  'RLS Status on shops:' AS info,
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'shops';

-- ============================================
-- IF NO SHOPS EXIST:
-- ============================================
-- You need to submit a shop verification first!
-- 1. Sign in as a store_owner
-- 2. Go to /shop-verification
-- 3. Fill out and submit the form
-- 4. Then check admin dashboard

-- ============================================
-- IF SHOPS EXIST BUT NOT SHOWING:
-- ============================================
-- The RLS policy might be blocking access.
-- Run the fix below to ensure admins can see all shops.

