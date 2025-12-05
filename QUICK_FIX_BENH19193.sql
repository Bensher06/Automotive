-- ============================================
-- QUICK FIX FOR benh19193@gmail.com
-- ============================================
-- Run this ONCE to fix the login issue
-- ============================================

-- Step 1: Confirm the account (allow login)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'benh19193@gmail.com'
  AND email_confirmed_at IS NULL;

-- Step 2: Ensure profile exists with store_owner role
INSERT INTO profiles (id, email, role, needs_setup)
SELECT 
  id,
  email,
  'store_owner',
  true
FROM auth.users
WHERE email = 'benh19193@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'store_owner';

-- Step 3: Verify the fix
SELECT 
  '✅ FIXED! Account status:' AS info,
  au.id,
  au.email,
  au.email_confirmed_at,
  p.role,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL AND p.role = 'store_owner' 
      THEN '✅ Ready to login as Store Owner!'
    ELSE '❌ Something went wrong'
  END AS status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'benh19193@gmail.com';

-- ============================================
-- After running this, try logging in again!
-- ============================================

