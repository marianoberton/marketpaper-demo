-- =====================================================
-- MÓDULO DE TEMAS (Gestión de Proyectos/Trabajos)
-- =====================================================
-- Sistema independiente para seguimiento de temas/expedientes
-- Multi-tenant con soporte para múltiples responsables
-- =====================================================

-- 1. Tabla de tipos de tema (configurable por empresa)
CREATE TABLE IF NOT EXISTS tema_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6B7280',
    icon TEXT DEFAULT 'folder',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

-- 2. Tabla principal de temas
CREATE TABLE IF NOT EXISTS temas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type_id UUID REFERENCES tema_types(id) ON DELETE SET NULL,
    
    -- Información básica
    title TEXT NOT NULL,
    description TEXT,
    reference_code TEXT, -- Número de expediente o referencia
    
    -- Estado y prioridad
    status TEXT NOT NULL DEFAULT 'nuevo_expediente' CHECK (status IN (
        'nuevo_expediente',
        'caratulado', 
        'seguimiento',
        'subsanacion',
        'observado',
        'subsanacion_cerrada',
        'completado',
        'finalizado'
    )),
    priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta')),
    
    -- Fechas
    due_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Auditoría
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de asignaciones (múltiples responsables)
CREATE TABLE IF NOT EXISTS tema_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'responsable', -- responsable, colaborador, revisor
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    UNIQUE(tema_id, user_id)
);

-- 4. Tabla de historial/actividad
CREATE TABLE IF NOT EXISTS tema_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- created, status_changed, assigned, comment, etc.
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_temas_company ON temas(company_id);
CREATE INDEX IF NOT EXISTS idx_temas_status ON temas(status);
CREATE INDEX IF NOT EXISTS idx_temas_priority ON temas(priority);
CREATE INDEX IF NOT EXISTS idx_temas_created ON temas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_temas_due_date ON temas(due_date);
CREATE INDEX IF NOT EXISTS idx_temas_type ON temas(type_id);

CREATE INDEX IF NOT EXISTS idx_tema_assignees_tema ON tema_assignees(tema_id);
CREATE INDEX IF NOT EXISTS idx_tema_assignees_user ON tema_assignees(user_id);

CREATE INDEX IF NOT EXISTS idx_tema_activity_tema ON tema_activity(tema_id);
CREATE INDEX IF NOT EXISTS idx_tema_activity_created ON tema_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tema_types_company ON tema_types(company_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_tema_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tema_timestamp ON temas;
CREATE TRIGGER trigger_update_tema_timestamp
    BEFORE UPDATE ON temas
    FOR EACH ROW
    EXECUTE FUNCTION update_tema_timestamp();

DROP TRIGGER IF EXISTS trigger_update_tema_type_timestamp ON tema_types;
CREATE TRIGGER trigger_update_tema_type_timestamp
    BEFORE UPDATE ON tema_types
    FOR EACH ROW
    EXECUTE FUNCTION update_tema_timestamp();

-- Función para registrar cambios de estado
CREATE OR REPLACE FUNCTION log_tema_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO tema_activity (tema_id, user_id, action, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_tema_status ON temas;
CREATE TRIGGER trigger_log_tema_status
    AFTER UPDATE ON temas
    FOR EACH ROW
    EXECUTE FUNCTION log_tema_status_change();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tema_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tema_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tema_activity ENABLE ROW LEVEL SECURITY;

-- Políticas para tema_types
DROP POLICY IF EXISTS "Users can view tema types for their company" ON tema_types;
CREATE POLICY "Users can view tema types for their company"
    ON tema_types FOR SELECT
    USING (
        is_super_admin() OR
        company_id = get_my_company_id()
    );

DROP POLICY IF EXISTS "Admins can manage tema types" ON tema_types;
CREATE POLICY "Admins can manage tema types"
    ON tema_types FOR ALL
    USING (
        is_super_admin() OR
        (company_id = get_my_company_id() AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        ))
    );

-- Políticas para temas
DROP POLICY IF EXISTS "Users can view temas for their company" ON temas;
CREATE POLICY "Users can view temas for their company"
    ON temas FOR SELECT
    USING (
        is_super_admin() OR
        company_id = get_my_company_id()
    );

DROP POLICY IF EXISTS "Users can create temas for their company" ON temas;
CREATE POLICY "Users can create temas for their company"
    ON temas FOR INSERT
    WITH CHECK (
        is_super_admin() OR
        company_id = get_my_company_id()
    );

DROP POLICY IF EXISTS "Users can update temas for their company" ON temas;
CREATE POLICY "Users can update temas for their company"
    ON temas FOR UPDATE
    USING (
        is_super_admin() OR
        company_id = get_my_company_id()
    );

DROP POLICY IF EXISTS "Admins can delete temas" ON temas;
CREATE POLICY "Admins can delete temas"
    ON temas FOR DELETE
    USING (
        is_super_admin() OR
        (company_id = get_my_company_id() AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        ))
    );

-- Políticas para tema_assignees
DROP POLICY IF EXISTS "Users can view tema assignees" ON tema_assignees;
CREATE POLICY "Users can view tema assignees"
    ON tema_assignees FOR SELECT
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_assignees.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "Users can manage tema assignees" ON tema_assignees;
CREATE POLICY "Users can manage tema assignees"
    ON tema_assignees FOR ALL
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_assignees.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

-- Políticas para tema_activity
DROP POLICY IF EXISTS "Users can view tema activity" ON tema_activity;
CREATE POLICY "Users can view tema activity"
    ON tema_activity FOR SELECT
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_activity.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "System can insert tema activity" ON tema_activity;
CREATE POLICY "System can insert tema activity"
    ON tema_activity FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE temas IS 'Temas/expedientes/trabajos del sistema de gestión';
COMMENT ON TABLE tema_types IS 'Tipos de tema configurables por empresa';
COMMENT ON TABLE tema_assignees IS 'Asignaciones de responsables a temas (múltiples)';
COMMENT ON TABLE tema_activity IS 'Historial de actividad y cambios en temas';

COMMENT ON COLUMN temas.status IS 'Estado del tema: nuevo_expediente, caratulado, seguimiento, subsanacion, observado, subsanacion_cerrada, completado, finalizado';
COMMENT ON COLUMN temas.priority IS 'Prioridad: baja, media, alta';
COMMENT ON COLUMN temas.reference_code IS 'Número de expediente o código de referencia externo';
