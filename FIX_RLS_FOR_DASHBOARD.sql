-- ============================================
-- Fix RLS Policies for Dashboard Data Access
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix order_items RLS policies
DROP POLICY IF EXISTS "Shop owners can view order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;

-- Allow shop owners to view order_items for their shop's orders
CREATE POLICY "Shop owners can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN shops ON orders.shop_id = shops.id
      WHERE order_items.order_id = orders.id 
        AND shops.owner_id = auth.uid()
    )
  );

-- Allow anyone to insert order_items (for checkout)
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- 2. Fix orders RLS policies
DROP POLICY IF EXISTS "Shop owners can view orders for their shops" ON orders;
CREATE POLICY "Shop owners can view orders for their shops" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()
    )
  );

-- 3. Ensure orders table has customer_name
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 4. Ensure order_items has product_name
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;

-- 5. Update existing order_items with product names
UPDATE order_items oi
SET product_name = p.name
FROM products p
WHERE oi.product_id = p.id 
  AND (oi.product_name IS NULL OR oi.product_name = '');

-- 6. Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- 7. Test query (should work for shop owners)
-- Replace 'YOUR_SHOP_ID' with an actual shop_id
-- SELECT 
--   o.id as order_id,
--   o.customer_name,
--   o.total_amount,
--   oi.product_name,
--   oi.quantity,
--   oi.price
-- FROM orders o
-- JOIN order_items oi ON o.id = oi.order_id
-- WHERE o.shop_id = 'YOUR_SHOP_ID'
-- LIMIT 5;

SELECT 'RLS policies updated! Check the policies list above.' AS status;

