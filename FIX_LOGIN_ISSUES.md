# Fix Login Issues - Email Confirmation

## Problem
After signing up, you can't log in because Supabase requires email confirmation by default.

## Solution: Disable Email Confirmation (For Development)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Find the **"Confirm email"** toggle
4. **Turn it OFF** (disable email confirmation)
5. Click **Save**

## Alternative: Keep Email Confirmation Enabled

If you want to keep email confirmation enabled:

1. After signing up, check your email inbox
2. Look for an email from Supabase
3. Click the confirmation link
4. Then try logging in again

## Additional Fix: Verify Database Schema

Make sure your `profiles` table has the correct columns. Run this in Supabase SQL Editor:

```sql
-- Check if profiles table exists and has correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

You should see these columns:
- `id` (uuid)
- `email` (text)
- `name` (text)
- `phone` (text)
- `address` (text)
- `role` (text)
- `vehicle_brand` (text)
- `vehicle_model` (text)
- `vehicle_year` (integer)
- `profile_image` (text)
- `needs_setup` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

If any columns are missing, run the SQL from `SUPABASE_SETUP_SQL.sql` or `FIX_SIGNUP_ERROR.sql` to fix the schema.

## Quick Test

After disabling email confirmation:
1. Try signing up with a new account
2. Immediately try logging in with that account
3. It should work without needing email confirmation

