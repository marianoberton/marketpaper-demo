-- =============================================
-- COMPANY INTEGRATIONS - SECURE SECRETS MANAGEMENT
-- =============================================
-- Stores encrypted API keys, tokens (OpenAI, Gemini, HubSpot, etc.)
-- Only accessible by super_admins via admin panel

-- Create the integrations table
CREATE TABLE IF NOT EXISTS company_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Integration identification
  provider VARCHAR(50) NOT NULL,  -- 'openai', 'gemini', 'anthropic', 'hubspot', 'custom'
  name VARCHAR(100) NOT NULL,     -- User-friendly name: "OpenAI Production Key"
  
  -- Encrypted credentials (AES-256-GCM)
  encrypted_credentials TEXT NOT NULL,
  credentials_iv TEXT NOT NULL,
  
  -- Configuration (non-sensitive)
  environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('production', 'sandbox', 'development')),
  config JSONB DEFAULT '{}',      -- Non-sensitive config like base_url, model preferences, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'valid', 'invalid', 'expired')),
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraint: unique integration name per company and provider
  UNIQUE(company_id, provider, name)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_company_integrations_company ON company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_provider ON company_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_company_integrations_active ON company_integrations(company_id, is_active) WHERE is_active = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_company_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_integrations_updated_at ON company_integrations;
CREATE TRIGGER update_company_integrations_updated_at
  BEFORE UPDATE ON company_integrations
  FOR EACH ROW EXECUTE FUNCTION update_company_integrations_updated_at();

-- Enable Row Level Security
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admins can access this table
-- Using the existing is_super_admin() function from 0008_update_user_system.sql
DROP POLICY IF EXISTS "Super admins can manage integrations" ON company_integrations;
CREATE POLICY "Super admins can manage integrations" ON company_integrations
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Audit log table for integration access
CREATE TABLE IF NOT EXISTS company_integrations_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES company_integrations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'accessed', 'rotated'
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_audit_integration ON company_integrations_audit(integration_id);
CREATE INDEX IF NOT EXISTS idx_integrations_audit_action ON company_integrations_audit(action);
CREATE INDEX IF NOT EXISTS idx_integrations_audit_date ON company_integrations_audit(created_at);

-- RLS for audit table
ALTER TABLE company_integrations_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit" ON company_integrations_audit;
CREATE POLICY "Super admins can view audit" ON company_integrations_audit
  FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert audit" ON company_integrations_audit;
CREATE POLICY "Super admins can insert audit" ON company_integrations_audit
  FOR INSERT
  WITH CHECK (is_super_admin());

-- Comment for documentation
COMMENT ON TABLE company_integrations IS 'Stores encrypted API keys and integration credentials per company. Access restricted to super_admins.';
COMMENT ON COLUMN company_integrations.encrypted_credentials IS 'AES-256-GCM encrypted JSON containing sensitive credentials';
COMMENT ON COLUMN company_integrations.credentials_iv IS 'Initialization vector for AES decryption';
