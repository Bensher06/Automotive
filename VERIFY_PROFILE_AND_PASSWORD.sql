-- ============================================
-- VERIFY PROFILE AND CHECK PASSWORD ISSUE
-- ============================================
-- Account is confirmed, but login still fails
-- Let's check the profile and see what's wrong
-- ============================================

-- Step 1: Check the profile for this account
SELECT 
  p.id,
  p.email,
  p.role,
  au.email_confirmed_at,
  au.created_at AS account_created,
  p.created_at AS profile_created,
  CASE 
    WHEN p.role = 'store_owner' THEN '✅ Correct role for store owner login'
    ELSE '⚠️ Role is: ' || p.role || ' (might need to be store_owner)'
  END AS role_status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.email = 'bentets35@gmail.com';

-- Step 2: Check ALL accounts with this email (in case there are duplicates)
SELECT 
  'All accounts with this email:' AS info,
  au.id AS auth_user_id,
  au.email,
  au.email_confirmed_at,
  p.id AS profile_id,
  p.role,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Not confirmed'
    WHEN p.role = 'store_owner' THEN '✅ Confirmed + Store Owner - Should work!'
    ELSE '⚠️ Confirmed but role is: ' || COALESCE(p.role, 'NULL')
  END AS status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'bentets35@gmail.com'
ORDER BY au.created_at DESC;

-- ============================================
-- TROUBLESHOOTING:
-- ============================================
-- If profile role is NOT 'store_owner':
--   → Update it: UPDATE profiles SET role = 'store_owner' WHERE email = 'bentets35@gmail.com';
--
-- If password is wrong:
--   → You need to either:
--     1. Reset password in Supabase Dashboard → Authentication → Users
--     2. Or sign up again with a new password
--     3. Or delete the account and create a new one
-- ============================================

