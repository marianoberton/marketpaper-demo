-- Agregar columna upload_date a project_documents
ALTER TABLE project_documents 
ADD COLUMN IF NOT EXISTS upload_date DATE;

-- Crear índice para la nueva columna
CREATE INDEX IF NOT EXISTS idx_project_documents_upload_date ON project_documents(upload_date);

-- Comentario para documentar el propósito de la columna
COMMENT ON COLUMN project_documents.upload_date IS 'Fecha de carga del documento, utilizada para calcular fechas de vencimiento';