# Autorización

> [Inicio](../README.md) > Arquitectura > Autorización

## Jerarquía de roles

Los 6 roles están ordenados de mayor a menor privilegio:

```
super_admin > company_owner > company_admin > manager > employee > viewer
```

Definidos en `lib/auth-types.ts`:

```typescript
export const ROLE_HIERARCHY: UserRole[] = [
  'super_admin',
  'company_owner',
  'company_admin',
  'manager',
  'employee',
  'viewer'
]
```

## Permisos por rol

Cada rol tiene un conjunto fijo de permisos definido en `ROLE_PERMISSIONS`:

| Permiso | super_admin | company_owner | company_admin | manager | employee | viewer |
|---------|:-----------:|:-------------:|:-------------:|:-------:|:--------:|:------:|
| `read` | x | x | x | x | x | x |
| `write` | x | x | x | x | x | |
| `delete` | x | x | x | | | |
| `manage_users` | x | x | x | | | |
| `manage_company` | x | x | | | | |
| `manage_projects` | x | x | x | x | x | |
| `manage_clients` | x | x | x | x | x | |
| `view_reports` | x | x | x | x | | x |
| `manage_billing` | x | x | | | | |
| `admin_access` | x | x | x | | | |
| `super_admin_access` | x | | | | | |

## Acceso por área de la plataforma

| Área | Roles permitidos | Ruta |
|------|-----------------|------|
| Panel Admin | `super_admin` | `/admin/*` |
| Workspace | Todos excepto `viewer` (con company_id) | `/workspace/*` |
| Portal Cliente | `viewer` (con client_id) | `/client-view/*` |
| Settings: Usuarios | `company_owner`, `company_admin` | `/workspace/settings/users` |
| Settings: Empresa | `company_owner`, `company_admin` | `/workspace/settings/company` |

## Funciones helper de autorización

En `lib/auth-types.ts` (importable desde cualquier lugar):

```typescript
// Verificar si un rol tiene un permiso
hasPermission(role, 'manage_users')  // true/false

// Verificar si un rol es igual o superior a otro
isRoleEqualOrHigher('company_admin', 'manager')  // true

// Verificar si un rol puede gestionar a otro (solo roles inferiores)
canManageRole('company_admin', 'employee')  // true
canManageRole('manager', 'company_admin')   // false

// Obtener roles asignables por un actor
getAssignableRoles('company_admin')  // ['manager', 'employee', 'viewer']
```

## Verificación de permisos en API routes

```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  // Verificar rol mínimo necesario
  if (!isRoleEqualOrHigher(profile.role, 'company_admin')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // ... lógica del endpoint
}
```

## Verificación en componentes client

```typescript
'use client'
import { useWorkspace } from '@/components/workspace-context'
import { isRoleEqualOrHigher } from '@/lib/auth-types'

function MyComponent() {
  const { userRole } = useWorkspace()

  const canManageUsers = isRoleEqualOrHigher(userRole, 'company_admin')

  return (
    <>
      {canManageUsers && <Button>Gestionar Usuarios</Button>}
    </>
  )
}
```

## Módulos por rol

Además de la autorización global, cada módulo puede tener `allowed_roles` que restringe qué roles lo ven en la navegación. Ver [Sistema Modular](sistema-modular.md).

## Acceso a tickets (caso especial)

Los tickets tienen lógica de acceso particular definida en `hasTicketAccess()`:

| Condición | Acceso |
|-----------|--------|
| Super admin | Todos los tickets |
| Creador del ticket | Su propio ticket |
| Misma empresa | Tickets de su empresa |
| Viewer | Solo sus propios tickets |

## Archivos relevantes

- `lib/auth-types.ts` - `ROLE_PERMISSIONS`, `ROLE_HIERARCHY`, funciones helper
- `lib/auth-server.ts` - Verificación server-side
- `lib/auth-client.ts` - Verificación client-side
- `components/workspace-context.tsx` - `useWorkspace()` para obtener rol en el client

## Ver también

- [Autenticación](autenticacion.md) - Cómo se identifica al usuario
- [Multi-tenancy](multi-tenancy.md) - Aislamiento por empresa
- [Roles y Permisos](../referencias/roles-y-permisos.md) - Tabla de referencia completa
