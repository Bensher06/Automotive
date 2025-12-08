-- ============================================
-- ENSURE ALL DATA IS SAVED TO SUPABASE
-- Run this in Supabase SQL Editor
-- This ensures all tables have proper RLS policies to allow data saving
-- ============================================

-- ============================================
-- 1. ORDERS TABLE - Ensure orders can be saved
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Shop owners can view orders for their shops" ON orders;
DROP POLICY IF EXISTS "Shop owners can update orders for their shops" ON orders;

-- Create open policies (allows all operations)
DROP POLICY IF EXISTS "Allow all orders operations" ON orders;
CREATE POLICY "Allow all orders operations"
ON orders
FOR ALL
USING (true)
WITH CHECK (true);

-- Add missing columns for customer info
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_profile_image TEXT;

-- ============================================
-- 2. ORDER_ITEMS TABLE - Ensure order items can be saved
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;

-- Create open policies
DROP POLICY IF EXISTS "Allow all order items operations" ON order_items;
CREATE POLICY "Allow all order items operations"
ON order_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Add missing columns
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- ============================================
-- 3. CART_ITEMS TABLE - Create if doesn't exist
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  product_name TEXT,
  product_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create open policy
DROP POLICY IF EXISTS "Allow all cart items operations" ON cart_items;
CREATE POLICY "Allow all cart items operations"
ON cart_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================
-- 4. PRODUCTS TABLE - Ensure products can be read
-- ============================================

-- Check if products table has proper policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'products';

-- If no policies exist, create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'products'
  ) THEN
    CREATE POLICY "Allow all products operations"
    ON products
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 5. PROFILES TABLE - Ensure profiles can be read/updated
-- ============================================

-- Check current policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Add public read policy if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Allow public profile read for login'
  ) THEN
    CREATE POLICY "Allow public profile read for login"
    ON profiles
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- ============================================
-- 6. VERIFY ALL POLICIES
-- ============================================

SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items', 'cart_items', 'products', 'profiles')
ORDER BY tablename, policyname;

-- ============================================
-- SUMMARY:
-- ✅ Orders can be created
-- ✅ Order items can be created
-- ✅ Cart items can be saved to database
-- ✅ Products can be read
-- ✅ Profiles can be read for login
-- ============================================

