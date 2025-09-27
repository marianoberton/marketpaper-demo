-- Crear tabla para fechas de carga de documentos
CREATE TABLE IF NOT EXISTS project_upload_dates (
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_project_upload_dates_project_id ON project_upload_dates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_upload_dates_section_name ON project_upload_dates(section_name);
CREATE INDEX IF NOT EXISTS idx_project_upload_dates_upload_date ON project_upload_dates(upload_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE project_upload_dates ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver fechas de carga de su compañía
CREATE POLICY "Users can view upload dates from their company" ON project_upload_dates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = auth.jwt() ->> 'company_id'
        )
    );

-- Política para que los usuarios puedan insertar fechas de carga en proyectos de su compañía
CREATE POLICY "Users can insert upload dates for their company projects" ON project_upload_dates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = auth.jwt() ->> 'company_id'
        )
    );

-- Política para que los usuarios puedan actualizar fechas de carga de su compañía
CREATE POLICY "Users can update upload dates from their company" ON project_upload_dates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = auth.jwt() ->> 'company_id'
        )
    );

-- Política para que los usuarios puedan eliminar fechas de carga de su compañía
CREATE POLICY "Users can delete upload dates from their company" ON project_upload_dates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_upload_dates.project_id
            AND p.company_id = auth.jwt() ->> 'company_id'
        )
    );

-- Política especial para super_admin
CREATE POLICY "Super admin can manage all upload dates" ON project_upload_dates
    FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_project_upload_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_project_upload_dates_updated_at_trigger
    BEFORE UPDATE ON project_upload_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_project_upload_dates_updated_at();

-- Vista para obtener fechas de carga con información del proyecto
CREATE OR REPLACE VIEW project_upload_summary AS
SELECT 
    pud.id,
    pud.project_id,
    pud.section_name,
    pud.upload_date,
    pud.created_by,
    pud.created_at,
    pud.updated_at,
    p.name as project_name,
    p.company_id,
    -- Calcular fecha de vencimiento (1 año después de la fecha de carga)
    (pud.upload_date + INTERVAL '1 year')::DATE as expiration_date,
    -- Calcular días restantes hasta el vencimiento
    EXTRACT(DAY FROM (pud.upload_date + INTERVAL '1 year') - CURRENT_DATE)::INTEGER as days_remaining
FROM project_upload_dates pud
JOIN projects p ON pud.project_id = p.id;

-- Función RPC para obtener próximos vencimientos basados en fechas de carga
CREATE OR REPLACE FUNCTION get_upcoming_upload_expirations(
    target_company_id UUID DEFAULT NULL,
    days_ahead INTEGER DEFAULT 90
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    project_name TEXT,
    section_name TEXT,
    upload_date DATE,
    expiration_date DATE,
    days_remaining INTEGER,
    urgency_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pus.id,
        pus.project_id,
        pus.project_name,
        pus.section_name,
        pus.upload_date,
        pus.expiration_date,
        pus.days_remaining,
        CASE 
            WHEN pus.days_remaining < 0 THEN 'expired'
            WHEN pus.days_remaining = 0 THEN 'today'
            WHEN pus.days_remaining <= 7 THEN 'critical'
            WHEN pus.days_remaining <= 30 THEN 'warning'
            ELSE 'upcoming'
        END as urgency_level
    FROM project_upload_summary pus
    WHERE 
        (target_company_id IS NULL OR pus.company_id = target_company_id)
        AND pus.days_remaining <= days_ahead
    ORDER BY pus.days_remaining ASC, pus.project_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE project_upload_dates IS 'Almacena las fechas de carga de documentos por proyecto y sección';
COMMENT ON COLUMN project_upload_dates.project_id IS 'ID del proyecto al que pertenece la fecha de carga';
COMMENT ON COLUMN project_upload_dates.section_name IS 'Nombre de la sección del documento (ej: Permiso de obra, Planos, etc.)';
COMMENT ON COLUMN project_upload_dates.upload_date IS 'Fecha en que se cargó el documento';
COMMENT ON VIEW project_upload_summary IS 'Vista que incluye información del proyecto y cálculos de vencimiento';
COMMENT ON FUNCTION get_upcoming_upload_expirations IS 'Función para obtener próximos vencimientos basados en fechas de carga';