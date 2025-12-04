# How to Disable Email Verification in Supabase

## Step-by-Step Instructions

### Step 1: Go to Your Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your Supabase account
3. Select your project (the one with URL: `cpxbcorlniggftfrnvzf.supabase.co`)

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click on **"Authentication"** (it has a key icon)
2. Then click on **"Providers"** (under Authentication)
3. You should see a list of authentication providers

### Step 3: Configure Email Provider
1. Find **"Email"** in the list of providers
2. Click on **"Email"** to expand its settings
3. Look for the setting: **"Confirm email"** or **"Enable email confirmations"**
4. **Toggle it OFF** (it should be gray/unchecked)
5. Click **"Save"** at the bottom of the page

### Step 4: Verify the Change
1. The page should show a success message
2. The "Confirm email" toggle should now be OFF

### Step 5: Test Your Login
1. Go back to your application at `localhost:5174/login`
2. Try logging in with your existing account
3. It should work now without requiring email confirmation

## Alternative: If You Can't Find the Setting

If you don't see the "Confirm email" toggle, it might be in a different location:

1. Go to **Authentication** > **Settings** (instead of Providers)
2. Look for **"Email Auth"** section
3. Find **"Enable email confirmations"** and turn it OFF
4. Save the changes

## What This Does

- **Before**: Users must click a confirmation link in their email before they can log in
- **After**: Users can log in immediately after signing up, no email confirmation needed

## Important Notes

- This is recommended for **development/testing** only
- For **production**, you should keep email confirmation enabled for security
- You can always re-enable it later if needed

## Still Having Issues?

If you've disabled email confirmation but still can't log in:

1. Try signing up with a **new account** (the old account might still be in "unconfirmed" state)
2. Or, manually confirm the existing user in Supabase:
   - Go to **Authentication** > **Users**
   - Find your user (`evannfrancisco@gmail.com`)
   - Click on the user
   - Look for "Email Confirmed" status
   - If it says "Not confirmed", you can manually confirm it or delete and recreate the user

