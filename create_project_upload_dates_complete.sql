-- Script SQL completo para crear la tabla project_upload_dates
-- Este script resuelve el error: relation "project_upload_dates" does not exist

-- 1. Eliminar la tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS project_upload_dates CASCADE;

-- 2. Crear la tabla project_upload_dates
CREATE TABLE project_upload_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    upload_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados por proyecto y sección
    UNIQUE(project_id, section_name)
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX idx_project_upload_dates_project_id ON project_upload_dates(project_id);
CREATE INDEX idx_project_upload_dates_section_name ON project_upload_dates(section_name);
CREATE INDEX idx_project_upload_dates_upload_date ON project_upload_dates(upload_date);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE project_upload_dates ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de seguridad (RLS) con conversión de tipos correcta
CREATE POLICY "Users can view upload dates from their company" ON project_upload_dates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = (auth.jwt() ->> 'company_id')::uuid
        )
    );

CREATE POLICY "Users can insert upload dates for their company projects" ON project_upload_dates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = (auth.jwt() ->> 'company_id')::uuid
        )
    );

CREATE POLICY "Users can update upload dates from their company" ON project_upload_dates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = (auth.jwt() ->> 'company_id')::uuid
        )
    );

CREATE POLICY "Users can delete upload dates from their company" ON project_upload_dates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = (auth.jwt() ->> 'company_id')::uuid
        )
    );

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_project_upload_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_project_upload_dates_updated_at
    BEFORE UPDATE ON project_upload_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_project_upload_dates_updated_at();

-- 8. Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_upload_dates'
ORDER BY ordinal_position;

-- 9. Verificar que las políticas RLS se crearon
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'project_upload_dates';

-- 10. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Tabla project_upload_dates creada exitosamente con:';
    RAISE NOTICE '- Estructura de tabla completa';
    RAISE NOTICE '- Índices para rendimiento';
    RAISE NOTICE '- Políticas RLS con conversión de tipos correcta';
    RAISE NOTICE '- Trigger para updated_at automático';
    RAISE NOTICE '- Verificaciones de integridad';
END $$;