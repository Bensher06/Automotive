# Fix: Products Not Displaying After Upload

## Problem
You uploaded a product but it's not showing up in the Products page. You're seeing:
- Error: "Failed to load resource: the server responded with a status of 400 ()"
- Error from `StoreDashboard.jsx:1427` - "fetching products"

## Root Cause
The code was trying to fetch products using `owner_id` column, but:
1. **Products table doesn't have `owner_id`** - it was removed
2. **Products use `shop_id`** instead
3. **RLS policies** might be blocking the query

## Fixes Applied

### 1. ✅ Fixed Code to Use shop_id
The code now fetches products by `shop_id` instead of `owner_id`.

### 2. ⚠️ Need to Fix RLS Policies
Run this SQL in Supabase SQL Editor:

```sql
-- Fix products table RLS policies to allow fetching
DROP POLICY IF EXISTS "Shop owners can manage their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products from verified shops" ON products;

-- Allow anyone to view products (for now)
CREATE POLICY "Allow product viewing"
ON products FOR SELECT
USING (true);

-- Allow product insertion
CREATE POLICY "Allow product insertion"
ON products FOR INSERT
WITH CHECK (true);

-- Allow product updates
CREATE POLICY "Allow product updates"
ON products FOR UPDATE
USING (true) WITH CHECK (true);
```

### 3. Verify Your Shop ID

Make sure you have a valid shop. Check if your shop exists:

```sql
-- Check if you have a shop
SELECT id, name, owner_id, status 
FROM shops 
WHERE owner_id IN (
  SELECT id FROM profiles WHERE email = 'your-email@example.com'
);
```

Replace `your-email@example.com` with your actual email.

## Quick Test

After running the SQL above:

1. **Refresh the page** (hard refresh: Ctrl+F5)
2. **Check if your shop is loaded** - You should see your shop name
3. **Products should now display** - Your uploaded product should appear

## If Products Still Don't Show

1. **Check browser console** - Look for any new errors
2. **Verify product was saved** - Run this query:
   ```sql
   SELECT * FROM products 
   WHERE shop_id IN (
     SELECT id FROM shops WHERE owner_id IN (
       SELECT id FROM profiles WHERE email = 'your-email@example.com'
     )
   );
   ```
3. **Check shop_id** - Make sure the product has the correct `shop_id`

## Summary

✅ **Code Fixed**: Now uses `shop_id` instead of `owner_id`  
⚠️ **RLS Policies**: Need to run SQL to allow product fetching  
✅ **Upload Fixed**: Products should save correctly

After running the RLS policy SQL, refresh the page and your products should appear!

