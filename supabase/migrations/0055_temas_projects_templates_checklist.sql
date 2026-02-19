-- =====================================================
-- MÓDULO DE TEMAS - FASE 4: Proyectos, Templates, Checklist
-- =====================================================
-- Migración puramente aditiva. No modifica ni elimina datos existentes.
-- =====================================================

-- =====================================================
-- 1. TABLA tema_projects (agrupador de temas)
-- =====================================================

CREATE TABLE IF NOT EXISTS tema_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Datos del proyecto
    name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    address TEXT,
    gerencia TEXT CHECK (gerencia IS NULL OR gerencia IN ('licitaciones', 'construccion')),
    status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'en_curso', 'pausado', 'completado')),
    responsible_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    start_date DATE,
    estimated_end_date DATE,
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
    notes TEXT,

    -- Auditoría
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tema_projects_company ON tema_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_tema_projects_client ON tema_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tema_projects_status ON tema_projects(status);
CREATE INDEX IF NOT EXISTS idx_tema_projects_responsible ON tema_projects(responsible_id);

-- Trigger updated_at (reutilizar función existente)
DROP TRIGGER IF EXISTS trigger_update_tema_project_timestamp ON tema_projects;
CREATE TRIGGER trigger_update_tema_project_timestamp
    BEFORE UPDATE ON tema_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_tema_timestamp();

-- RLS
ALTER TABLE tema_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins full access tema_projects" ON tema_projects;
CREATE POLICY "Super admins full access tema_projects"
    ON tema_projects FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Users can view projects in their company" ON tema_projects;
CREATE POLICY "Users can view projects in their company"
    ON tema_projects FOR SELECT
    USING (
        is_super_admin() OR
        (auth.uid() IS NOT NULL AND company_id = get_my_company_id())
    );

DROP POLICY IF EXISTS "Users can create projects in their company" ON tema_projects;
CREATE POLICY "Users can create projects in their company"
    ON tema_projects FOR INSERT
    WITH CHECK (
        is_super_admin() OR
        (auth.uid() IS NOT NULL AND company_id = get_my_company_id())
    );

DROP POLICY IF EXISTS "Users can update projects in their company" ON tema_projects;
CREATE POLICY "Users can update projects in their company"
    ON tema_projects FOR UPDATE
    USING (
        is_super_admin() OR
        (auth.uid() IS NOT NULL AND company_id = get_my_company_id())
    );

DROP POLICY IF EXISTS "Admins can delete projects in their company" ON tema_projects;
CREATE POLICY "Admins can delete projects in their company"
    ON tema_projects FOR DELETE
    USING (
        is_super_admin() OR
        (auth.uid() IS NOT NULL AND company_id = get_my_company_id()
         AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('company_owner', 'company_admin')
        ))
    );

-- =====================================================
-- 2. Agregar project_id a temas (nullable para backward compat)
-- =====================================================

ALTER TABLE temas ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES tema_projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_temas_project ON temas(project_id);

-- =====================================================
-- 3. Extender tema_types para servir como templates
-- =====================================================

ALTER TABLE tema_types ADD COLUMN IF NOT EXISTS tareas_template JSONB DEFAULT '[]';
ALTER TABLE tema_types ADD COLUMN IF NOT EXISTS campos_custom_schema JSONB DEFAULT '[]';
ALTER TABLE tema_types ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE tema_types ADD COLUMN IF NOT EXISTS gerencia TEXT CHECK (gerencia IS NULL OR gerencia IN ('licitaciones', 'construccion'));

COMMENT ON COLUMN tema_types.tareas_template IS 'JSON array de tareas predefinidas: [{orden, titulo, tipo, asignado_default, checklist[], dias_estimados}]';
COMMENT ON COLUMN tema_types.campos_custom_schema IS 'JSON array de campos personalizados del template';
COMMENT ON COLUMN tema_types.categoria IS 'Agrupación en el catálogo (ej: Permisos, Conformes, Habilitaciones)';
COMMENT ON COLUMN tema_types.gerencia IS 'Gerencia a la que pertenece el template';

-- =====================================================
-- 4. Agregar checklist y task_type a tema_tasks
-- =====================================================

ALTER TABLE tema_tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';
ALTER TABLE tema_tasks ADD COLUMN IF NOT EXISTS task_type TEXT CHECK (task_type IS NULL OR task_type IN ('interna', 'esperando_cliente'));

COMMENT ON COLUMN tema_tasks.checklist IS 'JSON array de ítems verificables: [{id, label, checked}]';
COMMENT ON COLUMN tema_tasks.task_type IS 'Tipo de tarea: interna o esperando respuesta del cliente';

-- =====================================================
-- 5. Extender tema_attachments para links externos
-- =====================================================

ALTER TABLE tema_attachments ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE tema_attachments ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'upload' CHECK (link_type IN ('upload', 'external_link'));

-- Hacer file_path nullable para soportar links externos
ALTER TABLE tema_attachments ALTER COLUMN file_path DROP NOT NULL;

-- Hacer filename/original_filename nullable para links externos
ALTER TABLE tema_attachments ALTER COLUMN filename DROP NOT NULL;
ALTER TABLE tema_attachments ALTER COLUMN original_filename DROP NOT NULL;

COMMENT ON COLUMN tema_attachments.url IS 'URL externa del documento (Google Drive, etc.)';
COMMENT ON COLUMN tema_attachments.link_type IS 'Tipo: upload (archivo subido) o external_link (URL)';

-- =====================================================
-- 6. Comentarios sobre tablas
-- =====================================================

COMMENT ON TABLE tema_projects IS 'Proyectos que agrupan temas/trámites bajo una obra y un cliente';
