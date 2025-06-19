-- MIGRATION SCRIPT: Seed Standard Modules (v2)
-- Adds a unique constraint and fixes the ON CONFLICT clause.

-- Step 1: Add a UNIQUE constraint to the 'name' column if it doesn't exist
ALTER TABLE public.modules
ADD CONSTRAINT modules_name_unique UNIQUE (name);

-- Step 2: Add the featureId column to link modules to company features
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS "featureId" TEXT;

-- Step 3: Insert the standard modules into the table.
-- This is idempotent; the ON CONFLICT (name) clause prevents duplicates.
INSERT INTO public.modules (name, route_path, icon, category, "featureId") VALUES
  -- Dashboard Category
  ('Overview', '/workspace', 'LayoutDashboard', 'Dashboard', 'overview'),
  ('Marketing', '/workspace/marketing', 'Megaphone', 'Dashboard', 'marketing'),
  ('Ventas', '/workspace/sales', 'TrendingUp', 'Dashboard', 'sales'),
  ('Analytics', '/workspace/analytics', 'BarChart3', 'Dashboard', 'analytics'),
  
  -- Workspace Category
  ('CRM', '/workspace/crm', 'Users', 'Workspace', 'crm'),
  ('Proyectos', '/workspace/projects', 'Briefcase', 'Workspace', 'projects'),
  ('Documentos', '/workspace/documents', 'FileText', 'Workspace', 'documents'),
  ('Calendario', '/workspace/calendar', 'Calendar', 'Workspace', 'calendar'),
  ('Equipo', '/workspace/team', 'Building2', 'Workspace', 'team'),
  ('Knowledge', '/workspace/knowledge', 'BookOpen', 'Workspace', 'knowledge'),
  ('Bots', '/workspace/bots', 'Bot', 'Workspace', 'bots'),
  ('Gastos', '/workspace/expenses', 'Receipt', 'Workspace', 'expenses'),
  ('Configuración', '/workspace/settings', 'Settings', 'Workspace', 'settings')

ON CONFLICT (name) DO NOTHING;

-- Note: The "construccion" module is assumed to be in the table already.
-- If not, you can add it with a similar INSERT statement.
-- Example:
-- INSERT INTO public.modules (name, route_path, icon, category, "featureId") VALUES
--   ('Construccion', '/workspace/construccion', 'Cpu', 'Workspace', 'construccion')
-- ON CONFLICT (name) DO NOTHING; 