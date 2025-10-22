-- Migración: Sistema de Etapas Completadas
-- Fecha: 2025-01-22
-- Descripción: Agregar funcionalidad para marcar etapas como completadas y ocultar fechas de vigencia

-- 1. Crear tabla para almacenar el estado de completitud de las etapas
CREATE TABLE IF NOT EXISTS project_stage_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(project_id, stage_name)
);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_project_stage_completions_project_id 
ON project_stage_completions(project_id);

CREATE INDEX IF NOT EXISTS idx_project_stage_completions_stage_name 
ON project_stage_completions(stage_name);

CREATE INDEX IF NOT EXISTS idx_project_stage_completions_completed 
ON project_stage_completions(completed);

-- 3. Agregar comentarios descriptivos
COMMENT ON TABLE project_stage_completions IS 'Almacena el estado de completitud de las etapas de cada proyecto';
COMMENT ON COLUMN project_stage_completions.project_id IS 'ID del proyecto al que pertenece la etapa';
COMMENT ON COLUMN project_stage_completions.stage_name IS 'Nombre de la etapa (ej: "Consulta DGIUR", "Permiso de obra")';
COMMENT ON COLUMN project_stage_completions.completed IS 'Indica si la etapa está marcada como completada';
COMMENT ON COLUMN project_stage_completions.completed_at IS 'Fecha y hora cuando se marcó como completada';
COMMENT ON COLUMN project_stage_completions.completed_by IS 'Usuario que marcó la etapa como completada';
COMMENT ON COLUMN project_stage_completions.notes IS 'Notas adicionales sobre la completitud de la etapa';

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_project_stage_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para updated_at
CREATE TRIGGER trigger_update_project_stage_completions_updated_at
    BEFORE UPDATE ON project_stage_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stage_completions_updated_at();

-- 6. Crear función para marcar/desmarcar etapa como completada
CREATE OR REPLACE FUNCTION toggle_stage_completion(
    p_project_id UUID,
    p_stage_name TEXT,
    p_completed BOOLEAN,
    p_user_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS project_stage_completions AS $$
DECLARE
    result project_stage_completions;
BEGIN
    -- Insertar o actualizar el registro
    INSERT INTO project_stage_completions (
        project_id,
        stage_name,
        completed,
        completed_at,
        completed_by,
        notes
    ) VALUES (
        p_project_id,
        p_stage_name,
        p_completed,
        CASE WHEN p_completed THEN NOW() ELSE NULL END,
        CASE WHEN p_completed THEN p_user_id ELSE NULL END,
        p_notes
    )
    ON CONFLICT (project_id, stage_name)
    DO UPDATE SET
        completed = p_completed,
        completed_at = CASE WHEN p_completed THEN NOW() ELSE NULL END,
        completed_by = CASE WHEN p_completed THEN p_user_id ELSE NULL END,
        notes = COALESCE(p_notes, project_stage_completions.notes),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear función para obtener etapas completadas de un proyecto
CREATE OR REPLACE FUNCTION get_project_completed_stages(p_project_id UUID)
RETURNS TABLE (
    stage_name TEXT,
    completed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psc.stage_name,
        psc.completed,
        psc.completed_at,
        psc.completed_by,
        psc.notes
    FROM project_stage_completions psc
    WHERE psc.project_id = p_project_id
    ORDER BY psc.stage_name;
END;
$$ LANGUAGE plpgsql;

-- 8. Configurar políticas RLS (Row Level Security)
ALTER TABLE project_stage_completions ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Los usuarios pueden ver las completitudes de proyectos de su compañía
CREATE POLICY "Users can view stage completions from their company projects" 
ON project_stage_completions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_profiles up ON up.company_id = p.company_id
        WHERE p.id = project_stage_completions.project_id
        AND up.id = auth.uid()
    )
);

-- Política para INSERT: Los usuarios pueden crear completitudes para proyectos de su compañía
CREATE POLICY "Users can create stage completions for their company projects" 
ON project_stage_completions 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_profiles up ON up.company_id = p.company_id
        WHERE p.id = project_stage_completions.project_id
        AND up.id = auth.uid()
    )
);

-- Política para UPDATE: Los usuarios pueden actualizar completitudes de proyectos de su compañía
CREATE POLICY "Users can update stage completions for their company projects" 
ON project_stage_completions 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_profiles up ON up.company_id = p.company_id
        WHERE p.id = project_stage_completions.project_id
        AND up.id = auth.uid()
    )
);

-- Política para DELETE: Los usuarios pueden eliminar completitudes de proyectos de su compañía
CREATE POLICY "Users can delete stage completions for their company projects" 
ON project_stage_completions 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_profiles up ON up.company_id = p.company_id
        WHERE p.id = project_stage_completions.project_id
        AND up.id = auth.uid()
    )
);

-- 9. Crear vista para facilitar consultas
CREATE OR REPLACE VIEW project_stages_with_completion AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.company_id,
    stage_names.stage_name,
    COALESCE(psc.completed, FALSE) as completed,
    psc.completed_at,
    psc.completed_by,
    psc.notes,
    psc.created_at as completion_created_at,
    psc.updated_at as completion_updated_at
FROM projects p
CROSS JOIN (
    VALUES 
    ('Consulta DGIUR'),
    ('Permiso de Demolición - Informe'),
    ('Permiso de Demolición - Plano'),
    ('Registro etapa de proyecto - Informe'),
    ('Registro etapa de proyecto - Plano'),
    ('Permiso de obra'),
    ('Alta Inicio de obra'),
    ('Cartel de Obra'),
    ('Demolición'),
    ('Excavación'),
    ('AVO 1'),
    ('AVO 2'),
    ('AVO 3'),
    ('Conforme de obra'),
    ('MH-SUBDIVISION')
) AS stage_names(stage_name)
LEFT JOIN project_stage_completions psc 
    ON p.id = psc.project_id 
    AND stage_names.stage_name = psc.stage_name;

-- 10. Agregar comentario a la vista
COMMENT ON VIEW project_stages_with_completion IS 'Vista que combina todos los proyectos con todas las etapas posibles y su estado de completitud';

-- 11. Verificación de la migración
DO $$
BEGIN
    -- Verificar que la tabla fue creada
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_stage_completions') THEN
        RAISE NOTICE 'Tabla project_stage_completions creada exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear la tabla project_stage_completions';
    END IF;
    
    -- Verificar que las funciones fueron creadas
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'toggle_stage_completion') THEN
        RAISE NOTICE 'Función toggle_stage_completion creada exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear la función toggle_stage_completion';
    END IF;
    
    -- Verificar que la vista fue creada
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'project_stages_with_completion') THEN
        RAISE NOTICE 'Vista project_stages_with_completion creada exitosamente';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear la vista project_stages_with_completion';
    END IF;
    
    RAISE NOTICE 'Migración 0023_add_stage_completion_system completada exitosamente';
END $$;