-- =============================================
-- UPDATE USER SYSTEM FOR MULTI-TENANT WITH ROLES
-- =============================================

-- First, check if user_profiles table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Create user_profiles table
    CREATE TABLE user_profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Información básica
      email VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      avatar_url TEXT,
      
      -- Multi-tenant
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      
      -- Rol y permisos
      role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('super_admin', 'company_owner', 'company_admin', 'manager', 'employee', 'viewer')),
      
      -- Estado
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      last_login TIMESTAMP WITH TIME ZONE,
      
      -- Configuración personal
      preferences JSONB DEFAULT '{}',
      timezone VARCHAR(50) DEFAULT 'UTC',
      locale VARCHAR(10) DEFAULT 'es-ES'
    );

    -- Índices para user_profiles
    CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
    CREATE INDEX idx_user_profiles_email ON user_profiles(email);
    CREATE INDEX idx_user_profiles_role ON user_profiles(role);
    CREATE INDEX idx_user_profiles_status ON user_profiles(status);

    -- Enable RLS
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Update existing user_profiles table structure if it exists
DO $$ 
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
    ALTER TABLE user_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('super_admin', 'company_owner', 'company_admin', 'manager', 'employee', 'viewer'));
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
    ALTER TABLE user_profiles ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
  END IF;

  -- Add last_login column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login') THEN
    ALTER TABLE user_profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add preferences column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
    ALTER TABLE user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
  END IF;

  -- Add timezone column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'timezone') THEN
    ALTER TABLE user_profiles ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
  END IF;

  -- Add locale column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'locale') THEN
    ALTER TABLE user_profiles ADD COLUMN locale VARCHAR(10) DEFAULT 'es-ES';
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_profiles_role') THEN
    CREATE INDEX idx_user_profiles_role ON user_profiles(role);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_profiles_status') THEN
    CREATE INDEX idx_user_profiles_status ON user_profiles(status);
  END IF;
END $$;

-- Update trigger for user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent users from changing their own role/company
CREATE OR REPLACE FUNCTION prevent_self_role_company_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if user is super admin
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'super_admin') THEN
    RETURN NEW;
  END IF;
  
  -- Allow if user is company owner/admin and changing other user's data
  IF NEW.id != auth.uid() AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND company_id = NEW.company_id 
    AND role IN ('company_owner', 'company_admin')
  ) THEN
    RETURN NEW;
  END IF;
  
  -- If user is updating their own profile, prevent role and company_id changes
  IF NEW.id = auth.uid() THEN
    NEW.role = OLD.role;
    NEW.company_id = OLD.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop triggers if exist and recreate
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS prevent_self_role_company_change ON user_profiles;

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

CREATE TRIGGER prevent_self_role_company_change 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_self_role_company_change();

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- =============================================

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'super_admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is company admin
CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role IN ('company_owner', 'company_admin'), FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
  user_company_id UUID;
BEGIN
  SELECT company_id INTO user_company_id FROM user_profiles WHERE id = auth.uid();
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage another user
CREATE OR REPLACE FUNCTION can_manage_user(target_user_id UUID, target_role TEXT, target_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  current_user_company_id UUID;
BEGIN
  SELECT role, company_id INTO current_user_role, current_user_company_id 
  FROM user_profiles WHERE id = auth.uid();
  
  -- Super admin can manage anyone
  IF current_user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Must be in same company
  IF current_user_company_id != target_company_id THEN
    RETURN FALSE;
  END IF;
  
  -- Company owners can manage admins, managers, employees, viewers
  IF current_user_role = 'company_owner' THEN
    RETURN target_role IN ('company_admin', 'manager', 'employee', 'viewer');
  END IF;
  
  -- Company admins can manage managers, employees, viewers
  IF current_user_role = 'company_admin' THEN
    RETURN target_role IN ('manager', 'employee', 'viewer');
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES FOR USER_PROFILES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Company admins can view company users" ON user_profiles;
DROP POLICY IF EXISTS "Company admins can manage company users" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Can delete user profiles" ON user_profiles;

-- Create new RLS policies using helper functions
-- Users can view their own profile OR super admins can view all OR company admins can view company users
CREATE POLICY "Users can view profiles" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    is_super_admin() OR 
    (is_company_admin() AND company_id = get_user_company_id())
  );

-- Users can update their own profile OR admins can manage users
CREATE POLICY "Users can update profiles" ON user_profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR 
    is_super_admin() OR 
    can_manage_user(id, role, company_id)
  );

-- Insert policy for creating new users
CREATE POLICY "Can insert user profiles" ON user_profiles
  FOR INSERT
  WITH CHECK (
    is_super_admin() OR 
    (is_company_admin() AND company_id = get_user_company_id() AND role IN ('manager', 'employee', 'viewer'))
  );

-- Delete policy for removing users
CREATE POLICY "Can delete user profiles" ON user_profiles
  FOR DELETE
  USING (
    is_super_admin() OR 
    can_manage_user(id, role, company_id)
  );

-- =============================================
-- UPDATE EXISTING TABLES RLS POLICIES
-- =============================================

-- Update companies table policies to work with new user system
DROP POLICY IF EXISTS "Super admins can manage companies" ON companies;
DROP POLICY IF EXISTS "Company owners can view their company" ON companies;
DROP POLICY IF EXISTS "Company owners can update their company" ON companies;

-- Super admins can manage all companies
CREATE POLICY "Super admins can manage companies" ON companies
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Company owners and admins can view their company
CREATE POLICY "Company owners can view their company" ON companies
  FOR SELECT
  USING (
    id = get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('company_owner', 'company_admin')
    )
  );

-- Only company owners can update their company
CREATE POLICY "Company owners can update their company" ON companies
  FOR UPDATE
  USING (
    id = get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'company_owner'
    )
  )
  WITH CHECK (
    id = get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'company_owner'
    )
  );

-- =============================================
-- SEED DATA (OPTIONAL)
-- =============================================

-- Create a default super admin if none exists
-- This should be run manually with actual credentials
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@marketpaper.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (id, email, full_name, role, status)
SELECT 
  u.id,
  u.email,
  'Super Administrator',
  'super_admin',
  'active'
FROM auth.users u
WHERE u.email = 'admin@marketpaper.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active';
*/ 