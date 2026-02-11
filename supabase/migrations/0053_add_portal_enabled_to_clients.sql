-- Add portal_enabled column to clients table
-- This allows companies to control which clients have access to the client portal

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_portal_enabled
ON clients(portal_enabled) WHERE portal_enabled = true;

-- Add comment
COMMENT ON COLUMN clients.portal_enabled IS 'Whether this client has access to the client portal';
