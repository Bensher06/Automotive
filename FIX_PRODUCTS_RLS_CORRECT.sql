-- ============================================
-- FIX PRODUCTS TABLE RLS POLICIES (CORRECTED)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing policies on products table first
DROP POLICY IF EXISTS "Allow product viewing" ON products;
DROP POLICY IF EXISTS "Allow product insertion" ON products;
DROP POLICY IF EXISTS "Allow product updates" ON products;
DROP POLICY IF EXISTS "Allow product deletion" ON products;
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

-- Step 2: Create new policies (fresh start)
CREATE POLICY "Allow product viewing"
ON products FOR SELECT
USING (true);

CREATE POLICY "Allow product insertion"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow product updates"
ON products FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Allow product deletion"
ON products FOR DELETE
USING (true);

-- Step 3: Verify policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY policyname;

-- ============================================
-- You should see 4 policies:
-- 1. Allow product deletion
-- 2. Allow product insertion
-- 3. Allow product updates
-- 4. Allow product viewing
-- ============================================

