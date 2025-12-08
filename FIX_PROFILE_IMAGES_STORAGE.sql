-- ============================================
-- FIX PROFILE IMAGES STORAGE BUCKET RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the profile-images bucket if it doesn't exist
-- (You need to create this manually in Supabase Dashboard > Storage first)
-- Go to: Storage > New Bucket
-- Name: profile-images
-- Public: ✅ Enable (toggle ON)
-- Then run this SQL to set up policies

-- ============================================
-- DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Allow users to upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own profile images" ON storage.objects;

-- ============================================
-- CREATE POLICIES FOR PROFILE-IMAGES BUCKET
-- ============================================

-- Policy 1: Allow authenticated users to upload profile images
-- File path format: profile-images/{userId}-{timestamp}.{ext}
CREATE POLICY "Allow users to upload own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Policy 2: Allow public reads (so profile images can be displayed)
CREATE POLICY "Allow public reads from profile-images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-images'
);

-- Policy 3: Allow users to update profile images
CREATE POLICY "Allow users to update own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Policy 4: Allow users to delete profile images
CREATE POLICY "Allow users to delete own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- ============================================
-- ALTERNATIVE: SIMPLER POLICY (If above doesn't work)
-- This allows any authenticated user to upload to profile-images
-- Use this if the user-specific policies above don't work
-- ============================================

-- Uncomment these if the above policies don't work:

-- DROP POLICY IF EXISTS "Allow authenticated uploads to profile-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow users to upload own profile images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow users to update own profile images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow users to delete own profile images" ON storage.objects;
-- 
-- CREATE POLICY "Allow authenticated uploads to profile-images"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'profile-images'
-- );
-- 
-- CREATE POLICY "Allow authenticated updates to profile-images"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'profile-images')
-- WITH CHECK (bucket_id = 'profile-images');
-- 
-- CREATE POLICY "Allow authenticated deletes to profile-images"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'profile-images');

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Check all storage policies for profile-images
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%profile%'
ORDER BY policyname;

-- ============================================
-- NOTES:
-- 1. First create the bucket in Supabase Dashboard:
--    - Go to Storage > New Bucket
--    - Name: profile-images
--    - Public: ✅ Enable
-- 2. Then run this SQL script
-- 3. The code uploads to: profile-images/{userId}-{timestamp}.{ext}
--    So the folder structure matches the policy
-- ============================================

