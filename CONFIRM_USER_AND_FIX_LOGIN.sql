-- ============================================
-- CONFIRM USER AND FIX LOGIN ISSUE
-- ============================================
-- Run this to manually confirm your account so you can log in
-- ============================================

-- Step 1: Check if the user exists and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED - Cannot login'
    ELSE '✅ CONFIRMED - Can login'
  END AS status
FROM auth.users
WHERE email = 'benh19193@gmail.com';

-- Step 2: Manually confirm the user (if not confirmed)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'benh19193@gmail.com'
  AND email_confirmed_at IS NULL;

-- Step 3: Verify the user is now confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ User is now CONFIRMED - You can login!'
    ELSE '❌ User is still NOT CONFIRMED'
  END AS confirmation_status
FROM auth.users
WHERE email = 'benh19193@gmail.com';

-- Step 4: Check if profile exists
SELECT 
  id,
  email,
  role
FROM profiles
WHERE email = 'benh19193@gmail.com';

-- ============================================
-- AFTER RUNNING THIS:
-- ============================================
-- 1. Try logging in again - it should work now!
-- 2. If you want to disable email confirmation for future signups,
--    follow the instructions in DISABLE_EMAIL_VERIFICATION.md
-- ============================================

