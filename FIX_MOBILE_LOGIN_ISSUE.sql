-- ============================================
-- FIX MOBILE APP USER LOGIN ISSUE
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: DIAGNOSE - Check how passwords are stored for mobile users
-- ============================================

-- See all users and their password status
SELECT 
    id,
    email,
    role,
    CASE 
        WHEN password IS NULL THEN '❌ NULL'
        WHEN password = '' THEN '❌ EMPTY'
        WHEN password LIKE '$2%' THEN '🔐 HASHED (bcrypt)'
        ELSE '✅ PLAIN TEXT'
    END as password_status,
    LENGTH(password) as password_length,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- STEP 2: Check if any users have NULL/empty passwords
-- ============================================

SELECT COUNT(*) as users_without_password
FROM profiles
WHERE password IS NULL OR password = '';

-- ============================================
-- STEP 3: FIX OPTIONS
-- ============================================

-- OPTION A: If mobile app uses bcrypt hashed passwords,
-- create a password verification function:

CREATE OR REPLACE FUNCTION verify_password(user_email TEXT, user_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_password TEXT;
BEGIN
    SELECT password INTO stored_password
    FROM profiles
    WHERE email = user_email;
    
    IF stored_password IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check for plain text match
    IF stored_password = user_password THEN
        RETURN TRUE;
    END IF;
    
    -- Check for bcrypt match (requires pgcrypto extension)
    IF stored_password LIKE '$2%' THEN
        RETURN stored_password = crypt(user_password, stored_password);
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pgcrypto extension (required for bcrypt comparison)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- OPTION B: If mobile users have no password stored,
-- you need to migrate them. Here's how to set a default
-- password or allow them to reset:
-- ============================================

-- See users without passwords
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE password IS NULL OR password = '';

-- ============================================
-- OPTION C: If you want to allow mobile users to login
-- with a temporary password (they can change later):
-- WARNING: Only use this for testing!
-- ============================================

-- Uncomment to set a temp password for users without passwords:
-- UPDATE profiles
-- SET password = 'temp123'
-- WHERE (password IS NULL OR password = '')
-- AND role = 'customer';

-- ============================================
-- STEP 4: VERIFY THE FIX
-- ============================================

-- After fixing, run this to verify:
SELECT 
    email,
    CASE 
        WHEN password IS NULL THEN '❌ NULL'
        WHEN password = '' THEN '❌ EMPTY'
        ELSE '✅ HAS PASSWORD'
    END as status,
    role
FROM profiles
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- COMMON ISSUES:
-- ============================================
-- 1. Mobile app doesn't save password to 'password' column
--    → Need to update mobile app to save password
--    
-- 2. Mobile app uses different column name
--    → Check: SELECT column_name FROM information_schema.columns 
--             WHERE table_name = 'profiles';
--    
-- 3. Mobile app hashes passwords differently
--    → Need to use same hashing algorithm
--    
-- 4. Passwords are stored in auth.users instead of profiles
--    → Mobile users need to use Supabase Auth

