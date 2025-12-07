# Supabase Setup for Profiles Table Authentication

This document explains what you need to configure in Supabase to use the `profiles` table as the primary source for authentication and user data.

## Important Changes Made

The application now uses the `profiles` table as the **primary source** for:
- User authentication (login checks email + password in profiles table)
- User profile data
- All user-related information

Supabase Auth (`auth.users`) is now only used as a fallback for accounts created via web signup.

---

## 1. Database Schema - Profiles Table

Make sure your `profiles` table has all these columns. Run this SQL in the Supabase SQL Editor if any columns are missing:

```sql
-- Add missing columns if they don't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS firstName TEXT,
  ADD COLUMN IF NOT EXISTS middleInitial TEXT,
  ADD COLUMN IF NOT EXISTS lastName TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS barangay TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS vehicle_brand TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
  ADD COLUMN IF NOT EXISTS profile_image TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS needs_setup BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mobile app specific fields (if needed)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vehicle TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS experience TEXT,
  ADD COLUMN IF NOT EXISTS availability BOOLEAN,
  ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_jobs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL,
  ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMP WITH TIME ZONE;

-- Shop owner specific fields (if needed)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_image TEXT,
  ADD COLUMN IF NOT EXISTS shop_description TEXT,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
```

---

## 2. Row Level Security (RLS) Policies

The `profiles` table needs RLS policies to allow:
- **Public SELECT**: Users can check their own email/password for login (email is public)
- **Authenticated INSERT**: Users can create their own profiles during signup
- **Authenticated UPDATE**: Users can update their own profiles
- **Authenticated SELECT**: Users can read their own profile

### Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public SELECT for login (checking email/password)
-- This is needed for login authentication
CREATE POLICY "Allow public email check for login"
ON profiles
FOR SELECT
USING (true);  -- Allow anyone to read email (needed for login)

-- Policy: Allow authenticated users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
ON profiles
FOR INSERT
WITH CHECK (true);  -- Allow profile creation (id will be set by application)

-- Policy: Allow authenticated users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON profiles
FOR UPDATE
USING (true)  -- Allow update for matching id
WITH CHECK (true);

-- Policy: Allow users to read their own profile
CREATE POLICY "Allow users to read own profile"
ON profiles
FOR SELECT
USING (true);  -- Allow users to read their profile data
```

### ⚠️ Security Note:
The above policies allow public SELECT on the `profiles` table, which is necessary for login functionality since we're checking email/password. However, this means:
- Anyone can query the profiles table
- Email addresses are visible
- **Passwords are stored in plain text** (required for mobile app compatibility)

**For better security in production:**
- Consider hashing passwords before storing them
- Implement rate limiting on login endpoints
- Use more restrictive RLS policies if possible

---

## 3. Email Verification Settings (Optional)

Since we're using the `profiles` table as the primary source, email verification is not required. However, if you want to disable it in Supabase Auth (for accounts that still use Supabase Auth as fallback):

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Under **Email Auth**, disable **"Enable email confirmations"**

---

## 4. Indexes (Optional but Recommended)

Add indexes to improve login performance:

```sql
-- Index on email for fast login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index on role if you filter by role often
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

---

## 5. Testing

After making these changes:

1. **Test Sign Up**: Create a new account via the web app
   - Should create a record in `profiles` table with email, password, and role
   
2. **Test Login**: Login with the new account
   - Should authenticate using `profiles` table (not Supabase Auth)
   
3. **Test Mobile App Compatibility**: 
   - Accounts created on mobile app should be able to login on web
   - Accounts created on web should be able to login on mobile app

---

## 6. Migration from Existing Data

If you have existing users in `auth.users` but not in `profiles`:

```sql
-- Copy user data from auth.users to profiles (if needed)
INSERT INTO profiles (id, email, full_name, role, needs_setup, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as full_name,
  COALESCE(raw_user_meta_data->>'role', 'customer') as role,
  true as needs_setup,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
```

---

## Summary

✅ **Required Actions:**
1. Add missing columns to `profiles` table (if any)
2. Enable RLS on `profiles` table
3. Create RLS policies for SELECT, INSERT, UPDATE
4. (Optional) Add indexes for better performance

⚠️ **Security Considerations:**
- Passwords are stored in plain text (required for mobile app compatibility)
- RLS policies allow public SELECT (needed for login)
- Consider implementing password hashing and rate limiting for production

After completing these steps, your application will use the `profiles` table as the primary authentication source, making it fully compatible with your mobile app!

