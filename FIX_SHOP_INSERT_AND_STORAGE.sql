-- ============================================
-- FIX SHOP INSERT AND STORAGE POLICIES
-- ============================================
-- Run this to fix RLS errors when submitting shop verification
-- ============================================

-- ============================================
-- STEP 1: FIX SHOPS TABLE INSERT POLICY
-- ============================================

-- Drop the existing INSERT policy (might be too restrictive)
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON shops;
DROP POLICY IF EXISTS "Store owners can insert shops" ON shops;
DROP POLICY IF EXISTS "Owners can insert own shop" ON shops;

-- Create a proper INSERT policy that checks:
-- 1. User is authenticated
-- 2. owner_id matches the authenticated user
-- 3. User has store_owner role in profiles
CREATE POLICY "Shop owners can insert their own shops"
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

-- ============================================
-- STEP 2: ADD MISSING COLUMNS TO SHOPS TABLE
-- ============================================

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS credentials_url TEXT,
ADD COLUMN IF NOT EXISTS valid_id_url TEXT;

-- ============================================
-- STEP 3: CREATE STORAGE POLICIES
-- ============================================
-- Note: You still need to CREATE THE BUCKETS manually in Supabase Dashboard
-- Go to Storage > New Bucket and create:
-- 1. shop-images (Public)
-- 2. shop-documents (Private)

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload shop images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload shop documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own shop documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all shop documents" ON storage.objects;

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

-- Allow users to view their own documents (by checking filename contains their user ID)
CREATE POLICY "Users can view own shop documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'shop-documents'
    AND (
      name LIKE '%' || auth.uid()::text || '%'
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
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
-- STEP 4: VERIFY POLICIES WERE CREATED
-- ============================================

-- Check shops policies
SELECT 
  'shops' AS table_name,
  policyname,
  cmd AS command
FROM pg_policies 
WHERE tablename = 'shops'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Check storage policies
SELECT 
  'storage.objects' AS table_name,
  policyname,
  cmd AS command
FROM pg_policies 
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname LIKE '%shop%' OR policyname LIKE '%image%' OR policyname LIKE '%document%')
ORDER BY policyname;

-- ============================================
-- IMPORTANT: CREATE STORAGE BUCKETS MANUALLY
-- ============================================
-- After running this SQL, you MUST:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Create bucket: "shop-images" (set as PUBLIC)
-- 4. Create bucket: "shop-documents" (set as PRIVATE)
-- ============================================

