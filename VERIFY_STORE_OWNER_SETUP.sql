-- ============================================
-- VERIFY STORE OWNER SETUP
-- ============================================
-- Run this in Supabase SQL Editor to verify everything is set up correctly
-- ============================================

-- 1. Check if shops table exists and has status column
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'shops' 
  AND column_name = 'status';

-- 2. Check if status column has the correct CHECK constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'shops'::regclass 
  AND contype = 'c'
  AND conname LIKE '%status%';

-- 3. Check if RLS is enabled on shops table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'shops';

-- 4. Check if all required policies exist
SELECT 
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'shops'
ORDER BY policyname;

-- 5. Check if notifications table exists
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 6. Check if notifications RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. shops.status should exist with type 'text' and default 'pending'
-- 2. Should have a CHECK constraint allowing ('pending', 'verified', 'suspended')
-- 3. shops.rowsecurity should be 't' (true)
-- 4. Should have these policies:
--    - "Anyone can view verified shops"
--    - "Shop owners can view their own shops" (IMPORTANT for login check!)
--    - "Shop owners can update their own shops"
--    - "Shop owners can insert their own shops"
--    - "Admins can view all shops"
--    - "Admins can update all shops"
-- 5. notifications table should exist with columns: id, user_id, title, message, type, read, created_at
-- 6. notifications.rowsecurity should be 't' (true)
-- ============================================

