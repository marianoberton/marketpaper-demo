-- =============================================
-- MIGRACIÓN: Póliza de Seguro
-- =============================================

-- Agregar campos para Póliza de Seguro en la tabla projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_file_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_issue_date TIMESTAMPTZ; -- Fecha de emisión de la póliza
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_expiry_date TIMESTAMPTZ; -- Fecha de vencimiento de la póliza
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_is_valid BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT; -- Número de póliza
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_company TEXT; -- Compañía aseguradora

-- Comentarios en la tabla para clarificar el propósito de los campos
COMMENT ON COLUMN projects.insurance_policy_file_url IS 'URL del archivo de la póliza de seguro en Storage';
COMMENT ON COLUMN projects.insurance_policy_issue_date IS 'Fecha de emisión de la póliza';
COMMENT ON COLUMN projects.insurance_policy_expiry_date IS 'Fecha de vencimiento de la póliza';
COMMENT ON COLUMN projects.insurance_policy_is_valid IS 'Si la póliza está vigente (calculado automáticamente)';
COMMENT ON COLUMN projects.insurance_policy_notes IS 'Notas adicionales sobre la póliza';
COMMENT ON COLUMN projects.insurance_policy_number IS 'Número de la póliza de seguro';
COMMENT ON COLUMN projects.insurance_company IS 'Nombre de la compañía aseguradora';

-- =============================================
-- FUNCIÓN PARA CALCULAR VIGENCIA AUTOMÁTICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION update_insurance_policy_validity()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza la fecha de vencimiento, calcular si está vigente
    IF NEW.insurance_policy_expiry_date IS NOT NULL THEN
        NEW.insurance_policy_is_valid := NEW.insurance_policy_expiry_date > NOW();
    ELSE
        NEW.insurance_policy_is_valid := false;
    END IF;
    
    -- Si no hay fecha de vencimiento, marcar como no válido
    IF NEW.insurance_policy_expiry_date IS NULL THEN
        NEW.insurance_policy_is_valid := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario en la función
COMMENT ON FUNCTION update_insurance_policy_validity() IS 'Calcula automáticamente la vigencia de la póliza basado en la fecha de vencimiento';

-- =============================================
-- TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- =============================================

DROP TRIGGER IF EXISTS trigger_update_insurance_policy_validity ON projects;

CREATE TRIGGER trigger_update_insurance_policy_validity
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_insurance_policy_validity();

-- Comentario en el trigger
COMMENT ON TRIGGER trigger_update_insurance_policy_validity ON projects IS 'Trigger que actualiza automáticamente la validez de la póliza cuando cambian las fechas';

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índice para consultas por fecha de vencimiento
CREATE INDEX IF NOT EXISTS idx_projects_insurance_policy_expiry ON projects(insurance_policy_expiry_date)
WHERE insurance_policy_expiry_date IS NOT NULL;

-- Índice para consultas por validez
CREATE INDEX IF NOT EXISTS idx_projects_insurance_policy_valid ON projects(insurance_policy_is_valid)
WHERE insurance_policy_is_valid = true;

-- =============================================
-- VISTA PARA CONSULTAS DE PÓLIZAS PRÓXIMAS A VENCER
-- =============================================

CREATE OR REPLACE VIEW insurance_policies_expiring_soon AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.company_id,
    p.insurance_policy_file_url,
    p.insurance_policy_issue_date as issue_date,
    p.insurance_policy_expiry_date as expiry_date,
    p.insurance_policy_number as policy_number,
    p.insurance_company,
    p.insurance_policy_notes as notes,
    EXTRACT(DAY FROM (p.insurance_policy_expiry_date - NOW())) as days_remaining,
    CASE 
        WHEN p.insurance_policy_expiry_date <= NOW() THEN 'expired'
        WHEN p.insurance_policy_expiry_date <= NOW() + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'valid'
    END as status
FROM projects p
WHERE p.insurance_policy_expiry_date IS NOT NULL
ORDER BY p.insurance_policy_expiry_date ASC;

-- Comentario en la vista
COMMENT ON VIEW insurance_policies_expiring_soon IS 'Vista que muestra pólizas de seguro próximas a vencer o vencidas';

-- =============================================
-- ACTUALIZAR PÓLIZAS EXISTENTES (SI LAS HAY)
-- =============================================

-- Actualizar la validez de todas las pólizas existentes
UPDATE projects 
SET insurance_policy_is_valid = (insurance_policy_expiry_date > NOW())
WHERE insurance_policy_expiry_date IS NOT NULL;