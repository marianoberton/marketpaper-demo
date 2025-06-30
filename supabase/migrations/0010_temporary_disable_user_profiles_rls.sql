-- =============================================
-- TEMPORARY: DISABLE RLS ON USER_PROFILES
-- This is a temporary fix to stop infinite recursion
-- We'll re-enable with proper policies later
-- =============================================

-- Disable RLS on user_profiles table temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Company admins can view company users" ON user_profiles;
DROP POLICY IF EXISTS "Company admins can update company users" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert users" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON user_profiles;

-- Also drop the policies that might still exist from the previous migration
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Can delete user profiles" ON user_profiles;

-- Leave RLS disabled for now - we'll fix this properly later
-- This allows the app to function while we debug the policy issues 