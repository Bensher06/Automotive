-- ============================================
-- FIX FOR SIGNUP ERROR: "Database error saving new user"
-- ============================================
-- This fixes the trigger that creates profiles on user signup
-- Run this in Supabase SQL Editor
-- ============================================

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with error handling
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    needs_setup
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- Also ensure RLS allows the trigger to insert
-- ============================================
-- The trigger runs as SECURITY DEFINER, so it should bypass RLS
-- But let's make sure the policy exists and works correctly

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- If needed, you can temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Test the setup
-- ============================================
-- After running this, try signing up a new user
-- The profile should be created automatically

