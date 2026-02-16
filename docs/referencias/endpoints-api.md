# Endpoints API

> [Inicio](../README.md) > Referencias > Endpoints API

Índice rápido de todos los endpoints REST de la plataforma (~70 endpoints).

## Autenticación (`/api/auth/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/company` | Empresa del usuario actual |
| POST | `/api/auth/users` | Crear usuario |
| POST | `/api/auth/complete-invite` | Completar invitación |

## Admin (`/api/admin/`)

### Empresas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/admin/companies` | CRUD de empresas |
| PUT | `/api/admin/companies/[id]/branding` | Personalización visual |
| GET/POST | `/api/admin/companies/[id]/integrations` | Integraciones |
| POST | `/api/admin/companies/[id]/logo` | Subir logo |
| PUT | `/api/admin/companies/[id]/portal` | Config portal cliente |

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT | `/api/admin/users` | CRUD de usuarios |
| GET/POST/DELETE | `/api/admin/super-admins` | Super admins |
| GET | `/api/admin/clients` | Listar clientes |

### Módulos y templates

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT | `/api/admin/templates` | Templates |
| GET/POST/PUT | `/api/admin/modules` | Módulos |

### Tickets

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/PUT | `/api/admin/tickets` | Todos los tickets |
| GET/POST | `/api/admin/tickets/categories` | Categorías |

### Otros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/admin/process-registration` | Aprobar registro |

## Workspace - Construcción (`/api/workspace/construction/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/construction/projects` | Proyectos |
| GET/PUT | `/api/workspace/construction/projects/[id]/dates` | Fechas |
| GET/POST/PUT/DELETE | `/api/workspace/construction/clients` | Clientes |
| GET/POST/PUT/DELETE | `/api/workspace/construction/documents` | Documentos |
| GET/POST | `/api/workspace/construction/document-relationships` | Relaciones |
| GET/POST/PUT | `/api/workspace/construction/expiration-dates` | Vencimientos |
| GET/POST | `/api/workspace/construction/payment-receipts` | Pagos |
| GET/POST/PUT | `/api/workspace/construction/project-stages` | Etapas |
| GET/POST | `/api/workspace/construction/stage-completions` | Progreso |
| GET/POST | `/api/workspace/construction/tax-payments` | Impuestos |
| PUT/DELETE | `/api/workspace/construction/tax-payments/[id]` | Gestión impuestos |
| GET/POST/PUT | `/api/workspace/construction/upload-dates` | Fechas upload |

## Workspace - CRM (`/api/workspace/crm/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/crm` | Clientes B2B |
| GET/PUT/DELETE | `/api/workspace/crm/[id]` | CRUD cliente |
| GET/POST | `/api/workspace/crm/[id]/contacts` | Contactos |
| PUT/DELETE | `/api/workspace/crm/contacts/[contactId]` | CRUD contacto |

## Workspace - CRM-FOMO (`/api/workspace/crm-fomo/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/workspace/crm-fomo/contact-leads` | Leads contacto |
| GET/POST/PUT/DELETE | `/api/workspace/crm-fomo/pyme-leads` | Leads PyME |
| GET/POST | `/api/workspace/crm-fomo/contacts` | Contactos unificados |

## Workspace - Finanzas (`/api/workspace/finanzas/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/workspace/finanzas/expenses` | Gastos |
| GET/POST/PUT/DELETE | `/api/workspace/finanzas/categories` | Categorías |
| POST | `/api/workspace/finanzas/import` | Importar CSV |
| POST | `/api/workspace/finanzas/upload` | Upload archivo |

## Workspace - Temas (`/api/workspace/temas/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/temas` | Temas |
| GET/PUT/DELETE | `/api/workspace/temas/[id]` | CRUD tema |
| GET/POST | `/api/workspace/temas/[id]/tasks` | Tareas |
| PUT/DELETE | `/api/workspace/temas/[id]/tasks/[taskId]` | CRUD tarea |
| GET/POST | `/api/workspace/temas/[id]/comments` | Comentarios |
| GET/POST | `/api/workspace/temas/areas` | Áreas |
| GET/POST | `/api/workspace/temas/types` | Tipos |
| GET | `/api/workspace/temas/clients` | Clientes |

## Workspace - Tareas (`/api/workspace/tareas/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspace/tareas` | Tareas del usuario |

## Workspace - Tickets (`/api/workspace/tickets/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/tickets` | Tickets |
| GET/PUT/DELETE | `/api/workspace/tickets/[id]` | CRUD ticket |
| GET/POST | `/api/workspace/tickets/[id]/messages` | Mensajes |
| GET/POST | `/api/workspace/tickets/[id]/attachments` | Adjuntos |

## Workspace - Oportunidades (`/api/workspace/oportunidades/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/oportunidades` | Oportunidades |
| PUT/DELETE | `/api/workspace/oportunidades/[id]` | CRUD |
| PUT | `/api/workspace/oportunidades/[id]/stage` | Cambiar etapa |

## Workspace - Notificaciones (`/api/workspace/notifications/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/workspace/notifications` | Notificaciones |

## Workspace - Settings (`/api/workspace/settings/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/settings/role-modules` | Módulos por rol |
| GET/POST | `/api/workspace/settings/user-modules` | Override por usuario |
| GET | `/api/workspace/users` | Usuarios del workspace |

## Empresa (`/api/company/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/company/users` | Usuarios de empresa |
| GET/POST/DELETE | `/api/company/invitations` | Invitaciones |
| PUT | `/api/company/clients/portal-toggle` | Toggle portal cliente |

## Usuario (`/api/user/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/PUT | `/api/user/profile` | Perfil de usuario |

## Webhooks (`/api/webhook/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/webhook/leads` | Lead genérico |
| POST | `/api/webhook/contact-lead` | Lead de contacto |
| POST | `/api/webhook/pyme-leads` | Lead PyME |
| POST | `/api/webhook/meta` | Meta/Facebook |
| POST | `/api/webhook/whatsapp` | WhatsApp |
| POST | `/api/webhook/support-ticket` | Ticket externo |

## Knowledge Base (`/api/knowledge/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/knowledge/upload` | Upload documentos |
| POST | `/api/knowledge/reindex` | Rebuild índice |
| POST | `/api/knowledge/chat` | Chat RAG |

## Storage (`/api/storage/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/storage/create-upload-url` | URL presignada |
| POST | `/api/storage/signed-upload` | Upload firmado |
| POST | `/api/storage/commit` | Finalizar upload |

## Utilidades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ping` | Health check |
| POST | `/api/registration-requests` | Solicitud de registro |
| POST | `/api/setup-company` | Setup inicial de empresa |

## Nexus AI (`Nexus Core /api/v1/`)

> Estos endpoints van al backend de Nexus Core, no a Next.js.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/v1/projects` | Proyectos |
| GET/PATCH | `/api/v1/projects/:id` | CRUD proyecto |
| GET | `/api/v1/projects/:id/agents` | Agentes |
| GET | `/api/v1/projects/:id/agents/:agentId` | Detalle agente |
| POST | `/api/v1/projects/:id/agents/:agentId/chat` | Chat REST |
| GET/POST | `/api/v1/projects/:id/prompt-layers` | Prompts |
| POST | `/api/v1/prompt-layers/:id/activate` | Activar prompt |
| GET | `/api/v1/approvals` | Aprobaciones |
| POST | `/api/v1/approvals/:id/approve` | Aprobar |
| POST | `/api/v1/approvals/:id/deny` | Rechazar |
| GET | `/api/v1/projects/:id/scheduled-tasks` | Tareas |
| POST | `/api/v1/scheduled-tasks/:id/approve` | Aprobar tarea |
| POST | `/api/v1/scheduled-tasks/:id/reject` | Rechazar tarea |
| GET | `/api/v1/projects/:id/usage` | Uso/costos |
| GET | `/api/v1/projects/:id/traces` | Trazas |
| GET | `/api/v1/stats` | Stats globales |

## Ver también

- [Patrones de Código](../guias/patrones-codigo.md) - Cómo crear API routes
- [Autenticación](../arquitectura/autenticacion.md) - Auth en endpoints
