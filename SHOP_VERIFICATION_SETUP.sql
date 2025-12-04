-- ============================================
-- SHOP VERIFICATION SETUP
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to shops table for verification
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS credentials_url TEXT,
ADD COLUMN IF NOT EXISTS valid_id_url TEXT;

-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================
-- You need to create these storage buckets manually in Supabase Dashboard:
-- 
-- 1. Go to Storage in the left sidebar
-- 2. Click "New Bucket"
-- 3. Create these buckets:
--    - Name: shop-images (Public)
--    - Name: shop-documents (Private - for credentials/IDs)
--
-- For shop-images bucket (PUBLIC):
-- - Enable public access
--
-- For shop-documents bucket (PRIVATE):
-- - Keep private (only authenticated users can access)
-- ============================================

-- ============================================
-- STORAGE POLICIES (Run after creating buckets)
-- ============================================

-- Allow authenticated users to upload to shop-images
CREATE POLICY "Authenticated users can upload shop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

-- Allow public to view shop images
CREATE POLICY "Public can view shop images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow authenticated users to upload to shop-documents
CREATE POLICY "Authenticated users can upload shop documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-documents');

-- Allow users to view their own documents
CREATE POLICY "Users can view own shop documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'shop-documents' 
  AND (storage.foldername(name))[1] LIKE '%' || auth.uid()::text || '%'
);

-- Allow admins to view all shop documents
CREATE POLICY "Admins can view all shop documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'shop-documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- UPDATE SHOPS TABLE POLICIES (if not exists)
-- ============================================

-- Allow store owners to insert their shops
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shops' 
    AND policyname = 'Store owners can insert shops'
  ) THEN
    CREATE POLICY "Store owners can insert shops"
    ON shops FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = owner_id
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'store_owner'
      )
    );
  END IF;
END $$;

-- ============================================
-- DONE! 
-- ============================================
-- Remember to create the storage buckets manually:
-- 1. shop-images (Public)
-- 2. shop-documents (Private)
-- ============================================

