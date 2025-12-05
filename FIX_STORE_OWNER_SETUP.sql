-- ============================================
-- FIX STORE OWNER SETUP (if needed)
-- ============================================
-- Run this ONLY if verification shows missing items
-- ============================================

-- 1. Ensure shops table has status column with correct constraint
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'status'
  ) THEN
    ALTER TABLE shops 
    ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'verified', 'suspended'));
  ELSE
    -- Update constraint if it exists but is wrong
    ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_status_check;
    ALTER TABLE shops 
    ADD CONSTRAINT shops_status_check 
    CHECK (status IN ('pending', 'verified', 'suspended'));
  END IF;
END $$;

-- 2. Ensure RLS is enabled on shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- 3. Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON shops;
CREATE POLICY "Shop owners can view their own shops"
  ON shops FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON shops;
CREATE POLICY "Shop owners can insert their own shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Shop owners can update their own shops" ON shops;
CREATE POLICY "Shop owners can update their own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = owner_id);

-- 4. Ensure notifications table exists (from previous setup)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. Ensure notification policies exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);

-- ============================================
-- DONE!
-- ============================================
-- After running this, verify with VERIFY_STORE_OWNER_SETUP.sql
-- ============================================

