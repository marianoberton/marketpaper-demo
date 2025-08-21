-- =============================================
-- MIGRACIÓN PARA MÚLTIPLES EXPEDIENTES POR PROYECTO
-- Script limpio para ejecución en producción
-- =============================================

-- Crear tabla para expedientes de proyectos
CREATE TABLE IF NOT EXISTS project_expedientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    expediente_number TEXT NOT NULL,
    expediente_type TEXT DEFAULT 'DGROC', -- DGROC, DGIUR, etc.
    status TEXT DEFAULT 'Pendiente', -- Pendiente, En trámite, Aprobado, Rechazado
    submission_date DATE,
    approval_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_project_expedientes_project_id ON project_expedientes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expedientes_number ON project_expedientes(expediente_number);
CREATE INDEX IF NOT EXISTS idx_project_expedientes_type ON project_expedientes(expediente_type);
CREATE INDEX IF NOT EXISTS idx_project_expedientes_status ON project_expedientes(status);

-- Habilitar RLS
ALTER TABLE project_expedientes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para project_expedientes
CREATE POLICY "Authenticated users can view project expedientes"
ON project_expedientes FOR SELECT
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can create project expedientes"
ON project_expedientes FOR INSERT
WITH CHECK ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can update project expedientes"
ON project_expedientes FOR UPDATE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

CREATE POLICY "Authenticated users can delete project expedientes"
ON project_expedientes FOR DELETE
USING ( 
    public.is_super_admin() OR 
    (auth.uid() IS NOT NULL AND project_id IN (
        SELECT id FROM projects WHERE company_id = public.get_my_company_id()
    ))
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_project_expedientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_project_expedientes_updated_at ON project_expedientes;
CREATE TRIGGER trigger_update_project_expedientes_updated_at
    BEFORE UPDATE ON project_expedientes
    FOR EACH ROW
    EXECUTE FUNCTION update_project_expedientes_updated_at();

-- Migrar expedientes existentes desde el campo dgro_file_number
INSERT INTO project_expedientes (project_id, expediente_number, expediente_type, status)
SELECT 
    id as project_id,
    dgro_file_number as expediente_number,
    'DGROC' as expediente_type,
    CASE 
        WHEN permit_status = 'Aprobado' THEN 'Aprobado'
        WHEN permit_status = 'En trámite' THEN 'En trámite'
        ELSE 'Pendiente'
    END as status
FROM projects 
WHERE dgro_file_number IS NOT NULL 
  AND dgro_file_number != ''
  AND NOT EXISTS (
    SELECT 1 FROM project_expedientes 
    WHERE project_id = projects.id 
      AND expediente_number = projects.dgro_file_number
  );

-- Comentarios para documentación
COMMENT ON TABLE project_expedientes IS 'Tabla para almacenar múltiples expedientes por proyecto';
COMMENT ON COLUMN project_expedientes.project_id IS 'ID del proyecto al que pertenece el expediente';
COMMENT ON COLUMN project_expedientes.expediente_number IS 'Número del expediente (ej: EX-2024-40574851-GCABA-DGROC)';
COMMENT ON COLUMN project_expedientes.expediente_type IS 'Tipo de expediente (DGROC, DGIUR, etc.)';
COMMENT ON COLUMN project_expedientes.status IS 'Estado del expediente (Pendiente, En trámite, Aprobado, Rechazado)';
COMMENT ON COLUMN project_expedientes.submission_date IS 'Fecha de presentación del expediente';
COMMENT ON COLUMN project_expedientes.approval_date IS 'Fecha de aprobación del expediente';
COMMENT ON COLUMN project_expedientes.notes IS 'Notas adicionales sobre el expediente';