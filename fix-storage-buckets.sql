-- Script para corregir configuración de buckets de Supabase Storage
-- Este script crea el bucket faltante 'company-logos' y actualiza las políticas

-- 1. Crear bucket company-logos (faltante)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- 2. Actualizar límites de buckets existentes a 50MB
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB
WHERE id IN ('construction-documents', 'project-images', 'company-logos');

-- 3. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Permitir lectura pública de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserción de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de documentos de construcción" ON storage.objects;

DROP POLICY IF EXISTS "Permitir lectura pública de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserción de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes de proyectos" ON storage.objects;

DROP POLICY IF EXISTS "Public read construction documents" ON storage.objects;
DROP POLICY IF EXISTS "Public insert construction documents" ON storage.objects;
DROP POLICY IF EXISTS "Public update construction documents" ON storage.objects;
DROP POLICY IF EXISTS "Public delete construction documents" ON storage.objects;

DROP POLICY IF EXISTS "Public read project images" ON storage.objects;
DROP POLICY IF EXISTS "Public insert project images" ON storage.objects;
DROP POLICY IF EXISTS "Public update project images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete project images" ON storage.objects;

DROP POLICY IF EXISTS "Allow all for project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for construction-documents" ON storage.objects;

-- 4. Crear políticas simples y permisivas para todos los buckets

-- Políticas para construction-documents
CREATE POLICY "Allow all access to construction documents" ON storage.objects
FOR ALL USING (bucket_id = 'construction-documents');

-- Políticas para project-images
CREATE POLICY "Allow all access to project images" ON storage.objects
FOR ALL USING (bucket_id = 'project-images');

-- Políticas para company-logos
CREATE POLICY "Allow all access to company logos" ON storage.objects
FOR ALL USING (bucket_id = 'company-logos');

-- 5. Verificar configuración final
SELECT 
  id,
  name,
  public,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('construction-documents', 'project-images', 'company-logos')
ORDER BY id;

-- 6. Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%construction%' 
   OR policyname LIKE '%project%'
   OR policyname LIKE '%company%'
ORDER BY policyname;

SELECT 'Configuración de buckets completada. Todos los buckets están configurados con 50MB de límite y políticas permisivas.' as mensaje;