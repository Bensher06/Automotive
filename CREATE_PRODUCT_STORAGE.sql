-- ============================================
-- CREATE STORAGE POLICIES FOR PRODUCT IMAGES
-- ============================================
-- Run this AFTER creating the product-images bucket manually
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their product images" ON storage.objects;

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own uploads
CREATE POLICY "Users can update their product images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their product images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- MANUAL STEPS:
-- ============================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: product-images
-- 4. Toggle "Public bucket" ON
-- 5. Click "Create bucket"
-- 6. Then run this SQL
-- ============================================

