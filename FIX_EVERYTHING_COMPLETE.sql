-- ============================================
-- COMPLETE FIX - ALL ISSUES IN ONE SQL SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX PRODUCTS TABLE - Remove owner_id
-- ============================================

-- Remove the foreign key constraint
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_owner_id_fkey;

-- Remove owner_id column (products should only use shop_id)
ALTER TABLE products
DROP COLUMN IF EXISTS owner_id;

-- ============================================
-- 2. FIX PRODUCTS TABLE RLS POLICIES
-- ============================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow product viewing" ON products;
DROP POLICY IF EXISTS "Allow product insertion" ON products;
DROP POLICY IF EXISTS "Allow product updates" ON products;
DROP POLICY IF EXISTS "Allow product deletion" ON products;
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

-- Create new policies
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

-- ============================================
-- 3. FIX STORAGE BUCKET RLS POLICIES
-- ============================================

-- PRODUCT-IMAGES BUCKET
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from product-images" ON storage.objects;

CREATE POLICY "Allow public uploads to product-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads from product-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- SHOP-IMAGES BUCKET
DROP POLICY IF EXISTS "Allow public uploads to shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from shop-images" ON storage.objects;

CREATE POLICY "Allow public uploads to shop-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "Allow public reads from shop-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shop-images');

-- SHOP-DOCUMENTS BUCKET
DROP POLICY IF EXISTS "Allow public uploads to shop-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from shop-documents" ON storage.objects;

CREATE POLICY "Allow public uploads to shop-documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'shop-documents');

CREATE POLICY "Allow public reads from shop-documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shop-documents');

-- ============================================
-- VERIFY ALL POLICIES
-- ============================================

-- Check products table policies
SELECT 'PRODUCTS POLICIES:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY policyname;

-- Check storage policies
SELECT 'STORAGE POLICIES:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- NOTES:
-- 1. Products table now only uses shop_id (no owner_id)
-- 2. All RLS policies are permissive to allow operations
-- 3. Storage buckets allow public uploads/reads
-- 4. After running this, products should upload and display correctly
-- ============================================

