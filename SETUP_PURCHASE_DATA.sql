-- ============================================
-- Complete Setup for Purchase Data Storage
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure orders table has all required columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- 2. Ensure order_items table exists with all columns
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add product_name column if missing
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;

-- 3. Ensure sales table exists
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

-- 4. Enable RLS on all tables
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for order_items
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shop owners can view order items" ON order_items;
CREATE POLICY "Shop owners can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN shops s ON o.shop_id = s.id
      WHERE order_items.order_id = o.id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can view their order items" ON order_items;
CREATE POLICY "Customers can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE order_items.order_id = o.id AND o.customer_id = auth.uid()
    )
  );

-- 6. Create RLS policies for sales
DROP POLICY IF EXISTS "Anyone can insert sales" ON sales;
CREATE POLICY "Anyone can insert sales" ON sales
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shop owners can view their sales" ON sales;
CREATE POLICY "Shop owners can view their sales" ON sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops s
      WHERE sales.shop_id = s.id AND s.owner_id = auth.uid()
    )
  );

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- 8. Update existing order_items with product names (if missing)
UPDATE order_items oi
SET product_name = p.name
FROM products p
WHERE oi.product_id = p.id 
  AND (oi.product_name IS NULL OR oi.product_name = '');

-- 9. Verify setup
SELECT 'Tables and policies created successfully!' AS status;

-- Show table structures
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('orders', 'order_items', 'sales')
ORDER BY table_name, ordinal_position;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'sales')
ORDER BY tablename;

