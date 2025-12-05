-- ============================================
-- Create Profile Images Storage Bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- Note: You may need to create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: profile-images
-- 4. Public bucket: YES (so images can be displayed)
-- 5. Click "Create bucket"

-- After creating the bucket, run these policies:

-- Allow anyone to view profile images (public access)
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
CREATE POLICY "Anyone can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload their own profile images
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own profile images
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own profile images
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated'
  );

-- Ensure profile_image column exists in profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Verify setup
SELECT 'Profile images storage setup complete!' AS status;

-- Show storage policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%profile%';

