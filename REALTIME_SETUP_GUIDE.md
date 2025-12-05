# Real-Time Setup Guide for Admin Dashboard

## What This Does

When a store owner submits shop verification, the admin dashboard will automatically update to show the new submission without needing to refresh the page.

## Step-by-Step Setup

### 1. Enable Realtime in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/cpxbcorlniggftfrnvzf
2. Click on **Project Settings** (gear icon in left sidebar)
3. Go to **API** section
4. Scroll down to **Realtime** section
5. Make sure **Realtime** is **Enabled** ✅
   - If it's disabled, toggle it ON

### 2. Enable Replication for Shops Table

**Option A: Using SQL (Recommended)**
1. Open Supabase SQL Editor
2. Run `ENABLE_REALTIME_AND_VERIFY.sql`
3. This will enable replication for the shops table

**Option B: Using Dashboard**
1. Go to **Database** → **Replication** in left sidebar
2. Find the `shops` table
3. Toggle the switch to **Enable** replication
4. Click **Save**

### 3. Verify Setup

Run the verification query in `ENABLE_REALTIME_AND_VERIFY.sql` to check:
- ✅ Notifications table exists
- ✅ Admin users exist
- ✅ Notification policies are set up
- ✅ Replication is enabled

## What Happens After Setup

1. **Store owner submits verification** → Shop saved to database
2. **Real-time trigger fires** → Admin dashboard automatically refreshes
3. **Admin sees notification** → "New Shop Verification Request" appears
4. **Verifications page updates** → New shop appears immediately

## Troubleshooting

**If real-time doesn't work:**
1. Check that Realtime is enabled in Project Settings
2. Verify shops table has replication enabled
3. Check browser console for any errors
4. Make sure you're logged in as admin

**If notifications don't appear:**
1. Verify notifications table exists (run verification SQL)
2. Check that admin users exist in profiles table
3. Verify notification policies are created
4. Check browser console for errors

## Quick Test

1. Open admin dashboard in one browser tab
2. Open shop verification form in another tab (as store owner)
3. Submit a shop verification
4. Watch the admin dashboard - it should update automatically!

