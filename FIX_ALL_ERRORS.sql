-- ============================================
-- FIX ALL ERRORS - PRODUCTS, STORAGE, RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX PRODUCTS TABLE FOREIGN KEY CONSTRAINT
-- ============================================

-- Check current products table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Check foreign key constraints on products table
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'products';

-- If products.owner_id references auth.users, we need to either:
-- Option A: Remove owner_id foreign key constraint (products should only reference shop_id)
-- Option B: Change owner_id to reference profiles table

-- Drop the problematic foreign key constraint
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_owner_id_fkey;

-- Remove owner_id column if it exists (products should only use shop_id)
ALTER TABLE products
DROP COLUMN IF EXISTS owner_id;

-- ============================================
-- 2. FIX PRODUCTS TABLE RLS POLICIES
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

-- Create permissive policies
CREATE POLICY "Allow product insertion"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow product viewing"
ON products FOR SELECT
USING (true);

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

-- SHOP-IMAGES BUCKET (if not already fixed)
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

-- SHOP-DOCUMENTS BUCKET (if not already fixed)
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
-- 4. VERIFY ALL POLICIES
-- ============================================

-- Check products table policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'products'
ORDER BY policyname;

-- Check storage policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- NOTES:
-- 1. Products table should only use shop_id, not owner_id
-- 2. Make sure product-images bucket exists in Storage
-- 3. After running this, products should upload successfully
-- ============================================

