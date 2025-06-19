-- Solo crear las políticas RLS (los buckets ya existen)

-- Primero, eliminar políticas existentes si las hay (por si acaso)
DROP POLICY IF EXISTS "Permitir lectura pública de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserción de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de documentos de construcción" ON storage.objects;

DROP POLICY IF EXISTS "Permitir lectura pública de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserción de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes de proyectos" ON storage.objects;

-- Crear políticas más simples para construction-documents
CREATE POLICY "Public read construction documents" ON storage.objects
FOR SELECT USING (bucket_id = 'construction-documents');

CREATE POLICY "Public insert construction documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'construction-documents');

CREATE POLICY "Public update construction documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'construction-documents');

CREATE POLICY "Public delete construction documents" ON storage.objects
FOR DELETE USING (bucket_id = 'construction-documents');

-- Crear políticas más simples para project-images
CREATE POLICY "Public read project images" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Public insert project images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Public update project images" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-images');

CREATE POLICY "Public delete project images" ON storage.objects
FOR DELETE USING (bucket_id = 'project-images'); 