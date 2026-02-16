# Módulo de Soporte

> [Inicio](../../README.md) > [Módulos](../README.md) > Soporte

## Descripción

Sistema de tickets de soporte multi-rol. Permite a usuarios de empresa y clientes finales (viewers) crear y gestionar solicitudes de soporte.

## Acceso por rol

| Rol | Ruta | Permisos |
|-----|------|----------|
| Super Admin | `/admin/tickets` | Ver/gestionar todos, notas internas |
| Company Admin/Manager/Employee | `/workspace/soporte` | Tickets propios y de su empresa |
| Viewer (cliente final) | `/client-view/tickets` | Solo sus propios tickets |

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/soporte` | Lista de tickets |
| `/workspace/soporte/nuevo` | Crear ticket |
| `/workspace/soporte/[id]` | Detalle y respuestas |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/tickets` | Listar/crear tickets |
| GET/PUT/DELETE | `/api/workspace/tickets/[id]` | CRUD de ticket |
| GET/POST | `/api/workspace/tickets/[id]/messages` | Mensajes del ticket |
| GET/POST | `/api/workspace/tickets/[id]/attachments` | Adjuntos |

## Lógica de filtrado

La API filtra según el rol:

```typescript
if (role === 'super_admin') {
  // Ve todos los tickets
} else if (role === 'viewer') {
  // Solo sus propios tickets (user_id)
} else {
  // Tickets propios + de su empresa (user_id OR company_id)
}
```

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `support_tickets` | Tickets principales |
| `ticket_messages` | Mensajes/respuestas |
| `ticket_attachments` | Archivos adjuntos |
| `ticket_categories` | Categorías configurables |

## Estados de ticket

- `open` - Abierto (nuevo)
- `in_progress` - En progreso
- `waiting_response` - Esperando respuesta del usuario
- `resolved` - Resuelto

## Webhook externo

Se puede crear tickets desde sistemas externos via:
- `POST /api/webhook/support-ticket`

## Ver también

- [Tickets Admin](../admin/tickets.md) - Gestión global
- [Portal Cliente](../client-view/portal-cliente.md) - Vista del viewer
