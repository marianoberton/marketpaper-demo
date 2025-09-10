# Análisis de Políticas RLS de Storage

## Resumen de Políticas Encontradas

El sistema tiene **16 políticas RLS** activas en `storage.objects`, con configuraciones que presentan **problemas de seguridad y redundancias**.

## Problemas Identificados

### 🚨 CRÍTICO: Políticas Públicas Permisivas

**Políticas que permiten acceso público total:**
- `Permitir actualización de documentos de construcción` (UPDATE, public)
- `Permitir actualización de imágenes de proyectos` (UPDATE, public)
- `Permitir eliminación de documentos de construcción` (DELETE, public)
- `Permitir eliminación de imágenes de proyectos` (DELETE, public)
- `Permitir inserción de documentos de construcción` (INSERT, public)
- `Permitir inserción de imágenes de proyectos` (INSERT, public)
- `Permitir lectura pública de documentos de construcción` (SELECT, public)
- `Permitir lectura pública de imágenes de proyectos` (SELECT, public)

**Riesgo:** Cualquier usuario anónimo puede crear, leer, modificar y eliminar archivos.

### ⚠️ MEDIO: Políticas Duplicadas

**Para INSERT:**
- `Authenticated users can upload construction documents` (authenticated)
- `Permitir inserción de documentos de construcción` (public)

**Para SELECT:**
- `Authenticated users can view construction documents` (authenticated)
- `Permitir lectura pública de documentos de construcción` (public)

**Problema:** Las políticas públicas hacen redundantes las de usuarios autenticados.

### 🔍 INCONSISTENCIA: Validación de Ownership

Las políticas de usuarios autenticados para UPDATE/DELETE intentan validar ownership:
```sql
((auth.uid())::text = (storage.foldername(name))[1])
```

**Problema:** Esta validación asume que el primer folder es el `user_id`, pero nuestro patrón es:
```
company_id/projects/project_id/section/file
```

## Estructura Actual vs Esperada

### Patrón Actual de Archivos
```
57bffb9f-78ba-4252-a9ea-10adf83c3155/projects/b6f547b4-e066-4737-8693-46199613f5fd/verificaciones-prefactibilidad-del-proyecto/file.pdf
```

### Validación RLS Actual
```sql
(storage.foldername(name))[1] -- Devuelve company_id, no user_id
```

**Resultado:** Las políticas de ownership no funcionan correctamente.

## Recomendaciones de Seguridad

### 1. ELIMINAR Políticas Públicas Inmediatamente

```sql
-- ELIMINAR estas políticas peligrosas
DROP POLICY "Permitir actualización de documentos de construcción" ON storage.objects;
DROP POLICY "Permitir actualización de imágenes de proyectos" ON storage.objects;
DROP POLICY "Permitir eliminación de documentos de construcción" ON storage.objects;
DROP POLICY "Permitir eliminación de imágenes de proyectos" ON storage.objects;
DROP POLICY "Permitir inserción de documentos de construcción" ON storage.objects;
DROP POLICY "Permitir inserción de imágenes de proyectos" ON storage.objects;
DROP POLICY "Permitir lectura pública de documentos de construcción" ON storage.objects;
DROP POLICY "Permitir lectura pública de imágenes de proyectos" ON storage.objects;
```

### 2. Corregir Validación de Company Access

```sql
-- Política corregida para INSERT
CREATE POLICY "Company members can upload construction documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'construction-documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_companies uc 
    WHERE uc.user_id = auth.uid() 
    AND uc.company_id::text = (storage.foldername(name))[1]
  )
);

-- Política corregida para SELECT
CREATE POLICY "Company members can view construction documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_companies uc 
    WHERE uc.user_id = auth.uid() 
    AND uc.company_id::text = (storage.foldername(name))[1]
  )
);

-- Política corregida para UPDATE
CREATE POLICY "Company members can update construction documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_companies uc 
    WHERE uc.user_id = auth.uid() 
    AND uc.company_id::text = (storage.foldername(name))[1]
  )
);

-- Política corregida para DELETE
CREATE POLICY "Company members can delete construction documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'construction-documents' AND
  EXISTS (
    SELECT 1 FROM user_companies uc 
    WHERE uc.user_id = auth.uid() 
    AND uc.company_id::text = (storage.foldername(name))[1]
  )
);
```

### 3. Eliminar Políticas Redundantes

```sql
-- Eliminar políticas de ownership incorrectas
DROP POLICY "Users can delete their own construction documents" ON storage.objects;
DROP POLICY "Users can delete their own project images" ON storage.objects;
DROP POLICY "Users can update their own construction documents" ON storage.objects;
DROP POLICY "Users can update their own project images" ON storage.objects;
```

## Plan de Implementación

### Fase 1: Auditoría Inmediata
1. Ejecutar `analyze-storage-buckets.sql` para ver el estado actual
2. Verificar qué archivos están expuestos públicamente
3. Revisar logs de acceso no autorizado

### Fase 2: Corrección de Seguridad
1. Eliminar todas las políticas públicas
2. Implementar políticas basadas en company membership
3. Probar acceso con usuarios de diferentes companies

### Fase 3: Validación
1. Verificar que solo company members pueden acceder a sus archivos
2. Confirmar que usuarios no autenticados no tienen acceso
3. Probar edge cases (usuarios sin company, companies inexistentes)

## Impacto en el Sistema

**Antes de la corrección:**
- ❌ Cualquiera puede subir/eliminar archivos
- ❌ Documentos confidenciales expuestos públicamente
- ❌ Posible manipulación maliciosa de archivos

**Después de la corrección:**
- ✅ Solo company members pueden acceder a sus documentos
- ✅ Validación correcta de permisos
- ✅ Seguridad alineada con el modelo de negocio

## Monitoreo Continuo

```sql
-- Query para monitorear políticas activas
SELECT 
  policyname,
  roles,
  cmd,
  CASE 
    WHEN 'public' = ANY(roles) THEN '🚨 PÚBLICO'
    WHEN 'authenticated' = ANY(roles) THEN '✅ AUTENTICADO'
    ELSE '❓ OTRO'
  END as security_level
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY security_level, cmd;
```

---

**ACCIÓN REQUERIDA:** Implementar las correcciones de seguridad **inmediatamente** para proteger los datos de los clientes.