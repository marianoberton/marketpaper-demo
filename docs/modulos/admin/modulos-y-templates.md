# Módulos y Templates

> [Inicio](../../README.md) > [Módulos](../README.md) > Módulos y Templates

## Descripción

Gestión del catálogo de módulos de la plataforma y las plantillas que agrupan módulos por tipo de empresa.

## Acceso

Solo `super_admin`. Rutas: `/admin/modules` y `/admin/templates`.

## Gestión de Módulos (`/admin/modules`)

### API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT | `/api/admin/modules` | CRUD de módulos |

### Funcionalidades

- Listar todos los módulos del catálogo
- Activar/desactivar módulos globalmente
- Editar nombre, ícono, categoría, orden
- Configurar `allowed_roles` por módulo

## Gestión de Templates (`/admin/templates`)

### API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT | `/api/admin/templates` | CRUD de templates |

### Funcionalidades

- Crear plantillas de módulos por tipo de empresa
- Cada template define qué módulos incluye
- Al crear una empresa, se puede aplicar un template

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `modules` | Catálogo global de módulos |
| `template_modules` | Módulos por template |
| `client_templates` | Templates por tipo de cliente |

## Componentes

- `TemplateManagementTab` - Editor de templates con acordeón de módulos

## Ver también

- [Sistema Modular](../../arquitectura/sistema-modular.md) - Cómo funcionan los módulos
- [Empresas](empresas.md) - Aplicar templates a empresas
