# FOMO Platform - Documentación

Documentación técnica y de referencia para el equipo de desarrollo de FOMO Platform.

## Sobre esta documentación

FOMO Platform es una plataforma empresarial B2B SaaS multi-tenant. Cada tenant es una empresa cliente que gestiona su información, herramientas operativas y relación con sus propios clientes desde un workspace centralizado.

Esta documentación es la **fuente de verdad** para entender cómo funciona la plataforma, sus módulos, arquitectura y convenciones.

> **Nota**: Para instrucciones específicas para asistentes IA, ver `CLAUDE.md` en la raíz del proyecto. Esta documentación es para humanos.

---

## Mapa de la documentación

### Introducción
Para empezar a entender la plataforma.

| Documento | Descripción |
|-----------|-------------|
| [Visión General](introduccion/vision-general.md) | Qué es FOMO, para qué sirve, stack tecnológico |
| [Conceptos Clave](introduccion/conceptos-clave.md) | Multi-tenancy, RLS, roles, módulos dinámicos |
| [Primeros Pasos](introduccion/primeros-pasos.md) | Setup local, variables de entorno, comandos |

### Arquitectura
Cómo está construida la plataforma por dentro.

| Documento | Descripción |
|-----------|-------------|
| [Visión General](arquitectura/vision-general.md) | Diagrama de arquitectura, capas, flujo de requests |
| [Multi-tenancy](arquitectura/multi-tenancy.md) | Aislamiento por company_id, RLS de 3 capas |
| [Autenticación](arquitectura/autenticacion.md) | Separación client/server, middleware, flujo de login |
| [Autorización](arquitectura/autorizacion.md) | Roles, permisos, jerarquía RBAC |
| [Base de Datos](arquitectura/base-de-datos.md) | Schema, tablas, migraciones, convenciones |
| [Sistema Modular](arquitectura/sistema-modular.md) | Módulos dinámicos, features, navegación |
| [Seguridad](arquitectura/seguridad.md) | Cifrado AES-256-GCM, RLS, secrets |

### Guías de Desarrollo
Cómo trabajar en el proyecto día a día.

| Documento | Descripción |
|-----------|-------------|
| [Estructura del Proyecto](guias/estructura-proyecto.md) | Mapa de carpetas explicado |
| [Patrones de Código](guias/patrones-codigo.md) | Server/Client components, API routes, convenciones |
| [Crear un Módulo Nuevo](guias/crear-modulo-nuevo.md) | Paso a paso completo |
| [Trabajar con Base de Datos](guias/trabajar-con-base-datos.md) | Migraciones, tipos, queries, RLS |

### Módulos
Ficha técnica de cada módulo de la plataforma.

| Documento | Descripción |
|-----------|-------------|
| [Índice de Módulos](modulos/README.md) | Vista general y categorías |
| **Workspace** | |
| [Construcción](modulos/workspace/construccion.md) | Proyectos de obra, documentos, plazos, etapas |
| [CRM](modulos/workspace/crm.md) | Gestión de clientes y leads multi-canal |
| [Finanzas](modulos/workspace/finanzas.md) | Gastos, categorías, importación CSV |
| [Temas](modulos/workspace/temas.md) | Expedientes/temas con tareas y comentarios |
| [Tareas](modulos/workspace/tareas.md) | Tareas asignadas al usuario |
| [Soporte](modulos/workspace/soporte.md) | Tickets de soporte multi-rol |
| [HubSpot](modulos/workspace/hubspot.md) | Analytics de ventas, precios, planes de acción IA |
| [Oportunidades](modulos/workspace/oportunidades.md) | Pipeline de ventas Kanban |
| [Cotizador](modulos/workspace/cotizador.md) | Generador de cotizaciones |
| [Notificaciones](modulos/workspace/notificaciones.md) | Centro de notificaciones |
| [Settings](modulos/workspace/settings.md) | Configuración del workspace |
| **Admin** | |
| [Dashboard Admin](modulos/admin/dashboard.md) | Panel principal de super admin |
| [Empresas](modulos/admin/empresas.md) | Gestión de tenants |
| [Usuarios](modulos/admin/usuarios.md) | Gestión de usuarios de la plataforma |
| [Módulos y Templates](modulos/admin/modulos-y-templates.md) | Catálogo de módulos y plantillas |
| [Tickets Admin](modulos/admin/tickets.md) | Gestión global de tickets |
| **Portal Cliente** | |
| [Portal de Cliente](modulos/client-view/portal-cliente.md) | Acceso de viewers, tickets |

### Nexus AI
Sistema de agentes autónomos (sección dedicada).

| Documento | Descripción |
|-----------|-------------|
| [Visión General](nexus-ai/vision-general.md) | Qué es Nexus, arquitectura, entidades |
| [Proyectos](nexus-ai/proyectos.md) | Configuración y gestión de proyectos IA |
| [Agentes](nexus-ai/agentes.md) | Agentes autónomos, roles, canales |
| [Chat y WebSocket](nexus-ai/chat-y-websocket.md) | Comunicación en tiempo real |
| [Prompts](nexus-ai/prompts.md) | Sistema de capas de prompts |
| [Aprobaciones](nexus-ai/aprobaciones.md) | Human-in-the-loop |
| [Tareas Programadas](nexus-ai/tareas-programadas.md) | Scheduled tasks (cron) |
| [Costos y Uso](nexus-ai/costos-y-uso.md) | Tracking de tokens, costos, budgets |

### Referencias
Tablas de referencia rápida.

| Documento | Descripción |
|-----------|-------------|
| [Glosario](referencias/glosario.md) | Términos técnicos y de dominio |
| [Roles y Permisos](referencias/roles-y-permisos.md) | Tabla completa de accesos |
| [Variables de Entorno](referencias/variables-entorno.md) | Todas las env vars |
| [Endpoints API](referencias/endpoints-api.md) | Índice rápido de ~70 endpoints |

---

## Guía de lectura según tu rol

### Soy nuevo en el proyecto
1. [Visión General](introduccion/vision-general.md)
2. [Conceptos Clave](introduccion/conceptos-clave.md)
3. [Primeros Pasos](introduccion/primeros-pasos.md)
4. [Estructura del Proyecto](guias/estructura-proyecto.md)
5. [Patrones de Código](guias/patrones-codigo.md)
6. El módulo que te toque trabajar

### Ya conozco el proyecto, necesito referencia
- [Índice de Módulos](modulos/README.md) para encontrar un módulo rápido
- [Endpoints API](referencias/endpoints-api.md) para buscar un endpoint
- [Roles y Permisos](referencias/roles-y-permisos.md) para verificar accesos
- [Crear un Módulo Nuevo](guias/crear-modulo-nuevo.md) cuando necesites agregar funcionalidad

### Necesito entender Nexus AI
1. [Nexus - Visión General](nexus-ai/vision-general.md)
2. [Proyectos](nexus-ai/proyectos.md) y [Agentes](nexus-ai/agentes.md)
3. [Chat y WebSocket](nexus-ai/chat-y-websocket.md) para la parte técnica
4. [Aprobaciones](nexus-ai/aprobaciones.md) para el flujo de control

---

## Cómo mantener esta documentación

- Al **agregar un módulo nuevo**: crear su ficha en `docs/modulos/`
- Al **cambiar arquitectura**: actualizar el doc correspondiente en `docs/arquitectura/`
- Al **agregar endpoints**: actualizar `docs/referencias/endpoints-api.md`
- Al **cambiar el schema**: actualizar `docs/arquitectura/base-de-datos.md`

> **Regla**: si un cambio en el código requiere que otro dev lo sepa, actualizá la doc.
