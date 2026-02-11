-- Add client_portal_enabled to companies table
-- This allows super admins to control which companies have access to the client portal feature

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS client_portal_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN companies.client_portal_enabled IS 'Whether this company has the client portal feature enabled';

-- Set to true for INTED (assuming it exists)
-- You can update this manually in Supabase Dashboard for specific companies
