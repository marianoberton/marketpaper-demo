# Guía de Organización de Storage en Supabase

## Problema Actual

Los buckets de Storage pueden tener archivos dispersos en diferentes rutas sin una estructura consistente, lo que genera:

- **Confusión** sobre dónde se almacenan los documentos
- **Dificultad** para encontrar archivos específicos
- **Problemas de escalabilidad** a medida que crece el volumen de datos
- **Inconsistencias** entre lo que está en Storage y lo registrado en la base de datos

## Estructura Recomendada

### Buckets Principales

```
construction-documents/     # Documentos del módulo de construcción
├── {company_id}/
│   └── projects/
│       └── {project_id}/
│           ├── planos/
│           ├── permisos/
│           ├── verificaciones-prefactibilidad-del-proyecto/
│           ├── documentos-legales/
│           └── otros-documentos/

finance-imports/           # Importaciones financieras
├── {company_id}/
│   └── imports/
│       └── {import_date}/

company-logos/            # Logos de empresas
├── {company_id}/
│   └── logo.{ext}

docs/                     # Documentos generales del sistema
├── templates/
├── manuals/
└── system/
```

### Patrón de Nomenclatura

**Para construction-documents:**
```
{company_id}/projects/{project_id}/{section_slug}/{timestamp}-{random}-{sanitized_filename}
```

**Ejemplo real:**
```
57bffb9f-78ba-4252-a9ea-10adf83c3155/projects/b6f547b4-e066-4737-8693-46199613f5fd/verificaciones-prefactibilidad-del-proyecto/1757375488147-169h96-villanueva_version-08-08-2025.pptx-1.pdf
```

## Scripts de Diagnóstico

### 1. Análisis General

Ejecuta en SQL Editor de Supabase:

```bash
# Archivo: analyze-storage-buckets.sql
```

Este script te mostrará:
- Todos los buckets disponibles
- Conteo de objetos por bucket
- Estructura de carpetas en construction-documents
- Ejemplos de rutas
- Archivos en buckets incorrectos
- Patrones inconsistentes
- Archivos duplicados
- Resumen de sostenibilidad
- Políticas RLS
- Archivos más grandes

### 2. Recomendaciones de Limpieza

```bash
# Archivo: storage-cleanup-recommendations.sql
```

Este script identifica:
- Archivos mal ubicados
- Archivos huérfanos en Storage (sin registro en BD)
- Registros huérfanos en BD (sin archivo en Storage)
- Uso de espacio por company
- Archivos sospechosos (muy grandes/pequeños)
- Recomendaciones específicas de limpieza

## Cómo Usar los Scripts

1. **Abre Supabase Dashboard** → Tu proyecto → SQL Editor

2. **Ejecuta primero** `analyze-storage-buckets.sql`
   - Copia todo el contenido del archivo
   - Pégalo en SQL Editor
   - Ejecuta
   - Revisa los resultados de cada sección

3. **Ejecuta después** `storage-cleanup-recommendations.sql`
   - Te dará recomendaciones específicas
   - **NO ejecutes** las secciones comentadas de limpieza sin revisar

## Interpretación de Resultados

### ✅ Señales de Buena Organización
- `percentage_correct_pattern` > 90%
- Pocos archivos en "ARCHIVOS_MAL_UBICADOS"
- Pocos "HUERFANOS_EN_STORAGE" y "HUERFANOS_EN_BD"
- Archivos siguen el patrón `company_id/projects/project_id/section/`

### ⚠️ Señales de Problemas
- Archivos en la raíz del bucket
- Muchos archivos con "Patrón completamente incorrecto"
- Gran cantidad de archivos huérfanos
- Archivos de prueba (`test/`) o temporales (`temp/`) en producción

### 🚨 Problemas Críticos
- Archivos > 50MB (pueden afectar rendimiento)
- Archivos sin tipo MIME
- Discrepancias grandes entre Storage y BD

## Acciones Recomendadas

### Inmediatas
1. **Ejecutar los scripts** para entender el estado actual
2. **Documentar** los patrones encontrados
3. **Identificar** archivos críticos vs archivos de prueba

### A Corto Plazo
1. **Limpiar archivos de prueba** (`test/`, `temp/`)
2. **Eliminar archivos huérfanos** (con cuidado)
3. **Corregir registros** en BD que apuntan a archivos inexistentes

### A Mediano Plazo
1. **Migrar archivos** mal ubicados al patrón correcto
2. **Implementar validaciones** en el código para evitar nuevos problemas
3. **Establecer políticas** de limpieza automática

## Mejores Prácticas

### Para Desarrolladores
- **Siempre usar** `generateUniqueFilePath()` para generar rutas
- **Validar** que el archivo se subió correctamente antes de crear registro en BD
- **Manejar errores** de subida y limpiar archivos parciales
- **No hardcodear** rutas de buckets

### Para Administradores
- **Monitorear** el crecimiento de Storage regularmente
- **Ejecutar scripts** de diagnóstico mensualmente
- **Establecer límites** de tamaño de archivo por tipo
- **Configurar alertas** para uso excesivo de espacio

### Para el Sistema
- **Implementar** limpieza automática de archivos temporales
- **Validar** integridad entre Storage y BD periódicamente
- **Configurar** políticas RLS apropiadas
- **Establecer** backups de buckets críticos

## Comandos de Limpieza (Usar con Precaución)

```sql
-- SOLO ejecutar después de revisar cada caso
-- Respaldar datos importantes antes

-- Eliminar archivos de prueba
DELETE FROM storage.objects 
WHERE bucket_id = 'construction-documents' 
  AND name ~ '^test/';

-- Eliminar registros huérfanos en BD
DELETE FROM project_documents 
WHERE file_url LIKE '%construction-documents%'
  AND id IN (
    SELECT pd.id
    FROM project_documents pd
    LEFT JOIN storage.objects so ON so.name = SUBSTRING(pd.file_url FROM 'construction-documents/(.+)')
    WHERE pd.file_url LIKE '%construction-documents%'
      AND so.name IS NULL
  );
```

## Monitoreo Continuo

Ejecuta este query mensualmente para verificar la salud del Storage:

```sql
SELECT 
  COUNT(*) as total_files,
  COUNT(*) FILTER (WHERE name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/') as organized_files,
  ROUND(
    COUNT(*) FILTER (WHERE name ~ '^[a-f0-9-]{36}/projects/[a-f0-9-]{36}/')::numeric * 100.0 / COUNT(*), 2
  ) as organization_percentage,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb
FROM storage.objects
WHERE bucket_id = 'construction-documents';
```

Si `organization_percentage` < 90%, es hora de hacer limpieza.