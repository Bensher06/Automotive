-- ============================================
-- QUICK PASSWORD RESET CHECK
-- ============================================
-- This won't reset the password, but will help you understand the issue
-- ============================================

-- Check account details
SELECT 
  'Account Info:' AS info,
  id,
  email,
  email_confirmed_at,
  created_at,
  'Password cannot be viewed for security reasons' AS password_note
FROM auth.users
WHERE email = 'bentets35@gmail.com';

-- ============================================
-- TO RESET PASSWORD:
-- ============================================
-- You CANNOT reset password via SQL for security reasons.
-- You MUST use one of these methods:
--
-- Method 1: Supabase Dashboard
--   1. Go to Authentication → Users
--   2. Find bentets35@gmail.com
--   3. Click "Send password reset email"
--   4. Check email and reset password
--
-- Method 2: Delete and Recreate
--   1. Delete the account in Supabase Dashboard
--   2. Sign up again with same email, new password
--
-- Method 3: Use Supabase Auth API (if you have service role key)
--   This requires backend code - not recommended for frontend
-- ============================================

