-- =============================================
-- MIGRACIÓN: CAMPOS PARA CONTRATO DE OBRA
-- =============================================

-- Agregar campos para contrato de obra en la tabla de proyectos
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_contract_file_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_contract_upload_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_contract_notes TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN projects.construction_contract_file_url IS 'URL del contrato de obra en Supabase Storage';
COMMENT ON COLUMN projects.construction_contract_upload_date IS 'Fecha del contrato de obra';
COMMENT ON COLUMN projects.construction_contract_notes IS 'Notas adicionales del contrato de obra';
