-- Script de recomendaciones para limpieza y organización de Storage
-- Ejecutar después de analyze-storage-buckets.sql

-- 1. IDENTIFICAR ARCHIVOS MAL UBICADOS
-- Archivos que no siguen el patrón company_id/projects/project_id/section/
SELECT 
  'ARCHIVOS_MAL_UBICADOS' as issue_type,
  bucket_id,
  name as problematic_path,
  created_at,
  metadata->>'size' as size_bytes,
  CASE 
    WHEN name NOT LIKE '%/%' THEN 'Archivo en raíz del bucket'
    WHEN name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/' THEN 'Patrón correcto (no debería aparecer aquí)'
    WHEN name ~ '^test/' THEN 'Archivo de prueba'
    WHEN name ~ '^temp/' THEN 'Archivo temporal'
    WHEN name ~ '^[a-f0-9-]{36}/' THEN 'Solo tiene company_id, falta estructura projects/'
    ELSE 'Patrón completamente incorrecto'
  END as issue_description
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name !~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
ORDER BY created_at DESC;

-- 2. VERIFICAR CONSISTENCIA CON BASE DE DATOS
-- Archivos en Storage que no tienen registro en project_documents
SELECT 
  'HUERFANOS_EN_STORAGE' as issue_type,
  so.name as storage_path,
  so.created_at as uploaded_at,
  so.metadata->>'size' as size_bytes,
  'No existe en project_documents' as issue
FROM storage.objects so
LEFT JOIN project_documents pd ON pd.file_url LIKE '%' || so.name
WHERE so.bucket_id = 'construction-documents'
  AND pd.id IS NULL
  AND so.name !~ '^test/'
  AND so.name !~ '^temp/'
ORDER BY so.created_at DESC
LIMIT 20;

-- 3. REGISTROS EN BD SIN ARCHIVO EN STORAGE
-- Documentos en BD que apuntan a archivos inexistentes
SELECT 
  'HUERFANOS_EN_BD' as issue_type,
  pd.id as document_id,
  pd.filename,
  pd.file_url,
  pd.created_at,
  pd.project_id,
  'Archivo no existe en Storage' as issue
FROM project_documents pd
LEFT JOIN storage.objects so ON so.name = SUBSTRING(pd.file_url FROM 'construction-documents/(.+)')
WHERE pd.file_url LIKE '%construction-documents%'
  AND so.name IS NULL
ORDER BY pd.created_at DESC
LIMIT 20;

-- 4. ANÁLISIS DE ESPACIO POR COMPANY
SELECT 
  'USAGE_BY_COMPANY' as analysis_type,
  SPLIT_PART(name, '/', 1) as company_id,
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb,
  ROUND(AVG((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as avg_file_size_mb,
  MIN(created_at) as first_upload,
  MAX(created_at) as last_upload
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/'
GROUP BY SPLIT_PART(name, '/', 1)
ORDER BY total_bytes DESC;

-- 5. ARCHIVOS SOSPECHOSOS (muy grandes o muy pequeños)
SELECT 
  'ARCHIVOS_SOSPECHOSOS' as issue_type,
  name,
  metadata->>'size' as size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  metadata->>'mimetype' as mime_type,
  created_at,
  CASE 
    WHEN (metadata->>'size')::bigint > 50 * 1024 * 1024 THEN 'Archivo muy grande (>50MB)'
    WHEN (metadata->>'size')::bigint < 1024 THEN 'Archivo muy pequeño (<1KB)'
    WHEN metadata->>'mimetype' IS NULL THEN 'Sin tipo MIME'
    ELSE 'Otro problema'
  END as issue
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND (
    (metadata->>'size')::bigint > 50 * 1024 * 1024  -- >50MB
    OR (metadata->>'size')::bigint < 1024  -- <1KB
    OR metadata->>'mimetype' IS NULL
  )
ORDER BY (metadata->>'size')::bigint DESC;

-- 6. RECOMENDACIONES DE LIMPIEZA
SELECT 
  'RECOMENDACION' as type,
  'Eliminar archivos de prueba y temporales' as action,
  COUNT(*) as affected_files,
  SUM((metadata->>'size')::bigint) as bytes_to_free
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND (name ~ '^test/' OR name ~ '^temp/')

UNION ALL

SELECT 
  'RECOMENDACION' as type,
  'Mover archivos mal ubicados al patrón correcto' as action,
  COUNT(*) as affected_files,
  SUM((metadata->>'size')::bigint) as bytes_affected
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name !~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
  AND name !~ '^test/'
  AND name !~ '^temp/'

UNION ALL

SELECT 
  'RECOMENDACION' as type,
  'Revisar archivos huérfanos en Storage' as action,
  COUNT(*) as affected_files,
  SUM((metadata->>'size')::bigint) as bytes_affected
FROM storage.objects so
LEFT JOIN project_documents pd ON pd.file_url LIKE '%' || so.name
WHERE so.bucket_id = 'construction-documents'
  AND pd.id IS NULL
  AND so.name !~ '^test/'
  AND so.name !~ '^temp/';

-- 7. SCRIPT DE LIMPIEZA SUGERIDO (COMENTADO - NO EJECUTAR AUTOMÁTICAMENTE)
/*
-- CUIDADO: Estos comandos eliminan datos permanentemente
-- Revisar cada caso antes de ejecutar

-- Eliminar archivos de prueba (SOLO si estás seguro)
-- DELETE FROM storage.objects 
-- WHERE bucket_id = 'construction-documents' 
--   AND name ~ '^test/';

-- Eliminar archivos temporales (SOLO si estás seguro)
-- DELETE FROM storage.objects 
-- WHERE bucket_id = 'construction-documents' 
--   AND name ~ '^temp/';

-- Eliminar registros huérfanos en project_documents
-- DELETE FROM project_documents 
-- WHERE file_url LIKE '%construction-documents%'
--   AND id IN (
--     SELECT pd.id
--     FROM project_documents pd
--     LEFT JOIN storage.objects so ON so.name = SUBSTRING(pd.file_url FROM 'construction-documents/(.+)')
--     WHERE pd.file_url LIKE '%construction-documents%'
--       AND so.name IS NULL
--   );
*/

-- 8. VERIFICACIÓN FINAL DE SALUD DEL BUCKET
SELECT 
  'HEALTH_CHECK' as check_type,
  'Total archivos' as metric,
  COUNT(*)::text as value
FROM storage.objects
WHERE bucket_id = 'construction-documents'

UNION ALL

SELECT 
  'HEALTH_CHECK' as check_type,
  'Archivos con patrón correcto' as metric,
  COUNT(*)::text as value
FROM storage.objects
WHERE bucket_id = 'construction-documents'
  AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'

UNION ALL

SELECT 
  'HEALTH_CHECK' as check_type,
  'Porcentaje de archivos organizados correctamente' as metric,
  ROUND(
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'construction-documents' AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/')::numeric * 100.0 / 
    NULLIF((SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'construction-documents'), 0), 2
  )::text || '%' as value

UNION ALL

SELECT 
  'HEALTH_CHECK' as check_type,
  'Espacio total usado (MB)' as metric,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2)::text as value
FROM storage.objects
WHERE bucket_id = 'construction-documents';