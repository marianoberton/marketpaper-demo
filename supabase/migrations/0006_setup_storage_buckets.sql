-- Configuración de Storage Buckets para el módulo de construcción

-- Crear bucket para documentos de construcción
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'construction-documents',
  'construction-documents',
  true,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]::text[]
) ON CONFLICT (id) DO NOTHING;

-- Crear bucket para imágenes de proyectos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images', 
  true,
  5242880, -- 5MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]::text[]
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para construction-documents
CREATE POLICY "Authenticated users can view construction documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'construction-documents');

CREATE POLICY "Authenticated users can upload construction documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'construction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own construction documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'construction-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own construction documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'construction-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas de acceso para project-images
CREATE POLICY "Authenticated users can view project images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own project images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);