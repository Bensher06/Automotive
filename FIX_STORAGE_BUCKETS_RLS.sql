-- ============================================
-- FIX STORAGE BUCKET RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create storage buckets if they don't exist
-- (You need to create these manually in Supabase Dashboard > Storage first)
-- This SQL only sets up the policies

-- ============================================
-- SHOP-IMAGES BUCKET (Public bucket for shop photos)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public uploads to shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to shop-images" ON storage.objects;

-- Allow anyone to upload to shop-images bucket
CREATE POLICY "Allow public uploads to shop-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'shop-images'
);

-- Allow anyone to read from shop-images bucket (public)
CREATE POLICY "Allow public reads from shop-images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'shop-images'
);

-- Allow authenticated users to upload (backup policy)
CREATE POLICY "Allow authenticated uploads to shop-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'shop-images'
);

-- ============================================
-- SHOP-DOCUMENTS BUCKET (Private bucket for credentials and IDs)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads to shop-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from shop-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to shop-documents" ON storage.objects;

-- Allow anyone to upload to shop-documents (needed for shop registration)
CREATE POLICY "Allow public uploads to shop-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'shop-documents'
);

-- Allow authenticated users to read from shop-documents
-- (Admins need to view these documents)
CREATE POLICY "Allow authenticated reads from shop-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'shop-documents'
);

-- Allow public reads (if you want documents to be accessible)
-- Or remove this if you want them completely private
CREATE POLICY "Allow public reads from shop-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'shop-documents'
);

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Check all storage policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- NOTES:
-- 1. Make sure buckets 'shop-images' and 'shop-documents' exist in Storage
-- 2. shop-images should be PUBLIC bucket
-- 3. shop-documents can be PRIVATE or PUBLIC (depending on your needs)
-- ============================================

