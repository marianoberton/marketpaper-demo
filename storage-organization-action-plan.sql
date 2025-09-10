-- Plan de Acción para Organización de Storage
-- Basado en los resultados del health check: 17.78% archivos organizados correctamente

-- ========================================
-- ANÁLISIS DETALLADO DE ARCHIVOS MAL UBICADOS
-- ========================================

-- 1. Ver todos los archivos que NO siguen el patrón correcto
SELECT 
  'ARCHIVOS_DESORGANIZADOS' as tipo,
  name as ruta_actual,
  created_at,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  CASE 
    WHEN name NOT LIKE '%/%' THEN 'RAÍZ: Archivo en raíz del bucket'
    WHEN name ~ '^test/' THEN 'TEST: Archivo de prueba - ELIMINAR'
    WHEN name ~ '^temp/' THEN 'TEMP: Archivo temporal - ELIMINAR'
    WHEN name ~ '^[a-f0-9-]{36}$' THEN 'SOLO_UUID: Solo company_id, sin estructura'
    WHEN name ~ '^[a-f0-9-]{36}/[^/]+$' THEN 'SIN_PROJECTS: Falta carpeta projects/'
    WHEN name ~ '^[a-f0-9-]{36}/projects/$' THEN 'CARPETA_VACÍA: Solo carpeta projects'
    WHEN name ~ '^[a-f0-9-]{36}/projects/[^/]+$' THEN 'SIN_PROJECT_ID: Falta project_id específico'
    ELSE 'OTRO_PATRÓN: Revisar manualmente'
  END as problema,
  CASE 
    WHEN name ~ '^test/' OR name ~ '^temp/' THEN '🗑️ ELIMINAR'
    WHEN name ~ '^[a-f0-9-]{36}/' THEN '📁 REORGANIZAR'
    ELSE '❓ REVISAR'
  END as accion_sugerida
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name !~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
ORDER BY 
  CASE 
    WHEN name ~ '^test/' OR name ~ '^temp/' THEN 1
    WHEN name ~ '^[a-f0-9-]{36}/' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- ========================================
-- IDENTIFICAR COMPANIES Y PROJECTS EXISTENTES
-- ========================================

-- 2. Ver qué companies tienen archivos
SELECT 
  'COMPANIES_CON_ARCHIVOS' as tipo,
  SPLIT_PART(name, '/', 1) as company_id,
  COUNT(*) as total_archivos,
  COUNT(CASE WHEN name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/' THEN 1 END) as archivos_organizados,
  COUNT(CASE WHEN name !~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/' THEN 1 END) as archivos_desorganizados,
  ROUND(
    COUNT(CASE WHEN name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/' THEN 1 END)::numeric * 100.0 / 
    COUNT(*), 2
  ) as porcentaje_organizados
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/'
GROUP BY SPLIT_PART(name, '/', 1)
ORDER BY porcentaje_organizados ASC;

-- 3. Ver qué projects tienen archivos organizados
SELECT 
  'PROJECTS_ORGANIZADOS' as tipo,
  SPLIT_PART(name, '/', 1) as company_id,
  SPLIT_PART(name, '/', 3) as project_id,
  COUNT(*) as archivos,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
  MIN(created_at) as primer_archivo,
  MAX(created_at) as ultimo_archivo
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
GROUP BY 
  SPLIT_PART(name, '/', 1),
  SPLIT_PART(name, '/', 3)
ORDER BY archivos DESC;

-- ========================================
-- VERIFICAR CONSISTENCIA CON BASE DE DATOS
-- ========================================

-- 4. Verificar si las companies en storage existen en la BD
SELECT 
  'VERIFICACION_COMPANIES' as tipo,
  storage_companies.company_id,
  storage_companies.archivos_en_storage,
  CASE 
    WHEN c.id IS NOT NULL THEN '✅ Existe en BD'
    ELSE '❌ NO existe en BD - HUÉRFANO'
  END as estado_bd,
  c.name as company_name,
  c.status as company_status
FROM (
  SELECT 
    SPLIT_PART(name, '/', 1) as company_id,
    COUNT(*) as archivos_en_storage
  FROM storage.objects
  WHERE bucket_id = 'construction-documents'
    AND name ~ '^[a-f0-9-]{36}/'
  GROUP BY SPLIT_PART(name, '/', 1)
) storage_companies
LEFT JOIN companies c ON c.id::text = storage_companies.company_id
ORDER BY 
  CASE WHEN c.id IS NULL THEN 1 ELSE 2 END,
  storage_companies.archivos_en_storage DESC;

-- 5. Verificar si los projects en storage existen en la BD
SELECT 
  'VERIFICACION_PROJECTS' as tipo,
  storage_projects.company_id,
  storage_projects.project_id,
  storage_projects.archivos_en_storage,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Existe en BD'
    ELSE '❌ NO existe en BD - HUÉRFANO'
  END as estado_bd,
  p.name as project_name,
  p.status as project_status
FROM (
  SELECT 
    SPLIT_PART(name, '/', 1) as company_id,
    SPLIT_PART(name, '/', 3) as project_id,
    COUNT(*) as archivos_en_storage
  FROM storage.objects
  WHERE bucket_id = 'construction-documents'
    AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
  GROUP BY 
    SPLIT_PART(name, '/', 1),
    SPLIT_PART(name, '/', 3)
) storage_projects
LEFT JOIN projects p ON p.id::text = storage_projects.project_id
ORDER BY 
  CASE WHEN p.id IS NULL THEN 1 ELSE 2 END,
  storage_projects.archivos_en_storage DESC;

-- ========================================
-- PLAN DE LIMPIEZA INMEDIATA
-- ========================================

-- 6. PASO 1: Eliminar archivos de prueba y temporales (EJECUTAR PRIMERO)
/*
-- ⚠️ CUIDADO: Esto elimina archivos permanentemente
-- Revisar la lista antes de ejecutar:

SELECT name, created_at, metadata->>'size' as size_bytes
FROM storage.objects 
WHERE bucket_id = 'construction-documents' 
  AND (name ~ '^test/' OR name ~ '^temp/')
ORDER BY created_at;

-- Si estás seguro, descomenta y ejecuta:
-- DELETE FROM storage.objects 
-- WHERE bucket_id = 'construction-documents' 
--   AND (name ~ '^test/' OR name ~ '^temp/');
*/

-- 7. PASO 2: Identificar archivos que se pueden reorganizar automáticamente
SELECT 
  'REORGANIZACION_AUTOMATICA' as tipo,
  name as ruta_actual,
  CASE 
    WHEN name ~ '^[a-f0-9-]{36}/[^/]+\.[a-zA-Z0-9]+$' THEN 
      SPLIT_PART(name, '/', 1) || '/projects/NECESITA_PROJECT_ID/' || SPLIT_PART(name, '/', 2)
    ELSE 'REVISAR_MANUALMENTE'
  END as ruta_sugerida,
  created_at,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/'
  AND name !~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
  AND name !~ '^test/'
  AND name !~ '^temp/'
ORDER BY created_at DESC;

-- ========================================
-- RESUMEN Y PRÓXIMOS PASOS
-- ========================================

-- 8. Resumen final del estado
SELECT 
  'RESUMEN_FINAL' as tipo,
  'Total archivos' as metrica,
  COUNT(*)::text as valor
FROM storage.objects
WHERE bucket_id = 'construction-documents'

UNION ALL

SELECT 
  'RESUMEN_FINAL' as tipo,
  'Archivos organizados correctamente' as metrica,
  COUNT(*)::text as valor
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'

UNION ALL

SELECT 
  'RESUMEN_FINAL' as tipo,
  'Archivos de prueba/temporales (ELIMINAR)' as metrica,
  COUNT(*)::text as valor
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND (name ~ '^test/' OR name ~ '^temp/')

UNION ALL

SELECT 
  'RESUMEN_FINAL' as tipo,
  'Archivos desorganizados (REORGANIZAR)' as metrica,
  COUNT(*)::text as valor
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/'
  AND name !~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
  AND name !~ '^test/'
  AND name !~ '^temp/';

-- ========================================
-- PRÓXIMOS PASOS RECOMENDADOS
-- ========================================

/*
PLAN DE ACCIÓN:

1. 🔍 ANÁLISIS (YA HECHO)
   - Ejecutar este script para entender el estado actual
   - Identificar archivos problemáticos

2. 🗑️ LIMPIEZA INMEDIATA
   - Eliminar archivos test/ y temp/ (recuperar ~X MB)
   - Eliminar archivos huérfanos sin company/project válido

3. 📁 REORGANIZACIÓN
   - Mover archivos mal ubicados al patrón correcto
   - Crear project_ids faltantes si es necesario
   - Actualizar referencias en project_documents

4. 🔒 SEGURIDAD
   - Ejecutar fix-storage-rls-security.sql (YA CORREGIDO)
   - Verificar que las políticas funcionan correctamente

5. 📊 MONITOREO
   - Configurar alertas para archivos mal ubicados
   - Implementar validación en el frontend
   - Ejecutar health checks periódicos

ESTADO ACTUAL:
- ✅ Scripts de análisis creados
- ✅ Script de seguridad RLS corregido
- ⏳ Pendiente: Ejecutar limpieza
- ⏳ Pendiente: Reorganizar archivos
- ⏳ Pendiente: Probar upload con nuevas políticas
*/