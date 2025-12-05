# Reset Password Guide

## Your Account Status
✅ Account exists: `bentets35@gmail.com`  
✅ Email confirmed: Yes  
✅ Role: `store_owner`  
❌ Login failing: **Password issue**

## Solution: Reset Password

### Option 1: Reset via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/cpxbcorlniggftfrnvzf
   - Click **Authentication** → **Users**

2. **Find Your User**
   - Search for `bentets35@gmail.com`
   - Click on the user row

3. **Reset Password**
   - Click **"Send password reset email"** button
   - Check your email inbox
   - Click the reset link in the email
   - Set a new password
   - Try logging in with the new password

### Option 2: Delete and Recreate Account

If reset email doesn't work:

1. **Delete the account:**
   - Go to Authentication → Users
   - Find `bentets35@gmail.com`
   - Click the three dots (⋯) → Delete
   - Confirm deletion

2. **Sign up again:**
   - Go to your app: `localhost:5173/signup`
   - Select "I Own a Shop"
   - Use the same email: `bentets35@gmail.com`
   - Create a NEW password (remember this one!)
   - Complete signup

3. **Login:**
   - Use the new password you just created
   - Should work now!

### Option 3: Use Supabase SQL to Reset (Advanced)

If you want to manually set a password, you can use Supabase's admin API, but the easiest way is Option 1 or 2 above.

## Quick Test After Reset

1. Try logging in with the new password
2. Make sure you select "I Own a Shop" role
3. Should redirect to shop verification page

## Why This Happened

The account exists and is confirmed, but the password stored in Supabase doesn't match what you're entering. This can happen if:
- Password was set incorrectly during signup
- Password was changed somewhere else
- There was an issue during account creation

