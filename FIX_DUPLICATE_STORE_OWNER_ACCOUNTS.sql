-- ============================================
-- FIX DUPLICATE STORE_OWNER ACCOUNTS
-- Run this in Supabase SQL Editor
-- This will help you clean up duplicate accounts
-- ============================================

-- Step 1: See all store_owner accounts for this email
-- This shows which ones have passwords and when they were created
SELECT 
    id,
    email,
    role,
    full_name,
    password IS NOT NULL as has_password,
    CASE 
        WHEN password IS NULL THEN '❌ NO PASSWORD'
        WHEN password = '' THEN '❌ EMPTY PASSWORD'
        ELSE '✅ HAS PASSWORD'
    END as password_status,
    created_at,
    updated_at
FROM profiles
WHERE email = 'benh19193@gmail.com'
  AND role = 'store_owner'
ORDER BY created_at DESC;

-- Step 2: Identify which account to KEEP
-- Usually keep the MOST RECENT one with a password
-- Or the one with the most complete data

-- Step 3: DELETE duplicate store_owner accounts
-- ⚠️ WARNING: Only run this after you've identified which account to KEEP
-- Replace the IDs in the DELETE statement with the IDs you want to DELETE

-- Example: Delete all store_owner accounts EXCEPT the one you want to keep
-- Replace 'KEEP_THIS_ID' with the ID of the account you want to keep
/*
DELETE FROM profiles
WHERE email = 'benh19193@gmail.com'
  AND role = 'store_owner'
  AND id != 'KEEP_THIS_ID';  -- Keep this account, delete others
*/

-- OR: Delete only the one without password (if you want to keep the others)
-- Uncomment the line below and run it:
/*
DELETE FROM profiles
WHERE email = 'benh19193@gmail.com'
  AND role = 'store_owner'
  AND password IS NULL;
*/

-- Step 4: Verify only one store_owner account remains
SELECT 
    id,
    email,
    role,
    full_name,
    password IS NOT NULL as has_password,
    created_at
FROM profiles
WHERE email = 'benh19193@gmail.com'
  AND role = 'store_owner';

-- ============================================
-- RECOMMENDED APPROACH:
-- ============================================
-- 1. Run Step 1 to see all store_owner accounts
-- 2. Decide which one to KEEP (usually the most recent with password)
-- 3. Copy that account's ID
-- 4. Run Step 3 with the KEEP_THIS_ID replaced
-- 5. Run Step 4 to verify only one remains
-- ============================================

