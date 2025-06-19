-- Create modules table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    route_path TEXT NOT NULL,
    icon TEXT, -- Lucide icon name, e.g., 'Home', 'Users', 'Settings'
    category TEXT NOT NULL CHECK (category IN ('Dashboard', 'Workspace')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments to modules table for clarity
COMMENT ON TABLE modules IS 'Stores customizable modules that can be assigned to company templates.';
COMMENT ON COLUMN modules.name IS 'Display name of the module.';
COMMENT ON COLUMN modules.route_path IS 'The URL path for the module, e.g., /document-management.';
COMMENT ON COLUMN modules.icon IS 'The name of the lucide-react icon to display in the sidebar.';
COMMENT ON COLUMN modules.category IS 'The section of the sidebar where the module will appear (e.g., Dashboard, Workspace).';

-- Create template_modules pivot table
CREATE TABLE template_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_template_module UNIQUE (template_id, module_id)
);

-- Add comments to template_modules table
COMMENT ON TABLE template_modules IS 'Joins templates with their assigned modules.';
COMMENT ON COLUMN template_modules.template_id IS 'Foreign key to the templates table.';
COMMENT ON COLUMN template_modules.module_id IS 'Foreign key to the modules table.';

-- Enable RLS for the new tables
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_modules ENABLE ROW LEVEL SECURITY;

-- Create policies for modules
-- Super admins can manage all modules
CREATE POLICY "Super admins can manage modules" ON modules
    FOR ALL
    USING (is_super_admin(auth.uid()))
    WITH CHECK (is_super_admin(auth.uid()));

-- Authenticated users can read modules (to display in sidebar)
CREATE POLICY "Authenticated users can read modules" ON modules
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policies for template_modules
-- Super admins can manage all template_modules
CREATE POLICY "Super admins can manage template_modules" ON template_modules
    FOR ALL
    USING (is_super_admin(auth.uid()))
    WITH CHECK (is_super_admin(auth.uid()));

-- Authenticated users can read template_modules (to display in sidebar)
CREATE POLICY "Authenticated users can read template_modules" ON template_modules
    FOR SELECT
    USING (auth.role() = 'authenticated'); 