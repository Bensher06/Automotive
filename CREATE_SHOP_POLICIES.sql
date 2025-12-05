-- ============================================
-- CREATE SHOP POLICIES FOR STORE OWNER LOGIN
-- ============================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- Then click "Run" (or press Ctrl+Enter)
-- ============================================

-- Step 1: Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON shops;

-- Step 2: Create the policy (this is the critical one for login to work)
CREATE POLICY "Shop owners can view their own shops"
  ON shops FOR SELECT
  USING (auth.uid() = owner_id);

-- Step 3: Verify it was created
SELECT 
  policyname,
  cmd AS command
FROM pg_policies 
WHERE tablename = 'shops' 
  AND policyname = 'Shop owners can view their own shops';

-- ============================================
-- If you see a row returned, the policy was created successfully!
-- ============================================

