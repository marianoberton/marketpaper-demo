-- Migración para agregar columnas del informe de inhibición
-- Fecha: 2024-01-XX

-- Agregar columnas para el informe de inhibición a la tabla projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inhibition_report_file_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inhibition_report_upload_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inhibition_report_notes TEXT;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN projects.inhibition_report_file_url IS 'URL del archivo del informe de inhibición';
COMMENT ON COLUMN projects.inhibition_report_upload_date IS 'Fecha de carga del informe de inhibición';
COMMENT ON COLUMN projects.inhibition_report_notes IS 'Notas adicionales sobre el informe de inhibición';

-- Crear índices para mejorar performance si es necesario
CREATE INDEX IF NOT EXISTS idx_projects_inhibition_report_upload_date ON projects(inhibition_report_upload_date);