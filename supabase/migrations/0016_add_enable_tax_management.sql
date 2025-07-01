-- Migración para agregar el campo enable_tax_management a projects
-- Fecha: 2025-01-15

-- Agregar columna para activar la gestión de tasas gubernamentales
ALTER TABLE projects ADD COLUMN IF NOT EXISTS enable_tax_management BOOLEAN DEFAULT false;

-- Agregar comentario para documentar el propósito de la columna
COMMENT ON COLUMN projects.enable_tax_management IS 'Indica si el proyecto tiene activada la gestión automática de tasas gubernamentales (CPAU, CPIC, derechos de construcción, plusvalía)';

-- Crear índice para mejorar el rendimiento de consultas filtradas por este campo
CREATE INDEX IF NOT EXISTS idx_projects_enable_tax_management ON projects(enable_tax_management);

-- Actualizar proyectos existentes de forma segura
-- Verificar si existe la columna budget y activar para proyectos con presupuesto
DO $$ 
BEGIN
    -- Verificar si la columna budget existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' AND column_name = 'budget') THEN
        UPDATE projects 
        SET enable_tax_management = true 
        WHERE budget IS NOT NULL AND budget > 0;
    END IF;
    
    -- Si existe projected_total_cost también activarlo
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' AND column_name = 'projected_total_cost') THEN
        UPDATE projects 
        SET enable_tax_management = true 
        WHERE projected_total_cost IS NOT NULL AND projected_total_cost > 0;
    END IF;
END $$; 