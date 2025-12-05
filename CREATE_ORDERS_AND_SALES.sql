-- ============================================
-- Create Orders and Sales Tables for MotoZapp
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure orders table exists and has correct structure
-- (The orders table should already exist from SUPABASE_SETUP_SQL.sql)
-- Let's add missing columns if needed

-- Add customer_name column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Create sales table for analytics and tracking
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  sale_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Shop owners can view their sales" ON sales;
DROP POLICY IF EXISTS "Shop owners can insert sales" ON sales;
DROP POLICY IF EXISTS "Anyone can insert sales" ON sales;

-- Sales policies
CREATE POLICY "Shop owners can view their sales" ON sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = sales.shop_id AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert sales" ON sales
  FOR INSERT WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 3. Fix order_items table if needed
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;

-- 4. Update RLS policies for orders to allow customers to create
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- 5. Allow shop owners to view order items
DROP POLICY IF EXISTS "Shop owners can view order items" ON order_items;
CREATE POLICY "Shop owners can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN shops ON orders.shop_id = shops.id
      WHERE order_items.order_id = orders.id AND shops.owner_id = auth.uid()
    )
  );

-- 6. Create a view for daily sales summary (optional but useful)
DROP VIEW IF EXISTS daily_sales_summary;
CREATE VIEW daily_sales_summary AS
SELECT 
  shop_id,
  sale_date,
  COUNT(*) as total_orders,
  SUM(amount) as total_sales,
  SUM(quantity) as total_items
FROM sales
GROUP BY shop_id, sale_date
ORDER BY sale_date DESC;

-- Verify
SELECT 'Orders and Sales tables setup complete!' AS status;

-- Show table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders';

