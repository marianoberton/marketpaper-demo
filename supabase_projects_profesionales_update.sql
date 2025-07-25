-- ============================================
-- ACTUALIZACIÓN TABLA PROJECTS - PROFESIONALES Y NUEVOS CAMPOS
-- ============================================
-- Este script agrega los nuevos campos para profesionales y actualiza la estructura

-- 1. Agregar nuevas columnas a la tabla projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS director_obra TEXT,
ADD COLUMN IF NOT EXISTS profesionales JSONB,
ADD COLUMN IF NOT EXISTS project_usage TEXT;

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_director_obra ON projects(director_obra);
CREATE INDEX IF NOT EXISTS idx_projects_profesionales ON projects USING GIN(profesionales);
CREATE INDEX IF NOT EXISTS idx_projects_project_usage ON projects(project_usage);

-- 3. Agregar comentarios para documentar las columnas
COMMENT ON COLUMN projects.director_obra IS 'Director de obra responsable del proyecto';
COMMENT ON COLUMN projects.profesionales IS 'Array de profesionales adicionales del proyecto en formato JSON';
COMMENT ON COLUMN projects.project_usage IS 'Tipo de uso del proyecto (Vivienda, Comercial, Industrial, Mixto)';

-- 4. Función para validar profesionales
CREATE OR REPLACE FUNCTION validate_profesionales(profesionales_value JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si es NULL, es válido
    IF profesionales_value IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Debe ser un array
    IF jsonb_typeof(profesionales_value) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Validar cada profesional en el array
    FOR i IN 0..jsonb_array_length(profesionales_value) - 1 LOOP
        DECLARE
            profesional JSONB := profesionales_value->i;
            role_val TEXT;
        BEGIN
            -- Debe tener campos name y role
            IF NOT (profesional ? 'name' AND profesional ? 'role') THEN
                RETURN FALSE;
            END IF;
            
            -- Validar que el rol sea uno de los permitidos
            role_val := profesional->>'role';
            IF role_val NOT IN (
                'Estructuralista',
                'Proyectista', 
                'Instalación Electrica',
                'Instalación Sanitaria',
                'Instalación e incendios',
                'Instalación e elevadores',
                'Instalación Sala de maquinas',
                'Instalación Ventilación Mecanica',
                'Instalación ventilación electromecánica',
                'Agrimensor'
            ) THEN
                RETURN FALSE;
            END IF;
        END;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Agregar constraints de validación
-- Verificar y agregar constraint para profesionales si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_profesionales_format' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT check_profesionales_format 
        CHECK (validate_profesionales(profesionales));
    END IF;
END $$;

-- Verificar y agregar constraint para project_usage si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_project_usage_values' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT check_project_usage_values 
        CHECK (project_usage IS NULL OR project_usage IN ('Vivienda', 'Comercial', 'Industrial', 'Mixto'));
    END IF;
END $$;

-- 6. Migrar datos existentes
-- Migrar architect a director_obra donde director_obra esté vacío
UPDATE projects 
SET director_obra = architect 
WHERE director_obra IS NULL 
  AND architect IS NOT NULL 
  AND architect != '';

-- Migrar inspector_name a profesionales donde profesionales esté vacío
UPDATE projects 
SET profesionales = jsonb_build_array(
    jsonb_build_object(
        'name', inspector_name,
        'role', 'Estructuralista'
    )
)
WHERE profesionales IS NULL 
  AND inspector_name IS NOT NULL 
  AND inspector_name != '';

-- Migrar project_use a project_usage con mapeo de valores
UPDATE projects 
SET project_usage = CASE 
    WHEN project_use = 'RESIDENCIAL' THEN 'Vivienda'
    WHEN project_use = 'COMERCIAL' THEN 'Comercial'
    WHEN project_use = 'INDUSTRIAL' THEN 'Industrial'
    WHEN project_use = 'MIXTO' THEN 'Mixto'
    WHEN project_use = 'OBRA MAYOR' THEN 'Vivienda'  -- Asumiendo que Obra Mayor es generalmente vivienda
    WHEN project_use = 'OBRA MENOR' THEN 'Vivienda'
    ELSE project_use
END
WHERE project_usage IS NULL 
  AND project_use IS NOT NULL 
  AND project_use != '';

-- 7. Actualizar trigger para updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_projects_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_projects_updated_at
            BEFORE UPDATE ON projects
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 8. Verificar la estructura actualizada
-- Ejecuta esto para confirmar que las columnas se agregaron correctamente:
/*
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('director_obra', 'profesionales', 'project_usage')
ORDER BY ordinal_position;
*/

-- 9. Ejemplo de cómo insertar datos con la nueva estructura
/*
INSERT INTO projects (
    company_id, 
    name, 
    address, 
    barrio,
    ciudad,
    surface,
    director_obra,
    builder,
    project_type,
    project_usage,
    profesionales,
    client_id
) VALUES (
    'company-uuid-here',
    'PROYECTO EJEMPLO',
    'Av. Santa Fe 1234',
    'Palermo',
    'CABA',
    1500.00,
    'Arq. Juan Pérez',
    'CONSTRUCTORA EJEMPLO SA',
    'Obra Mayor',
    'Vivienda',
    '[
        {"name": "Ing. Carlos López", "role": "Estructuralista"},
        {"name": "Ing. Ana García", "role": "Instalación Electrica"}
    ]'::jsonb,
    'client-uuid-here'
);
*/

-- 10. Consultas útiles para verificar migración
/*
-- Ver proyectos con datos migrados
SELECT 
    id,
    name,
    architect,
    director_obra,
    inspector_name,
    profesionales,
    project_use,
    project_usage
FROM projects 
WHERE director_obra IS NOT NULL 
   OR profesionales IS NOT NULL 
   OR project_usage IS NOT NULL
LIMIT 5;
*/ 