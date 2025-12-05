-- ============================================
-- CHECK ACCOUNT STATUS FOR bentets35@gmail.com
-- ============================================
-- Run this to see if the account exists and is confirmed
-- ============================================

-- Step 1: Check if account exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED - Cannot login!'
    ELSE '✅ CONFIRMED - Should be able to login'
  END AS status
FROM auth.users
WHERE email = 'bentets35@gmail.com';

-- Step 2: Check if profile exists
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles
WHERE email = 'bentets35@gmail.com';

-- Step 3: If account exists but not confirmed, confirm it
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'bentets35@gmail.com'
  AND email_confirmed_at IS NULL;

-- Step 4: Verify account is now confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Account is CONFIRMED - Try logging in now!'
    ELSE '❌ Account still NOT CONFIRMED'
  END AS final_status
FROM auth.users
WHERE email = 'bentets35@gmail.com';

-- ============================================
-- RESULTS:
-- ============================================
-- If Step 1 shows NO ROWS:
--   → Account doesn't exist. You need to SIGN UP first.
--
-- If Step 1 shows account but status is "NOT CONFIRMED":
--   → Step 3 will confirm it. Then try logging in.
--
-- If Step 1 shows account and status is "CONFIRMED":
--   → Account exists and is confirmed. 
--   → Issue might be wrong password. Try resetting password or signing up again.
-- ============================================

