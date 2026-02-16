# Módulo de Tareas

> [Inicio](../../README.md) > [Módulos](../README.md) > Tareas

## Descripción

Vista centralizada de todas las tareas asignadas al usuario actual, agrupadas por tema al que pertenecen. Es una vista transversal de la tabla `tema_tasks` — las tareas se crean y gestionan dentro de cada [Tema](temas.md), pero este módulo las muestra filtradas por el usuario asignado.

## Rutas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/workspace/tareas` | `app/(workspace)/workspace/tareas/page.tsx` | Server Component wrapper |
| — | `app/(workspace)/workspace/tareas/client-page.tsx` | Dashboard de tareas (client, ~350 líneas) |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspace/tareas` | Tareas asignadas al usuario + stats |
| PATCH | `/api/workspace/tareas` | Cambiar estado de una tarea |

### GET — Listar tareas del usuario

**Parámetros de query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Filtrar: `pendiente`, `en_progreso`, `completada` |
| `show_completed` | boolean | Incluir tareas completadas |

**Respuesta:**

```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid",
      "title": "Revisar documentación",
      "description": "Verificar que los planos estén actualizados",
      "status": "pendiente",
      "due_date": "2024-02-15",
      "sort_order": 0,
      "created_at": "2024-02-01T10:00:00Z",
      "completed_at": null,
      "tema": {
        "id": "uuid",
        "title": "Expediente Obra Norte",
        "reference_code": "REF-123",
        "status": "caratulado",
        "priority": "alta",
        "type": { "id": "uuid", "name": "Concesión", "color": "#FF6B6B" }
      }
    }
  ],
  "stats": {
    "total": 10,
    "pendientes": 3,
    "enProgreso": 2,
    "completadas": 5
  }
}
```

### PATCH — Cambiar estado

```json
// Request body
{ "taskId": "uuid", "status": "completada" }

// Response
{ "success": true, "task": { /* tarea actualizada */ } }
```

### APIs del módulo Temas (CRUD completo)

Las tareas se crean y editan desde el detalle de cada tema:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/workspace/temas/[id]/tasks` | Crear tarea en un tema |
| PATCH | `/api/workspace/temas/[id]/tasks/[taskId]` | Actualizar tarea |
| DELETE | `/api/workspace/temas/[id]/tasks/[taskId]` | Eliminar tarea |

## Tabla: `tema_tasks`

Migración: `0028_temas_phase2_tasks_areas.sql`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `tema_id` | UUID | FK a temas (ON DELETE CASCADE) |
| `title` | TEXT | Título (requerido) |
| `description` | TEXT | Descripción opcional |
| `status` | TEXT | `'pending'`, `'in_progress'`, `'completed'`, `'blocked'` |
| `assigned_to` | UUID | FK a user_profiles (ON DELETE SET NULL) |
| `sort_order` | INTEGER | Orden de la tarea (default: 0) |
| `depends_on` | UUID[] | Array de IDs de tareas de las que depende |
| `is_sequential` | BOOLEAN | Si se ejecuta en secuencia (default: true) |
| `due_date` | DATE | Fecha de vencimiento |
| `started_at` | TIMESTAMPTZ | Primera vez que pasó a `in_progress` |
| `completed_at` | TIMESTAMPTZ | Fecha de completado |
| `completed_by` | UUID | FK a user_profiles (quién completó) |
| `created_by` | UUID | FK a user_profiles (quién creó) |
| `created_at` | TIMESTAMPTZ | Creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

### Índices

- `idx_tema_tasks_tema` — por `tema_id`
- `idx_tema_tasks_assigned` — por `assigned_to`
- `idx_tema_tasks_status` — por `status`

### RLS

- Super admins: acceso total
- Usuarios: ver y gestionar tareas de temas de su empresa

## Estados y transiciones

| Estado | Descripción | Side effects |
|--------|-------------|--------------|
| `pending` | No iniciada | — |
| `in_progress` | En progreso | Setea `started_at` (solo la primera vez) |
| `completed` | Completada | Setea `completed_at` y `completed_by`; trigger de notificación; Slack |
| `blocked` | Bloqueada | — |

### Configuración visual en el dashboard

```typescript
STATUS_CONFIG = {
  pendiente:   { label: 'Pendiente',   color: 'bg-muted text-muted-foreground' },
  en_progreso: { label: 'En Progreso', color: 'bg-primary/20 text-primary border border-primary/30' },
  completada:  { label: 'Completada',  color: 'bg-foreground/10 text-foreground/70' },
}
```

## Funcionalidades del dashboard

### Filtros

- Por estado: Todas / Pendientes / En progreso / Completadas
- Toggle para mostrar/ocultar completadas
- Botón de refresh manual

### Ordenamiento

Las tareas se ordenan por `due_date` ascendente (nulls last).

### Agrupación

Las tareas se agrupan por tema, mostrando:
- Badge de tipo de tema (con color)
- Título del tema como header del grupo
- Botón "Ver tema" que navega al detalle

### Indicador de fecha de vencimiento

```typescript
getDueDateStatus(dueDate) → {
  'overdue': "Vencida" (texto rojo)
  'today':   "Hoy" (color primary)
  'soon':    "Xd" (1-2 días, color accent)
  'ok':      "Xd" (>2 días, muted)
}
```

### Estadísticas (header)

4 contadores: Total | Pendientes | En progreso | Completadas

## Sistema de dependencias

Las tareas soportan dependencias a través del campo `depends_on UUID[]`:
- Una tarea puede depender de una o más tareas previas
- Al completar una tarea, el trigger `notify_next_task_assignee()` busca la siguiente tarea pendiente que dependa de ella
- Si la encuentra, crea una notificación `task_ready` para el asignado

### Trigger: `notify_next_task_assignee()`

```sql
-- Cuando una tarea cambia a 'completed':
-- 1. Busca la siguiente tarea pendiente que dependa de la completada
-- 2. Crea notificación para el asignado de la siguiente tarea
INSERT INTO notifications (user_id, type, title, message, link, tema_id, task_id)
VALUES (
  next_task.assigned_to,
  'task_ready',
  'Tarea lista para ti',
  'La tarea "X" del tema "Y" está lista.',
  '/workspace/temas/' || tema_id,
  tema_id,
  next_task.id
);
```

## Integración con Slack

Cuando una tarea se marca como completada, se envía una notificación a Slack (si `SLACK_WEBHOOK_URL` está configurado):

- Color: verde (`#22c55e`)
- Muestra: título de la tarea, número de expediente, tema, quién completó, siguiente tarea
- Es async (no bloquea la respuesta de la API)

## Actividad

Cada cambio de estado se registra en la tabla `tema_activity`:
- Usuario, acción, valor anterior, valor nuevo
- Visible en la vista de detalle del tema

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/(workspace)/workspace/tareas/client-page.tsx` | Dashboard de tareas del usuario |
| `app/api/workspace/tareas/route.ts` | GET/PATCH tareas del usuario |
| `app/api/workspace/temas/[id]/tasks/route.ts` | POST (crear tarea en tema) |
| `app/api/workspace/temas/[id]/tasks/[taskId]/route.ts` | PATCH/DELETE (editar/eliminar) |
| `supabase/migrations/0028_temas_phase2_tasks_areas.sql` | Schema + trigger |

## Ver también

- [Temas](temas.md) — Donde se crean y gestionan las tareas
- [Notificaciones](notificaciones.md) — Notificaciones de `task_ready` y `task_assigned`
