-- ============================================
-- Update Orders and Order Items Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure orders table has customer_name column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Ensure order_items table structure is correct
-- (product_name can be fetched via join, but we can add it for easier queries)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;

-- 3. Create a function to auto-update product_name in order_items
CREATE OR REPLACE FUNCTION update_order_item_product_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product_name from products table
  UPDATE order_items
  SET product_name = (SELECT name FROM products WHERE id = NEW.product_id)
  WHERE id = NEW.id AND product_name IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-populate product_name
DROP TRIGGER IF EXISTS trigger_update_order_item_product_name ON order_items;
CREATE TRIGGER trigger_update_order_item_product_name
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_item_product_name();

-- 5. Update existing order_items with product names
UPDATE order_items oi
SET product_name = p.name
FROM products p
WHERE oi.product_id = p.id AND (oi.product_name IS NULL OR oi.product_name = '');

-- 6. Ensure RLS policies allow shop owners to view order_items
DROP POLICY IF EXISTS "Shop owners can view order items" ON order_items;
CREATE POLICY "Shop owners can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN shops ON orders.shop_id = shops.id
      WHERE order_items.order_id = orders.id AND shops.owner_id = auth.uid()
    )
  );

-- 7. Verify the structure
SELECT 
  'orders' as table_name,
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('customer_name', 'customer_email', 'total_amount', 'shop_id')
ORDER BY column_name;

SELECT 
  'order_items' as table_name,
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
  AND column_name IN ('order_id', 'product_id', 'quantity', 'price', 'product_name')
ORDER BY column_name;

SELECT 'Done! All columns are set up correctly.' AS status;

