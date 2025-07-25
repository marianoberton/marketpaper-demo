-- ============================================
-- ACTUALIZACIÓN TABLA PROJECTS - AGREGAR BARRIO Y CIUDAD
-- ============================================
-- Este script agrega los campos barrio y ciudad a la tabla projects

-- 1. Agregar nuevas columnas a la tabla projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS barrio TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT;

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_barrio ON projects(barrio);
CREATE INDEX IF NOT EXISTS idx_projects_ciudad ON projects(ciudad);

-- 3. Agregar comentarios para documentar las columnas
COMMENT ON COLUMN projects.barrio IS 'Barrio donde se encuentra el proyecto';
COMMENT ON COLUMN projects.ciudad IS 'Ciudad donde se encuentra el proyecto';

-- 4. Función para extraer barrio y ciudad de la dirección existente (opcional)
-- Esta función intenta extraer información de las direcciones existentes
CREATE OR REPLACE FUNCTION extract_location_from_address(address_text TEXT)
RETURNS TABLE(barrio_extracted TEXT, ciudad_extracted TEXT) AS $$
BEGIN
    -- Valores por defecto
    barrio_extracted := NULL;
    ciudad_extracted := NULL;
    
    IF address_text IS NULL OR trim(address_text) = '' THEN
        RETURN;
    END IF;
    
    -- Convertir a mayúsculas para comparación
    address_text := upper(trim(address_text));
    
    -- Extraer ciudad basado en patrones comunes
    IF address_text LIKE '%CABA%' OR address_text LIKE '%CAPITAL%' THEN
        ciudad_extracted := 'CABA';
    ELSIF address_text LIKE '%BUENOS AIRES%' THEN
        ciudad_extracted := 'Buenos Aires';
    ELSIF address_text LIKE '%ROSARIO%' THEN
        ciudad_extracted := 'Rosario';
    ELSIF address_text LIKE '%CÓRDOBA%' THEN
        ciudad_extracted := 'Córdoba';
    ELSIF address_text LIKE '%MENDOZA%' THEN
        ciudad_extracted := 'Mendoza';
    END IF;
    
    -- Extraer barrio basado en patrones comunes de CABA
    IF ciudad_extracted = 'CABA' THEN
        IF address_text LIKE '%PALERMO%' THEN
            barrio_extracted := 'Palermo';
        ELSIF address_text LIKE '%BELGRANO%' THEN
            barrio_extracted := 'Belgrano';
        ELSIF address_text LIKE '%RECOLETA%' THEN
            barrio_extracted := 'Recoleta';
        ELSIF address_text LIKE '%PUERTO MADERO%' THEN
            barrio_extracted := 'Puerto Madero';
        ELSIF address_text LIKE '%SAN TELMO%' THEN
            barrio_extracted := 'San Telmo';
        ELSIF address_text LIKE '%VILLA CRESPO%' THEN
            barrio_extracted := 'Villa Crespo';
        ELSIF address_text LIKE '%CABALLITO%' THEN
            barrio_extracted := 'Caballito';
        ELSIF address_text LIKE '%BARRACAS%' THEN
            barrio_extracted := 'Barracas';
        ELSIF address_text LIKE '%ONCE%' THEN
            barrio_extracted := 'Once';
        ELSIF address_text LIKE '%MICROCENTRO%' THEN
            barrio_extracted := 'Microcentro';
        ELSIF address_text LIKE '%RETIRO%' THEN
            barrio_extracted := 'Retiro';
        ELSIF address_text LIKE '%FLORES%' THEN
            barrio_extracted := 'Flores';
        ELSIF address_text LIKE '%ALMAGRO%' THEN
            barrio_extracted := 'Almagro';
        END IF;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 5. Script para migrar datos existentes (opcional - ejecutar solo si quieres intentar extraer automáticamente)
-- PRECAUCIÓN: Esto intentará extraer barrio y ciudad de las direcciones existentes
-- Revisa los resultados antes de ejecutar el UPDATE
/*
-- Primero, ver qué se extraería:
SELECT 
    id,
    name,
    address,
    (extract_location_from_address(address)).*
FROM projects 
WHERE address IS NOT NULL 
  AND barrio IS NULL 
  AND ciudad IS NULL
LIMIT 10;

-- Si los resultados se ven bien, ejecuta el UPDATE:
UPDATE projects 
SET 
    barrio = extracted.barrio_extracted,
    ciudad = extracted.ciudad_extracted
FROM (
    SELECT 
        id,
        (extract_location_from_address(address)).*
    FROM projects 
    WHERE address IS NOT NULL 
      AND barrio IS NULL 
      AND ciudad IS NULL
) AS extracted
WHERE projects.id = extracted.id
  AND (extracted.barrio_extracted IS NOT NULL OR extracted.ciudad_extracted IS NOT NULL);
*/

-- 6. Verificar la estructura actualizada
-- Ejecuta esto para confirmar que las columnas se agregaron correctamente:
/*
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('barrio', 'ciudad')
ORDER BY ordinal_position;
*/

-- 7. Ejemplo de cómo insertar datos con la nueva estructura
/*
INSERT INTO projects (
    company_id, 
    name, 
    address, 
    barrio,
    ciudad,
    surface,
    architect,
    builder,
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
    'client-uuid-here'
);
*/ 