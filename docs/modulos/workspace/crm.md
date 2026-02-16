# Módulo CRM

> [Inicio](../../README.md) > [Módulos](../README.md) > CRM

## Descripción

El CRM de FOMO tiene dos implementaciones que coexisten:

1. **CRM Legacy** (`/workspace/crm`): Gestión de clientes B2B simples con contactos
2. **CRM-FOMO** (`/workspace/crm-fomo`): CRM avanzado multi-canal con leads, pipeline, scoring, campañas y automatización

## CRM Legacy

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/crm` | Lista de clientes (empresas) |
| `/workspace/crm/[id]` | Detalle de un cliente con contactos |

### API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/crm` | Listar/crear clientes |
| GET/PUT/DELETE | `/api/workspace/crm/[id]` | CRUD de cliente |
| GET/POST | `/api/workspace/crm/[id]/contacts` | Contactos del cliente |
| PUT/DELETE | `/api/workspace/crm/contacts/[contactId]` | CRUD de contacto |

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `clients` | Empresas cliente (B2B) |
| `crm_contacts` | Personas de contacto dentro de clientes |

### Componentes

- `ClientCompanyForm` - Formulario de empresa
- `ContactPersonForm` - Formulario de contacto
- `ClientTemasSection` - Vincular clientes a temas
- `CrmFilters` - Filtros de búsqueda
- `TagInput` - Gestión de tags

## CRM-FOMO (Avanzado)

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/crm-fomo` | Dashboard CRM |
| `/workspace/crm-fomo/leads` | Gestión de leads |
| `/workspace/crm-fomo/contacts` | Base de contactos |
| `/workspace/crm-fomo/pipeline` | Pipeline de ventas (Kanban) |
| `/workspace/crm-fomo/activities` | Tracking de actividades |
| `/workspace/crm-fomo/automation` | Marketing automation |
| `/workspace/crm-fomo/campaigns` | Campañas |
| `/workspace/crm-fomo/inbox` | Inbox unificado |
| `/workspace/crm-fomo/reports` | Analytics y reportes |
| `/workspace/crm-fomo/settings` | Configuración CRM |
| `/workspace/crm-fomo/documentation` | Docs de integración |

### API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/workspace/crm-fomo/contact-leads` | Leads de contactos |
| GET/POST/PUT/DELETE | `/api/workspace/crm-fomo/pyme-leads` | Leads PyME |
| GET/POST | `/api/workspace/crm-fomo/contacts` | Contactos unificados |

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `unified_leads` | Leads unificados multi-canal |
| `contact_leads` | Leads de contactos individuales |
| `pyme_leads` | Leads de PyMEs |
| `lead_activities` | Actividades sobre leads |
| `lead_scoring_rules` | Scoring automático |
| `channel_processors` | Procesadores por canal |
| `chatbot_analytics` | Datos de chatbot |
| `chatbot_contacts` | Contactos de chatbot |

### Canales soportados

El CRM-FOMO recibe leads de múltiples canales via webhooks:

| Canal | Webhook | Descripción |
|-------|---------|-------------|
| Web Form | `/api/webhook/leads` | Formulario web genérico |
| Contacto directo | `/api/webhook/contact-lead` | Lead de contacto |
| PyME | `/api/webhook/pyme-leads` | Lead de empresa PyME |
| Meta/Facebook | `/api/webhook/meta` | Facebook Lead Ads |
| WhatsApp | `/api/webhook/whatsapp` | Mensajes de WhatsApp |

### Lead scoring

El sistema asigna puntaje automáticamente a los leads basado en reglas configurables en `lead_scoring_rules`.

## Archivos de lógica

| Archivo | Propósito |
|---------|-----------|
| `lib/crm.ts` | Utilidades CRM |
| `lib/crm-multitenant.ts` | Lógica multi-tenant del CRM |
| `lib/crm/channel-processors.ts` | Procesadores de canales |

## Ver también

- [Construcción](construccion.md) - Usa clientes del CRM
- [Oportunidades](oportunidades.md) - Pipeline de ventas
- [HubSpot](hubspot.md) - Analytics de ventas
