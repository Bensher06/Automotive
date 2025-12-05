-- ============================================
-- CHECK PROFILES TABLE COLUMNS
-- ============================================
-- Run this to see what columns actually exist in your profiles table
-- ============================================

-- Check all columns in profiles table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- This will show you the exact column names
-- Common possibilities: name, full_name, or both
-- ============================================

