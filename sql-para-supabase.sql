-- SQL para agregar columna upload_date a project_documents
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna upload_date
ALTER TABLE project_documents ADD COLUMN upload_date DATE;

-- 2. Crear índice para mejorar performance
CREATE INDEX idx_project_documents_upload_date ON project_documents(upload_date);

-- 3. Agregar comentario descriptivo
COMMENT ON COLUMN project_documents.upload_date IS 'Fecha de carga del documento, utilizada para calcular fechas de vencimiento';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_documents' 
AND column_name = 'upload_date';