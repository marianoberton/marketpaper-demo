-- =============================================
-- DIAGNÓSTICO DE ELIMINACIÓN DE PAGOS
-- Script para identificar problemas en DELETE tax_payments
-- =============================================

-- 1. Verificar estructura de tax_payments
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tax_payments' 
ORDER BY ordinal_position;

-- 2. Verificar relaciones con projects
SELECT 
    tp.id,
    tp.project_id,
    p.id as project_exists,
    p.company_id,
    p.name as project_name
FROM tax_payments tp
LEFT JOIN projects p ON tp.project_id = p.id
LIMIT 5;

-- 3. Verificar payment_receipts asociados
SELECT 
    tp.id as payment_id,
    COUNT(pr.id) as receipts_count,
    STRING_AGG(pr.file_url, ', ') as receipt_urls
FROM tax_payments tp
LEFT JOIN payment_receipts pr ON pr.tax_payment_id = tp.id
GROUP BY tp.id
HAVING COUNT(pr.id) > 0
LIMIT 5;

-- 4. Verificar políticas RLS activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tax_payments'
ORDER BY policyname;

-- 5. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'tax_payments';

-- 6. Probar una consulta SELECT similar a la del endpoint
-- (Reemplazar 'PAYMENT_ID_AQUI' con un ID real)
/*
SELECT 
    tp.id,
    tp.project_id,
    p.company_id
FROM tax_payments tp
INNER JOIN projects p ON tp.project_id = p.id
WHERE tp.id = 'PAYMENT_ID_AQUI';
*/

-- 7. Verificar estructura de user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('id', 'company_id', 'role')
ORDER BY ordinal_position;

-- 8. Verificar si hay triggers en tax_payments
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tax_payments';