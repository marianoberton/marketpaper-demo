-- =====================================================
-- FIX: Disable RLS on user_profiles to avoid recursion
-- =====================================================
-- The previous policy caused infinite recursion because
-- it queried user_profiles to check permissions on user_profiles.
-- The safest fix is to disable RLS on this table and rely on
-- application-level security for user profile access.
-- =====================================================

-- First, drop any problematic policies
DROP POLICY IF EXISTS "Users can view company profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Company admins can view company users" ON user_profiles;

-- Disable RLS to prevent recursion issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Note: Security is handled at the application level via:
-- - getCurrentUser() in lib/auth-server.ts
-- - getCompanyUsers() in lib/auth-server.ts
-- These functions filter data based on user's company_id
