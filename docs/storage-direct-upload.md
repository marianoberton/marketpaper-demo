# Direct Upload to Supabase Storage

Este documento describe la implementación del sistema de subida directa a Supabase Storage usando URLs firmadas, que reemplaza el método anterior de subida a través de API routes para evitar límites de serverless.

## Arquitectura

El nuevo sistema implementa un flujo de 3 pasos:

1. **Obtener URL firmada**: El cliente solicita una URL firmada desde `/api/storage/signed-upload`
2. **Subida directa**: El archivo se sube directamente a Supabase Storage usando la URL firmada
3. **Confirmación**: Se confirma la subida y se guardan los metadatos en `/api/storage/commit`

## Configuración de CORS en Supabase Storage

Para que funcione la subida directa desde el navegador, es necesario configurar CORS en Supabase Storage:

### 1. Acceder a la configuración de Storage

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** > **Settings**
3. Busca la sección **CORS configuration**

### 2. Configurar CORS

Agrega la siguiente configuración CORS:

```json
[
  {
    "allowedOrigins": [
      "http://localhost:3000",
      "https://tu-dominio-staging.vercel.app",
      "https://tu-dominio-produccion.com"
    ],
    "allowedMethods": ["POST", "PUT", "OPTIONS"],
    "allowedHeaders": [
      "authorization",
      "content-type",
      "x-client-info",
      "cache-control"
    ],
    "maxAgeSeconds": 3600
  }
]
```

**Importante**: Reemplaza las URLs de ejemplo con tus dominios reales de staging y producción.

## Políticas de Seguridad (RLS)

Para garantizar que los usuarios solo puedan subir archivos a sus respectivos workspaces, implementa las siguientes políticas RLS:

### 1. Política de INSERT para buckets

Crea una política que permita INSERT solo bajo rutas que comiencen con `<workspaceId>/`:

```sql
-- Política para finance-imports
CREATE POLICY "Users can upload to their workspace finance imports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'finance-imports' 
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.jwt() ->> 'company_id') || '/%'
);

-- Política para construction-documents
CREATE POLICY "Users can upload to their workspace construction docs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'construction-documents' 
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.jwt() ->> 'company_id') || '/%'
);

-- Política para company-logos
CREATE POLICY "Users can upload to their workspace logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.jwt() ->> 'company_id') || '/%'
);
```

### 2. Política de SELECT para acceso a archivos

```sql
-- Permitir lectura de archivos del mismo workspace
CREATE POLICY "Users can view their workspace files" 
ON storage.objects 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND name LIKE (auth.jwt() ->> 'company_id') || '/%'
);
```

### 3. Política de DELETE para eliminación

```sql
-- Permitir eliminación de archivos del mismo workspace
CREATE POLICY "Users can delete their workspace files" 
ON storage.objects 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL
  AND name LIKE (auth.jwt() ->> 'company_id') || '/%'
);
```

## Variables de Entorno

Asegúrate de que las siguientes variables estén configuradas:

```env
# Públicas (disponibles en el cliente)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Privadas (solo en el servidor)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Buckets Configurados

| Bucket | Propósito | Carpetas | Público |
|--------|-----------|----------|----------|
| `finance-imports` | Recibos y archivos de importación financiera | `receipts/`, `imports/` | Sí |
| `construction-documents` | Documentos de proyectos de construcción | Por sección de proyecto | Sí |
| `company-logos` | Logos de empresas | `logos/` | Sí |

## Límites y Validaciones

- **Tamaño máximo**: 50MB por archivo
- **Validación en frontend**: Tamaño y tipo de archivo
- **Validación en backend**: Verificación de existencia y tamaño en `/api/storage/commit`
- **Estructura de rutas**: `<workspaceId>/<folder>/<timestamp>_<filename>`

## Migración Completada

Los siguientes componentes han sido migrados al nuevo sistema:

- ✅ `ExpenseModal.tsx` - Subida de recibos
- ✅ `ImportModal.tsx` - Importación de archivos financieros
- ✅ `DocumentUpload.tsx` - Documentos de construcción

## Pruebas

Para verificar que la implementación funciona correctamente:

### 1. Prueba de archivos pequeños (1-2MB)
- Debe completarse exitosamente
- Debe devolver `publicUrl` si el bucket es público
- No debe aparecer error 413/502/504

### 2. Prueba de archivos medianos (20-40MB)
- Debe completarse exitosamente
- En Network tab debe verse:
  - Llamada a `/api/storage/signed-upload`
  - Llamada directa a Supabase Storage
  - Llamada a `/api/storage/commit`
- No debe usar API routes para transferir el archivo

### 3. Prueba de archivos grandes (>50MB)
- Debe ser bloqueado en el frontend
- Si se fuerza, debe ser rechazado en `/api/storage/commit`

### 4. Verificación de endpoints obsoletos
- Confirmar que no se usan más:
  - `/api/workspace/finanzas/upload`
  - `/api/workspace/construction/documents`
  - Cualquier otro endpoint que reciba FormData

## Troubleshooting

### Error de CORS
- Verificar configuración CORS en Supabase Dashboard
- Asegurar que el dominio esté en `allowedOrigins`
- Verificar que los headers estén permitidos

### Error de políticas RLS
- Verificar que las políticas estén habilitadas
- Confirmar que `company_id` esté en el JWT
- Verificar que la ruta del archivo comience con `workspaceId/`

### Error de variables de entorno
- Verificar que `NEXT_PUBLIC_SUPABASE_URL` esté definida
- Verificar que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté definida
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté definida (solo servidor)

### Error de tamaño de archivo
- Verificar límite de 50MB en el frontend
- Verificar validación en `/api/storage/commit`
- Confirmar que no hay límites adicionales en Supabase