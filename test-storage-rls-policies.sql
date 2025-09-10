-- Script para probar las políticas RLS de Storage después de la corrección
-- Ejecutar después de fix-storage-rls-security.sql

-- ========================================
-- VERIFICACIÓN 1: ESTADO DE LAS POLÍTICAS
-- ========================================

-- Ver todas las políticas actuales
SELECT 
  '🔍 POLÍTICAS ACTUALES' as check_type,
  policyname,
  cmd as operacion,
  roles,
  CASE 
    WHEN 'public' = ANY(roles) THEN '🚨 CRÍTICO: Acceso público'
    WHEN 'authenticated' = ANY(roles) THEN '✅ OK: Solo autenticados'
    ELSE '❓ Revisar: Rol desconocido'
  END as nivel_seguridad,
  qual as condicion
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY 
  CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 2 END,
  cmd,
  policyname;

-- Resumen de seguridad
SELECT 
  '📊 RESUMEN SEGURIDAD' as check_type,
  COUNT(*) as total_politicas,
  SUM(CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 0 END) as politicas_publicas,
  SUM(CASE WHEN 'authenticated' = ANY(roles) THEN 1 ELSE 0 END) as politicas_autenticadas,
  CASE 
    WHEN SUM(CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 0 END) = 0 THEN '✅ SEGURO'
    ELSE '🚨 INSEGURO - HAY POLÍTICAS PÚBLICAS'
  END as estado_seguridad
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- ========================================
-- VERIFICACIÓN 2: ESTRUCTURA DE DATOS
-- ========================================

-- Verificar que existe la tabla user_profiles
SELECT 
  '🔍 VERIFICAR TABLAS' as check_type,
  'user_profiles' as tabla,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
    THEN '✅ Existe'
    ELSE '❌ NO existe - PROBLEMA CRÍTICO'
  END as estado;

-- Ver estructura de user_profiles
SELECT 
  '📋 ESTRUCTURA user_profiles' as info_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICACIÓN 3: DATOS DE PRUEBA
-- ========================================

-- Ver usuarios existentes con sus companies
SELECT 
  '👥 USUARIOS EXISTENTES' as info_type,
  up.id,
  up.email,
  up.full_name,
  up.company_id,
  up.role,
  up.status,
  c.name as company_name
FROM user_profiles up
LEFT JOIN companies c ON c.id = up.company_id
ORDER BY up.created_at DESC
LIMIT 10;

-- Ver companies existentes
SELECT 
  '🏢 COMPANIES EXISTENTES' as info_type,
  c.id,
  c.name,
  c.status,
  COUNT(up.id) as usuarios_count
FROM companies c
LEFT JOIN user_profiles up ON up.company_id = c.id
GROUP BY c.id, c.name, c.status
ORDER BY usuarios_count DESC;

-- ========================================
-- VERIFICACIÓN 4: ARCHIVOS EN STORAGE
-- ========================================

-- Ver archivos organizados por company
SELECT 
  '📁 ARCHIVOS POR COMPANY' as info_type,
  SPLIT_PART(so.name, '/', 1) as company_id_en_storage,
  c.name as company_name,
  COUNT(*) as archivos_count,
  ROUND(SUM((so.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
  CASE 
    WHEN c.id IS NOT NULL THEN '✅ Company válida'
    ELSE '❌ Company huérfana'
  END as estado_company
FROM storage.objects so
LEFT JOIN companies c ON c.id::text = SPLIT_PART(so.name, '/', 1)
WHERE so.bucket_id = 'construction-documents'
  AND so.name ~ '^[a-f0-9-]{36}/'
GROUP BY 
  SPLIT_PART(so.name, '/', 1),
  c.name,
  c.id
ORDER BY archivos_count DESC;

-- ========================================
-- VERIFICACIÓN 5: SIMULACIÓN DE ACCESO
-- ========================================

-- Esta sección requiere un usuario autenticado para probar
-- Las siguientes consultas muestran qué verificaría RLS

-- Mostrar la lógica que usarían las políticas RLS
SELECT 
  '🔐 LÓGICA RLS' as test_type,
  'Para acceder a un archivo, RLS verificará:' as descripcion,
  '1. Usuario autenticado (auth.uid() IS NOT NULL)' as paso_1,
  '2. Usuario pertenece a company (EXISTS en user_profiles)' as paso_2,
  '3. Company_id en ruta coincide con user_profiles.company_id' as paso_3,
  '4. Usuario tiene status = active' as paso_4,
  '5. Para DELETE: rol debe ser admin/owner/company_admin/company_owner' as paso_5;

-- Ejemplo de verificación manual (simula lo que haría RLS)
-- Reemplazar 'USER_ID_AQUI' y 'COMPANY_ID_AQUI' con valores reales para probar
/*
SELECT 
  '🧪 PRUEBA MANUAL RLS' as test_type,
  so.name as archivo,
  SPLIT_PART(so.name, '/', 1) as company_id_archivo,
  up.company_id::text as company_id_usuario,
  up.role,
  up.status,
  CASE 
    WHEN up.id IS NULL THEN '❌ Usuario no encontrado'
    WHEN up.status != 'active' THEN '❌ Usuario inactivo'
    WHEN up.company_id::text != SPLIT_PART(so.name, '/', 1) THEN '❌ Company diferente'
    ELSE '✅ Acceso permitido'
  END as resultado_acceso,
  CASE 
    WHEN up.role IN ('admin', 'owner', 'company_admin', 'company_owner') THEN '✅ Puede eliminar'
    ELSE '❌ No puede eliminar'
  END as puede_eliminar
FROM storage.objects so
CROSS JOIN (
  SELECT * FROM user_profiles 
  WHERE id = 'USER_ID_AQUI'::uuid  -- Reemplazar con UUID real
) up
WHERE so.bucket_id = 'construction-documents'
  AND so.name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
LIMIT 5;
*/

-- ========================================
-- VERIFICACIÓN 6: FUNCIONES DE STORAGE
-- ========================================

-- Verificar si existe la función storage.foldername
SELECT 
  '🔧 FUNCIONES STORAGE' as check_type,
  'storage.foldername' as funcion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'storage' AND p.proname = 'foldername'
    ) THEN '✅ Existe'
    ELSE '❌ NO existe - Las políticas fallarán'
  END as estado;

-- ========================================
-- PRÓXIMOS PASOS PARA PRUEBAS REALES
-- ========================================

/*
PARA PROBAR LAS POLÍTICAS RLS EN VIVO:

1. 🔐 CREAR USUARIO DE PRUEBA:
   - Registrar usuario en Supabase Auth
   - Crear registro en user_profiles con company_id válido
   - Asignar rol y status = 'active'

2. 📤 PROBAR UPLOAD:
   - Autenticarse con el usuario de prueba
   - Intentar subir archivo a construction-documents
   - Verificar que se crea en: company_id/projects/project_id/section/

3. 👀 PROBAR ACCESO:
   - Verificar que usuario puede ver sus archivos
   - Verificar que NO puede ver archivos de otra company
   - Probar con usuario no autenticado (debe fallar)

4. ✏️ PROBAR MODIFICACIÓN:
   - Intentar actualizar metadatos de archivo propio (debe funcionar)
   - Intentar actualizar archivo de otra company (debe fallar)

5. 🗑️ PROBAR ELIMINACIÓN:
   - Con rol admin/owner: debe poder eliminar
   - Con rol employee: NO debe poder eliminar
   - De otra company: NO debe poder eliminar

6. 📊 MONITOREAR LOGS:
   - Revisar logs de Supabase para errores RLS
   - Verificar que no hay accesos no autorizados

COMANDOS ÚTILES PARA DEBUG:

-- Ver logs de RLS en tiempo real:
-- SELECT * FROM pg_stat_activity WHERE query LIKE '%storage.objects%';

-- Verificar permisos de usuario actual:
-- SELECT auth.uid(), auth.role();

-- Ver políticas que se están aplicando:
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM storage.objects WHERE bucket_id = 'construction-documents';
*/

-- ========================================
-- RESUMEN FINAL
-- ========================================

SELECT 
  '📋 CHECKLIST FINAL' as tipo,
  '✅ Políticas públicas eliminadas' as item_1,
  '✅ Políticas basadas en user_profiles creadas' as item_2,
  '✅ Roles admin/owner pueden eliminar' as item_3,
  '⏳ Pendiente: Probar con usuario real' as item_4,
  '⏳ Pendiente: Verificar upload funciona' as item_5,
  '⏳ Pendiente: Confirmar aislamiento entre companies' as item_6;