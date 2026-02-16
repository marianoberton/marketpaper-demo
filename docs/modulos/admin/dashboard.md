# Dashboard Admin

> [Inicio](../../README.md) > [Módulos](../README.md) > Dashboard Admin

## Descripción

Panel principal del super admin. Muestra métricas globales de la plataforma, accesos rápidos a las secciones principales y una lista de empresas recientes. Es la página de inicio del panel de administración.

## Acceso

Solo `super_admin`. Ruta: `/admin`.

## Arquitectura

El dashboard es un **Server Component** que hace fetch de datos directamente desde Supabase (no usa API routes). La función `getDashboardData()` ejecuta queries en paralelo para obtener todas las métricas.

**Archivo:** `app/admin/page.tsx`

### Data fetching

```typescript
async function getDashboardData() {
  const supabase = await createClient()

  // Queries paralelas
  const [companies, templates, modules, userCount] = await Promise.all([
    supabase.from('companies').select('*').order('created_at', { ascending: false }),
    supabase.from('client_templates').select('*').eq('is_active', true),
    supabase.from('modules').select('*'),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
  ])

  return { companies, templates, modules, userCount }
}
```

## Métricas

Se muestran 3 `StatsCard` principales:

| Métrica | Fuente | Detalle |
|---------|--------|---------|
| Empresas totales | `companies.length` | Desglose: activas / trial |
| Usuarios totales | `user_profiles` count | Conteo directo |
| Módulos activos | `modules.length` | Desglose: Dashboard / Workspace |

### Componente StatsCard

**Archivo:** `components/ui/stats-card.tsx`

Cards reutilizables con:

- Borde izquierdo de 4px con variante de color (default, success, warning, danger)
- Ícono dinámico renderizado desde string (lucide-react)
- Valor principal con descripción opcional
- Indicador de tendencia opcional (flecha arriba/abajo con porcentaje)
- Meta de benchmark opcional
- Footer de texto opcional
- Tooltip en hover
- Hover effects: sombra y translación vertical

## Acciones rápidas

4 cards de navegación rápida:

| Acción | Link | Ícono |
|--------|------|-------|
| Nueva Empresa | `/admin/companies` | Building2 |
| Plantillas | `/admin/templates` | FileText |
| Módulos | `/admin/modules` | Package |
| Usuarios | `/admin/users` | Users |

## Empresas recientes

Lista de las últimas 5 empresas creadas, mostrando:
- Nombre de la empresa
- Estado (badge)
- Plan
- Botón "Ver" que navega al detalle

## Layout del admin

**Archivo:** `app/admin/layout.tsx`

Client Component que gestiona:
- Sidebar colapsable (16px collapsed → 64px expanded)
- Responsive: sidebar oculto en mobile, visible en desktop (md:)
- State de toggle para colapsar/expandir

### AdminSidebar

**Archivo:** `components/admin/AdminSidebar.tsx`

Navegación lateral con las siguientes entradas:

| Sección | Ruta | Ícono |
|---------|------|-------|
| Dashboard | `/admin` | LayoutDashboard |
| Empresas | `/admin/companies` | Building2 |
| Plantillas | `/admin/templates` | FileText |
| Módulos | `/admin/modules` | Package |
| Usuarios | `/admin/users` | Users |
| Tickets | `/admin/tickets` | MessageSquare |
| Nexus AI | `/admin/nexus` | Bot |
| Configuración | `/admin/settings` | Settings |

Características:
- Highlighting de ruta activa con color primary
- Quick action buttons visibles en hover (cuando no está colapsado)
- Tooltips para estado colapsado
- Soporte para badges dinámicos
- Header: "Super Admin - Panel de Control"

### AdminHeader

**Archivo:** `components/admin/AdminHeader.tsx`

Header sticky con backdrop blur que incluye:

- Barra de búsqueda con indicador de atajo (Cmd+K)
- Toggle de tema (Sun/Moon con fallback para hidratación SSR)
- `NotificationBell` — campana de notificaciones
- Dropdown de usuario con:
  - Info del usuario (email, rol)
  - Opciones de tema (Claro, Oscuro, Sistema)
  - Links a Perfil y Configuración
  - Botón de Sign Out
- Menu mobile (Sheet) que despliega el sidebar completo

## Seguridad

Todas las API routes del admin verifican:
1. Autenticación via `supabase.auth.getUser()`
2. Status de super admin via tabla `super_admins`
3. Retornan 401 si no autenticado, 403 si no es super admin

El middleware (`middleware.ts`) también intercepta `/admin/*` y redirige si el usuario no es super admin activo.

## APIs del admin

| API | Métodos | Tabla principal |
|-----|---------|-----------------|
| `/api/admin/companies` | GET, PUT, DELETE | `companies` |
| `/api/admin/users` | GET, POST, PUT, DELETE | `user_profiles` |
| `/api/admin/tickets` | GET, HEAD | `support_tickets` |
| `/api/admin/templates` | GET, POST, PUT, DELETE | `client_templates` |
| `/api/admin/modules` | GET, POST, PUT, DELETE | `modules` |
| `/api/admin/super-admins` | GET | `super_admins` |

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/admin/page.tsx` | Dashboard (Server Component) |
| `app/admin/layout.tsx` | Layout con sidebar |
| `components/admin/AdminSidebar.tsx` | Navegación lateral |
| `components/admin/AdminHeader.tsx` | Header con búsqueda, tema, usuario |
| `components/ui/stats-card.tsx` | Componente de stat card reutilizable |

## Ver también

- [Empresas](empresas.md) — Gestión de tenants
- [Usuarios](usuarios.md) — Gestión de usuarios de la plataforma
- [Módulos y Templates](modulos-y-templates.md) — Catálogo de módulos
- [Tickets Admin](tickets.md) — Gestión global de tickets
- [Nexus AI](../../nexus-ai/vision-general.md) — Agentes autónomos
