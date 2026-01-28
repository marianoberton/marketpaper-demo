-- =============================================
-- INVITATION AND APPROVAL SYSTEM
-- =============================================

-- Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Role assignment
  target_role VARCHAR(50) DEFAULT 'employee' CHECK (target_role IN ('company_admin', 'manager', 'employee', 'viewer')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Approval flow
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Token for invitation link
  token UUID DEFAULT gen_random_uuid(),
  
  -- Unique constraint: one pending invitation per email per company
  UNIQUE (email, company_id, status)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_status ON company_invitations(status);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(token);

-- Enable RLS
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
DROP POLICY IF EXISTS "Company admins can manage invitations" ON company_invitations;
DROP POLICY IF EXISTS "Super admins can manage all invitations" ON company_invitations;

-- Super admins can manage all invitations
CREATE POLICY "Super admins can manage all invitations" ON company_invitations
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Company owners/admins can manage their company's invitations
CREATE POLICY "Company admins can manage invitations" ON company_invitations
  FOR ALL
  USING (
    company_id = get_user_company_id() AND is_company_admin()
  )
  WITH CHECK (
    company_id = get_user_company_id() AND is_company_admin()
  );

-- =============================================
-- ADD can_approve_users TO user_profiles
-- =============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'can_approve_users') THEN
    ALTER TABLE user_profiles ADD COLUMN can_approve_users BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN user_profiles.can_approve_users IS 'Whether this user can approve new user registrations for their company';
  END IF;
END $$;

-- Company owners always can approve (trigger)
CREATE OR REPLACE FUNCTION set_owner_can_approve()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'company_owner' THEN
    NEW.can_approve_users = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_owner_can_approve ON user_profiles;
CREATE TRIGGER set_owner_can_approve
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_owner_can_approve();

-- =============================================
-- PENDING USERS TABLE
-- =============================================

-- Create pending_users table to track users awaiting approval
CREATE TABLE IF NOT EXISTS pending_company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User info
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  
  -- Company and role
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_role VARCHAR(50) DEFAULT 'employee',
  
  -- Invitation reference (if came from invitation)
  invitation_id UUID REFERENCES company_invitations(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  UNIQUE (user_id, company_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_users_company_id ON pending_company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_pending_users_status ON pending_company_users(status);

-- Enable RLS
ALTER TABLE pending_company_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own pending status" ON pending_company_users;
DROP POLICY IF EXISTS "Company approvers can manage pending users" ON pending_company_users;

-- Users can view their own pending status
CREATE POLICY "Users can view their own pending status" ON pending_company_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Company approvers can manage pending users
CREATE POLICY "Company approvers can manage pending users" ON pending_company_users
  FOR ALL
  USING (
    company_id = get_user_company_id() AND 
    (is_company_admin() OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND can_approve_users = TRUE
    ))
  )
  WITH CHECK (
    company_id = get_user_company_id() AND 
    (is_company_admin() OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND can_approve_users = TRUE
    ))
  );

-- Super admins can manage all
CREATE POLICY "Super admins can manage all pending users" ON pending_company_users
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- =============================================
-- HELPER FUNCTION: Can approve users
-- =============================================

CREATE OR REPLACE FUNCTION can_approve_company_users()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_can_approve BOOLEAN;
BEGIN
  SELECT role, can_approve_users INTO user_role, user_can_approve 
  FROM user_profiles WHERE id = auth.uid();
  
  -- Owner always can
  IF user_role = 'company_owner' THEN
    RETURN TRUE;
  END IF;
  
  -- Check explicit permission
  RETURN COALESCE(user_can_approve, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing company owners to have can_approve_users = true
UPDATE user_profiles SET can_approve_users = TRUE WHERE role = 'company_owner';
