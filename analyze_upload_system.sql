-- Script general para analizar la estructura completa de la base de datos
-- y luego el sistema de uploads específico
-- Ejecutar en el SQL Editor de Supabase

-- ========================================
-- PARTE 1: ANÁLISIS GENERAL DE LA BASE DE DATOS
-- ========================================

-- 1. Ver todos los esquemas disponibles
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- 2. Ver todas las tablas en el esquema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Ver todas las tablas en el esquema storage
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'storage'
ORDER BY table_name;

-- 4. Ver todas las tablas en el esquema auth
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 5. Ver columnas de todas las tablas que podrían estar relacionadas con uploads
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema IN ('public', 'storage', 'auth')
AND (
    table_name ILIKE '%document%' OR
    table_name ILIKE '%file%' OR
    table_name ILIKE '%upload%' OR
    table_name ILIKE '%storage%' OR
    table_name ILIKE '%import%' OR
    table_name ILIKE '%receipt%' OR
    table_name ILIKE '%logo%' OR
    column_name ILIKE '%file%' OR
    column_name ILIKE '%document%' OR
    column_name ILIKE '%upload%' OR
    column_name ILIKE '%url%' OR
    column_name ILIKE '%path%'
)
ORDER BY table_schema, table_name, ordinal_position;

-- 6. Ver estructura completa de la tabla auth.users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- PARTE 2: ANÁLISIS ESPECÍFICO DE STORAGE
-- ========================================

-- 7. Verificar si existe la tabla storage.buckets
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'buckets'
) as buckets_table_exists;

-- 8. Si existe storage.buckets, ver su estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'buckets'
ORDER BY ordinal_position;

-- 9. Verificar si existe la tabla storage.objects
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects'
) as objects_table_exists;

-- 10. Si existe storage.objects, ver su estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
ORDER BY ordinal_position;

-- ========================================
-- PARTE 3: CONSULTAS CONDICIONALES BASADAS EN EXISTENCIA
-- ========================================

-- 11. Buckets existentes (solo si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        RAISE NOTICE 'Ejecutando consulta de buckets...';
        -- Esta parte se ejecutará manualmente después de confirmar la estructura
    ELSE
        RAISE NOTICE 'La tabla storage.buckets no existe';
    END IF;
END $$;

-- 12. Objetos en storage (solo si la tabla existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        RAISE NOTICE 'La tabla storage.objects existe';
    ELSE
        RAISE NOTICE 'La tabla storage.objects no existe';
    END IF;
END $$;

-- ========================================
-- PARTE 4: FUNCIONES Y POLÍTICAS
-- ========================================

-- 13. Ver todas las funciones relacionadas con storage/upload
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema IN ('public', 'storage')
AND (
    routine_name ILIKE '%upload%' OR
    routine_name ILIKE '%file%' OR
    routine_name ILIKE '%document%' OR
    routine_name ILIKE '%storage%'
)
ORDER BY routine_schema, routine_name;

-- 14. Ver políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- ========================================
-- INSTRUCCIONES PARA CONTINUAR
-- ========================================

/*
Después de ejecutar este script, revisa los resultados y:

1. Confirma qué tablas de storage existen realmente
2. Verifica la estructura exacta de auth.users
3. Identifica las tablas del esquema public relacionadas con uploads
4. Basándote en los resultados, ejecuta consultas específicas como:

-- Para buckets (si existe la tabla):
SELECT * FROM storage.buckets ORDER BY name;

-- Para objetos (si existe la tabla y tiene las columnas correctas):
SELECT 
    bucket_id,
    name,
    created_at,
    metadata
FROM storage.objects 
LIMIT 10;

-- Para usuarios (usando las columnas que realmente existen):
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;
*/