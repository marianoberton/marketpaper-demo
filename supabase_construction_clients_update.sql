-- ============================================
-- ACTUALIZACIÓN TABLA CLIENTS - MÓDULO CONSTRUCCIÓN
-- ============================================
-- Este script agrega las nuevas columnas necesarias para el sistema de referentes y campos adicionales

-- 1. Agregar nuevas columnas a la tabla clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS cuit TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS referentes JSONB;

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_cuit ON clients(cuit);
CREATE INDEX IF NOT EXISTS idx_clients_referentes ON clients USING GIN (referentes);

-- 3. Agregar comentarios para documentar las columnas
COMMENT ON COLUMN clients.cuit IS 'CUIT del cliente (Código Único de Identificación Tributaria)';
COMMENT ON COLUMN clients.website_url IS 'URL del sitio web del cliente';
COMMENT ON COLUMN clients.referentes IS 'Array JSON con los referentes del cliente [{name: string, role: string}]';

-- 4. Función para validar el formato de CUIT (opcional)
CREATE OR REPLACE FUNCTION validate_cuit(cuit_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validación básica del formato CUIT: XX-XXXXXXXX-X
    IF cuit_value IS NULL THEN
        RETURN TRUE; -- NULL es válido
    END IF;
    
    -- Verificar formato básico
    RETURN cuit_value ~ '^[0-9]{2}-[0-9]{8}-[0-9]$';
END;
$$ LANGUAGE plpgsql;

-- 5. Constraint para validar CUIT (opcional - puedes comentar si no quieres validación)
ALTER TABLE clients 
ADD CONSTRAINT check_cuit_format 
CHECK (validate_cuit(cuit));

-- 6. Función para validar estructura de referentes
CREATE OR REPLACE FUNCTION validate_referentes(referentes_value JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si es NULL, es válido
    IF referentes_value IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Debe ser un array
    IF jsonb_typeof(referentes_value) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que cada elemento tenga name y role
    RETURN (
        SELECT bool_and(
            referente ? 'name' AND 
            referente ? 'role' AND
            jsonb_typeof(referente->'name') = 'string' AND
            jsonb_typeof(referente->'role') = 'string'
        )
        FROM jsonb_array_elements(referentes_value) AS referente
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Constraint para validar estructura de referentes
ALTER TABLE clients 
ADD CONSTRAINT check_referentes_structure 
CHECK (validate_referentes(referentes));

-- 8. Migrar datos existentes de contact_person a referentes (si hay datos)
-- Solo para clientes que tienen contact_person pero no tienen referentes
UPDATE clients 
SET referentes = jsonb_build_array(
    jsonb_build_object(
        'name', contact_person,
        'role', 'Contacto Principal'
    )
)
WHERE contact_person IS NOT NULL 
  AND contact_person != '' 
  AND referentes IS NULL;

-- 9. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();

-- 10. Verificar la estructura actualizada
-- Ejecuta esto para confirmar que las columnas se agregaron correctamente:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'clients' 
-- ORDER BY ordinal_position;

-- 11. Ejemplo de cómo insertar datos con la nueva estructura
/*
INSERT INTO clients (
    company_id, 
    name, 
    email, 
    phone, 
    address, 
    cuit, 
    website_url, 
    referentes,
    notes
) VALUES (
    'company-uuid-here',
    'EMPRESA EJEMPLO SA',
    'contacto@empresa.com',
    '+54 11 1234-5678',
    'Av. Corrientes 1234, CABA',
    '30-12345678-9',
    'https://www.empresa.com.ar',
    '[
        {"name": "Juan Pérez", "role": "Director General"},
        {"name": "María García", "role": "Gerente de Proyectos"}
    ]'::jsonb,
    'Cliente ejemplo con múltiples referentes'
);
*/

-- 12. Consulta de ejemplo para ver los datos
/*
SELECT 
    name,
    cuit,
    website_url,
    jsonb_pretty(referentes) as referentes_formatted,
    contact_person
FROM clients 
WHERE referentes IS NOT NULL
LIMIT 5;
*/ 