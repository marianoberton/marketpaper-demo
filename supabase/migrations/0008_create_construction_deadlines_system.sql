-- Migración para sistema de plazos de obra
-- Vincula "Permiso de Obra" con "Alta/Inicio de Obra" y calcula plazos automáticamente

-- 1. Agregar campos relacionados con plazos a la tabla projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_deadline_months INTEGER DEFAULT 24; -- 24 meses = 2 años para obra media
ALTER TABLE projects ADD COLUMN IF NOT EXISTS permit_issue_date DATE; -- Fecha de emisión del permiso
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_start_date DATE; -- Fecha de alta/inicio de obra
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_end_date DATE; -- Fecha calculada de vencimiento
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline_status TEXT DEFAULT 'pending'; -- pending, active, warning, expired
ALTER TABLE projects ADD COLUMN IF NOT EXISTS days_remaining INTEGER; -- Días restantes calculados

-- 2. Crear tabla para vincular documentos relacionados
CREATE TABLE IF NOT EXISTS document_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_document_id UUID REFERENCES project_documents(id) ON DELETE CASCADE,
    child_document_id UUID REFERENCES project_documents(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'triggers_deadline', 'depends_on', 'follows'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicados
    UNIQUE(parent_document_id, child_document_id, relationship_type)
);

-- 3. Crear tabla para configuración de plazos por tipo de obra
CREATE TABLE IF NOT EXISTS construction_deadline_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    project_type TEXT NOT NULL, -- 'obra_menor', 'obra_media', 'obra_mayor'
    deadline_months INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un solo plazo activo por tipo de obra por compañía
    UNIQUE(company_id, project_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- 4. Crear función para calcular plazos automáticamente
CREATE OR REPLACE FUNCTION calculate_construction_deadline(
    p_project_id UUID,
    p_construction_start_date DATE
) RETURNS VOID AS $$
DECLARE
    v_deadline_months INTEGER;
    v_calculated_end_date DATE;
    v_days_remaining INTEGER;
    v_status TEXT;
BEGIN
    -- Obtener los meses de plazo para el proyecto
    SELECT 
        COALESCE(cdr.deadline_months, p.construction_deadline_months, 24)
    INTO v_deadline_months
    FROM projects p
    LEFT JOIN construction_deadline_rules cdr ON (
        cdr.company_id = p.company_id 
        AND cdr.project_type = p.project_type 
        AND cdr.is_active = true
    )
    WHERE p.id = p_project_id;
    
    -- Calcular fecha de vencimiento
    v_calculated_end_date := p_construction_start_date + (v_deadline_months || ' months')::INTERVAL;
    
    -- Calcular días restantes
    v_days_remaining := v_calculated_end_date - CURRENT_DATE;
    
    -- Determinar estado
    IF v_days_remaining < 0 THEN
        v_status := 'expired';
    ELSIF v_days_remaining <= 90 THEN -- 3 meses de advertencia
        v_status := 'warning';
    ELSE
        v_status := 'active';
    END IF;
    
    -- Actualizar el proyecto
    UPDATE projects SET
        construction_start_date = p_construction_start_date,
        construction_end_date = v_calculated_end_date,
        days_remaining = v_days_remaining,
        deadline_status = v_status,
        updated_at = NOW()
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear función trigger para actualizar plazos cuando se sube "Alta/Inicio de Obra"
CREATE OR REPLACE FUNCTION trigger_deadline_calculation() RETURNS TRIGGER AS $$
DECLARE
    v_permit_date DATE;
BEGIN
    -- Solo procesar si es un documento de "Alta Inicio de obra"
    IF NEW.section_name = 'Alta Inicio de obra' THEN
        -- Buscar si existe un documento de "Permiso de Obra" para este proyecto
        SELECT created_at::DATE INTO v_permit_date
        FROM project_documents 
        WHERE project_id = NEW.project_id 
          AND section_name = 'Permiso de Obra'
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Si existe permiso, usar esa fecha como referencia, sino usar la fecha actual
        IF v_permit_date IS NOT NULL THEN
            UPDATE projects SET permit_issue_date = v_permit_date WHERE id = NEW.project_id;
        END IF;
        
        -- Calcular el plazo usando la fecha de creación del documento como inicio de obra
        PERFORM calculate_construction_deadline(NEW.project_id, NEW.created_at::DATE);
        
        -- Crear relación entre documentos si existe el permiso
        IF v_permit_date IS NOT NULL THEN
            INSERT INTO document_relationships (
                project_id, 
                parent_document_id, 
                child_document_id, 
                relationship_type
            )
            SELECT 
                NEW.project_id,
                pd.id,
                NEW.id,
                'triggers_deadline'
            FROM project_documents pd
            WHERE pd.project_id = NEW.project_id 
              AND pd.section_name = 'Permiso de Obra'
              AND pd.created_at::DATE = v_permit_date
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger
DROP TRIGGER IF EXISTS trigger_construction_deadline ON project_documents;
CREATE TRIGGER trigger_construction_deadline
    AFTER INSERT ON project_documents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_deadline_calculation();

-- 7. Crear función para actualizar todos los plazos existentes
CREATE OR REPLACE FUNCTION update_all_construction_deadlines() RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_project RECORD;
BEGIN
    FOR v_project IN 
        SELECT DISTINCT p.id, p.company_id, pd.created_at::DATE as start_date
        FROM projects p
        INNER JOIN project_documents pd ON pd.project_id = p.id
        WHERE pd.section_name = 'Alta Inicio de obra'
    LOOP
        PERFORM calculate_construction_deadline(v_project.id, v_project.start_date);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Insertar reglas por defecto para tipos de obra
INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'obra_media',
    24,
    'Plazo legal de 2 años para obras medias según normativa'
FROM companies c
ON CONFLICT DO NOTHING;

INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'obra_menor',
    12,
    'Plazo de 1 año para obras menores'
FROM companies c
ON CONFLICT DO NOTHING;

INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'obra_mayor',
    36,
    'Plazo de 3 años para obras mayores'
FROM companies c
ON CONFLICT DO NOTHING;

-- 9. Habilitar RLS en las nuevas tablas
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_deadline_rules ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para document_relationships
CREATE POLICY "Users can view document relationships for their projects"
ON document_relationships FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Users can create document relationships for their projects"
ON document_relationships FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- 11. Políticas RLS para construction_deadline_rules
CREATE POLICY "Users can view deadline rules for their company"
ON construction_deadline_rules FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

CREATE POLICY "Users can manage deadline rules for their company"
ON construction_deadline_rules FOR ALL
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND company_id = public.get_my_company_id())
);

-- 12. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_document_relationships_project_id ON document_relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_document_relationships_parent_doc ON document_relationships(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_document_relationships_child_doc ON document_relationships(child_document_id);
CREATE INDEX IF NOT EXISTS idx_construction_deadline_rules_company ON construction_deadline_rules(company_id, project_type, is_active);
CREATE INDEX IF NOT EXISTS idx_projects_deadline_status ON projects(deadline_status);
CREATE INDEX IF NOT EXISTS idx_projects_construction_dates ON projects(construction_start_date, construction_end_date);

-- 13. Comentarios para documentación
COMMENT ON TABLE document_relationships IS 'Vincula documentos relacionados, especialmente Permiso de Obra con Alta/Inicio de Obra';
COMMENT ON TABLE construction_deadline_rules IS 'Reglas de plazos de construcción por tipo de obra y compañía';
COMMENT ON FUNCTION calculate_construction_deadline IS 'Calcula automáticamente los plazos de obra basado en fecha de inicio y tipo de proyecto';
COMMENT ON FUNCTION trigger_deadline_calculation IS 'Trigger que se ejecuta al subir documento de Alta/Inicio de Obra para calcular plazos';