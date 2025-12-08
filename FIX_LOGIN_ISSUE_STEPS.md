# Fix Login Issue - Step by Step Guide

## Problem
Login is not working because RLS (Row Level Security) policies on the `profiles` table are blocking the login queries.

## Solution

### Step 1: Run SQL Script in Supabase

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `FIX_PROFILES_LOGIN_RLS.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press F5)

This script will:
- ✅ Remove old restrictive RLS policies
- ✅ Create new permissive policies that allow login queries
- ✅ Allow SELECT queries by email+role (needed for login)
- ✅ Allow INSERT queries (needed for signup)
- ✅ Allow UPDATE queries (needed for profile updates)

### Step 2: Verify the Fix

After running the SQL script, test the login:

1. **For Store Owner:**
   - Select "I Own a Shop"
   - Enter email: `benh19193@gmail.com` (or your store_owner email)
   - Enter password
   - Should successfully log in

2. **For Motorist:**
   - Select "I'm a Motorist"
   - Enter email: `benh19193@gmail.com` (or your customer email)
   - Enter password
   - Should successfully log in

### Step 3: Check Browser Console

Open browser DevTools (F12) and check the Console tab. You should see:
- `[LOGIN] Querying profiles table for: email=..., role=...`
- `[LOGIN] Query result: { found: 1, error: null }`
- `[LOGIN] Profile found successfully`

If you see errors, they will be logged with `[LOGIN]` prefix.

## What Changed in the Code

1. **Removed Supabase Auth Fallback**: Login now ONLY uses `profiles` table
2. **Fixed Query Method**: Changed from `.maybeSingle()` to `.limit(2)` to avoid "multiple rows" errors
3. **Added Logging**: Console logs show exactly what's happening during login
4. **Better Error Handling**: More specific error messages

## If It Still Doesn't Work

1. **Check RLS Policies:**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'profiles';
   ```
   You should see:
   - `Allow public profile read for login` (SELECT)
   - `Allow profile insertion` (INSERT)
   - `Allow profile updates` (UPDATE)

2. **Check if Profile Exists:**
   ```sql
   SELECT id, email, role, password IS NOT NULL as has_password
   FROM profiles
   WHERE email = 'your-email@example.com' AND role = 'store_owner';
   ```

3. **Check Browser Console:**
   - Look for `[LOGIN]` messages
   - Check for any error messages
   - Share the console output if issues persist

## Summary

The login system now:
- ✅ Queries ONLY from `profiles` table
- ✅ Filters by both email AND role
- ✅ Handles duplicate emails correctly
- ✅ Provides clear error messages
- ✅ Logs all operations for debugging

Run the SQL script and try logging in again!

