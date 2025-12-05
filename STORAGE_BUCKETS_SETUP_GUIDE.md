# Storage Buckets Setup Guide

## Why You Need This

When store owners submit shop verification, they need to upload:
- Shop photos (shop-images bucket)
- Business credentials (shop-documents bucket)
- Valid ID (shop-documents bucket)

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to your Supabase project: https://supabase.com/dashboard/project/cpxbcorlniggftfrnvzf
- Click on **Storage** in the left sidebar

### 2. Create `shop-images` Bucket (Public)

1. Click **"New Bucket"** button
2. **Bucket name:** `shop-images`
3. **Public bucket:** ✅ **Enable** (toggle ON)
   - This allows public access to shop photos
4. **File size limit:** Leave default or set to 10MB
5. **Allowed MIME types:** Leave empty (allows all image types)
6. Click **"Create bucket"**

### 3. Create `shop-documents` Bucket (Private)

1. Click **"New Bucket"** button again
2. **Bucket name:** `shop-documents`
3. **Public bucket:** ❌ **Disable** (toggle OFF)
   - This keeps credentials and IDs private
4. **File size limit:** Leave default or set to 10MB
5. **Allowed MIME types:** Leave empty (allows PDFs and images)
6. Click **"Create bucket"**

## Verify Setup

After creating both buckets, you should see:
- ✅ `shop-images` (Public)
- ✅ `shop-documents` (Private)

## Test

After running `FIX_SHOP_INSERT_AND_STORAGE.sql` and creating the buckets, try submitting a shop verification again. The errors should be gone!

## Troubleshooting

**If you still get storage errors:**
1. Make sure both buckets are created with exact names: `shop-images` and `shop-documents`
2. Make sure `shop-images` is set to **Public**
3. Make sure `shop-documents` is set to **Private**
4. Run `FIX_SHOP_INSERT_AND_STORAGE.sql` again to ensure policies are correct

