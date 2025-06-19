-- Mejoras para el módulo de construcción
-- Tabla de clientes (si no existe)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    contact_person TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitamos RLS para clientes
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
CREATE POLICY "Authenticated users can view clients"
ON clients FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
CREATE POLICY "Authenticated users can create clients"
ON clients FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
CREATE POLICY "Authenticated users can update clients"
ON clients FOR UPDATE
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

-- Añadir client_id a la tabla projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Añadir más campos específicos para construcción
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'Planificación';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS permit_status TEXT DEFAULT 'Pendiente';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inspector_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabla para etapas predefinidas de proyectos
CREATE TABLE IF NOT EXISTS project_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para project_stages
ALTER TABLE project_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view project stages" ON project_stages;
CREATE POLICY "Authenticated users can view project stages"
ON project_stages FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

DROP POLICY IF EXISTS "Authenticated users can manage project stages" ON project_stages;
CREATE POLICY "Authenticated users can manage project stages"
ON project_stages FOR ALL
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id()) );

-- Insertar etapas predefinidas para todas las compañías existentes
INSERT INTO project_stages (company_id, name, description, "order", color)
SELECT 
    c.id,
    stage_data.name,
    stage_data.description,
    stage_data."order",
    stage_data.color
FROM companies c
CROSS JOIN (
    VALUES 
    ('Planificación', 'Fase inicial de planificación del proyecto', 1, '#6B7280'),
    ('Permisos', 'Tramitación de permisos municipales', 2, '#F59E0B'),
    ('Demolición', 'Demolición de estructuras existentes', 3, '#EF4444'),
    ('Excavación 10%', 'Excavación inicial 10%', 4, '#8B5CF6'),
    ('Excavación 50%', 'Excavación al 50%', 5, '#8B5CF6'),
    ('AVO 1', 'Apto Verificación de Obra 1', 6, '#10B981'),
    ('AVO 2', 'Apto Verificación de Obra 2', 7, '#10B981'),
    ('AVO 3', 'Apto Verificación de Obra 3', 8, '#10B981'),
    ('AVO 4', 'Apto Verificación de Obra 4', 9, '#10B981'),
    ('Paralización', 'Obra paralizada', 10, '#F97316'),
    ('Finalización', 'Obra completada', 11, '#059669')
) AS stage_data(name, description, "order", color)
ON CONFLICT DO NOTHING;

-- Mejoras en project_sections para categorías específicas
ALTER TABLE project_sections ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE project_sections ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Insertar secciones predefinidas para todos los proyectos existentes
WITH default_sections AS (
    SELECT 
        p.id as project_id,
        section_data.name,
        section_data."order",
        section_data.icon,
        section_data.is_system
    FROM projects p
    CROSS JOIN (
        VALUES 
        ('Planos de Proyecto e Instalaciones', 1, '📐', true),
        ('Documentación Municipal y Gestoría', 2, '🏛️', true),
        ('Servicios Públicos', 3, '⚡', true),
        ('Profesionales Intervinientes', 4, '👷', true),
        ('Seguros y Documentación Administrativa', 5, '📋', true),
        ('Pagos y Comprobantes', 6, '💰', true)
    ) AS section_data(name, "order", icon, is_system)
)
INSERT INTO project_sections (project_id, name, "order", icon, is_system)
SELECT project_id, name, "order", icon, is_system
FROM default_sections
ON CONFLICT DO NOTHING;

-- Función para crear secciones automáticamente cuando se crea un proyecto
CREATE OR REPLACE FUNCTION create_default_project_sections()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_sections (project_id, name, "order", icon, is_system)
    VALUES 
        (NEW.id, 'Planos de Proyecto e Instalaciones', 1, '📐', true),
        (NEW.id, 'Documentación Municipal y Gestoría', 2, '🏛️', true),
        (NEW.id, 'Servicios Públicos', 3, '⚡', true),
        (NEW.id, 'Profesionales Intervinientes', 4, '👷', true),
        (NEW.id, 'Seguros y Documentación Administrativa', 5, '📋', true),
        (NEW.id, 'Pagos y Comprobantes', 6, '💰', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear secciones automáticamente
DROP TRIGGER IF EXISTS trigger_create_default_sections ON projects;
CREATE TRIGGER trigger_create_default_sections
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_project_sections();

-- Tabla para seguimiento de cambios de estado
CREATE TABLE IF NOT EXISTS project_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    previous_stage TEXT,
    new_stage TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para project_status_history
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view status history" ON project_status_history;
CREATE POLICY "Authenticated users can view status history"
ON project_status_history FOR SELECT
USING ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE company_id = public.get_my_company_id())) );

DROP POLICY IF EXISTS "Authenticated users can create status history" ON project_status_history;
CREATE POLICY "Authenticated users can create status history"
ON project_status_history FOR INSERT
WITH CHECK ( public.is_super_admin() OR (auth.uid() IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE company_id = public.get_my_company_id())) );

-- Función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION track_project_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
        INSERT INTO project_status_history (project_id, previous_stage, new_stage, changed_by)
        VALUES (NEW.id, OLD.current_stage, NEW.current_stage, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar cambios de estado
DROP TRIGGER IF EXISTS trigger_track_status_changes ON projects;
CREATE TRIGGER trigger_track_status_changes
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION track_project_status_changes();

-- Añadir índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_current_stage ON projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_project_id ON project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id); 