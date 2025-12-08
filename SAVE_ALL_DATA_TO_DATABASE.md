# Save All Data to Supabase Database

This guide will help you save **ALL** data to Supabase tables instead of localStorage.

## What Will Be Saved to Database:

1. ✅ **Cart Items** → `cart_items` table
2. ✅ **Orders** → `orders` table  
3. ✅ **Order Items** → `order_items` table
4. ✅ **User Profiles** → `profiles` table (already working)
5. ✅ **Products** → `products` table (already working)
6. ✅ **Shops** → `shops` table (already working)

---

## Step 1: Run SQL Scripts

Run these SQL scripts in **Supabase SQL Editor** in this order:

### 1. First: `ENSURE_ALL_DATA_SAVED.sql`
This creates all necessary tables and RLS policies:
- Creates `cart_items` table
- Fixes RLS policies for `orders` and `order_items`
- Adds missing columns
- Ensures all data can be saved

### 2. Verify: Check Tables Exist
After running the SQL, verify these tables exist:
- ✅ `cart_items`
- ✅ `orders` 
- ✅ `order_items`
- ✅ `profiles`
- ✅ `products`
- ✅ `shops`

---

## Step 2: How It Works Now

### Cart Items Storage:
- **Before**: Only in localStorage (lost when browser clears)
- **After**: Saved to `cart_items` table in database
- **Benefits**: 
  - Cart syncs across devices
  - Cart persists after browser clear
  - Cart accessible from mobile app

### Order Storage:
- **Before**: Simulated (not saved)
- **After**: Saved to `orders` and `order_items` tables
- **Benefits**:
  - Order history available
  - Shop owners can see orders
  - Analytics can track sales

---

## Step 3: Test It

1. **Login** as a customer/motorist
2. **Add items to cart** from marketplace
3. **Check database** → `cart_items` table should show your cart
4. **Go to checkout**
5. **Place order**
6. **Check database** → `orders` and `order_items` tables should show your order

---

## Troubleshooting

### If cart items aren't saving:
1. Check browser console for errors
2. Verify `cart_items` table exists
3. Verify RLS policies allow inserts
4. Check that user is logged in (cart needs `user_id`)

### If orders aren't saving:
1. Check browser console for detailed error messages
2. Verify `orders` and `order_items` tables exist
3. Verify RLS policies allow inserts
4. Check that all required fields are filled (payment, address, contact)

### Common Errors:

**Error: "new row violates row-level security policy"**
→ Run `ENSURE_ALL_DATA_SAVED.sql` to fix RLS policies

**Error: "column does not exist"**
→ Run `ENSURE_ALL_DATA_SAVED.sql` to add missing columns

**Error: "null value in column violates not-null constraint"**
→ Check that `shop_id` is included when adding to cart

---

## Database Tables Structure

### cart_items
```sql
- id (uuid)
- user_id (uuid) → references profiles(id)
- product_id (uuid) → references products(id)
- shop_id (uuid) → references shops(id)
- quantity (integer)
- price (decimal)
- product_name (text)
- product_image (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### orders
```sql
- id (uuid)
- customer_id (uuid) → references profiles(id)
- shop_id (uuid) → references shops(id)
- total_amount (decimal)
- payment_method (text)
- shipping_address (text)
- contact_number (text)
- customer_name (text)
- customer_email (text)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### order_items
```sql
- id (uuid)
- order_id (uuid) → references orders(id)
- product_id (uuid) → references products(id)
- quantity (integer)
- price (decimal)
- product_name (text)
- created_at (timestamp)
```

---

## What Changed in Code

1. **CartContext.jsx**:
   - Now loads cart from database when user logs in
   - Saves cart to database whenever it changes
   - Falls back to localStorage if not logged in

2. **Checkout.jsx**:
   - Actually saves orders to database (was simulated before)
   - Creates order and order_items records
   - Updates product stock

3. **Marketplace.jsx**:
   - Now includes `shop_id` when adding to cart

---

## Next Steps

After everything is working:
1. ✅ Test adding items to cart → Check `cart_items` table
2. ✅ Test checkout → Check `orders` and `order_items` tables
3. ✅ Verify cart syncs across browser tabs
4. ✅ Test on different device (if logged in)

---

## Security Note

The current RLS policies are **open** (allow all operations) for testing. For production, you should:
1. Restrict cart_items to only allow users to see/modify their own cart
2. Restrict orders to only allow customers to create their own orders
3. Add proper authentication checks

But for now, the open policies ensure everything works!

