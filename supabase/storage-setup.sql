-- Crear buckets de storage para el módulo de construcción

-- Bucket para documentos de construcción
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'construction-documents',
  'construction-documents',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de proyectos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para construction-documents
CREATE POLICY "Permitir lectura pública de documentos de construcción" ON storage.objects
FOR SELECT USING (bucket_id = 'construction-documents');

CREATE POLICY "Permitir inserción de documentos de construcción" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'construction-documents');

CREATE POLICY "Permitir actualización de documentos de construcción" ON storage.objects
FOR UPDATE USING (bucket_id = 'construction-documents');

CREATE POLICY "Permitir eliminación de documentos de construcción" ON storage.objects
FOR DELETE USING (bucket_id = 'construction-documents');

-- Políticas RLS para project-images
CREATE POLICY "Permitir lectura pública de imágenes de proyectos" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Permitir inserción de imágenes de proyectos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Permitir actualización de imágenes de proyectos" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-images');

CREATE POLICY "Permitir eliminación de imágenes de proyectos" ON storage.objects
FOR DELETE USING (bucket_id = 'project-images'); 