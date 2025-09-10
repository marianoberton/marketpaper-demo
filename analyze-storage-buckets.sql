-- Script para analizar buckets de Storage en Supabase
-- Ejecutar en SQL Editor de Supabase Dashboard

-- 1. Ver todos los buckets disponibles
SELECT 
  name as bucket_name,
  public,
  created_at,
  updated_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY created_at;

-- 2. Contar objetos por bucket
SELECT 
  bucket_id,
  COUNT(*) as total_objects,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
GROUP BY bucket_id
ORDER BY total_objects DESC;

-- 3. Analizar estructura de carpetas en construction-documents
SELECT 
  SPLIT_PART(name, '/', 1) as company_folder,
  SPLIT_PART(name, '/', 2) as level_2,
  SPLIT_PART(name, '/', 3) as project_folder,
  SPLIT_PART(name, '/', 4) as section_folder,
  COUNT(*) as files_count,
  SUM((metadata->>'size')::bigint) as folder_size_bytes
FROM storage.objects
WHERE bucket_id = 'construction-documents'
GROUP BY 
  SPLIT_PART(name, '/', 1),
  SPLIT_PART(name, '/', 2),
  SPLIT_PART(name, '/', 3),
  SPLIT_PART(name, '/', 4)
ORDER BY files_count DESC
LIMIT 20;

-- 4. Ver ejemplos de rutas completas en construction-documents
SELECT 
  name as full_path,
  metadata->>'size' as size_bytes,
  created_at,
  LENGTH(name) as path_length
FROM storage.objects
WHERE bucket_id = 'construction-documents'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar si hay archivos en otros buckets que deberían estar en construction-documents
SELECT 
  bucket_id,
  name,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects
WHERE bucket_id != 'construction-documents'
  AND (metadata->>'mimetype' LIKE '%pdf%' 
       OR metadata->>'mimetype' LIKE '%document%'
       OR metadata->>'mimetype' LIKE '%spreadsheet%'
       OR name ILIKE '%.pdf'
       OR name ILIKE '%.doc%'
       OR name ILIKE '%.xls%')
ORDER BY created_at DESC;

-- 6. Buscar patrones inconsistentes en nombres de archivos
SELECT 
  bucket_id,
  name,
  CASE 
    WHEN name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/' THEN 'Patrón correcto'
    WHEN name ~ '^[a-f0-9-]{36}/' THEN 'Solo company_id'
    WHEN name ~ 'projects/' THEN 'Contiene projects pero formato incorrecto'
    ELSE 'Patrón desconocido'
  END as pattern_analysis,
  created_at
FROM storage.objects
WHERE bucket_id = 'construction-documents'
ORDER BY pattern_analysis, created_at DESC;

-- 7. Verificar archivos duplicados (mismo nombre en diferentes rutas)
SELECT 
  SPLIT_PART(name, '/', -1) as filename,
  COUNT(*) as occurrences,
  STRING_AGG(name, ' | ') as all_paths
FROM storage.objects
WHERE bucket_id = 'construction-documents'
GROUP BY SPLIT_PART(name, '/', -1)
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;

-- 8. Resumen de sostenibilidad
SELECT 
  'RESUMEN DE SOSTENIBILIDAD' as analysis,
  (
    SELECT COUNT(*) 
    FROM storage.objects 
    WHERE bucket_id = 'construction-documents'
      AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
  ) as files_with_correct_pattern,
  (
    SELECT COUNT(*) 
    FROM storage.objects 
    WHERE bucket_id = 'construction-documents'
  ) as total_construction_files,
  ROUND(
    (
      SELECT COUNT(*) 
      FROM storage.objects 
      WHERE bucket_id = 'construction-documents'
        AND name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/'
    ) * 100.0 / NULLIF(
      (
        SELECT COUNT(*) 
        FROM storage.objects 
        WHERE bucket_id = 'construction-documents'
      ), 0
    ), 2
  ) as percentage_correct_pattern;

-- 9. Verificar políticas RLS en Storage
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
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- 10. Archivos más grandes (posibles problemas de rendimiento)
SELECT 
  bucket_id,
  name,
  metadata->>'size' as size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects
WHERE (metadata->>'size')::bigint > 10485760  -- Archivos > 10MB
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 15;