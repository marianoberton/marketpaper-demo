-- Actualizar límites de tamaño de archivos en buckets existentes

-- Actualizar bucket construction-documents de 10MB a 20MB
UPDATE storage.buckets 
SET file_size_limit = 20971520 -- 20MB
WHERE id = 'construction-documents';

-- Verificar que el cambio se aplicó correctamente
SELECT id, name, file_size_limit 
FROM storage.buckets 
WHERE id IN ('construction-documents', 'project-images');