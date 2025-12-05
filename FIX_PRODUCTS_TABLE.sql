-- ============================================
-- FIX PRODUCTS TABLE
-- ============================================
-- Run this to fix the products table
-- ============================================

-- Step 1: Drop the table if it exists (start fresh)
DROP TABLE IF EXISTS products CASCADE;

-- Step 2: Create the products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  brand VARCHAR(255),
  quantity INTEGER DEFAULT 0,
  image_url TEXT,
  category VARCHAR(100),
  ratings DECIMAL(2, 1) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_owner_id ON products(owner_id);
CREATE INDEX idx_products_status ON products(status);

-- Step 4: Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies (allow all operations for now)
CREATE POLICY "Enable read access for products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for products" ON products
  FOR DELETE USING (true);

-- Step 6: Verify table was created
SELECT 
  '✅ Products table created!' AS status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

