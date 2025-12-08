-- ============================================
-- FIND ALL USER/ACCOUNT TABLES IN DATABASE
-- Run this in Supabase SQL Editor to discover
-- where mobile app users are stored
-- ============================================

-- STEP 1: List ALL tables in the public schema
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- STEP 2: Find tables that might contain user data
-- Looking for tables with email, password, or user-related columns
-- ============================================

SELECT DISTINCT 
    c.table_name,
    c.column_name,
    c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
AND (
    c.column_name ILIKE '%email%' OR
    c.column_name ILIKE '%password%' OR
    c.column_name ILIKE '%user%' OR
    c.column_name ILIKE '%name%' OR
    c.column_name ILIKE '%phone%' OR
    c.column_name ILIKE '%role%'
)
ORDER BY c.table_name, c.column_name;

-- ============================================
-- STEP 3: Check auth.users table (Supabase built-in)
-- ============================================

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 4: Check profiles table
-- ============================================

SELECT 
    id,
    email,
    full_name,
    role,
    password IS NOT NULL as has_password,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 5: Look for a separate "users" table
-- ============================================

-- Check if there's a "users" table
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
) as users_table_exists;

-- If users table exists, show its structure and data
-- (Uncomment if needed)
-- SELECT * FROM users LIMIT 10;

-- ============================================
-- STEP 6: Look for "riders" or "customers" table
-- ============================================

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'riders'
) as riders_table_exists;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'customers'
) as customers_table_exists;

-- ============================================
-- STEP 7: Find ALL rows with a specific email
-- Replace 'benh19193@gmail.com' with the test email
-- ============================================

-- Search in profiles
SELECT 'profiles' as source_table, id, email, role, created_at
FROM profiles
WHERE email = 'benh19193@gmail.com';

-- Search in auth.users
SELECT 'auth.users' as source_table, id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'benh19193@gmail.com';

-- ============================================
-- STEP 8: Compare profiles vs auth.users
-- Find users that exist in one but not the other
-- ============================================

-- Users in auth.users but NOT in profiles
SELECT 
    'In auth.users but NOT in profiles' as status,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Users in profiles but NOT in auth.users  
SELECT 
    'In profiles but NOT in auth.users' as status,
    p.id,
    p.email,
    p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- ============================================
-- SUMMARY: This will help identify where mobile
-- app users are stored vs where web expects them
-- ============================================

