# Gestión de Usuarios

> [Inicio](../../README.md) > [Módulos](../README.md) > Usuarios

## Descripción

Gestión de todos los usuarios de la plataforma, incluyendo super admins.

## Acceso

Solo `super_admin`. Ruta: `/admin/users`.

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT | `/api/admin/users` | CRUD de usuarios |
| GET/POST/DELETE | `/api/admin/super-admins` | Gestión de super admins |
| GET | `/api/admin/clients` | Listar clientes (viewers) |

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `user_profiles` | Perfiles de usuario |
| `super_admins` | Super administradores |

## Funcionalidades

- Listar todos los usuarios con filtros (rol, empresa, estado)
- Crear usuarios nuevos
- Cambiar roles
- Activar/desactivar usuarios
- Gestionar super admins

## Componentes

- `UserFormDialog` - Crear/editar usuario

## Ver también

- [Autorización](../../arquitectura/autorizacion.md) - Roles y permisos
