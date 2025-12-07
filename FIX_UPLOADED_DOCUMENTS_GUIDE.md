# Fix Uploaded Documents Not Showing in Admin Page

## Problem
Documents (Business Credentials, Valid ID, Shop Photo) are not being uploaded or displayed in the admin page.

## Root Causes
1. **Storage bucket RLS policies** blocking file uploads
2. **Shop insert failing** (RLS error) - so even if files upload, URLs don't get saved
3. **Storage buckets not created** or missing

## Solution - Step by Step

### Step 1: Fix Shops Table RLS (CRITICAL - Do This First!)

Run the SQL from `FIX_SHOPS_RLS_NOW.sql` in Supabase SQL Editor:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can update their own shops" ON shops;

-- Create new policies
CREATE POLICY "Allow shop insertion"
ON shops FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow shop viewing"
ON shops FOR SELECT
USING (true);

CREATE POLICY "Allow shop updates"
ON shops FOR UPDATE
USING (true) WITH CHECK (true);
```

### Step 2: Create Storage Buckets

1. Go to **Supabase Dashboard** → **Storage**
2. Create two buckets:

   **Bucket 1: `shop-images`**
   - Name: `shop-images`
   - Public: ✅ **YES** (toggle ON)
   - File size limit: 10MB (or default)
   
   **Bucket 2: `shop-documents`**
   - Name: `shop-documents`
   - Public: ✅ **YES** (toggle ON) - *We'll make it public so admins can view*
   - File size limit: 10MB (or default)

### Step 3: Fix Storage Bucket RLS Policies

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- SHOP-IMAGES BUCKET POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public uploads to shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from shop-images" ON storage.objects;

-- Allow anyone to upload
CREATE POLICY "Allow public uploads to shop-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'shop-images');

-- Allow anyone to read (public bucket)
CREATE POLICY "Allow public reads from shop-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shop-images');

-- ============================================
-- SHOP-DOCUMENTS BUCKET POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public uploads to shop-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from shop-documents" ON storage.objects;

-- Allow anyone to upload
CREATE POLICY "Allow public uploads to shop-documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'shop-documents');

-- Allow anyone to read (so admins can view)
CREATE POLICY "Allow public reads from shop-documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shop-documents');
```

### Step 4: Verify Setup

1. **Check buckets exist:**
   - Go to Storage → You should see `shop-images` and `shop-documents`

2. **Check policies:**
   - Run this SQL to verify:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' 
   AND tablename = 'objects'
   ORDER BY policyname;
   ```

### Step 5: Test Shop Registration

1. Try registering a shop again
2. Upload all three documents:
   - Business Credentials
   - Valid ID
   - Shop Photo
3. Submit the form
4. Check the `shops` table in Supabase - you should see:
   - `credentials_url` (not null)
   - `valid_id_url` (not null)
   - `image_url` (not null)

### Step 6: Check Admin Page

1. Go to Admin Dashboard → Verifications
2. Expand a shop
3. Under "Uploaded Documents" you should see:
   - ✅ Business Credentials - "View Document" link
   - ✅ Valid ID - "View Document" link
   - ✅ Shop Photo - "View Photo" link

## Troubleshooting

### If files still don't upload:

1. **Check browser console** for storage errors
2. **Verify bucket names** are exactly: `shop-images` and `shop-documents`
3. **Check bucket is public** - both buckets should be public
4. **Verify RLS policies** were created successfully

### If files upload but don't show in admin:

1. **Check `shops` table** - Are `credentials_url`, `valid_id_url`, and `image_url` populated?
2. **Check URLs** - Open the URLs in a new tab to see if they're accessible
3. **Check admin page** - Make sure it's fetching from the correct columns

### If you see "Not uploaded" in admin:

The URLs might be null in the database. This means:
- Either the upload failed (check storage bucket policies)
- Or the shop insert failed (check shops table RLS policies)

## Quick Test Query

Run this to check if shops have document URLs:

```sql
SELECT 
  id,
  name,
  credentials_url,
  valid_id_url,
  image_url
FROM shops
WHERE status = 'pending'
LIMIT 5;
```

If URLs are NULL, the upload or insert failed.

## Summary

✅ **Fixed shops table RLS** - Shop data can now be saved
✅ **Created storage buckets** - Files can be uploaded
✅ **Fixed storage bucket RLS** - Uploads are allowed
✅ **Admin page displays documents** - URLs are fetched and displayed

After completing all steps, documents should upload and display correctly!

