# Supabase Integration Setup Guide

This guide will help you set up Supabase as the backend for MotoZapp.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed
3. Your MotoZapp project

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `moto-zapp` (or your preferred name)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to your users
4. Click "Create new project" and wait for it to be ready (2-3 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Set Up Environment Variables

1. In your project root, create a `.env` file (if it doesn't exist)
2. Add the following:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

**Important:** Make sure `.env` is in your `.gitignore` file to keep your keys secure!

## Step 4: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Open the file `SUPABASE_SCHEMA.md` in this project
3. Copy and paste the SQL statements from that file into the SQL Editor
4. Run them in this order:
   - First: All table creation statements
   - Second: All RLS (Row Level Security) policies
   - Third: All indexes
   - Fourth: All functions and triggers

**Note:** The schema includes:
- `profiles` - User profiles extending auth.users
- `shops` - Shop information
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Items in each order
- `bookings` - Service bookings
- `notifications` - User notifications
- `dashboard_data` - Shop owner dashboard analytics

## Step 5: Verify the Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see all the tables listed:
   - profiles
   - shops
   - products
   - orders
   - order_items
   - bookings
   - notifications
   - dashboard_data

3. Check that RLS is enabled:
   - Click on any table
   - Go to the "Policies" tab
   - You should see policies listed

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try signing up a new user:
   - Go to the Sign Up page
   - Create an account
   - Check Supabase dashboard > Authentication > Users to see if the user was created
   - Check Table Editor > profiles to see if the profile was created

3. Try creating a shop (as a store owner):
   - Sign up as a store owner
   - Complete profile setup
   - Create a shop
   - Check Table Editor > shops to see if the shop was created

## Troubleshooting

### "Supabase URL not configured" warning
- Make sure your `.env` file exists and has the correct values
- Restart your development server after creating/updating `.env`
- Check that variable names start with `VITE_`

### Authentication errors
- Check that the `handle_new_user()` function and trigger are set up correctly
- Verify RLS policies allow users to insert their own profiles

### RLS policy errors
- Make sure all policies are created correctly
- Check the Supabase logs (Settings > Logs) for specific error messages

### Real-time subscriptions not working
- Ensure you're using the correct channel names
- Check that RLS policies allow the user to read the data they're subscribing to

## Next Steps

After setup is complete:

1. **Test all features:**
   - User registration and login
   - Profile management
   - Shop creation and management
   - Product listing and management
   - Order creation
   - Booking creation
   - Notifications

2. **Set up email templates** (optional):
   - Go to Authentication > Email Templates
   - Customize welcome emails, password reset emails, etc.

3. **Configure storage** (if you need file uploads):
   - Go to Storage
   - Create buckets for images (e.g., `shop-images`, `product-images`, `profile-images`)
   - Set up storage policies

4. **Monitor usage:**
   - Check the Dashboard for API usage
   - Monitor database size
   - Review authentication metrics

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use RLS policies** - They're already set up in the schema
3. **Regular backups** - Supabase provides automatic backups, but you can also create manual ones
4. **Monitor logs** - Regularly check for suspicious activity
5. **Update dependencies** - Keep `@supabase/supabase-js` updated

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Issues: Check the project repository for known issues

## Migration Notes

The application has been migrated from localStorage/mock data to Supabase. All data operations now go through Supabase:

- ✅ Authentication (AuthContext)
- ✅ User Profiles (ProfileService)
- ✅ Shops (ShopService)
- ✅ Products (ProductService)
- ✅ Orders (OrderService)
- ✅ Bookings (BookingContext/BookingService)
- ✅ Notifications (NotificationContext/NotificationService)
- ✅ Dashboard Data (DashboardService)

The Cart still uses localStorage (this is intentional - carts are typically client-side only, but can be migrated to Supabase if needed for cross-device sync).

