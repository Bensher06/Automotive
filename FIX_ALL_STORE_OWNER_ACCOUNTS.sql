-- ============================================
-- FIX ALL STORE OWNER ACCOUNTS
-- ============================================
-- This script will:
-- 1. Find all unconfirmed accounts
-- 2. Confirm them automatically
-- 3. Ensure profiles exist with correct role
-- ============================================

-- Step 1: Show all unconfirmed accounts
SELECT 
  '❌ UNCONFIRMED ACCOUNTS:' AS info,
  id,
  email,
  created_at,
  'Will be confirmed by this script' AS action
FROM auth.users
WHERE email_confirmed_at IS NULL;

-- Step 2: Confirm ALL unconfirmed accounts
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Step 3: Check specifically for benh19193@gmail.com
SELECT 
  'Account Status for benh19193@gmail.com:' AS info,
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED - Ready to login!'
    ELSE '❌ Still not confirmed'
  END AS status
FROM auth.users
WHERE email = 'benh19193@gmail.com';

-- Step 4: Ensure profile exists for this user
INSERT INTO profiles (id, email, role, needs_setup)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'store_owner'),
  true
FROM auth.users au
WHERE au.email = 'benh19193@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(EXCLUDED.role, profiles.role, 'store_owner');

-- Step 5: Verify profile
SELECT 
  'Profile Status for benh19193@gmail.com:' AS info,
  p.id,
  p.email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.role = 'store_owner' THEN '✅ Correct role'
    ELSE '⚠️ Role is: ' || COALESCE(p.role, 'NULL')
  END AS role_status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE au.email = 'benh19193@gmail.com';

-- Step 6: Final summary - all store owner accounts
SELECT 
  '📋 ALL STORE OWNER ACCOUNTS:' AS info,
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL AND p.role = 'store_owner' 
      THEN '✅ Ready to login as Store Owner'
    WHEN au.email_confirmed_at IS NOT NULL 
      THEN '⚠️ Confirmed but role is: ' || COALESCE(p.role, 'No profile')
    ELSE '❌ Not confirmed'
  END AS status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.role = 'store_owner' OR au.raw_user_meta_data->>'role' = 'store_owner'
ORDER BY au.created_at DESC;

-- ============================================
-- RESULTS:
-- ============================================
-- After running this:
-- 1. All accounts will be confirmed
-- 2. benh19193@gmail.com will have a profile with store_owner role
-- 3. You should be able to log in now!
-- 
-- If still failing, the password is wrong.
-- Reset password in Supabase Dashboard → Authentication → Users
-- ============================================

