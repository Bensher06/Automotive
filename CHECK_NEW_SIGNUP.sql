-- ============================================
-- CHECK IF NEW SIGNUP WAS CREATED
-- ============================================
-- Run this to see if your new signup account exists
-- Replace 'YOUR_EMAIL@example.com' with your actual email
-- ============================================

-- Replace this with your email address
\set email 'bentets35@gmail.com'

-- Step 1: Check if account exists in auth.users
SELECT 
  'Auth Account Status:' AS info,
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED - Cannot login!'
    ELSE '✅ CONFIRMED - Should be able to login'
  END AS status
FROM auth.users
WHERE email = :'email';

-- Step 2: Check if profile exists
SELECT 
  'Profile Status:' AS info,
  id,
  email,
  role,
  full_name,
  created_at,
  CASE 
    WHEN role = 'store_owner' THEN '✅ Store Owner Role'
    ELSE '⚠️ Role: ' || role
  END AS role_status
FROM profiles
WHERE email = :'email';

-- Step 3: If account exists but not confirmed, confirm it
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = :'email'
  AND email_confirmed_at IS NULL;

-- Step 4: Verify final status
SELECT 
  'Final Status:' AS info,
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Account NOT CONFIRMED - Cannot login'
    WHEN p.role = 'store_owner' THEN '✅ Account CONFIRMED + Store Owner - Ready to login!'
    WHEN p.role IS NULL THEN '⚠️ Account confirmed but NO PROFILE - Profile might not be created yet'
    ELSE '✅ Account CONFIRMED - Role: ' || p.role
  END AS final_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = :'email';

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Replace 'bentets35@gmail.com' with your actual email
-- 2. Run this script
-- 3. Check the results:
--    - If "NOT CONFIRMED": Step 3 will confirm it automatically
--    - If "NO PROFILE": The profile trigger might have failed
--    - If everything is ✅: Account is ready, password might be wrong
-- ============================================

