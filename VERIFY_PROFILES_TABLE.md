# Verify Profiles Table Structure

## Current Status ✅
Your signup is working! Accounts are being saved to the `profiles` table as expected.

## Check Required Columns

Please verify that your `profiles` table has all these columns. Some might not be visible in the table view:

### Required Columns for Authentication:
- ✅ `id` (uuid) - Primary key
- ✅ `email` (text)
- ✅ `role` (text) - 'customer', 'store_owner', 'admin', 'mechanic'
- ✅ `full_name` (text)
- ✅ `phone` (text)

### Additional Columns Needed:
- ⚠️ `password` (text) - **CRITICAL** - Needed for login authentication
- ⚠️ `firstName` (text) - For separate name fields
- ⚠️ `middleInitial` (text) - For separate name fields
- ⚠️ `lastName` (text) - For separate name fields
- ⚠️ `address` (text) - Full address
- ⚠️ `region` (text) - Philippine address breakdown
- ⚠️ `province` (text) - Philippine address breakdown
- ⚠️ `city` (text) - Philippine address breakdown
- ⚠️ `barangay` (text) - Philippine address breakdown
- ⚠️ `street_address` (text) - Street address

### Optional Columns (for mobile app compatibility):
- `vehicle_brand`, `vehicle_model`, `vehicle_year`
- `profile_image`, `avatar_url`
- `needs_setup` (boolean)
- `created_at`, `updated_at`

## How to Check All Columns

In Supabase Table Editor:
1. Click on the `profiles` table
2. Look for a "Columns" or "Schema" tab/view
3. Or go to **SQL Editor** and run:

```sql
-- Check all columns in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

## If Password Column is Missing

If the `password` column doesn't exist, run this in **SQL Editor**:

```sql
-- Add password column if missing
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS password TEXT;
```

## If Other Columns are Missing

Run this to add all missing columns:

```sql
-- Add missing columns for profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS firstName TEXT,
  ADD COLUMN IF NOT EXISTS middleInitial TEXT,
  ADD COLUMN IF NOT EXISTS lastName TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS barangay TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_brand TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
  ADD COLUMN IF NOT EXISTS profile_image TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS needs_setup BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

## Next Steps

1. ✅ **Signup is working** - Accounts are saved to `profiles` table
2. ⚠️ **Check if `password` column exists** - Critical for login
3. ⚠️ **Fix `shops` table RLS policies** - Still needed for shop registration
4. ⚠️ **Update `profiles` table RLS policies** - May need adjustment for profiles table authentication

## Test Login

After verifying the `password` column exists:
1. Try logging in with the account you just created
2. If login fails, the password might not have been saved during signup
3. Check the signup code to ensure password is being saved

