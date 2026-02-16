# Módulo de Notificaciones

> [Inicio](../../README.md) > [Módulos](../README.md) > Notificaciones

## Descripción

Centro de notificaciones in-app del workspace. Incluye la campana de notificaciones en el header (con contador de no leídas) y una página completa para gestionar todas las notificaciones. El sistema usa **polling cada 30 segundos** para detectar nuevas notificaciones.

## Rutas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/workspace/notifications` | `app/(workspace)/workspace/notifications/page.tsx` | Server Component wrapper |
| — | `app/(workspace)/workspace/notifications/client-page.tsx` | Centro de notificaciones (client, ~317 líneas) |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspace/notifications` | Listar notificaciones + unread count |
| PATCH | `/api/workspace/notifications` | Marcar como leídas |
| DELETE | `/api/workspace/notifications` | Eliminar notificaciones |

### GET — Listar notificaciones

**Parámetros de query:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Máximo de resultados |
| `unread` | boolean | — | Solo no leídas si `true` |

**Respuesta:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "task_assigned",
      "title": "Nueva tarea asignada",
      "message": "Se te asignó la tarea \"Revisar planos\"",
      "link": "/workspace/temas/uuid",
      "is_read": false,
      "created_at": "2024-02-15T14:30:00Z"
    }
  ],
  "unread_count": 3
}
```

### PATCH — Marcar como leídas

```json
// Opción 1: IDs específicos
{ "notification_ids": ["uuid1", "uuid2"] }

// Opción 2: Todas
{ "mark_all": true }
```

Setea `is_read = true` y `read_at` con el timestamp actual.

### DELETE — Eliminar

```json
// Opción 1: IDs específicos
{ "notification_ids": ["uuid1", "uuid2"] }

// Opción 2: Todas las leídas
{ "delete_read": true }
```

## Tabla: `notifications`

Migración principal: `0028_temas_phase2_tasks_areas.sql`
Migraciones adicionales: `0043_add_ticket_id_to_notifications.sql`, `0046_add_notification_delete_policy.sql`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK a user_profiles (destinatario) |
| `type` | TEXT | Tipo de notificación |
| `title` | TEXT | Título corto |
| `message` | TEXT | Mensaje descriptivo (opcional) |
| `link` | TEXT | URL de navegación al ítem relacionado |
| `tema_id` | UUID | FK a temas (para notificaciones de tareas) |
| `task_id` | UUID | FK a tema_tasks (para notificaciones de tareas) |
| `ticket_id` | UUID | FK a support_tickets (para notificaciones de tickets) |
| `is_read` | BOOLEAN | Estado de lectura (default: `false`) |
| `read_at` | TIMESTAMPTZ | Cuándo se marcó como leída |
| `created_at` | TIMESTAMPTZ | Creación |

### Índices

- `idx_notifications_user` — por `user_id`
- `idx_notifications_unread` — por `(user_id, is_read)` WHERE `is_read = false` (optimizado)
- `idx_notifications_ticket` — por `ticket_id`

### RLS

| Operación | Política |
|-----------|----------|
| SELECT | Solo sus propias notificaciones (`user_id = auth.uid()`) |
| UPDATE | Solo sus propias notificaciones |
| INSERT | Abierto (`WITH CHECK (true)`) — para que el sistema pueda crear |
| DELETE | Solo sus propias notificaciones |

## Tipos de notificación

| Tipo | Origen | Link | Ícono/Color |
|------|--------|------|-------------|
| `task_assigned` | Creación de tarea con asignado | `/workspace/temas/{id}` | Azul |
| `task_ready` | Trigger DB al completar tarea previa | `/workspace/temas/{id}` | Azul |
| `task_completed` | Actualización de tarea | — | Verde |
| `ticket_response` | Admin responde a ticket (público) | `/workspace/soporte/{id}` | Púrpura |
| `ticket_waiting` | Ticket cambia a `waiting_user` | `/workspace/soporte/{id}` | Naranja |

## Puntos de creación

### 1. Asignación de tarea

**Archivo:** `app/api/workspace/temas/[id]/tasks/route.ts`

Cuando se crea una tarea con `assigned_to`:

```typescript
await supabase.from('notifications').insert({
  user_id: assigned_to,
  type: 'task_assigned',
  title: 'Nueva tarea asignada',
  message: `Se te asignó la tarea "${title}"`,
  link: `/workspace/temas/${temaId}`,
  tema_id: temaId,
  task_id: task.id
})
```

### 2. Tarea lista (trigger de BD)

**Archivo:** `supabase/migrations/0028_temas_phase2_tasks_areas.sql`

Función `notify_next_task_assignee()`: cuando una tarea se completa, busca la siguiente tarea pendiente que dependa de ella y notifica al asignado.

### 3. Respuesta a ticket

**Archivo:** `app/api/workspace/tickets/[id]/messages/route.ts`

Cuando un admin publica un mensaje público en un ticket:

```typescript
await supabase.from('notifications').insert({
  user_id: ticket.user_id,
  type: 'ticket_response',
  title: 'Nueva respuesta en tu ticket',
  message: `Respuesta en: "${ticket.subject}"`,
  link: `/workspace/soporte/${ticketId}`,
  ticket_id: ticketId
})
```

### 4. Ticket esperando respuesta

**Archivo:** `app/api/workspace/tickets/[id]/route.ts`

Cuando el estado del ticket cambia a `waiting_user`:

```typescript
await supabase.from('notifications').insert({
  user_id: currentTicket.user_id,
  type: 'ticket_waiting',
  title: 'Tu ticket necesita respuesta',
  message: `El equipo de soporte espera tu respuesta en: "${currentTicket.subject}"`,
  link: `/workspace/soporte/${id}`,
  ticket_id: id
})
```

## Componentes

### Notification Bell (`components/notification-bell.tsx`)

Campana de notificaciones en el header con dropdown popover:

- Muestra las 10 notificaciones más recientes
- Badge con contador de no leídas (muestra "9+" si > 9)
- Click en notificación → marca como leída y navega al link
- Botón "Marcar todas como leídas"
- Link al centro de notificaciones completo
- **Auto-refresh cada 30 segundos**

**Integrado en:**
- `components/workspace-layout.tsx` — Header del workspace
- `components/admin/AdminHeader.tsx` — Header del admin

### Centro de notificaciones (`notifications/client-page.tsx`)

Página completa con:

- Filtros: Todas / No leídas / Leídas
- Marcar individual como leída
- Marcar todas como leídas
- Eliminar individual
- Eliminar todas las leídas
- Auto-refresh cada 30 segundos
- Formato de tiempo relativo ("Hace 5m", "Hace 2h", "Hace 3d")
- Badges de tipo por notificación

## Integración con Slack

**Archivo:** `lib/slack-notifications.ts`

Además de las notificaciones in-app, el sistema envía notificaciones a Slack (async, no bloquea la API):

| Función | Trigger |
|---------|---------|
| `notifySlackTicketResponse()` | Admin responde a ticket |
| `notifySlackTicketStatusChange()` | Cambio de estado de ticket |
| `notifySlackTaskCompleted()` | Tarea completada |

Requiere `SLACK_WEBHOOK_URL` en variables de entorno.

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/(workspace)/workspace/notifications/client-page.tsx` | Centro de notificaciones |
| `components/notification-bell.tsx` | Campana en header |
| `app/api/workspace/notifications/route.ts` | API CRUD |
| `lib/slack-notifications.ts` | Integración Slack |
| `supabase/migrations/0028_temas_phase2_tasks_areas.sql` | Schema + trigger |
| `supabase/migrations/0043_add_ticket_id_to_notifications.sql` | Columna ticket_id |
| `supabase/migrations/0046_add_notification_delete_policy.sql` | RLS de delete |

## Ver también

- [Tareas](tareas.md) — Origen de notificaciones `task_assigned` y `task_ready`
- [Soporte](soporte.md) — Origen de notificaciones `ticket_response` y `ticket_waiting`
- [Settings](settings.md) — Preferencias de notificaciones
