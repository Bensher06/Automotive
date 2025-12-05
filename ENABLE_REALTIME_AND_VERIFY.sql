-- ============================================
-- ENABLE REALTIME AND VERIFY SETUP
-- ============================================
-- Run this to ensure real-time updates work for admin dashboard
-- ============================================

-- ============================================
-- STEP 1: ENABLE REALTIME REPLICATION FOR SHOPS TABLE
-- ============================================
-- This allows the admin dashboard to receive real-time updates
-- when new shop verifications are submitted

-- Enable replication for shops table (required for real-time)
-- This will only add it if it's not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'shops'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shops;
  END IF;
END $$;

-- Verify replication is enabled
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'shops'
    ) THEN '✅ Realtime replication is ENABLED for shops table'
    ELSE '❌ Realtime replication is NOT enabled for shops table'
  END AS replication_status;

-- ============================================
-- STEP 2: VERIFY NOTIFICATIONS TABLE EXISTS
-- ============================================

-- Check if notifications table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: VERIFY ADMIN PROFILES CAN RECEIVE NOTIFICATIONS
-- ============================================

-- Check if there are any admin users
SELECT 
  id,
  email,
  role
FROM profiles
WHERE role = 'admin';

-- ============================================
-- STEP 4: VERIFY NOTIFICATION POLICIES
-- ============================================

-- Check notification policies
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- STEP 5: TEST REALTIME SETUP
-- ============================================
-- After running this, check Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Make sure "shops" table is listed and enabled
-- ============================================

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. Real-time requires Supabase Realtime to be enabled
--    - Go to Project Settings > API
--    - Make sure "Realtime" is enabled
--
-- 2. If you get an error about publication, it might already be enabled
--    - That's fine, just continue
--
-- 3. Make sure you have at least one admin user in the profiles table
--    - If no admins exist, create one manually or sign up as admin
-- ============================================

