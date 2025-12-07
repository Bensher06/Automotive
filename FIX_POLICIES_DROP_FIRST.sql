-- ============================================
-- FIX: Drop Existing Policies First
-- Run this to fix the "policy already exists" error
-- ============================================

-- Drop ALL existing products table policies first
DROP POLICY IF EXISTS "Allow product viewing" ON products;
DROP POLICY IF EXISTS "Allow product insertion" ON products;
DROP POLICY IF EXISTS "Allow product updates" ON products;
DROP POLICY IF EXISTS "Allow product deletion" ON products;
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

-- Now create the policies fresh
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

-- Verify they were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY policyname;

