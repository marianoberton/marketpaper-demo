# Conceptos Clave

> [Inicio](../README.md) > Introducción > Conceptos Clave

## Multi-tenancy

Cada empresa (tenant) que usa FOMO tiene un workspace completamente aislado. Todas las tablas de datos incluyen una columna `company_id` que identifica a qué empresa pertenece cada registro.

**Principio fundamental**: un usuario de la Empresa A nunca puede ver datos de la Empresa B.

Este aislamiento se garantiza en dos niveles:
1. **Código**: toda API route filtra por `company_id` del usuario autenticado
2. **Base de datos**: Row Level Security (RLS) en PostgreSQL bloquea acceso a nivel de query

Ver [Multi-tenancy](../arquitectura/multi-tenancy.md) para la implementación técnica.

## Row Level Security (RLS)

RLS es una feature de PostgreSQL que aplica filtros automáticos a nivel de base de datos. Cada tabla sensible tiene **policies** que determinan qué filas puede ver/modificar cada usuario.

FOMO usa un **patrón de 3 capas**:

| Capa | Quién | Acceso |
|------|-------|--------|
| 1 | Super Admin | Acceso total a todas las filas |
| 2 | Admin de empresa | CRUD en filas de su empresa |
| 3 | Usuarios regulares | Lectura de filas de su empresa |

Las policies usan funciones SQL helper como `is_super_admin()`, `get_user_company_id()`, etc.

Ver [Multi-tenancy](../arquitectura/multi-tenancy.md) para el SQL completo.

## Roles de usuario

La plataforma tiene 6 roles ordenados de mayor a menor privilegio:

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `super_admin` | Equipo FOMO | Toda la plataforma, panel `/admin` |
| `company_owner` | Dueño de empresa | Su empresa completa, facturación |
| `company_admin` | Admin de empresa | Su empresa, gestión de usuarios |
| `manager` | Gerente | Lectura/escritura en su empresa |
| `employee` | Empleado | Lectura/escritura limitada |
| `viewer` | Cliente final | Solo lectura + tickets propios, portal `/client-view` |

**Regla**: un rol solo puede gestionar roles inferiores. Un `manager` no puede crear `company_admin`.

Ver [Autorización](../arquitectura/autorizacion.md) para los permisos detallados de cada rol.

## Módulos dinámicos

Cada empresa tiene un array `features[]` que define qué módulos tiene habilitados. La navegación del sidebar se construye dinámicamente según:

1. **Módulos habilitados** para la empresa (tabla `modules` + configuración)
2. **Roles permitidos** por módulo (`allowed_roles`)
3. **Overrides por usuario** (un usuario específico puede tener más o menos módulos)

Esto permite que cada empresa vea una plataforma diferente, adaptada a su industria y plan.

Ver [Sistema Modular](../arquitectura/sistema-modular.md) para la implementación.

## Separación Client / Server

Next.js 15 distingue entre Server Components (se ejecutan en el servidor) y Client Components (se ejecutan en el browser). FOMO mantiene esta separación de forma estricta, especialmente en autenticación:

| Archivo | Usar desde | Importa |
|---------|-----------|---------|
| `lib/auth-client.ts` | Componentes `'use client'` | `utils/supabase/client` |
| `lib/auth-server.ts` | API routes, Server Components | `utils/supabase/server` |
| `lib/auth-types.ts` | Cualquier lugar | Solo tipos y constantes |

**Regla crítica**: nunca importar `auth-server` desde un componente client. Causa errores de build porque intenta usar `next/headers` en el browser.

Ver [Autenticación](../arquitectura/autenticacion.md) para más detalle.

## Cifrado de credenciales

Las API keys de integraciones externas (HubSpot, OpenAI, etc.) se almacenan cifradas con **AES-256-GCM**. Nunca se guardan en texto plano en la base de datos.

Flujo:
1. El admin ingresa la API key en el frontend
2. Se envía al servidor via API route
3. El servidor cifra con `encryptCredentials()` y guarda `encrypted_credentials` + `credentials_iv`
4. Cuando se necesita usar, el servidor descifra con `decryptCredentials()`
5. La credencial descifrada nunca viaja al frontend

Ver [Seguridad](../arquitectura/seguridad.md) para la implementación.

## Nexus AI

Nexus es un sistema de **agentes IA autónomos** gestionado desde el panel de admin. Es un backend separado (Nexus Core) que se comunica con FOMO via REST API y WebSocket.

Conceptos principales:
- **Proyecto**: contenedor de configuración (modelo, herramientas, presupuesto)
- **Agente**: instancia con un rol específico (ventas, soporte, análisis)
- **Sesión**: conversación activa entre usuario y agente
- **Aprobación**: mecanismo human-in-the-loop para acciones críticas

Ver [Nexus AI](../nexus-ai/vision-general.md) para la documentación completa.

## Ver también

- [Visión General](vision-general.md) - Stack y diagrama de alto nivel
- [Glosario](../referencias/glosario.md) - Definiciones de todos los términos
