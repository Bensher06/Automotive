-- ============================================
-- MANUALLY CONFIRM EXISTING USERS
-- ============================================
-- Run this in Supabase SQL Editor to confirm users who signed up
-- before email confirmation was disabled
-- ============================================

-- Option 1: Confirm a specific user by email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'evannfrancisco@gmail.com'
  AND email_confirmed_at IS NULL;

-- Option 2: Confirm ALL unconfirmed users (use with caution!)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- Verify the user is confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'evannfrancisco@gmail.com';

-- ============================================
-- After running this, try logging in again
-- ============================================

