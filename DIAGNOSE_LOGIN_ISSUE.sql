-- ============================================
-- DIAGNOSE LOGIN ISSUE
-- Run this in Supabase SQL Editor
-- This will help identify why login is failing
-- ============================================

-- Step 1: Check for duplicate emails with different roles
SELECT 
    email,
    COUNT(*) as account_count,
    STRING_AGG(role, ', ') as roles,
    STRING_AGG(id::text, ', ') as profile_ids
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY account_count DESC;

-- Step 2: Check for duplicate emails with SAME role (this is a problem!)
SELECT 
    email,
    role,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as profile_ids
FROM profiles
GROUP BY email, role
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Check specific email (replace with your email)
-- Replace 'benh19193@gmail.com' with the email you're trying to log in with
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
    created_at
FROM profiles
WHERE email = 'benh19193@gmail.com'  -- CHANGE THIS TO YOUR EMAIL
ORDER BY role, created_at DESC;

-- Step 4: Test login query (replace with your email and role)
-- This simulates what the login code does
SELECT 
    id,
    email,
    role,
    password IS NOT NULL as has_password,
    full_name
FROM profiles
WHERE email = 'benh19193@gmail.com'  -- CHANGE THIS
  AND role = 'store_owner'  -- CHANGE THIS: 'store_owner' or 'customer'
LIMIT 2;

-- ============================================
-- WHAT TO LOOK FOR:
-- ============================================
-- 1. If Step 1 shows results: You have duplicate emails with different roles (this is OK)
-- 2. If Step 2 shows results: You have duplicate emails with SAME role (this is BAD - need to delete duplicates)
-- 3. If Step 3 shows no password: That's why login fails - password wasn't saved during signup
-- 4. If Step 4 returns 0 rows: No account exists with that email+role combination
-- 5. If Step 4 returns 2+ rows: Multiple accounts with same email+role (need to delete duplicates)
-- ============================================

