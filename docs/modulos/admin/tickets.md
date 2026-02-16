# Tickets Admin

> [Inicio](../../README.md) > [Módulos](../README.md) > Tickets Admin

## Descripción

Vista global de todos los tickets de soporte de todas las empresas. El super admin puede gestionar tickets, agregar notas internas, y cambiar estados.

## Acceso

Solo `super_admin`. Ruta: `/admin/tickets`.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/tickets` | Lista global de tickets con stat cards |
| `/admin/tickets/[id]` | Detalle del ticket con notas internas |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/PUT | `/api/admin/tickets` | Listar y actualizar tickets |
| GET/POST | `/api/admin/tickets/categories` | Gestión de categorías |

## Funcionalidades adicionales vs workspace

- Ver tickets de **todas** las empresas
- Stat cards: total, abiertos, urgentes, tiempo promedio de respuesta
- Notas internas (solo visibles para super admins)
- Cambiar prioridad y categoría
- Gestionar categorías globales de tickets

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `support_tickets` | Todos los tickets (sin filtro de company_id) |
| `ticket_messages` | Mensajes incluyendo notas internas |
| `ticket_categories` | Categorías globales |

## Ver también

- [Soporte (workspace)](../workspace/soporte.md) - Vista del usuario de empresa
- [Portal Cliente](../client-view/portal-cliente.md) - Vista del viewer
