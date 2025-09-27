-- Migración para crear tabla de fechas de vencimiento por sección de proyecto
-- Esta tabla almacena las fechas de vencimiento específicas para cada sección de documentos

-- 1. Crear tabla para fechas de vencimiento por sección
CREATE TABLE IF NOT EXISTS project_expiration_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Una fecha de vencimiento por sección por proyecto
    UNIQUE(project_id, section_name)
);

-- 2. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_project_expiration_dates_project_id ON project_expiration_dates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expiration_dates_section_name ON project_expiration_dates(section_name);
CREATE INDEX IF NOT EXISTS idx_project_expiration_dates_expiration_date ON project_expiration_dates(expiration_date);

-- 3. Habilitar RLS
ALTER TABLE project_expiration_dates ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para project_expiration_dates
CREATE POLICY "Users can view expiration dates for their projects"
ON project_expiration_dates FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Users can create expiration dates for their projects"
ON project_expiration_dates FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Users can update expiration dates for their projects"
ON project_expiration_dates FOR UPDATE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Users can delete expiration dates for their projects"
ON project_expiration_dates FOR DELETE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- 5. Función para calcular días restantes hasta vencimiento
CREATE OR REPLACE FUNCTION calculate_days_until_expiration(expiration_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN (expiration_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Vista para obtener fechas de vencimiento con información adicional
CREATE OR REPLACE VIEW project_expiration_summary AS
SELECT 
    ped.id,
    ped.project_id,
    p.name as project_name,
    p.company_id,
    ped.section_name,
    ped.expiration_date,
    calculate_days_until_expiration(ped.expiration_date) as days_remaining,
    CASE 
        WHEN ped.expiration_date < CURRENT_DATE THEN 'expired'
        WHEN calculate_days_until_expiration(ped.expiration_date) <= 7 THEN 'critical'
        WHEN calculate_days_until_expiration(ped.expiration_date) <= 30 THEN 'warning'
        ELSE 'normal'
    END as status,
    ped.created_at,
    ped.updated_at
FROM project_expiration_dates ped
JOIN projects p ON p.id = ped.project_id;

-- 7. Función para obtener fechas próximas a vencer
CREATE OR REPLACE FUNCTION get_upcoming_expirations(
    p_company_id UUID DEFAULT NULL,
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    section_name TEXT,
    expiration_date DATE,
    days_remaining INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pes.project_id,
        pes.project_name,
        pes.section_name,
        pes.expiration_date,
        pes.days_remaining,
        pes.status
    FROM project_expiration_summary pes
    WHERE 
        (p_company_id IS NULL OR pes.company_id = p_company_id)
        AND pes.days_remaining <= p_days_ahead
        AND pes.expiration_date >= CURRENT_DATE
    ORDER BY pes.days_remaining ASC, pes.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_project_expiration_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_expiration_dates_updated_at
    BEFORE UPDATE ON project_expiration_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_project_expiration_dates_updated_at();

-- 9. Comentarios para documentación
COMMENT ON TABLE project_expiration_dates IS 'Almacena fechas de vencimiento específicas para cada sección de documentos de proyecto';
COMMENT ON COLUMN project_expiration_dates.section_name IS 'Nombre de la sección (ej: "Permiso de Obra", "AVO 1", etc.)';
COMMENT ON COLUMN project_expiration_dates.expiration_date IS 'Fecha de vencimiento para la sección específica';
COMMENT ON VIEW project_expiration_summary IS 'Vista que incluye información calculada sobre el estado de vencimiento';
COMMENT ON FUNCTION get_upcoming_expirations IS 'Obtiene fechas de vencimiento próximas para una compañía';
COMMENT ON FUNCTION calculate_days_until_expiration IS 'Calcula días restantes hasta la fecha de vencimiento';