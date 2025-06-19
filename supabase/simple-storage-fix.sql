-- Configuración mínima para permitir acceso público a los buckets

-- Habilitar RLS en storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política simple para permitir todo en project-images
CREATE POLICY "Allow all for project-images" ON storage.objects
FOR ALL USING (bucket_id = 'project-images');

-- Política simple para permitir todo en construction-documents  
CREATE POLICY "Allow all for construction-documents" ON storage.objects
FOR ALL USING (bucket_id = 'construction-documents'); 