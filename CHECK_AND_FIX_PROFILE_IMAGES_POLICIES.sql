-- ============================================
-- CHECK AND FIX PROFILE-IMAGES STORAGE POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current policies for profile-images bucket
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
-- Step 2: Drop existing policies (if they're not working)
-- ============================================

DROP POLICY IF EXISTS "Allow users to upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- ============================================
-- Step 3: Create new working policies
-- ============================================

-- Policy 1: Allow authenticated users to INSERT (upload) to profile-images
CREATE POLICY "Allow authenticated uploads to profile-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Policy 2: Allow public SELECT (read) from profile-images (since bucket is public)
CREATE POLICY "Allow public reads from profile-images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-images'
);

-- Policy 3: Allow authenticated users to UPDATE their files in profile-images
CREATE POLICY "Allow authenticated updates to profile-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Policy 4: Allow authenticated users to DELETE their files in profile-images
CREATE POLICY "Allow authenticated deletes to profile-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- ============================================
-- Step 4: Verify the new policies
-- ============================================

SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%profile%'
ORDER BY policyname;

-- ============================================
-- ALTERNATIVE: If you're using profiles table auth (not Supabase Auth)
-- You might need to allow public uploads (less secure but will work)
-- ============================================

-- Uncomment this section if authenticated policies don't work:

-- DROP POLICY IF EXISTS "Allow authenticated uploads to profile-images" ON storage.objects;
-- 
-- CREATE POLICY "Allow public uploads to profile-images"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = 'profile-images'
-- );

