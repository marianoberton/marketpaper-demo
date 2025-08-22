-- Script para actualizar límites de archivos en buckets de Supabase Storage
-- Este script actualiza los límites de 10MB a 20MB sin perder datos existentes

-- Actualizar bucket construction-documents de 10MB a 20MB
UPDATE storage.buckets 
SET file_size_limit = 20971520 -- 20MB en bytes
WHERE id = 'construction-documents';

-- Verificar que la actualización se aplicó correctamente
SELECT 
  id,
  name,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb
FROM storage.buckets 
WHERE id IN ('construction-documents', 'project-images');

-- Opcional: También actualizar project-images si se desea (actualmente 5MB)
-- UNCOMMENT la siguiente línea si quieres aumentar también las imágenes a 20MB:
-- UPDATE storage.buckets SET file_size_limit = 20971520 WHERE id = 'project-images';

-- Verificar que no hay archivos que excedan el nuevo límite
-- (Este query es informativo, no debería haber archivos > 20MB)
SELECT 
  bucket_id,
  name,
  metadata->>'size' as file_size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as size_mb
FROM storage.objects 
WHERE bucket_id IN ('construction-documents', 'project-images')
  AND (metadata->>'size')::bigint > 20971520
ORDER BY (metadata->>'size')::bigint DESC;

-- Mensaje de confirmación
SELECT 'Actualización completada. Los buckets ahora permiten archivos de hasta 20MB.' as mensaje;