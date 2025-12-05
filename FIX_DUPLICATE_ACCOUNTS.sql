-- ============================================
-- FIX DUPLICATE ACCOUNTS ISSUE
-- ============================================
-- You have multiple accounts with the same email
-- This script will help identify and fix the issue
-- ============================================

-- Step 1: Check all accounts with this email in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'role' AS role_in_metadata,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END AS confirmation_status
FROM auth.users
WHERE email = 'benh19193@gmail.com'
ORDER BY created_at DESC;

-- Step 2: Check all profiles with this email
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles
WHERE email = 'benh19193@gmail.com'
ORDER BY created_at DESC;

-- Step 3: Find which profile matches which auth user
SELECT 
  au.id AS auth_user_id,
  au.email,
  au.email_confirmed_at,
  p.id AS profile_id,
  p.role AS profile_role,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Cannot login'
    ELSE '✅ Can login'
  END AS can_login
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'benh19193@gmail.com'
ORDER BY au.created_at DESC;

-- ============================================
-- RECOMMENDATION:
-- ============================================
-- You should keep only ONE account. Here's what to do:
--
-- Option 1: Keep the store_owner account (recommended)
-- - Find the auth.users ID that matches the store_owner profile
-- - Confirm that auth user
-- - Delete the other duplicate accounts
--
-- Option 2: Keep the most recent account
-- - Confirm the most recent auth.users entry
-- - Delete older duplicates
-- ============================================

-- Step 4: Confirm the store_owner account (if you want to keep that one)
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual auth.users ID that matches the store_owner profile
-- You can find it by matching the profile ID with auth.users ID

-- First, let's see which auth user matches the store_owner profile
SELECT 
  'Use this auth.users ID to confirm:' AS instruction,
  au.id AS auth_user_id_to_confirm,
  au.email,
  p.role
FROM auth.users au
INNER JOIN profiles p ON au.id = p.id
WHERE au.email = 'benh19193@gmail.com'
  AND p.role = 'store_owner';

-- Step 5: Confirm the store_owner auth user (run this after Step 4 shows the ID)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE id = 'YOUR_AUTH_USER_ID_FROM_STEP_4'
--   AND email_confirmed_at IS NULL;

-- ============================================
-- TO DELETE DUPLICATE ACCOUNTS (use with caution):
-- ============================================
-- Only delete accounts you don't need. Be careful!
--
-- To delete a specific auth user and their profile:
-- DELETE FROM profiles WHERE id = 'UNWANTED_PROFILE_ID';
-- DELETE FROM auth.users WHERE id = 'UNWANTED_AUTH_USER_ID';
-- ============================================

