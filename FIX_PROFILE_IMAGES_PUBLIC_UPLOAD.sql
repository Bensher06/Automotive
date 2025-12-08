-- ============================================
-- FIX PROFILE-IMAGES STORAGE FOR PUBLIC UPLOADS
-- Run this in Supabase SQL Editor
-- Since you're using profiles table auth (not Supabase Auth),
-- we need public upload policies
-- ============================================

-- Step 1: Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Allow users to upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Step 2: Create public upload policy (since bucket is PUBLIC)
CREATE POLICY "Allow public uploads to profile-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Step 3: Allow public reads (already should work since bucket is PUBLIC, but ensure it)
CREATE POLICY "Allow public reads from profile-images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-images'
);

-- Step 4: Allow public updates (for upsert functionality)
CREATE POLICY "Allow public updates to profile-images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Step 5: Allow public deletes (so users can remove their images)
CREATE POLICY "Allow public deletes to profile-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-images'
);

-- ============================================
-- Verify policies were created
-- ============================================

SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%profile%'
ORDER BY policyname;

-- ============================================
-- NOTE: These are PUBLIC policies, meaning anyone can upload.
-- Since your bucket is already PUBLIC, this is the simplest solution.
-- For better security later, consider:
-- 1. Creating Supabase Auth sessions when users log in
-- 2. Using authenticated policies instead
-- ============================================

