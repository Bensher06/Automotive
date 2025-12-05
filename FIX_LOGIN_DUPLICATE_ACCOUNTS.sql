-- ============================================
-- FIX LOGIN: CONFIRM STORE_OWNER ACCOUNT
-- ============================================
-- You have duplicate accounts. This will confirm the store_owner account
-- ============================================

-- Step 1: Find the store_owner account's auth.users ID
SELECT 
  'Store Owner Account Info:' AS info,
  au.id AS auth_user_id,
  au.email,
  au.email_confirmed_at,
  p.role,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED - This is why you cannot login!'
    ELSE '✅ CONFIRMED'
  END AS status
FROM auth.users au
INNER JOIN profiles p ON au.id = p.id
WHERE au.email = 'benh19193@gmail.com'
  AND p.role = 'store_owner';

-- Step 2: Confirm ALL accounts with this email (to fix login)
-- This will allow you to login with any of them
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'benh19193@gmail.com'
  AND email_confirmed_at IS NULL;

-- Step 3: Verify all accounts are now confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED - Can login!'
    ELSE '❌ NOT CONFIRMED'
  END AS status
FROM auth.users
WHERE email = 'benh19193@gmail.com';

-- ============================================
-- AFTER RUNNING THIS:
-- ============================================
-- 1. Try logging in again - it should work now!
-- 2. Use the store_owner account when logging in
-- 3. The password should be the one you used when signing up as store_owner
-- ============================================

