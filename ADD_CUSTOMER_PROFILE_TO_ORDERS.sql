-- ============================================
-- ADD CUSTOMER PROFILE INFO TO ORDERS TABLE
-- Run this in Supabase SQL Editor
-- This adds customer profile image and ensures all customer data is saved
-- ============================================

-- Step 1: Add customer profile image column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_profile_image TEXT;

-- Step 2: Add customer phone column (if not exists)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Step 3: Ensure customer_name and customer_email exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Step 4: Add order_time column (explicit timestamp, though created_at already exists)
-- created_at is automatically set, but we can add a readable format column if needed
-- Actually, created_at already has the time, so we don't need a separate column

-- Step 5: Verify columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'orders'
AND column_name IN ('customer_name', 'customer_email', 'customer_profile_image', 'customer_phone', 'created_at')
ORDER BY column_name;

-- ============================================
-- NOTES:
-- - customer_name: Full name of customer/motorist
-- - customer_email: Email of customer
-- - customer_profile_image: Profile image URL
-- - customer_phone: Phone number
-- - created_at: Automatically set timestamp when order is created
-- ============================================

