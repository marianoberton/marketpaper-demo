-- =============================================
-- MIGRACIÓN ACTUALIZADA: Informe de Dominio con Fecha Manual
-- =============================================

-- Agregar campos para Informe de Dominio en la tabla projects
-- NOTA: domain_report_upload_date es realmente la fecha DEL DOCUMENTO (fecha de emisión)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_file_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_upload_date TIMESTAMPTZ; -- Fecha del documento (no de subida)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_expiry_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_is_valid BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_report_notes TEXT;

-- Comentario en la tabla para clarificar el propósito de los campos
COMMENT ON COLUMN projects.domain_report_upload_date IS 'Fecha de emisión del documento (NO fecha de subida al sistema)';
COMMENT ON COLUMN projects.domain_report_expiry_date IS 'Fecha de vencimiento (emisión + 90 días)';
COMMENT ON COLUMN projects.domain_report_is_valid IS 'Si el informe está vigente (calculado automáticamente)';

-- =============================================
-- FUNCIÓN PARA CALCULAR VIGENCIA AUTOMÁTICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION update_domain_report_validity()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza la fecha del documento, calcular nueva fecha de vencimiento
    IF NEW.domain_report_upload_date IS NOT NULL AND 
       (OLD.domain_report_upload_date IS NULL OR 
        NEW.domain_report_upload_date != OLD.domain_report_upload_date) THEN
        
        -- Calcular fecha de vencimiento (90 días desde la emisión del documento)
        NEW.domain_report_expiry_date := NEW.domain_report_upload_date + INTERVAL '90 days';
        
        -- Calcular si está vigente
        NEW.domain_report_is_valid := NEW.domain_report_expiry_date > NOW();
    END IF;
    
    -- Si no hay fecha del documento, marcar como no válido
    IF NEW.domain_report_upload_date IS NULL THEN
        NEW.domain_report_expiry_date := NULL;
        NEW.domain_report_is_valid := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario en la función
COMMENT ON FUNCTION update_domain_report_validity() IS 'Calcula automáticamente la vigencia del informe basado en la fecha de emisión del documento';

-- =============================================
-- TRIGGER PARA EJECUTAR LA FUNCIÓN AUTOMÁTICAMENTE
-- =============================================

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_update_domain_report_validity ON projects;

-- Crear trigger
CREATE TRIGGER trigger_update_domain_report_validity
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_domain_report_validity();

-- =============================================
-- ÍNDICE PARA MEJORAR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_domain_report_expiry ON projects(domain_report_expiry_date) 
WHERE domain_report_expiry_date IS NOT NULL;

-- =============================================
-- VISTA PARA CONSULTAR INFORMES PRÓXIMOS A VENCER
-- =============================================

CREATE OR REPLACE VIEW domain_reports_expiring_soon AS
SELECT 
    p.id,
    p.name as project_name,
    p.domain_report_upload_date as document_date,
    p.domain_report_expiry_date as expiry_date,
    p.domain_report_is_valid,
    EXTRACT(DAY FROM (p.domain_report_expiry_date - NOW())) as days_remaining,
    CASE 
        WHEN p.domain_report_expiry_date <= NOW() THEN 'expired'
        WHEN p.domain_report_expiry_date <= NOW() + INTERVAL '10 days' THEN 'expiring_soon'
        ELSE 'valid'
    END as status
FROM projects p
WHERE p.domain_report_upload_date IS NOT NULL
ORDER BY p.domain_report_expiry_date ASC;

COMMENT ON VIEW domain_reports_expiring_soon IS 'Vista para consultar informes de dominio próximos a vencer o vencidos'; 