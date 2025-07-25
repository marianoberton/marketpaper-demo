-- ============================================
-- FIX: VALIDACIÓN CUIT MÁS FLEXIBLE
-- ============================================
-- Este script arregla la validación de CUIT para permitir valores vacíos

-- 1. Actualizar la función de validación para ser más flexible
CREATE OR REPLACE FUNCTION validate_cuit(cuit_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si es NULL o string vacío, es válido
    IF cuit_value IS NULL OR trim(cuit_value) = '' THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar formato básico: XX-XXXXXXXX-X
    -- Pero también permitir formatos alternativos comunes
    RETURN cuit_value ~ '^[0-9]{2}-[0-9]{8}-[0-9]$' OR  -- Formato estándar
           cuit_value ~ '^[0-9]{11}$' OR                  -- Solo números (11 dígitos)
           cuit_value ~ '^[0-9]{2}[0-9]{8}[0-9]$';       -- Números sin guiones
END;
$$ LANGUAGE plpgsql;

-- 2. Como alternativa más simple: remover temporalmente el constraint
-- (Descomenta la siguiente línea si prefieres quitar la validación completamente)
-- ALTER TABLE clients DROP CONSTRAINT IF EXISTS check_cuit_format;

-- 3. Verificar que la función funciona correctamente
-- Pruebas de la función (puedes ejecutarlas para verificar):
/*
SELECT 
    validate_cuit(NULL) as test_null,           -- Debe ser TRUE
    validate_cuit('') as test_empty,            -- Debe ser TRUE
    validate_cuit('  ') as test_spaces,        -- Debe ser TRUE
    validate_cuit('20-12345678-9') as test_valid,  -- Debe ser TRUE
    validate_cuit('20123456789') as test_no_dash,  -- Debe ser TRUE
    validate_cuit('12345') as test_invalid;        -- Debe ser FALSE
*/ 