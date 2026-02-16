# Portal de Cliente

> [Inicio](../../README.md) > [Módulos](../README.md) > Portal de Cliente

## Descripción

Portal de acceso para clientes finales (viewers) de las empresas. Los viewers son usuarios con rol `viewer` y un `client_id` asignado. Tienen acceso de solo lectura a datos de su empresa y pueden gestionar sus propios tickets de soporte.

## Acceso

Solo rol `viewer` con `client_id` activo. Ruta: `/client-view`.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/client-view` | Dashboard del cliente |
| `/client-view/tickets` | Lista de tickets propios |
| `/client-view/tickets/nuevo` | Crear ticket |
| `/client-view/tickets/[id]` | Detalle y respuestas |

## Login separado

Los viewers acceden via `/client-login` (página de login dedicada).

## Restricciones

- Solo ven sus propios tickets (filtro por `user_id`)
- No ven notas internas
- No pueden cambiar estado ni prioridad de tickets
- No acceden al workspace ni al admin
- El middleware valida: `role === 'viewer'` + `client_id` presente + `status === 'active'`

## Funcionalidades

### Dashboard
- Resumen de tickets (abiertos, resueltos)
- Acceso rápido a crear ticket

### Tickets
- Crear tickets con asunto, descripción y categoría
- Ver historial de sus tickets
- Responder a mensajes del equipo
- Ver estado (abierto, en progreso, esperando respuesta, resuelto)

## Habilitación del portal

El portal de cliente se habilita desde:
1. **Admin**: `/admin/companies/[id]` → Portal settings
2. **Settings de empresa**: `/workspace/settings/company` → Toggle portal
3. **API**: `PUT /api/company/clients/portal-toggle`

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `user_profiles` | Perfil del viewer (role, client_id) |
| `clients` | Empresa cliente asociada |
| `support_tickets` | Tickets del viewer |
| `ticket_messages` | Mensajes de los tickets |

## Archivos clave

- `app/client-view/` - Todas las páginas del portal
- `app/client-login/page.tsx` - Login dedicado
- `components/client-view/` - Componentes específicos
- `utils/supabase/middleware.ts` - Validación de acceso

## Ver también

- [Soporte (workspace)](../workspace/soporte.md) - Vista del usuario
- [Tickets Admin](../admin/tickets.md) - Vista del super admin
- [Autorización](../../arquitectura/autorizacion.md) - Rol viewer
