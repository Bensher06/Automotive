-- ============================================
-- Verify Role Setup for Authentication
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check current profiles with their roles
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 2. Ensure role column exists and has proper constraint
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- 3. Add CHECK constraint for valid roles (drop existing if any)
DO $$ 
BEGIN
  -- Drop existing constraint if exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'store_owner', 'admin'));

-- 4. Check if trigger exists to automatically create profile on signup
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%profile%' OR trigger_name LIKE '%user%';

-- 5. Create or replace the trigger function to include role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, needs_setup, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Verify the setup
SELECT 'Role setup verified!' AS status;

-- Show all profiles with roles
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.role = 'customer' THEN '🏍️ Rider'
    WHEN p.role = 'store_owner' THEN '🏪 Shop Owner'
    WHEN p.role = 'admin' THEN '🛡️ Admin'
    ELSE '❓ Unknown'
  END AS role_display
FROM profiles p
ORDER BY p.created_at DESC;

