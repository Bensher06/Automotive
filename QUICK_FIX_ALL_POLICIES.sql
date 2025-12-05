-- ============================================
-- QUICK FIX: CREATE ALL REQUIRED POLICIES
-- ============================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- This will create/fix all policies needed for store owner login
-- ============================================

-- ============================================
-- SHOPS TABLE POLICIES
-- ============================================

-- Critical: Shop owners can view their own shops (needed for login check)
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON shops;
CREATE POLICY "Shop owners can view their own shops"
  ON shops FOR SELECT
  USING (auth.uid() = owner_id);

-- Shop owners can insert their own shops (needed for shop verification)
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON shops;
CREATE POLICY "Shop owners can insert their own shops"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Shop owners can update their own shops
DROP POLICY IF EXISTS "Shop owners can update their own shops" ON shops;
CREATE POLICY "Shop owners can update their own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = owner_id);

-- Public can view verified shops (for marketplace)
DROP POLICY IF EXISTS "Anyone can view verified shops" ON shops;
CREATE POLICY "Anyone can view verified shops"
  ON shops FOR SELECT
  USING (status = 'verified');

-- Admins can view all shops
DROP POLICY IF EXISTS "Admins can view all shops" ON shops;
CREATE POLICY "Admins can view all shops"
  ON shops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update all shops
DROP POLICY IF EXISTS "Admins can update all shops" ON shops;
CREATE POLICY "Admins can update all shops"
  ON shops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can create notifications (for admin approvals)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VERIFICATION: Check all policies were created
-- ============================================
SELECT 
  'shops' AS table_name,
  policyname,
  cmd AS command
FROM pg_policies 
WHERE tablename = 'shops'
UNION ALL
SELECT 
  'notifications' AS table_name,
  policyname,
  cmd AS command
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY table_name, policyname;

-- ============================================
-- DONE! You should see all policies listed above
-- ============================================

