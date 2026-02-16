# Gestión de Empresas

> [Inicio](../../README.md) > [Módulos](../README.md) > Empresas

## Descripción

CRUD completo de empresas (tenants). Permite crear, configurar y gestionar cada empresa de la plataforma.

## Acceso

Solo `super_admin`. Ruta: `/admin/companies`.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/companies` | Lista de empresas |
| `/admin/companies/create` | Crear empresa |
| `/admin/companies/[id]` | Detalle y configuración |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/admin/companies` | CRUD de empresas |
| PUT | `/api/admin/companies/[id]/branding` | Personalización visual |
| GET/POST | `/api/admin/companies/[id]/integrations` | Integraciones |
| POST | `/api/admin/companies/[id]/logo` | Subir logo |
| PUT | `/api/admin/companies/[id]/portal` | Config portal de cliente |

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `companies` | Datos de la empresa |
| `company_integrations` | Credenciales cifradas |
| `company_integrations_audit` | Auditoría de integraciones |

## Funcionalidades

### Datos de empresa
- Nombre, slug, dominio
- Plan (starter, professional, enterprise)
- Máximo de usuarios y contactos
- Estado (active, suspended, cancelled)

### Features habilitados
- Array `features[]` que determina módulos visibles
- Configurable desde el detalle de la empresa

### Branding personalizado
- Logo custom
- Colores de marca

### Integraciones
- Configurar credenciales de HubSpot, OpenAI, etc.
- Las credenciales se cifran con AES-256-GCM
- Ver [Seguridad](../../arquitectura/seguridad.md)

### Portal de cliente
- Habilitar/deshabilitar acceso de viewers

## Componentes

- `IntegrationsTab` - Gestión de integraciones
- `ColorCustomizer` - Personalización de colores

## Ver también

- [Módulos y Templates](modulos-y-templates.md) - Plantillas de empresa
- [Seguridad](../../arquitectura/seguridad.md) - Cifrado de credenciales
