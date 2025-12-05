-- ============================================
-- CREATE PRODUCTS TABLE FOR STORE OWNERS
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the products table
CREATE TABLE IF NOT EXISTS products (
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
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, out_of_stock
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Step 3: Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Shop owners can manage their products" ON products;
DROP POLICY IF EXISTS "Shop owners can insert products" ON products;
DROP POLICY IF EXISTS "Shop owners can update products" ON products;
DROP POLICY IF EXISTS "Shop owners can delete products" ON products;

-- Step 5: Create RLS policies

-- Anyone can view active products (for marketplace)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT
  USING (status = 'active' OR auth.uid() = owner_id);

-- Shop owners can insert their own products
CREATE POLICY "Shop owners can insert products" ON products
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Shop owners can update their own products
CREATE POLICY "Shop owners can update products" ON products
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Shop owners can delete their own products
CREATE POLICY "Shop owners can delete products" ON products
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Step 7: Verify table was created
SELECT 
  '✅ Products table created!' AS status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- ============================================
-- NOTES:
-- ============================================
-- After running this, you also need to create a storage bucket:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket called "product-images"
-- 3. Make it PUBLIC (so images can be displayed)
-- 4. Add policies to allow authenticated users to upload
-- ============================================

