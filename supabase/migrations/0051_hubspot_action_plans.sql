-- Migration: Create hubspot_action_plans table
-- For storing AI-generated action plans for HubSpot deals

CREATE TABLE IF NOT EXISTS hubspot_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('urgent', 'normal', 'low')),
  next_steps JSONB NOT NULL DEFAULT '[]',
  suggested_approach TEXT,
  risk_assessment TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, deal_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hubspot_action_plans_company_id 
  ON hubspot_action_plans(company_id);

CREATE INDEX IF NOT EXISTS idx_hubspot_action_plans_deal_id 
  ON hubspot_action_plans(deal_id);

CREATE INDEX IF NOT EXISTS idx_hubspot_action_plans_expires_at 
  ON hubspot_action_plans(expires_at);

-- Enable RLS
ALTER TABLE hubspot_action_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies (3-layer pattern)

-- Super admin access
CREATE POLICY "Super admins full access" ON hubspot_action_plans
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Company admin access
CREATE POLICY "Company admins manage action plans" ON hubspot_action_plans
  FOR ALL
  USING (company_id = get_user_company_id() AND is_company_admin())
  WITH CHECK (company_id = get_user_company_id() AND is_company_admin());

-- Users read own company
CREATE POLICY "Users read own company action plans" ON hubspot_action_plans
  FOR SELECT
  USING (is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = get_user_company_id()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_hubspot_action_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hubspot_action_plans_updated_at ON hubspot_action_plans;
CREATE TRIGGER trigger_hubspot_action_plans_updated_at
  BEFORE UPDATE ON hubspot_action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_hubspot_action_plans_updated_at();

-- Comment on table
COMMENT ON TABLE hubspot_action_plans IS 'AI-generated action plans for HubSpot deals with price analysis and follow-up suggestions';
