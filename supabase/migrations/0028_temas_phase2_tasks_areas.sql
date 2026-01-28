-- =====================================================
-- MÓDULO DE TEMAS - FASE 2
-- =====================================================
-- Extensión: Áreas, Tareas, Notificaciones, Organismo
-- =====================================================

-- =====================================================
-- 1. TABLA DE ÁREAS (Departamentos)
-- =====================================================

CREATE TABLE IF NOT EXISTS tema_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366F1',
    icon TEXT DEFAULT 'building',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

-- =====================================================
-- 2. MODIFICAR TABLAS EXISTENTES
-- =====================================================

-- Agregar area_id a tema_types
ALTER TABLE tema_types ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES tema_areas(id) ON DELETE SET NULL;

-- Agregar campos a temas
ALTER TABLE temas ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES tema_areas(id) ON DELETE SET NULL;
ALTER TABLE temas ADD COLUMN IF NOT EXISTS expediente_number TEXT;
ALTER TABLE temas ADD COLUMN IF NOT EXISTS organismo TEXT CHECK (organismo IS NULL OR organismo IN ('DGROC', 'AGC', 'otro'));

-- Agregar is_lead a tema_assignees
ALTER TABLE tema_assignees ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT false;

-- =====================================================
-- 3. TABLA DE TAREAS DE UN TEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS tema_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    
    -- Información de la tarea
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    
    -- Asignación
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Orden y dependencias
    sort_order INTEGER DEFAULT 0,
    depends_on UUID[], -- Array de task IDs
    is_sequential BOOLEAN DEFAULT true,
    
    -- Fechas
    due_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Auditoría
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Contenido
    type TEXT NOT NULL, -- task_ready, tema_assigned, status_changed, task_completed
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    
    -- Referencia opcional
    tema_id UUID REFERENCES temas(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tema_tasks(id) ON DELETE CASCADE,
    
    -- Estado
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA DE PLANTILLAS DE TAREAS (para futuro)
-- =====================================================

CREATE TABLE IF NOT EXISTS tema_task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tema_type_id UUID NOT NULL REFERENCES tema_types(id) ON DELETE CASCADE,
    
    -- Definición de la tarea
    title TEXT NOT NULL,
    description TEXT,
    default_assignee_role TEXT DEFAULT 'member', -- lead, member
    
    -- Orden y dependencias
    sort_order INTEGER DEFAULT 0,
    is_sequential BOOLEAN DEFAULT true,
    days_offset INTEGER DEFAULT 0, -- días desde inicio del tema
    
    -- Configuración
    notify_on_ready BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tema_areas_company ON tema_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_tema_tasks_tema ON tema_tasks(tema_id);
CREATE INDEX IF NOT EXISTS idx_tema_tasks_assigned ON tema_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tema_tasks_status ON tema_tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_temas_area ON temas(area_id);
CREATE INDEX IF NOT EXISTS idx_temas_organismo ON temas(organismo);
CREATE INDEX IF NOT EXISTS idx_temas_expediente ON temas(expediente_number);

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger para updated_at en tema_tasks
DROP TRIGGER IF EXISTS trigger_update_tema_task_timestamp ON tema_tasks;
CREATE TRIGGER trigger_update_tema_task_timestamp
    BEFORE UPDATE ON tema_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tema_timestamp();

-- Trigger para updated_at en tema_areas
DROP TRIGGER IF EXISTS trigger_update_tema_area_timestamp ON tema_areas;
CREATE TRIGGER trigger_update_tema_area_timestamp
    BEFORE UPDATE ON tema_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_tema_timestamp();

-- Función para notificar cuando una tarea se completa
CREATE OR REPLACE FUNCTION notify_next_task_assignee()
RETURNS TRIGGER AS $$
DECLARE
    v_next_task RECORD;
    v_tema_title TEXT;
    v_assignee_name TEXT;
BEGIN
    -- Solo si la tarea pasó a completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Obtener título del tema
        SELECT title INTO v_tema_title FROM temas WHERE id = NEW.tema_id;
        
        -- Buscar siguiente tarea pendiente que depende de esta
        SELECT tt.*, up.full_name as assignee_name INTO v_next_task
        FROM tema_tasks tt
        LEFT JOIN user_profiles up ON up.id = tt.assigned_to
        WHERE tt.tema_id = NEW.tema_id
          AND tt.status = 'pending'
          AND NEW.id = ANY(tt.depends_on)
        ORDER BY tt.sort_order
        LIMIT 1;
        
        -- Si hay siguiente tarea asignada, crear notificación
        IF v_next_task.assigned_to IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link, tema_id, task_id)
            VALUES (
                v_next_task.assigned_to,
                'task_ready',
                'Tarea lista para ti',
                'La tarea "' || v_next_task.title || '" del tema "' || v_tema_title || '" está lista.',
                '/workspace/temas/' || NEW.tema_id,
                NEW.tema_id,
                v_next_task.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_next_task ON tema_tasks;
CREATE TRIGGER trigger_notify_next_task
    AFTER UPDATE ON tema_tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_next_task_assignee();

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE tema_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tema_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tema_task_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para tema_areas
DROP POLICY IF EXISTS "Users can view areas for their company" ON tema_areas;
CREATE POLICY "Users can view areas for their company"
    ON tema_areas FOR SELECT
    USING (
        is_super_admin() OR
        company_id = get_my_company_id()
    );

DROP POLICY IF EXISTS "Admins can manage areas" ON tema_areas;
CREATE POLICY "Admins can manage areas"
    ON tema_areas FOR ALL
    USING (
        is_super_admin() OR
        (company_id = get_my_company_id() AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        ))
    );

-- Políticas para tema_tasks
DROP POLICY IF EXISTS "Users can view tasks for their temas" ON tema_tasks;
CREATE POLICY "Users can view tasks for their temas"
    ON tema_tasks FOR SELECT
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_tasks.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "Users can manage tasks for their temas" ON tema_tasks;
CREATE POLICY "Users can manage tasks for their temas"
    ON tema_tasks FOR ALL
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM temas
            WHERE temas.id = tema_tasks.tema_id
            AND temas.company_id = get_my_company_id()
        )
    );

-- Políticas para notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Políticas para tema_task_templates
DROP POLICY IF EXISTS "Users can view templates for their company" ON tema_task_templates;
CREATE POLICY "Users can view templates for their company"
    ON tema_task_templates FOR SELECT
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM tema_types tt
            WHERE tt.id = tema_task_templates.tema_type_id
            AND tt.company_id = get_my_company_id()
        )
    );

DROP POLICY IF EXISTS "Admins can manage templates" ON tema_task_templates;
CREATE POLICY "Admins can manage templates"
    ON tema_task_templates FOR ALL
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM tema_types tt
            JOIN user_profiles up ON up.company_id = tt.company_id
            WHERE tt.id = tema_task_templates.tema_type_id
            AND up.id = auth.uid()
            AND up.role IN ('admin', 'owner')
        )
    );

-- =====================================================
-- 9. COMENTARIOS
-- =====================================================

COMMENT ON TABLE tema_areas IS 'Áreas o departamentos de la empresa (Construcción, Concesiones BAC, etc.)';
COMMENT ON TABLE tema_tasks IS 'Tareas individuales dentro de un tema';
COMMENT ON TABLE notifications IS 'Notificaciones in-app para usuarios';
COMMENT ON TABLE tema_task_templates IS 'Plantillas de tareas que se crean automáticamente al crear un tema de cierto tipo';

COMMENT ON COLUMN temas.expediente_number IS 'Número de expediente oficial';
COMMENT ON COLUMN temas.organismo IS 'Organismo ante el cual se tramita: DGROC, AGC, u otro';
COMMENT ON COLUMN tema_assignees.is_lead IS 'Indica si es el responsable líder del tema';
COMMENT ON COLUMN tema_tasks.depends_on IS 'Array de IDs de tareas que deben completarse antes';
COMMENT ON COLUMN tema_tasks.is_sequential IS 'Si true, esta tarea debe esperar a sus dependencias';
