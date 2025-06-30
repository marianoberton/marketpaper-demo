-- =============================================
-- FIX SUPER ADMIN PROFILES - ALLOW NULL COMPANY_ID
-- =============================================

-- First, drop the existing check constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the updated check constraint that includes super_admin
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('super_admin', 'company_owner', 'company_admin', 'manager', 'employee', 'viewer'));

-- Make company_id nullable for super admins
ALTER TABLE user_profiles ALTER COLUMN company_id DROP NOT NULL;

-- Update the constraint to allow NULL company_id for super admins only
ALTER TABLE user_profiles 
ADD CONSTRAINT check_company_id_for_non_super_admins 
CHECK (
  role = 'super_admin' OR company_id IS NOT NULL
);

-- Create a trigger to ensure super admins don't need company_id
CREATE OR REPLACE FUNCTION validate_super_admin_company() 
RETURNS TRIGGER AS $$
BEGIN
  -- If role is super_admin, company_id can be NULL
  IF NEW.role = 'super_admin' AND NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- If role is not super_admin, company_id is required
  IF NEW.role != 'super_admin' AND NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required for non-super-admin users';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_super_admin_company_trigger ON user_profiles;
CREATE TRIGGER validate_super_admin_company_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_super_admin_company();

-- Update existing super admin helper functions to handle NULL company_id
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check both user_profiles and super_admins tables
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Also check super_admins table for backwards compatibility
  IF EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = auth.uid() AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to handle super admins with NULL company_id
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
CREATE POLICY "Users can view profiles" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    is_super_admin() OR 
    (company_id IS NOT NULL AND company_id = get_user_company_id() AND is_company_admin())
  );

DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;  
CREATE POLICY "Users can update profiles" ON user_profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR 
    is_super_admin() OR 
    (company_id IS NOT NULL AND can_manage_user(id, role, company_id))
  );

DROP POLICY IF EXISTS "Can insert user profiles" ON user_profiles;
CREATE POLICY "Can insert user profiles" ON user_profiles
  FOR INSERT
  WITH CHECK (
    is_super_admin() OR 
    (company_id IS NOT NULL AND can_manage_user(id, role, company_id))
  );

-- Allow super admins to be created without company_id
DROP POLICY IF EXISTS "Can delete user profiles" ON user_profiles;
CREATE POLICY "Can delete user profiles" ON user_profiles
  FOR DELETE
  USING (
    is_super_admin() OR 
    (company_id IS NOT NULL AND can_manage_user(id, role, company_id))
  );