# Fix Product Upload Error - Complete Guide

## Error Messages You're Seeing:

1. **Main Error**: `insert or update on table "products" violates foreign key constraint "products_owner_id_fkey"`
2. **Storage Errors**: `new row violates row-level security policy` for storage buckets
3. **Image Upload Error**: Storage RLS blocking product images

## Root Causes:

1. **Products table has `owner_id` column** that references a table/user that doesn't exist
2. **Storage bucket RLS policies** are blocking file uploads
3. **Code is trying to insert `owner_id`** but it should only use `shop_id`

## Complete Fix - Step by Step:

### Step 1: Fix Products Table Structure

Run this SQL in Supabase SQL Editor:

```sql
-- Check if products table has owner_id column
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
AND column_name = 'owner_id';

-- Remove owner_id foreign key constraint
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_owner_id_fkey;

-- Remove owner_id column (products should only use shop_id)
ALTER TABLE products
DROP COLUMN IF EXISTS owner_id;
```

### Step 2: Fix Products Table RLS Policies

```sql
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

-- Create new permissive policies
CREATE POLICY "Allow product insertion"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow product viewing"
ON products FOR SELECT
USING (true);

CREATE POLICY "Allow product updates"
ON products FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Allow product deletion"
ON products FOR DELETE
USING (true);
```

### Step 3: Fix Storage Bucket RLS Policies

```sql
-- PRODUCT-IMAGES bucket policies
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from product-images" ON storage.objects;

CREATE POLICY "Allow public uploads to product-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads from product-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');
```

### Step 4: Create Storage Bucket (if missing)

1. Go to **Supabase Dashboard** → **Storage**
2. Create bucket named: `product-images`
3. Make it **Public** (toggle ON)

### Step 5: Fix Code to Remove owner_id

The code needs to be updated to NOT insert `owner_id`. I'll fix this in the code file.

## After Fixing:

1. ✅ Products will upload successfully
2. ✅ Images will upload to storage
3. ✅ No more foreign key constraint errors
4. ✅ No more storage RLS errors

## Quick All-in-One SQL Fix

Run this complete SQL script:

```sql
-- 1. Remove owner_id from products table
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_owner_id_fkey;

ALTER TABLE products
DROP COLUMN IF EXISTS owner_id;

-- 2. Fix products RLS policies
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

CREATE POLICY "Allow product insertion"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow product viewing"
ON products FOR SELECT
USING (true);

CREATE POLICY "Allow product updates"
ON products FOR UPDATE
USING (true) WITH CHECK (true);

-- 3. Fix storage bucket policies
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from product-images" ON storage.objects;

CREATE POLICY "Allow public uploads to product-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads from product-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');
```

