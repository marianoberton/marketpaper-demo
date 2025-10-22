-- Migración para actualizar plazos de construcción según nuevos requerimientos
-- Fecha: 2024-01-XX

-- =============================================
-- ACTUALIZAR REGLAS DE PLAZOS DE CONSTRUCCIÓN
-- =============================================

-- Primero, eliminar las reglas existentes para poder insertar las nuevas
DELETE FROM construction_deadline_rules WHERE project_type IN ('obra_menor', 'obra_media', 'obra_mayor');

-- Insertar las nuevas reglas con los plazos correctos
-- Micro Obra: 2 años
INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'micro_obra',
    24,
    'Plazo de 2 años para micro obras'
FROM companies c
ON CONFLICT DO NOTHING;

-- Obra Menor: 3 años
INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'obra_menor',
    36,
    'Plazo de 3 años para obras menores'
FROM companies c
ON CONFLICT DO NOTHING;

-- Obra Media: 4 años
INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'obra_media',
    48,
    'Plazo de 4 años para obras medias'
FROM companies c
ON CONFLICT DO NOTHING;

-- Obra Mayor: 6 años
INSERT INTO construction_deadline_rules (company_id, project_type, deadline_months, description)
SELECT 
    c.id,
    'obra_mayor',
    72,
    'Plazo de 6 años para obras mayores'
FROM companies c
ON CONFLICT DO NOTHING;

-- =============================================
-- ACTUALIZAR PROYECTOS EXISTENTES
-- =============================================

-- Normalizar los tipos de obra en la tabla projects para que coincidan con las reglas
-- Mapear "Microobra" -> "micro_obra"
UPDATE projects 
SET project_type = 'micro_obra' 
WHERE project_type = 'Microobra';

-- Mapear "Obra Menor" -> "obra_menor"
UPDATE projects 
SET project_type = 'obra_menor' 
WHERE project_type = 'Obra Menor';

-- Mapear "Obra Media" -> "obra_media"
UPDATE projects 
SET project_type = 'obra_media' 
WHERE project_type = 'Obra Media';

-- Mapear "Obra Mayor" -> "obra_mayor"
UPDATE projects 
SET project_type = 'obra_mayor' 
WHERE project_type = 'Obra Mayor';

-- =============================================
-- RECALCULAR PLAZOS PARA PROYECTOS ACTIVOS
-- =============================================

-- Recalcular plazos para proyectos que ya tienen fecha de inicio de construcción
-- pero necesitan actualizar su fecha de vencimiento según los nuevos plazos
UPDATE projects 
SET 
    construction_end_date = construction_start_date + (
        CASE 
            WHEN project_type = 'micro_obra' THEN '24 months'
            WHEN project_type = 'obra_menor' THEN '36 months'
            WHEN project_type = 'obra_media' THEN '48 months'
            WHEN project_type = 'obra_mayor' THEN '72 months'
            ELSE '24 months' -- fallback por defecto
        END
    )::INTERVAL,
    days_remaining = (
        construction_start_date + (
            CASE 
                WHEN project_type = 'micro_obra' THEN '24 months'
                WHEN project_type = 'obra_menor' THEN '36 months'
                WHEN project_type = 'obra_media' THEN '48 months'
                WHEN project_type = 'obra_mayor' THEN '72 months'
                ELSE '24 months'
            END
        )::INTERVAL
    ) - CURRENT_DATE,
    deadline_status = CASE 
        WHEN (
            construction_start_date + (
                CASE 
                    WHEN project_type = 'micro_obra' THEN '24 months'
                    WHEN project_type = 'obra_menor' THEN '36 months'
                    WHEN project_type = 'obra_media' THEN '48 months'
                    WHEN project_type = 'obra_mayor' THEN '72 months'
                    ELSE '24 months'
                END
            )::INTERVAL
        ) - CURRENT_DATE < 0 THEN 'expired'
        WHEN (
            construction_start_date + (
                CASE 
                    WHEN project_type = 'micro_obra' THEN '24 months'
                    WHEN project_type = 'obra_menor' THEN '36 months'
                    WHEN project_type = 'obra_media' THEN '48 months'
                    WHEN project_type = 'obra_mayor' THEN '72 months'
                    ELSE '24 months'
                END
            )::INTERVAL
        ) - CURRENT_DATE <= 90 THEN 'warning'
        ELSE 'active'
    END,
    updated_at = NOW()
WHERE construction_start_date IS NOT NULL 
  AND project_type IN ('micro_obra', 'obra_menor', 'obra_media', 'obra_mayor');

-- =============================================
-- CONSULTAS DE VERIFICACIÓN
-- =============================================

-- Verificar que las reglas se actualizaron correctamente
/*
SELECT 
    cdr.project_type,
    cdr.deadline_months,
    cdr.description,
    COUNT(c.id) as companies_count
FROM construction_deadline_rules cdr
JOIN companies c ON c.id = cdr.company_id
WHERE cdr.project_type IN ('micro_obra', 'obra_menor', 'obra_media', 'obra_mayor')
GROUP BY cdr.project_type, cdr.deadline_months, cdr.description
ORDER BY cdr.deadline_months;
*/

-- Verificar proyectos actualizados
/*
SELECT 
    project_type,
    COUNT(*) as project_count,
    AVG(EXTRACT(EPOCH FROM (construction_end_date - construction_start_date))/2592000) as avg_months
FROM projects 
WHERE project_type IN ('micro_obra', 'obra_menor', 'obra_media', 'obra_mayor')
  AND construction_start_date IS NOT NULL
GROUP BY project_type
ORDER BY project_type;
*/