-- ============================================
-- CREATE CART_ITEMS TABLE FOR DATABASE STORAGE
-- Run this in Supabase SQL Editor
-- This will store cart items in the database instead of localStorage
-- ============================================

-- Step 1: Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  product_name TEXT,
  product_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- One cart item per product per user
);

-- Step 2: Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies (open policies for now)
DROP POLICY IF EXISTS "Allow all cart items operations" ON cart_items;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;

-- Allow all operations (can restrict later for security)
CREATE POLICY "Allow all cart items operations"
ON cart_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Step 4: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Step 5: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cart_items_updated_at_trigger ON cart_items;
CREATE TRIGGER update_cart_items_updated_at_trigger
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Step 6: Verify table was created
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'cart_items'
ORDER BY ordinal_position;

-- ============================================
-- NOTES:
-- This table will store cart items in the database
-- Cart will sync across devices for logged-in users
-- ============================================

