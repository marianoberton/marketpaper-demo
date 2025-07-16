-- =============================================
-- SCRIPT PARA ARREGLAR COMPATIBILIDAD message_buffer
-- =============================================
-- Soluciona el error de "column phone_number does not exist"

-- =============================================
-- VERIFICAR ESTRUCTURA EXISTENTE
-- =============================================

-- Mostrar estructura actual de message_buffer (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'message_buffer' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- OPCIÓN 1: ELIMINAR Y RECREAR (CUIDADO: BORRA DATOS)
-- =============================================

-- Descomentar solo si quieres eliminar la tabla existente
/*
DROP TABLE IF EXISTS message_buffer CASCADE;
*/

-- =============================================
-- OPCIÓN 2: ADAPTAR TABLA EXISTENTE
-- =============================================

-- Verificar si la tabla existe con wa_id
DO $$
BEGIN
    -- Si existe con wa_id, crear vista de compatibilidad
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message_buffer' 
        AND column_name = 'wa_id'
        AND table_schema = 'public'
    ) THEN
        -- Crear vista para compatibilidad con phone_number
        CREATE OR REPLACE VIEW message_buffer_phone_compat AS
        SELECT 
            wa_id as phone_number,
            messages,
            created_at,
            updated_at
        FROM message_buffer
        WHERE company_id = (SELECT id FROM companies LIMIT 1);
        
        RAISE NOTICE 'Vista de compatibilidad creada: message_buffer_phone_compat';
    END IF;
    
    -- Si no existe la tabla, crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'message_buffer'
        AND table_schema = 'public'
    ) THEN
        -- Crear tabla híbrida
        CREATE TABLE message_buffer (
            phone_number VARCHAR(20) NOT NULL,
            company_id UUID DEFAULT (SELECT id FROM companies LIMIT 1),
            messages TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (phone_number, company_id)
        );
        
        -- Índices
        CREATE INDEX idx_message_buffer_phone ON message_buffer(phone_number);
        CREATE INDEX idx_message_buffer_company ON message_buffer(company_id);
        CREATE INDEX idx_message_buffer_updated ON message_buffer(updated_at);
        
        RAISE NOTICE 'Tabla message_buffer creada exitosamente';
    END IF;
END $$;

-- =============================================
-- OPCIÓN 3: CREAR TABLA ALTERNATIVA
-- =============================================

-- Crear tabla con nombre alternativo para evitar conflictos
CREATE TABLE IF NOT EXISTS message_buffer_v2 (
    phone_number VARCHAR(20) NOT NULL,
    company_id UUID DEFAULT (SELECT id FROM companies LIMIT 1),
    messages TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (phone_number, company_id)
);

-- Índices para message_buffer_v2
CREATE INDEX IF NOT EXISTS idx_message_buffer_v2_phone ON message_buffer_v2(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_buffer_v2_company ON message_buffer_v2(company_id);
CREATE INDEX IF NOT EXISTS idx_message_buffer_v2_updated ON message_buffer_v2(updated_at);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_message_buffer_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para message_buffer_v2
DROP TRIGGER IF EXISTS trigger_update_message_buffer_v2_updated_at ON message_buffer_v2;
CREATE TRIGGER trigger_update_message_buffer_v2_updated_at
    BEFORE UPDATE ON message_buffer_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_message_buffer_v2_updated_at();

-- =============================================
-- FUNCIONES DE COMPATIBILIDAD
-- =============================================

-- Función para insertar en cualquier versión de la tabla
CREATE OR REPLACE FUNCTION insert_message_buffer(
    p_phone_number VARCHAR(20),
    p_messages TEXT,
    p_company_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    final_company_id UUID;
BEGIN
    -- Determinar company_id
    final_company_id := COALESCE(p_company_id, (SELECT id FROM companies LIMIT 1));
    
    -- Intentar insertar en la tabla que exista
    BEGIN
        -- Intentar con wa_id si existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'message_buffer' 
            AND column_name = 'wa_id'
        ) THEN
            INSERT INTO message_buffer (wa_id, company_id, messages)
            VALUES (p_phone_number, final_company_id, p_messages)
            ON CONFLICT (wa_id, company_id) DO UPDATE SET
                messages = EXCLUDED.messages,
                updated_at = NOW();
            RETURN TRUE;
        END IF;
        
        -- Intentar con phone_number si existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'message_buffer' 
            AND column_name = 'phone_number'
        ) THEN
            INSERT INTO message_buffer (phone_number, company_id, messages)
            VALUES (p_phone_number, final_company_id, p_messages)
            ON CONFLICT (phone_number, company_id) DO UPDATE SET
                messages = EXCLUDED.messages,
                updated_at = NOW();
            RETURN TRUE;
        END IF;
        
        -- Usar tabla alternativa
        INSERT INTO message_buffer_v2 (phone_number, company_id, messages)
        VALUES (p_phone_number, final_company_id, p_messages)
        ON CONFLICT (phone_number, company_id) DO UPDATE SET
            messages = EXCLUDED.messages,
            updated_at = NOW();
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error al insertar: %', SQLERRM;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener mensajes
CREATE OR REPLACE FUNCTION get_message_buffer(
    p_phone_number VARCHAR(20),
    p_company_id UUID DEFAULT NULL
)
RETURNS TABLE (
    phone_number VARCHAR(20),
    messages TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    final_company_id UUID;
BEGIN
    final_company_id := COALESCE(p_company_id, (SELECT id FROM companies LIMIT 1));
    
    -- Intentar obtener de la tabla que exista
    BEGIN
        -- Intentar con wa_id si existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'message_buffer' 
            AND column_name = 'wa_id'
        ) THEN
            RETURN QUERY
            SELECT 
                mb.wa_id::VARCHAR(20) as phone_number,
                mb.messages,
                mb.created_at,
                mb.updated_at
            FROM message_buffer mb
            WHERE mb.wa_id = p_phone_number
            AND mb.company_id = final_company_id;
            RETURN;
        END IF;
        
        -- Intentar con phone_number si existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'message_buffer' 
            AND column_name = 'phone_number'
        ) THEN
            RETURN QUERY
            SELECT 
                mb.phone_number,
                mb.messages,
                mb.created_at,
                mb.updated_at
            FROM message_buffer mb
            WHERE mb.phone_number = p_phone_number
            AND mb.company_id = final_company_id;
            RETURN;
        END IF;
        
        -- Usar tabla alternativa
        RETURN QUERY
        SELECT 
            mb.phone_number,
            mb.messages,
            mb.created_at,
            mb.updated_at
        FROM message_buffer_v2 mb
        WHERE mb.phone_number = p_phone_number
        AND mb.company_id = final_company_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error al obtener mensajes: %', SQLERRM;
        RETURN;
    END;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICAR ESTADO FINAL
-- =============================================

-- Mostrar qué tablas existen
SELECT 
    table_name,
    'exists' as status
FROM information_schema.tables 
WHERE table_name LIKE 'message_buffer%'
AND table_schema = 'public';

-- Mostrar estructura de message_buffer (si existe)
SELECT 
    'message_buffer' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'message_buffer' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- INSTRUCCIONES DE USO
-- =============================================

/*
-- Usar las funciones para compatibilidad:

-- Insertar mensaje:
SELECT insert_message_buffer('5491112345678', 'Mensajes concatenados');

-- Obtener mensajes:
SELECT * FROM get_message_buffer('5491112345678');

-- O usar directamente message_buffer_v2:
INSERT INTO message_buffer_v2 (phone_number, messages) 
VALUES ('5491112345678', 'Mensajes concatenados');

SELECT * FROM message_buffer_v2 WHERE phone_number = '5491112345678';
*/

SELECT 'Script de compatibilidad ejecutado exitosamente! ✅' as status; 