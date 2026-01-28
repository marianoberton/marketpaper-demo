# Módulo: Temas (Gestión de Expedientes)

Este módulo gestiona el ciclo de vida de expedientes, trabajos y temas generales dentro de la plataforma. Está diseñado para reemplazar seguimientos manuales en Excel, ofreciendo una visión centralizada del estado, prioridades y responsables de cada asunto.

## 📂 Ubicación
`app/(workspace)/workspace/temas`

## 🛠 Características Principales

### 1. Bandeja de Entrada (`/workspace/temas`)
- **Visualización Rápida**: Tarjetas con contadores en tiempo real por estado.
- **Filtros Avanzados**: Búsqueda por texto, filtrado por estado y prioridad.
- **Listado Interactivo**: Tabla responsive que muestra título, referencia, estado, prioridad, responsables (avatars) y fecha de vencimiento.

### 2. Gestión de Tickets/Temas
- **Creación**: Formulario completo con validación (`/workspace/temas/nuevo`).
- **Detalle**: Vista profunda del expediente (`/workspace/temas/[id]`).
- **Edición en Línea**: Modificación rápida de estado, prioridad y notas desde la vista de detalle.

### 3. Colaboración
- **Asignación Múltiple**: Los temas pueden tener múltiples responsables (User Profiles).
- **Historial de Actividad**: Registro automático de cambios de estado, asignaciones y creación (Audit Log).
- **Notas**: Campo para notas internas o bitácora rápida.

## 🏗 Arquitectura de Datos

El módulo es **totalmente independiente** del módulo de construcción (`/construccion`). Utiliza sus propias tablas en la base de datos:

### Tablas Principales
1.  **`temas`**: Tabla core.
    *   `id` (UUID)
    *   `company_id` (FK -> companies)
    *   `status` (Enum: nuevo_expediente, caratulado, seguimiento, subsanacion, observado, subsanacion_cerrada, completado, finalizado)
    *   `priority` (Enum: baja, media, alta)
    *   `assignees` (Relación M:N con user_profiles via `tema_assignees`)
2.  **`tema_types`**: Tipos de tema configurables por empresa (ej. Administrativo, Técnico, Legal).
3.  **`tema_assignees`**: Tabla pivote para múltiples responsables.
4.  **`tema_activity`**: Log de auditoría inmutable.

### Lógica de Negocio (Backend)
*   **API Routes**: `app/api/workspace/temas/*`
*   **Seguridad**: Row Level Security (RLS) aplicado en todas las tablas. Solo usuarios de la misma `company_id` pueden ver/editar.
*   **Triggers**:
    *   Calculo automático de `updated_at`.
    *   Registro automático en `tema_activity` al cambiar estados.

## 🚀 Uso para Desarrolladores

### Agregar un nuevo Estado
1.  Modificar el check constraint en la base de datos (tabla `temas`, columna `status`).
2.  Actualizar la constante `STATUS_CONFIG` en `app/(workspace)/workspace/temas/page.tsx` y `[id]/page.tsx`.
3.  Actualizar `STATUS_OPTIONS` en los formularios.

### Extender Funcionalidad
Este módulo está preparado para escalar. Futuras mejoras planificadas (Fase 2):
*   **Plantillas de Flujo**: Crear tareas automáticas basadas en el `tema_type`.
*   **Sub-tareas**: Tabla `workflow_tasks` vinculada a `temas`.
*   **Adjuntos**: Integración con Supabase Storage para expedientes digitales.

---
*Documentación actualizada: Enero 2026*
