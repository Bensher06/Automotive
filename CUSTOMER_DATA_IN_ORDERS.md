# Customer Data Saved in Orders

## What Customer Information is Saved

When a customer/motorist places an order, the following information is automatically saved to the `orders` table:

### 1. Customer Identification
- ✅ **customer_id** (UUID) - Links to profiles table
- ✅ **customer_name** - Full name of the customer/motorist
- ✅ **customer_email** - Email address
- ✅ **customer_phone** - Phone number

### 2. Customer Profile
- ✅ **customer_profile_image** - Profile picture URL

### 3. Order Time
- ✅ **created_at** - Automatic timestamp when order is created
- ✅ This includes both date and time (e.g., "2025-12-07 23:45:30")

---

## Database Columns

The `orders` table now includes:

```sql
- customer_id (uuid) → References profiles(id)
- customer_name (text) → "Ben H. Hassan"
- customer_email (text) → "benh19193@gmail.com"
- customer_phone (text) → "09973625731"
- customer_profile_image (text) → "https://..."
- created_at (timestamp) → "2025-12-07 23:45:30.123+00"
```

---

## How to View Order Data

### In Supabase Dashboard:
1. Go to **Table Editor** → `orders` table
2. You'll see columns:
   - `customer_name` - Name of customer
   - `customer_email` - Email
   - `customer_phone` - Phone
   - `customer_profile_image` - Profile image URL
   - `created_at` - Order date and time

### Query Example:
```sql
SELECT 
    customer_name,
    customer_email,
    customer_phone,
    customer_profile_image,
    created_at,
    total_amount,
    status
FROM orders
ORDER BY created_at DESC;
```

---

## What Gets Saved Automatically

When a customer places an order:

1. **Name** → From `user.name` or `user.full_name` or `user.email`
2. **Email** → From `user.email`
3. **Phone** → From `contactNumber` (checkout form) or `user.phone`
4. **Profile Image** → From `user.profileImage` or `user.profile_image`
5. **Order Time** → Automatically set to current timestamp

---

## Setup Required

Run this SQL script first:
- `ADD_CUSTOMER_PROFILE_TO_ORDERS.sql` - Adds the new columns

Or run:
- `ENSURE_ALL_DATA_SAVED.sql` - Includes all columns (updated)

---

## Example Order Record

After checkout, an order record will look like:

```json
{
  "id": "uuid-here",
  "customer_id": "user-uuid",
  "customer_name": "Ben H. Hassan",
  "customer_email": "benh19193@gmail.com",
  "customer_phone": "09973625731",
  "customer_profile_image": "https://supabase.co/storage/.../profile.jpg",
  "shop_id": "shop-uuid",
  "total_amount": 1500.00,
  "payment_method": "Cash on Delivery",
  "shipping_address": "Kasanyangan, Brgy. Sta. Catalina...",
  "contact_number": "09973625731",
  "status": "pending",
  "created_at": "2025-12-07T23:45:30.123Z"
}
```

---

## Benefits

✅ **Complete Customer Info** - Shop owners can see who ordered
✅ **Profile Images** - Visual identification of customers
✅ **Order History** - Track when orders were placed
✅ **Customer Contact** - Easy to contact customers about orders
✅ **Analytics** - Can analyze orders by customer, time, etc.

---

## Notes

- All customer data is pulled from the logged-in user's profile
- If profile image is not set, the field will be empty (not null)
- Order time (`created_at`) is automatically set by PostgreSQL
- Customer name uses fallback: `name` → `full_name` → `email`

