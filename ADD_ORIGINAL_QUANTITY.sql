-- ============================================
-- ADD ORIGINAL QUANTITY COLUMN TO PRODUCTS
-- ============================================
-- This tracks the original quantity for stock % calculation
-- ============================================

-- Add original_quantity column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_quantity INTEGER DEFAULT 0;

-- Update existing products to set original_quantity = quantity
UPDATE products 
SET original_quantity = quantity 
WHERE original_quantity = 0 OR original_quantity IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'original_quantity';

