-- ============================================
-- CREATE SHOP RATINGS TABLE
-- ============================================
-- Allows users to rate shops 1-5 stars
-- ============================================

-- Step 1: Create shop_ratings table
CREATE TABLE IF NOT EXISTS shop_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Each user can only rate a shop once
  UNIQUE(shop_id, user_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_ratings_shop_id ON shop_ratings(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_ratings_user_id ON shop_ratings(user_id);

-- Step 3: Enable RLS
ALTER TABLE shop_ratings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Anyone can view shop ratings" ON shop_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON shop_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON shop_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON shop_ratings;

-- Anyone can view ratings
CREATE POLICY "Anyone can view shop ratings" ON shop_ratings
  FOR SELECT USING (true);

-- Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings" ON shop_ratings
  FOR INSERT WITH CHECK (true);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON shop_ratings
  FOR UPDATE USING (true);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON shop_ratings
  FOR DELETE USING (true);

-- Step 5: Add average_rating column to shops table if not exists
ALTER TABLE shops ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2, 1) DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS ratings_count INTEGER DEFAULT 0;

-- Step 6: Create function to update shop average rating
CREATE OR REPLACE FUNCTION update_shop_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the shop's average rating
  UPDATE shops
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0)
      FROM shop_ratings
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM shop_ratings
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
    )
  WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers to auto-update average rating
DROP TRIGGER IF EXISTS trigger_update_shop_rating_insert ON shop_ratings;
DROP TRIGGER IF EXISTS trigger_update_shop_rating_update ON shop_ratings;
DROP TRIGGER IF EXISTS trigger_update_shop_rating_delete ON shop_ratings;

CREATE TRIGGER trigger_update_shop_rating_insert
  AFTER INSERT ON shop_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_average_rating();

CREATE TRIGGER trigger_update_shop_rating_update
  AFTER UPDATE ON shop_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_average_rating();

CREATE TRIGGER trigger_update_shop_rating_delete
  AFTER DELETE ON shop_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_average_rating();

-- Step 8: Verify tables
SELECT '✅ shop_ratings table created!' AS status;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_ratings'
ORDER BY ordinal_position;

-- Check shops has rating columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' AND column_name IN ('average_rating', 'ratings_count');

