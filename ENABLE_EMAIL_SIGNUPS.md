# Enable Email Signups in Supabase

## Problem
You're getting the error: "Email signups are disabled"

This means Supabase has disabled email/password authentication for your project.

## Solution: Enable Email Signups

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/cpxbcorlniggftfrnvzf
2. Click on **Authentication** in the left sidebar

### Step 2: Enable Email Provider
1. Click on **Providers** (under Authentication)
2. Find **"Email"** in the list
3. Click on **"Email"** to expand settings
4. Make sure the toggle at the top is **ON** (enabled)
5. If it's OFF, toggle it **ON**
6. Click **"Save"**

### Step 3: Disable Email Confirmation (For Development)
While you're there:
1. Find **"Confirm email"** or **"Enable email confirmations"**
2. Toggle it **OFF** (for easier development)
3. Click **"Save"**

### Step 4: Verify Settings
After enabling, you should see:
- ✅ Email provider: **Enabled**
- ✅ Confirm email: **Disabled** (for development)

## Alternative: Check Project Settings

If you can't find it in Providers:
1. Go to **Project Settings** (gear icon)
2. Click on **Auth** section
3. Look for **"Enable Email Signup"** or similar
4. Make sure it's **enabled**

## After Enabling

1. Try signing up again with a new account
2. Try logging in with existing accounts
3. Both should work now!

## Quick Test

After enabling email signups:
1. Go to your app: `localhost:5173/signup`
2. Try creating a new store owner account
3. It should work without the "Email signups are disabled" error

