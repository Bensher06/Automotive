# How to Fix Profile Update Errors (409/406)

## Step 1: Run This SQL in Supabase SQL Editor

This will ensure your RLS policies are correct and allow profile updates:

```sql
-- Fix RLS policies for profiles table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view customer profiles" ON profiles;

-- Recreate policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view customer profiles"
  ON profiles FOR SELECT
  USING (role = 'customer');

-- Verify policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

## Step 2: Check Your Profile in Database

Run this to see if your profile exists:

```sql
-- Check if your profile exists (replace with your user ID)
SELECT id, email, full_name, role, phone, address, needs_setup
FROM profiles
WHERE id = auth.uid();
```

## Step 3: Clear Browser Cache and Try Again

1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try completing your profile again

## Step 4: If Still Having Issues

If you're still getting errors, manually update your profile in Supabase:

```sql
-- Manually update your profile (replace values with your actual data)
UPDATE profiles
SET 
  phone = '09673890444',
  address = 'Divisoria, Zamboanga City',
  vehicle_brand = 'Honda',
  vehicle_model = 'Click 125i',
  vehicle_year = 2020,
  needs_setup = false
WHERE id = auth.uid();
```

## Step 5: Verify the Fix

After running the SQL, try:
1. Log out
2. Log back in
3. Go to profile setup
4. Fill in the form
5. Click "Complete Setup"

The errors should be resolved!

