-- Script de verificación para confirmar que todos los límites de archivo están configurados correctamente
-- Este script verifica los buckets de Supabase Storage

-- Verificar límites actuales de buckets
SELECT 
  id as bucket_name,
  name,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb,
  CASE 
    WHEN file_size_limit >= 52428800 THEN '✅ Configurado correctamente (50MB+)'
    WHEN file_size_limit >= 20971520 THEN '⚠️ Límite bajo (20MB)'
    WHEN file_size_limit >= 10485760 THEN '❌ Límite muy bajo (10MB)'
    ELSE '❌ Límite insuficiente (<10MB)'
  END as status
FROM storage.buckets 
WHERE id IN ('construction-documents', 'project-images')
ORDER BY id;

-- Verificar archivos que podrían estar cerca del límite
SELECT 
  bucket_id,
  name,
  metadata->>'size' as file_size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  CASE 
    WHEN (metadata->>'size')::bigint > 41943040 THEN '⚠️ Archivo grande (>40MB)'
    WHEN (metadata->>'size')::bigint > 20971520 THEN 'ℹ️ Archivo mediano (>20MB)'
    ELSE '✅ Archivo normal'
  END as file_status
FROM storage.objects 
WHERE bucket_id IN ('construction-documents', 'project-images')
  AND metadata->>'size' IS NOT NULL
  AND (metadata->>'size')::bigint > 10485760 -- Solo mostrar archivos > 10MB
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 10;

-- Resumen de configuración
SELECT 
  'Verificación completada' as mensaje,
  'Todos los buckets deben mostrar 50MB+ para funcionamiento óptimo' as nota;