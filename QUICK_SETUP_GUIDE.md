# Quick Supabase SQL Setup Guide

## What to Put in SQL Editor

I've created a complete SQL file (`SUPABASE_SETUP_SQL.sql`) that you can copy and paste directly into the Supabase SQL Editor.

## Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/cpxbcorlniggftfrnvzf
   - Click on **SQL Editor** in the left sidebar

2. **Open the SQL File**
   - Open `SUPABASE_SETUP_SQL.sql` in your project
   - Copy the **entire contents** of the file

3. **Paste into SQL Editor**
   - Click **New Query** in the SQL Editor
   - Paste all the SQL code
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

4. **Verify Setup**
   - Go to **Table Editor** in the left sidebar
   - You should see 8 tables:
     - ✅ profiles
     - ✅ shops
     - ✅ products
     - ✅ orders
     - ✅ order_items
     - ✅ bookings
     - ✅ notifications
     - ✅ dashboard_data

5. **Check RLS Policies**
   - Click on any table
   - Go to the **Policies** tab
   - You should see policies listed

## What the SQL Does:

1. **Creates 8 tables** - All the database tables your app needs
2. **Enables RLS** - Row Level Security for data protection
3. **Creates policies** - Rules for who can access what data
4. **Creates indexes** - For faster database queries
5. **Creates functions** - Auto-creates profiles when users sign up
6. **Creates triggers** - Auto-updates timestamps

## If You Get Errors:

- **"relation already exists"** - Tables already created, skip that part
- **"policy already exists"** - Policies already created, skip that part
- **"function already exists"** - Functions already created, skip that part

You can run the SQL multiple times - it will skip what's already created.

## Alternative: Run Section by Section

If you prefer to run it in parts, run in this order:

1. **Step 1**: All CREATE TABLE statements
2. **Step 2**: All ALTER TABLE ENABLE ROW LEVEL SECURITY
3. **Step 3**: All CREATE POLICY statements
4. **Step 4**: All CREATE INDEX statements
5. **Step 5**: All CREATE FUNCTION statements
6. **Step 6**: All CREATE TRIGGER statements

## After Setup:

1. Test by signing up a new user in your app
2. Check **Authentication > Users** in Supabase to see the user
3. Check **Table Editor > profiles** to see the profile was created automatically

That's it! Your database is ready to use! 🎉

