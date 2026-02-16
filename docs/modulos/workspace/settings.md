# Módulo de Settings

> [Inicio](../../README.md) > [Módulos](../README.md) > Settings

## Descripción

Configuración del workspace. Incluye perfil de usuario, configuración de empresa, y gestión de usuarios de la empresa.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/settings` | Hub de configuración |
| `/workspace/settings/profile` | Perfil del usuario |
| `/workspace/settings/company` | Configuración de empresa |
| `/workspace/settings/users` | Gestión de usuarios |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/settings/role-modules` | Módulos por rol |
| GET/POST | `/api/workspace/settings/user-modules` | Override por usuario |
| GET | `/api/workspace/users` | Listar usuarios del workspace |
| GET/POST | `/api/company/users` | Gestión de usuarios |
| GET/POST/DELETE | `/api/company/invitations` | Invitaciones pendientes |
| PUT | `/api/company/clients/portal-toggle` | Habilitar portal de cliente |

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `user_profiles` | Datos del usuario |
| `companies` | Configuración de empresa |
| `company_invitations` | Invitaciones pendientes |
| `company_role_modules` | Módulos por rol |
| `user_module_overrides` | Overrides por usuario |

## Secciones

### Perfil de usuario
- Nombre, email, avatar
- Teléfono, cargo, departamento
- Preferencias de tema

### Configuración de empresa
- Nombre, logo, branding
- Portal de cliente (habilitar/deshabilitar)
- Configuraciones generales

### Gestión de usuarios (solo admin)
- Invitar usuarios por email
- Asignar/cambiar roles
- Activar/desactivar usuarios
- Configurar módulos visibles por rol
- Overrides de módulos por usuario individual

## Acceso

| Sección | Roles permitidos |
|---------|-----------------|
| Perfil | Todos |
| Empresa | `company_owner`, `company_admin` |
| Usuarios | `company_owner`, `company_admin` |

## Ver también

- [Autorización](../../arquitectura/autorizacion.md) - Roles y permisos
- [Sistema Modular](../../arquitectura/sistema-modular.md) - Módulos dinámicos
