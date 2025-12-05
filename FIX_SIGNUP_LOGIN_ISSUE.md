# Fix Signup/Login Issue

## Problem
You signed up but can't log in - getting "Invalid login credentials" or "No account found" error.

## Quick Diagnosis

### Step 1: Check if Account Was Created
Run this SQL in Supabase SQL Editor (replace with your email):
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END AS status
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

### Step 2: Check Profile
```sql
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
WHERE email = 'YOUR_EMAIL@example.com';
```

## Common Issues & Solutions

### Issue 1: Account Not Confirmed
**Symptoms:** Account exists but `email_confirmed_at` is NULL

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find your email
3. Click on the user
4. Click "Confirm Email" or manually confirm via SQL:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'YOUR_EMAIL@example.com'
  AND email_confirmed_at IS NULL;
```

### Issue 2: Wrong Password
**Symptoms:** Account exists and is confirmed, but login fails

**Solution:**
1. **Reset Password (Recommended):**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your email
   - Click "Send password reset email"
   - Check your email and reset password

2. **Or Delete and Recreate:**
   - Delete the account in Supabase Dashboard
   - Sign up again with the same email
   - Use a password you'll remember!

### Issue 3: Email Signups Disabled
**Symptoms:** Signup fails with "Email signups are disabled"

**Solution:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Email" provider
3. Toggle it ON
4. Click Save
5. Try signing up again

### Issue 4: Profile Not Created
**Symptoms:** Account exists but no profile row

**Solution:**
Run this SQL (replace with your user ID from Step 1):
```sql
INSERT INTO profiles (id, email, role, needs_setup)
SELECT 
  id,
  email,
  'store_owner',
  true
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'
  AND id NOT IN (SELECT id FROM profiles);
```

## After Fixing

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Try logging in again**
3. If it still fails, check the console for errors

## Prevention

1. **Disable Email Confirmation for Development:**
   - Supabase Dashboard → Authentication → Providers → Email
   - Toggle "Confirm email" OFF
   - Click Save

2. **Use a Password Manager:**
   - Save your password when you sign up
   - Or use a simple password you'll remember during development

## Still Not Working?

1. Check browser console for errors
2. Verify Supabase URL and API key are correct
3. Make sure you're using the correct email (case-sensitive)
4. Try signing up with a different email to test

