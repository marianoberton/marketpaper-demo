-- Script para corregir problemas críticos de seguridad en Storage RLS
-- EJECUTAR INMEDIATAMENTE - Hay políticas públicas que exponen todos los archivos

-- ========================================
-- FASE 1: ELIMINAR POLÍTICAS PÚBLICAS PELIGROSAS
-- ========================================

-- Estas políticas permiten que CUALQUIER USUARIO ANÓNIMO pueda:
-- - Subir archivos
-- - Leer todos los documentos
-- - Modificar archivos existentes  
-- - Eliminar archivos

DROP POLICY IF EXISTS "Permitir actualización de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserción de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserción de imágenes de proyectos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública de documentos de construcción" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública de imágenes de proyectos" ON storage.objects;

-- ========================================
-- FASE 2: ELIMINAR POLÍTICAS REDUNDANTES/INCORRECTAS
-- ========================================

-- Estas políticas intentan validar ownership pero usan user_id cuando deberían usar company_id
DROP POLICY IF EXISTS "Users can delete their own construction documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own construction documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;

-- ========================================
-- FASE 3: CREAR POLÍTICAS SEGURAS BASADAS EN COMPANY MEMBERSHIP
-- ========================================

-- CONSTRUCCIÓN: Políticas para construction-documents
-- Solo miembros de la company pueden acceder a documentos de su company

-- INSERT: Subir documentos
CREATE POLICY "Company members can upload construction documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'construction-documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
);

-- SELECT: Ver documentos
CREATE POLICY "Company members can view construction documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
);

-- UPDATE: Actualizar metadatos de documentos
CREATE POLICY "Company members can update construction documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
)
WITH CHECK (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
);

-- DELETE: Eliminar documentos (solo admins de company)
CREATE POLICY "Company admins can delete construction documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
    AND up.role IN ('admin', 'owner', 'company_admin', 'company_owner')
  )
);

-- IMÁGENES: Políticas para project-images
-- Misma lógica pero para el bucket de imágenes

-- INSERT: Subir imágenes
CREATE POLICY "Company members can upload project images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
);

-- SELECT: Ver imágenes
CREATE POLICY "Company members can view project images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
);

-- UPDATE: Actualizar metadatos de imágenes
CREATE POLICY "Company members can update project images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
)
WITH CHECK (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
  )
);

-- DELETE: Eliminar imágenes (solo admins de company)
CREATE POLICY "Company admins can delete project images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.company_id::text = (storage.foldername(name))[1]
    AND up.status = 'active'
    AND up.role IN ('admin', 'owner', 'company_admin', 'company_owner')
  )
);

-- ========================================
-- FASE 4: VERIFICACIÓN DE SEGURIDAD
-- ========================================

-- Verificar que no quedan políticas públicas
SELECT 
  'VERIFICACIÓN DE SEGURIDAD' as check_type,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN 'public' = ANY(roles) THEN '🚨 CRÍTICO: Política pública encontrada'
    WHEN 'authenticated' = ANY(roles) THEN '✅ OK: Solo usuarios autenticados'
    ELSE '❓ Revisar: Rol desconocido'
  END as security_status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY 
  CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 2 END,
  cmd;

-- Contar políticas por tipo de seguridad
SELECT 
  'RESUMEN DE SEGURIDAD' as summary,
  SUM(CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 0 END) as politicas_publicas,
  SUM(CASE WHEN 'authenticated' = ANY(roles) THEN 1 ELSE 0 END) as politicas_autenticadas,
  COUNT(*) as total_politicas
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================

/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. VERIFICAR que politicas_publicas = 0 en el resumen
2. PROBAR upload con usuario autenticado de una company
3. VERIFICAR que usuario de otra company NO puede acceder
4. CONFIRMAR que usuario no autenticado NO puede acceder

ESTRUCTURA DE ARCHIVOS ESPERADA:
company_id/projects/project_id/section/filename

EJEMPLO:
57bffb9f-78ba-4252-a9ea-10adf83c3155/projects/b6f547b4-e066-4737-8693-46199613f5fd/verificaciones/documento.pdf

VALIDACIÓN RLS:
- (storage.foldername(name))[1] extrae el company_id
- Se verifica que el usuario pertenezca a esa company en user_companies
- Solo usuarios con status='active' pueden acceder
- Solo admins/owners pueden eliminar archivos

SI ALGO FALLA:
1. Verificar que existe la tabla user_profiles
2. Verificar que los usuarios tienen registros en user_profiles con company_id
3. Verificar que company_id en la ruta coincide con user_profiles.company_id
*/