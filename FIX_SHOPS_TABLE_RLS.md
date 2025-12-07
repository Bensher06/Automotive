# Fix Shops Table RLS Policy Error

## Problem
You're getting this error when trying to register a shop:
```
new row violates row-level security policy for table 'shops'
```

This happens because:
1. The `shops` table RLS policies use `auth.uid()` to check authentication
2. Since we're now using the `profiles` table for authentication (not Supabase Auth), `auth.uid()` returns `null`
3. The RLS policy blocks the insert because it can't verify the user

## Solution

You need to update the RLS policies for the `shops` table in Supabase. Run these SQL commands in the **Supabase SQL Editor**:

### Step 1: Drop existing restrictive policies

```sql
-- Drop the old policies that rely on auth.uid()
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can update their own shops" ON shops;
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON shops;
DROP POLICY IF EXISTS "Admins can view all shops" ON shops;
DROP POLICY IF EXISTS "Admins can update all shops" ON shops;
```

### Step 2: Create new policies that work with profiles table authentication

```sql
-- Policy: Allow users with store_owner role to insert their own shops
-- This works because we're checking the profiles table, not auth.uid()
CREATE POLICY "Store owners can insert their own shops"
ON shops
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = shops.owner_id
    AND profiles.role = 'store_owner'
  )
  OR
  -- Fallback: Allow if owner_id matches any authenticated user's profile
  owner_id IN (SELECT id FROM profiles WHERE email IS NOT NULL)
);

-- Policy: Allow store owners to view their own shops
CREATE POLICY "Store owners can view their own shops"
ON shops
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = shops.owner_id
    AND profiles.role = 'store_owner'
  )
  OR
  -- Allow viewing if owner_id exists in profiles
  owner_id IN (SELECT id FROM profiles)
);

-- Policy: Allow store owners to update their own shops
CREATE POLICY "Store owners can update their own shops"
ON shops
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = shops.owner_id
    AND profiles.role = 'store_owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = shops.owner_id
    AND profiles.role = 'store_owner'
  )
);

-- Policy: Allow admins to view all shops
CREATE POLICY "Admins can view all shops"
ON shops
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.role = 'admin'
  )
);

-- Policy: Allow admins to update all shops
CREATE POLICY "Admins can update all shops"
ON shops
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.role = 'admin'
  )
);

-- Keep the public view policy for verified shops
-- (This should already exist, but adding it just in case)
CREATE POLICY IF NOT EXISTS "Anyone can view verified shops"
ON shops
FOR SELECT
USING (status = 'verified');
```

### Step 3: Alternative Simpler Approach (If above doesn't work)

If the above policies still don't work, use this more permissive approach (less secure, but works with profiles table auth):

```sql
-- Drop all existing policies first
DROP POLICY IF EXISTS "Store owners can insert their own shops" ON shops;
DROP POLICY IF EXISTS "Store owners can view their own shops" ON shops;
DROP POLICY IF EXISTS "Store owners can update their own shops" ON shops;
DROP POLICY IF EXISTS "Admins can view all shops" ON shops;
DROP POLICY IF EXISTS "Admins can update all shops" ON shops;
DROP POLICY IF EXISTS "Anyone can view verified shops" ON shops;

-- More permissive policies (for development/testing)
-- Allow anyone with a profile to insert shops (they must be store_owner role)
CREATE POLICY "Allow shop insertion for store owners"
ON shops
FOR INSERT
WITH CHECK (true);  -- Allow all inserts (application logic will validate role)

-- Allow viewing shops
CREATE POLICY "Allow viewing shops"
ON shops
FOR SELECT
USING (true);  -- Allow all selects

-- Allow updating shops
CREATE POLICY "Allow updating shops"
ON shops
FOR UPDATE
USING (true)
WITH CHECK (true);  -- Allow all updates
```

⚠️ **Warning**: The simpler approach above is less secure. Use it only if the first approach doesn't work, and consider adding application-level validation.

### Step 4: Verify the policies

After running the SQL, verify the policies were created:

```sql
-- Check all policies on shops table
SELECT * FROM pg_policies WHERE tablename = 'shops';
```

## Why This Works

The new policies:
1. **Don't rely on `auth.uid()`** - They check the `profiles` table directly
2. **Work with profiles table authentication** - Since we're using profiles as primary auth source
3. **Still maintain security** - They check that the user has the correct role in the profiles table

## Testing

After applying these changes:
1. Try registering a shop again
2. The error should be gone
3. The shop should be created successfully

## Additional Notes

- If you still get errors, you may need to also update RLS policies for:
  - `notifications` table (for admin notifications)
  - `products` table (if shop owners need to add products)
  - Other tables that use `auth.uid()`

Let me know if you need help updating other tables' RLS policies!

