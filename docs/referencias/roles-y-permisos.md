# Roles y Permisos

> [Inicio](../README.md) > Referencias > Roles y Permisos

## Jerarquía

```
super_admin > company_owner > company_admin > manager > employee > viewer
```

Un rol solo puede gestionar roles inferiores al suyo.

## Permisos por rol

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

## Acceso por área

| Área | super_admin | company_owner | company_admin | manager | employee | viewer |
|------|:-----------:|:-------------:|:-------------:|:-------:|:--------:|:------:|
| `/admin/*` | x | | | | | |
| `/workspace/*` | x | x | x | x | x | |
| `/client-view/*` | | | | | | x |
| Settings: Empresa | x | x | x | | | |
| Settings: Usuarios | x | x | x | | | |
| Settings: Perfil | x | x | x | x | x | |
| Nexus AI | x | | | | | |

## Acceso a tickets

| Condición | Acceso |
|-----------|--------|
| Super admin | Todos los tickets de todas las empresas |
| Creador del ticket | Su propio ticket |
| Misma empresa (no viewer) | Tickets de su empresa |
| Viewer | Solo sus propios tickets |

## Roles asignables

Cada rol solo puede asignar roles inferiores:

| Actor | Puede asignar |
|-------|--------------|
| `super_admin` | company_owner, company_admin, manager, employee, viewer |
| `company_owner` | company_admin, manager, employee, viewer |
| `company_admin` | manager, employee, viewer |
| `manager` | (no puede asignar roles) |
| `employee` | (no puede asignar roles) |
| `viewer` | (no puede asignar roles) |

## Funciones helper

Definidas en `lib/auth-types.ts`:

```typescript
hasPermission(role, permission)         // ¿Tiene este permiso?
hasAllPermissions(role, permissions)     // ¿Tiene todos estos permisos?
hasAnyPermission(role, permissions)      // ¿Tiene al menos uno?
isRoleEqualOrHigher(role, thanRole)      // ¿Es igual o superior?
canManageRole(actorRole, targetRole)     // ¿Puede gestionar este rol?
getAssignableRoles(actorRole)           // ¿Qué roles puede asignar?
isSuperAdminRole(role)                  // ¿Es super admin?
isAdminRole(role)                       // ¿Tiene admin_access?
hasCompanyAccess(role, userCo, resCo)   // ¿Tiene acceso a esta empresa?
hasTicketAccess(role, userId, ...)      // ¿Tiene acceso a este ticket?
```

## Ver también

- [Autorización](../arquitectura/autorizacion.md) - Implementación técnica
- [Autenticación](../arquitectura/autenticacion.md) - Cómo se identifica al usuario
