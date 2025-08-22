-- Script para verificar los límites actuales de los buckets de Supabase
-- Ejecutar este script en el SQL Editor de Supabase para verificar la configuración

-- Verificar límites actuales de los buckets
SELECT 
  id,
  name,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id IN ('construction-documents', 'project-images')
ORDER BY id;

-- Verificar políticas de storage que puedan estar limitando el tamaño
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
  AND tablename = 'objects'
  AND policyname LIKE '%construction%'
ORDER BY policyname;

-- Verificar archivos más grandes actualmente almacenados
SELECT 
  bucket_id,
  name,
  metadata->>'size' as file_size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb,
  created_at
FROM storage.objects 
WHERE bucket_id IN ('construction-documents', 'project-images')
  AND metadata->>'size' IS NOT NULL
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 10;

-- Mensaje informativo
SELECT 'Verificación de límites de buckets completada. Revisa los resultados anteriores.' as mensaje;