-- Script para actualizar límites de archivos en buckets de Supabase Storage a 50MB
-- Este script actualiza los límites para aprovechar el máximo permitido por Supabase

-- Actualizar bucket construction-documents a 50MB
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB en bytes
WHERE id = 'construction-documents';

-- Actualizar bucket project-images a 50MB también
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB en bytes
WHERE id = 'project-images';

-- Verificar que las actualizaciones se aplicaron correctamente
SELECT 
  id,
  name,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb
FROM storage.buckets 
WHERE id IN ('construction-documents', 'project-images')
ORDER BY id;

-- Verificar que no hay archivos que excedan el nuevo límite
-- (Este query es informativo, no debería haber archivos > 50MB)
SELECT 
  bucket_id,
  name,
  metadata->>'size' as file_size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb
FROM storage.objects 
WHERE bucket_id IN ('construction-documents', 'project-images')
  AND metadata->>'size' IS NOT NULL
  AND (metadata->>'size')::bigint > 52428800
ORDER BY (metadata->>'size')::bigint DESC;

-- Mensaje de confirmación
SELECT 'Actualización completada. Los buckets ahora permiten archivos de hasta 50MB.' as mensaje;