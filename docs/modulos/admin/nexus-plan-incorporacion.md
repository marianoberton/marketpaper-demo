# Plan de Incorporación: Nexus AI Module

> **Objetivo:** Integrar completamente el sistema Nexus AI (fomo-core) en FOMO Platform, creando una UI administrativa completa que supere las capacidades del dashboard anterior.

---

## Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estado Actual](#estado-actual)
4. [Análisis Comparativo](#análisis-comparativo)
5. [Plan de Implementación](#plan-de-implementación)
6. [Roadmap de Features](#roadmap-de-features)
7. [Verificación y Testing](#verificación-y-testing)
8. [Documentación Técnica](#documentación-técnica)

---

## Visión General

### ¿Qué es Nexus?

**Nexus** es un framework empresarial para construir y gestionar agentes autónomos de IA multi-tenant. Permite a las empresas crear agentes conversacionales personalizados con:

- **Prompts versionados e inmutables** (identity, instructions, safety)
- **Memoria a largo plazo** con embeddings vectoriales
- **Sistema de aprobaciones** para herramientas de alto riesgo
- **Control de costos** con presupuestos diarios/mensuales
- **Múltiples canales** (WhatsApp, Telegram, Slack, web)
- **Integración MCP** para herramientas externas
- **Multi-agente** con comunicación inter-agentes
- **Observabilidad completa** con traces y eventos

### Componentes del Ecosistema

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| **fomo-core** | `C:\Users\Mariano\Documents\fomo-core` | Servidor backend (Fastify + PostgreSQL + Prisma) |
| **fomo-core-dashboard** | `C:\Users\Mariano\Documents\fomo-core-dashboard` | Dashboard anterior (Next.js con mock data) |
| **marketpaper-demo** | Proyecto actual | Nueva UI integrada en FOMO Platform |

### Objetivo de la Integración

Crear un módulo administrativo completo en FOMO Platform (`/admin/nexus`) que:

1. ✅ Se conecte al servidor fomo-core (localhost:3002)
2. ✅ Replique todas las funcionalidades del dashboard viejo
3. ✅ Agregue nuevas capacidades no disponibles anteriormente
4. ✅ Se integre perfectamente con el sistema de autenticación (super_admin only)
5. ✅ Mantenga la consistencia de diseño con el resto de la plataforma

---

## Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOMO Platform (Next.js)                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          /admin/nexus/* (UI Pages)                     │   │
│  │  - Dashboard, Projects, Agents, Chat, Prompts, etc.    │   │
│  └──────────────────────┬─────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼─────────────────────────────────┐   │
│  │       React Query Hooks (useProjects, useAgents)       │   │
│  └──────────────────────┬─────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼─────────────────────────────────┐   │
│  │     API Client (lib/nexus/api.ts)                      │   │
│  │     - HTTP requests to proxy routes                    │   │
│  │     - WebSocket client for real-time chat              │   │
│  └──────────────────────┬─────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼─────────────────────────────────┐   │
│  │  API Routes Proxy (/api/admin/nexus/*)                 │   │
│  │  - Auth validation (super_admin only)                  │   │
│  │  - Forward requests to fomo-core                       │   │
│  └──────────────────────┬─────────────────────────────────┘   │
└────────────────────────┬┼─────────────────────────────────────┘
                         ││
                         ││ HTTP/WebSocket
                         ││ (localhost:3002)
                         ▼▼
┌─────────────────────────────────────────────────────────────────┐
│                    fomo-core Server (Fastify)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  API Routes (/api/v1/*)                                   │ │
│  │  - Projects, Agents, Sessions, Messages                   │ │
│  │  - Prompt Layers, Approvals, Scheduled Tasks              │ │
│  │  - Memory, Contacts, Files, Templates, Catalog            │ │
│  │  - WebSocket: /chat/stream, /ws                           │ │
│  └──────────────────────┬───────────────────────────────────┘ │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐ │
│  │  Core Services                                            │ │
│  │  - Agent Runner (LLM orchestration)                       │ │
│  │  - Memory Manager (pgvector + embeddings)                 │ │
│  │  - Approval Gate (high-risk tools)                        │ │
│  │  - Cost Guard (budget enforcement)                        │ │
│  │  - Task Scheduler (BullMQ + cron)                         │ │
│  │  - Channel Adapters (WhatsApp, Telegram, Slack)          │ │
│  │  - MCP Client (external tools)                            │ │
│  └──────────────────────┬───────────────────────────────────┘ │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐ │
│  │  PostgreSQL 17 + Prisma                                   │ │
│  │  - Projects, Agents, Sessions, Messages, Traces           │ │
│  │  - PromptLayers, Approvals, ScheduledTasks                │ │
│  │  - MemoryEntries (vector embeddings)                      │ │
│  │  - Contacts, Files, UsageRecords                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos: Crear Proyecto

```
1. User en /admin/nexus/projects/new
   ↓
2. Completa wizard (5 pasos)
   ↓
3. Submit → useCreateProject() hook
   ↓
4. POST /api/admin/nexus/projects
   ↓
5. Auth check: super_admin?
   ↓
6. Forward: POST http://localhost:3002/api/v1/projects
   ↓
7. fomo-core: Validate + Insert DB
   ↓
8. Response: NexusProject object
   ↓
9. React Query: invalidate cache
   ↓
10. Redirect: /admin/nexus/projects/{id}
```

### Flujo de Datos: Chat con Agente

```
1. User en /admin/nexus/projects/{id}/agents/{agentId}/chat
   ↓
2. WebSocket connection a ws://localhost:3002/ws
   ↓
3. Send: { type: 'session.create', agentId }
   ↓
4. Receive: { type: 'session.created', sessionId }
   ↓
5. User escribe mensaje
   ↓
6. Send: { type: 'message.send', content: '...' }
   ↓
7. fomo-core: runAgent() → LLM + tools
   ↓
8. Streaming events:
   - message.content_delta (chunks de texto)
   - message.tool_start (tool execution)
   - message.tool_complete (tool result)
   - message.approval_required (si tool riskLevel='high')
   ↓
9. UI: Render en tiempo real
   ↓
10. Si approval required:
    - User: approve/deny
    - Send: { type: 'approval.decide', approved: true }
    - Agente continúa o aborta
   ↓
11. Receive: { type: 'message.complete', usage: {...} }
```

---

## Estado Actual

### Dashboard Viejo (fomo-core-dashboard)

**Tecnologías:**
- Next.js 16 (App Router)
- shadcn/ui (estilo New York)
- TanStack Query v5
- Monaco Editor
- Recharts
- WebSocket nativo

**Páginas Implementadas (15):**

| Ruta | Funcionalidad | Estado |
|------|---------------|--------|
| `/` | Dashboard home con stats | ✅ Mock data |
| `/login` | Auth con API Key | ✅ Funcional |
| `/projects` | Listado de proyectos | ✅ Mock data |
| `/projects/new` | Wizard 5 pasos | ✅ Mock data |
| `/projects/[id]` | Project overview | ✅ Mock data |
| `/projects/[id]/agents` | Listado agentes | ✅ Mock data |
| `/projects/[id]/agents/[agentId]/chat` | Chat WebSocket | ✅ Funcional |
| `/projects/[id]/prompts` | Editor Monaco + versionado | ✅ Mock data |
| `/projects/[id]/integrations` | Credentials + MCP + Channels | ✅ Mock data |
| `/projects/[id]/costs` | Gráficos Recharts | ✅ Mock data |
| `/projects/[id]/tasks` | Scheduled tasks | ✅ Mock data |
| `/approvals` | Global approvals | ✅ Mock data |

**Fortalezas:**
- ✅ UI completa y pulida
- ✅ WebSocket chat funcionando
- ✅ Wizard de onboarding intuitivo
- ✅ Editor Monaco para prompts
- ✅ Componentes reutilizables

**Debilidades:**
- ❌ Todo con mock data (no conexión real)
- ❌ No hay gestión de sesiones
- ❌ No hay traces/logs
- ❌ No hay memoria del proyecto
- ❌ No hay contactos
- ❌ No hay templates
- ❌ No hay catálogo de productos
- ❌ No hay gestión de archivos

### Servidor fomo-core

**Capacidades Completas:**

| Feature | Endpoints | Descripción |
|---------|-----------|-------------|
| **Projects** | 7 endpoints | CRUD + pause/resume + stats + import |
| **Agents** | 8 endpoints | CRUD + pause/resume + stats + refresh + inter-agent messaging |
| **Sessions** | 5 endpoints | CRUD + status update + messages list |
| **Chat** | 2 endpoints | Sync endpoint + WebSocket streaming |
| **Prompt Layers** | 5 endpoints | CRUD + activate + list by type + get active |
| **Approvals** | 4 endpoints | List + get + resolve (approve/deny) + pending by project |
| **Scheduled Tasks** | 8 endpoints | CRUD + approve/reject + pause/resume + runs list |
| **Traces** | 2 endpoints | List by session + get detail |
| **Tools** | 2 endpoints | List + get metadata |
| **Contacts** | 5 endpoints | CRUD completo |
| **Files** | 6 endpoints | Upload + download + URL + list + delete |
| **Webhooks** | 4 endpoints | Telegram + WhatsApp + Slack + health |
| **Memory** | 7 endpoints | CRUD + search semantic + list by category |
| **Templates** | 7 endpoints | CRUD + create project from template |
| **Catalog** | 3 endpoints | Upload CSV + search + stats + delete |
| **Usage** | 3 endpoints | Summary + by agent + cost alerts |
| **Dashboard** | 1 endpoint | Overview stats |

**Sistemas Avanzados:**
- ✅ Approval Gate (herramientas de alto riesgo)
- ✅ Memory Management (pgvector + OpenAI embeddings)
- ✅ MCP Servers (stdio/HTTP)
- ✅ Prompt Layers versionados e inmutables
- ✅ Cost Tracking con budgets
- ✅ Scheduled Tasks (BullMQ + cron)
- ✅ Multi-channel (WhatsApp, Telegram, Slack, Chatwoot)
- ✅ Multi-agent communication
- ✅ Traces y observabilidad

### Marketpaper-Demo (Estado Actual)

**Implementado (95%):**

| Componente | Estado | Descripción |
|-----------|--------|-------------|
| **Páginas** | ✅ 13 rutas | Dashboard, Projects (CRUD), Agents (CRUD), Chat, Prompts, Integrations, Costs, Tasks, Approvals |
| **Componentes** | ✅ 3 componentes | ChatMessage, ChatToolCall, ChatApprovalCard |
| **Tipos TS** | ✅ 307 líneas | Todos los tipos de Nexus Core |
| **API Client** | ✅ 210 líneas | Todos los métodos HTTP + WebSocket |
| **React Query Hooks** | ✅ 2 archivos | useProjects, useAgents con invalidación |
| **WebSocket Client** | ✅ 81 líneas | Conexión + eventos + send |
| **API Routes Proxy** | 🟡 4 rutas | Solo stats + projects basic CRUD |

**Faltan:**
- ❌ 16 grupos de API routes proxy
- ❌ 9 páginas nuevas (traces, sessions, memory, contacts, templates, catalog, files, webhooks, agent edit)
- ❌ Documentación del módulo

---

## Análisis Comparativo

### Dashboard Viejo vs Marketpaper (Actual) vs Objetivo

| Feature | Dashboard Viejo | Marketpaper Actual | Objetivo |
|---------|----------------|-------------------|----------|
| **UI Design** | ✅ Pulido | ✅ Consistente con FOMO | ✅ Mantener |
| **Projects CRUD** | ✅ Mock | ✅ Implementado | ✅ Funcional |
| **Agents CRUD** | ✅ Mock | ✅ Implementado | ✅ Funcional |
| **Chat WebSocket** | ✅ Funcional | ✅ Funcional | ✅ Mantener |
| **Prompt Editor** | ✅ Monaco | ✅ Monaco | ✅ Mantener |
| **Approvals** | ✅ Mock | ✅ Implementado | ✅ Funcional |
| **Costs** | ✅ Charts mock | ✅ Charts mock | ✅ Con data real |
| **Tasks** | ✅ Mock | ✅ Mock | ✅ Con data real |
| **Integrations** | ✅ Mock | ✅ Mock | ✅ Con data real |
| **Traces** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Sessions** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Memory** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Contacts** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Templates** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Catalog** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Files** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Webhooks** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Agent Edit** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Search Global** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Real-time Notifications** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Bulk Actions** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |
| **Export/Import** | ❌ No existe | ❌ No existe | ✅ **NUEVO** |

**Resumen:**
- Dashboard viejo: 12 features (todo mock)
- Marketpaper actual: 12 features (95% implementado)
- Objetivo: **25 features** (12 existentes + 13 nuevas)

---

## Plan de Implementación

### Fase 1: Completar API Routes Proxy (P1)

**Objetivo:** Crear todos los endpoints proxy faltantes para conectar la UI al servidor fomo-core.

**Patrón Estándar:**

```typescript
// Archivo: app/api/admin/nexus/{endpoint}/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:3002'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check: solo super_admin
    const { user, profile } = await getCurrentUser()
    if (!user || profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // 2. Forward request a Nexus Core
    const res = await fetch(`${NEXUS_URL}/api/v1/{path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    // 3. Handle errors
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Nexus server error' }))
      return NextResponse.json({ error: error.message }, { status: res.status })
    }

    // 4. Return data
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/nexus/{endpoint}:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Archivos a Crear (16 grupos):**

#### 1. Agents (5 archivos)
- `app/api/admin/nexus/projects/[projectId]/agents/route.ts`
  - GET: Listar agentes
  - POST: Crear agente
- `app/api/admin/nexus/projects/[projectId]/agents/[agentId]/route.ts`
  - GET: Obtener agente
  - PATCH: Actualizar agente
  - DELETE: Eliminar agente
- `app/api/admin/nexus/projects/[projectId]/agents/[agentId]/stats/route.ts`
  - GET: Stats del agente
- `app/api/admin/nexus/projects/[projectId]/agents/[agentId]/pause/route.ts`
  - POST: Pausar agente
- `app/api/admin/nexus/projects/[projectId]/agents/[agentId]/resume/route.ts`
  - POST: Reanudar agente

#### 2. Prompt Layers (3 archivos)
- `app/api/admin/nexus/projects/[projectId]/prompt-layers/route.ts`
  - GET: Listar layers (opcional ?layerType=identity)
  - POST: Crear nueva versión
- `app/api/admin/nexus/projects/[projectId]/prompt-layers/active/route.ts`
  - GET: Obtener 3 layers activas
- `app/api/admin/nexus/prompt-layers/[id]/activate/route.ts`
  - POST: Activar layer específica

#### 3. Approvals (2 archivos)
- `app/api/admin/nexus/approvals/route.ts`
  - GET: Listar todas las aprobaciones
- `app/api/admin/nexus/approvals/[id]/resolve/route.ts`
  - POST: Resolver aprobación (decision: approved|denied)

#### 4. Scheduled Tasks (5 archivos)
- `app/api/admin/nexus/projects/[projectId]/scheduled-tasks/route.ts`
  - GET: Listar tareas
  - POST: Crear tarea
- `app/api/admin/nexus/scheduled-tasks/[id]/approve/route.ts`
  - POST: Aprobar tarea propuesta
- `app/api/admin/nexus/scheduled-tasks/[id]/reject/route.ts`
  - POST: Rechazar tarea
- `app/api/admin/nexus/scheduled-tasks/[id]/pause/route.ts`
  - POST: Pausar tarea activa
- `app/api/admin/nexus/scheduled-tasks/[id]/resume/route.ts`
  - POST: Reanudar tarea pausada

#### 5. Usage & Traces (2 archivos)
- `app/api/admin/nexus/projects/[projectId]/usage/route.ts`
  - GET: Resumen de uso (period: day|week|month)
- `app/api/admin/nexus/sessions/[sessionId]/traces/route.ts`
  - GET: Listar traces de sesión

#### 6. Projects Pause/Resume (2 archivos)
- Ya creados anteriormente pero fueron rechazados
- `app/api/admin/nexus/projects/[projectId]/pause/route.ts`
  - POST: Pausar proyecto
- `app/api/admin/nexus/projects/[projectId]/resume/route.ts`
  - POST: Reanudar proyecto

#### Adicionales para Nuevas Features (si se implementan en Fase 2):

#### 7. Sessions (3 archivos)
- `app/api/admin/nexus/projects/[projectId]/sessions/route.ts`
  - GET: Listar sesiones
- `app/api/admin/nexus/sessions/[sessionId]/route.ts`
  - GET: Obtener sesión
- `app/api/admin/nexus/sessions/[sessionId]/terminate/route.ts`
  - POST: Terminar sesión

#### 8. Memory (5 archivos)
- `app/api/admin/nexus/projects/[projectId]/memory/route.ts`
  - GET: Listar memory entries
  - POST: Crear entry
- `app/api/admin/nexus/projects/[projectId]/memory/search/route.ts`
  - POST: Búsqueda semántica
- `app/api/admin/nexus/memory/[id]/route.ts`
  - GET: Obtener entry
  - PATCH: Actualizar entry
  - DELETE: Eliminar entry

#### 9. Contacts (4 archivos)
- `app/api/admin/nexus/projects/[projectId]/contacts/route.ts`
  - GET: Listar contactos
  - POST: Crear contacto
- `app/api/admin/nexus/contacts/[contactId]/route.ts`
  - GET: Obtener contacto
  - PATCH: Actualizar contacto
  - DELETE: Eliminar contacto

#### 10. Templates (4 archivos)
- Similar a contacts

#### 11. Catalog (3 archivos)
- `app/api/admin/nexus/projects/[projectId]/catalog/route.ts`
  - GET: Listar productos
- `app/api/admin/nexus/projects/[projectId]/catalog/upload/route.ts`
  - POST: Upload CSV/Excel (multipart/form-data)
- `app/api/admin/nexus/projects/[projectId]/catalog/search/route.ts`
  - GET: Búsqueda con query param

#### 12. Files (5 archivos)
- Similar a memory

**Total: ~40 archivos nuevos de API routes**

---

### Fase 2: Funcionalidades Nuevas (Superar Dashboard Viejo)

**Objetivo:** Agregar páginas y features que el dashboard viejo NO tenía.

#### 2.1. Página de Traces

**Ruta:** `/admin/nexus/projects/[projectId]/traces`

**Componentes:**
```
TracesList (client-page.tsx)
  ├── TraceFilters (status, dateRange, sessionId)
  ├── TraceTable
  │   ├── TraceRow (expandable)
  │   │   ├── TraceHeader (id, status, duration, cost, tokens)
  │   │   └── TraceEvents (timeline)
  │   │       ├── EventItem (type, timestamp, data)
  │   │       └── EventDetails (collapsible JSON)
  ├── TracePagination
  └── TraceStats (total, avg duration, total cost)
```

**Hooks:**
```typescript
// lib/nexus/hooks/use-traces.ts
export function useTraces(sessionId: string, enabled = true)
export function useTrace(traceId: string, enabled = true)
```

**UI Features:**
- Filtros por status (running, completed, failed, budget_exceeded, etc.)
- Date range picker
- Búsqueda por sessionId
- Timeline visual de eventos
- Expandir/colapsar detalles
- Cost breakdown por trace
- Export trace como JSON

#### 2.2. Página de Sesiones

**Ruta:** `/admin/nexus/projects/[projectId]/sessions`

**Componentes:**
```
SessionsList
  ├── SessionFilters (status, contact, agent, dateRange)
  ├── SessionsTable
  │   ├── SessionRow
  │   │   ├── SessionInfo (id, status, agent, contact, created)
  │   │   ├── SessionStats (turns, tokens, cost)
  │   │   └── SessionActions (view traces, terminate)
  ├── SessionsPagination
  └── SessionsStats (active, total today, avg duration)
```

**Hooks:**
```typescript
export function useSessions(projectId: string, filters?: SessionFilters)
export function useSession(sessionId: string)
export function useTerminateSession()
```

**UI Features:**
- Filtros por status, agent, contact
- Badges de status coloreados
- Link a traces de la sesión
- Acción: terminate session (con confirmación)
- Stats agregadas

#### 2.3. Página de Memoria

**Ruta:** `/admin/nexus/projects/[projectId]/memory`

**Componentes:**
```
MemoryManager
  ├── MemorySearch (semantic search bar)
  ├── MemoryFilters (category, importance, dateRange)
  ├── MemoryList
  │   ├── MemoryCard
  │   │   ├── Content (truncated)
  │   │   ├── Category badge
  │   │   ├── Importance (5 stars)
  │   │   ├── AccessCount
  │   │   └── Actions (edit, delete)
  ├── MemoryStats (total entries, categories count)
  └── CreateMemoryDialog
```

**Hooks:**
```typescript
export function useMemory(projectId: string, filters?: MemoryFilters)
export function useSearchMemory(projectId: string)
export function useCreateMemory(projectId: string)
export function useUpdateMemory(projectId: string)
export function useDeleteMemory(projectId: string)
```

**UI Features:**
- Búsqueda semántica (vector similarity)
- Filtros por category (fact, decision, preference, task_context, learning, catalog_product)
- Slider de importance (0-1)
- CRUD completo
- Badge de accessCount
- Visual importance stars

#### 2.4. Página de Contactos

**Ruta:** `/admin/nexus/projects/[projectId]/contacts`

**Componentes:**
```
ContactsManager
  ├── ContactsSearch (name, email, phone)
  ├── ContactsTable
  │   ├── ContactRow
  │   │   ├── Name + displayName
  │   │   ├── Channels (phone, email, telegram, slack)
  │   │   ├── Language + timezone
  │   │   └── Actions (edit, delete, view sessions)
  ├── ContactsStats
  └── CreateContactDialog
```

**Hooks:**
```typescript
export function useContacts(projectId: string)
export function useContact(contactId: string)
export function useCreateContact(projectId: string)
export function useUpdateContact(projectId: string)
export function useDeleteContact(projectId: string)
```

**UI Features:**
- CRUD completo
- Búsqueda por name, email, phone
- Badges de canales disponibles
- Link a sesiones del contacto
- Metadata custom fields (JSON)

#### 2.5. Página de Plantillas

**Ruta:** `/admin/nexus/projects/[projectId]/templates`

**Componentes:**
```
TemplatesManager
  ├── TemplatesList
  │   ├── TemplateCard
  │   │   ├── Name + variables count
  │   │   ├── UsageCount
  │   │   ├── Preview (first 100 chars)
  │   │   └── Actions (edit, delete, use)
  └── TemplateEditorDialog
      ├── Name input
      ├── Content textarea (Mustache syntax)
      └── Variables detected (auto-parse {{var}})
```

**Hooks:**
```typescript
export function useTemplates(projectId: string)
export function useTemplate(templateId: string)
export function useCreateTemplate(projectId: string)
export function useUpdateTemplate(projectId: string)
export function useDeleteTemplate(projectId: string)
```

**UI Features:**
- CRUD de templates
- Detección automática de variables Mustache `{{var}}`
- Usage count tracking
- Preview del template

#### 2.6. Página de Catálogo

**Ruta:** `/admin/nexus/projects/[projectId]/catalog`

**Componentes:**
```
CatalogManager
  ├── CatalogUpload (drag & drop CSV/Excel)
  │   └── ProcessingProgress (batch processing)
  ├── CatalogSearch (semantic + keyword)
  ├── CatalogStats (total products, categories, embeddings status)
  ├── CatalogTable
  │   ├── ProductRow
  │   │   ├── SKU, Name, Description
  │   │   ├── Price, Stock
  │   │   ├── Category
  │   │   └── Metadata (JSON)
  └── DeleteCatalogButton (delete all)
```

**Hooks:**
```typescript
export function useCatalog(projectId: string, filters?: CatalogFilters)
export function useSearchCatalog(projectId: string)
export function useUploadCatalog(projectId: string)
export function useDeleteCatalog(projectId: string)
```

**UI Features:**
- Upload CSV/Excel con drag & drop
- Progress bar durante procesamiento
- Búsqueda semántica con embeddings
- Filtros por category
- Stats (total products, categories)
- Delete all con confirmación

#### 2.7. Página de Archivos

**Ruta:** `/admin/nexus/projects/[projectId]/files`

**Componentes:**
```
FilesManager
  ├── FileUpload (drag & drop)
  ├── FilesFilters (mimeType, dateRange)
  ├── FilesTable
  │   ├── FileRow
  │   │   ├── Filename + mimeType icon
  │   │   ├── Size (formatted)
  │   │   ├── ExpiresAt (if set)
  │   │   └── Actions (download, get URL, delete)
  └── FilesStats (total size, count by type)
```

**Hooks:**
```typescript
export function useFiles(projectId: string)
export function useUploadFile(projectId: string)
export function useDownloadFile(fileId: string)
export function useFileUrl(fileId: string)
export function useDeleteFile(projectId: string)
```

**UI Features:**
- Upload file con drag & drop
- Multipart/form-data upload
- Download directo
- Get temporary URL (1h)
- ExpiresAt opcional
- Filtros por mime type
- Preview para imágenes (thumbnail)

#### 2.8. Página de Webhooks

**Ruta:** `/admin/nexus/projects/[projectId]/webhooks`

**Componentes:**
```
WebhooksManager
  ├── WebhooksList
  │   ├── WebhookCard
  │   │   ├── Name + status badge
  │   │   ├── Trigger prompt (preview)
  │   │   ├── Agent assigned
  │   │   ├── AllowedIPs (if set)
  │   │   └── Actions (edit, delete, pause/resume)
  └── WebhookEditorDialog
      ├── Name, description
      ├── Agent selector
      ├── Trigger prompt (Mustache template)
      ├── Secret (env var name)
      ├── AllowedIPs (comma-separated)
      └── Status toggle
```

**Hooks:**
```typescript
export function useWebhooks(projectId: string)
export function useWebhook(webhookId: string)
export function useCreateWebhook(projectId: string)
export function useUpdateWebhook(projectId: string)
export function useDeleteWebhook(projectId: string)
```

**UI Features:**
- CRUD de webhooks
- Mustache template editor
- IP allowlist
- Secret management (env var reference)
- Status toggle (active/paused)
- Test webhook (send sample payload)

#### 2.9. Página de Editar Agente

**Ruta:** `/admin/nexus/projects/[projectId]/agents/[agentId]/edit`

**Componentes:**
- Reutilizar el formulario de create agent
- Pre-poblar con datos del agente
- Botón "Save Changes" en lugar de "Create"

**Hooks:**
- `useAgent(projectId, agentId)` para cargar
- `useUpdateAgent(projectId, agentId)` para guardar

#### 2.10. Dashboard Overview Mejorado

**Mejoras a `/admin/nexus/page.tsx`:**

**Agregar:**
- Real-time updates (useQuery con refetchInterval: 30000)
- Más stat cards:
  - Sessions Activas
  - Cost This Week
  - Pending Approvals Count
- Activity Feed:
  - Últimas 10 ejecuciones (traces)
  - Formato: agent, project, timestamp, cost, status
- Quick Actions:
  - "Create Project" button
  - "View Pending Approvals" button
  - "Go to Project" search/dropdown

---

### Fase 3: Mejoras de UX

#### 3.1. Búsqueda Global (Cmd+K)

**Componente:** `components/nexus/global-search.tsx`

**Features:**
- Shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
- Dialog modal con input
- Búsqueda fuzzy en:
  - Proyectos (por name)
  - Agentes (por name, role)
  - Sesiones (por id)
- Resultados agrupados por tipo
- Click para navegar

**Implementación:**
- Hook: `useGlobalSearch(query)` → API /api/admin/nexus/search?q={query}
- Backend: Endpoint que busca en Projects, Agents, Sessions
- UI: Shadcn CommandMenu component

#### 3.2. Notificaciones Real-Time

**Componente:** `components/nexus/nexus-notifications.tsx`

**Features:**
- WebSocket connection global a /ws
- Eventos escuchados:
  - `approval.required` → Toast + badge count
  - `session.cost_alert` → Toast warning
  - `task.completed` → Toast success
- Badge en header con count de pending approvals
- Click en badge → redirect a /admin/nexus/approvals

**Implementación:**
- Context: `NexusNotificationsProvider`
- Estado: `useNexusNotifications()` hook
- Toast: Sonner con custom styling

#### 3.3. Bulk Actions

**En Approvals:**
- Checkbox para select múltiples
- Botón "Approve All" / "Deny All"
- Confirmación antes de ejecutar
- Progress indicator durante bulk operation

**En Scheduled Tasks:**
- Select múltiples tasks
- Botón "Approve All" / "Reject All"
- Confirmación

**Implementación:**
- Hook: `useBulkApprovals(approvalIds, decision)`
- Backend: Loop de requests o nuevo endpoint `/api/admin/nexus/approvals/bulk`

#### 3.4. Export/Import Configs

**Export Project:**
- Botón en `/admin/nexus/projects/[projectId]`
- Genera JSON con:
  - Project config
  - Active prompt layers
  - Agents configs
  - Tools allowlist
  - MCP servers
- Download como `project-{name}.json`

**Import Project:**
- Botón "Import from File" en `/admin/nexus/projects/new`
- Upload JSON file
- Validar estructura
- Crear proyecto con config importado

**Implementación:**
- Export: client-side JSON.stringify + download
- Import: `POST /api/admin/nexus/projects/import` con body

#### 3.5. Keyboard Shortcuts

**Shortcuts:**
- `/` o `?` → Abrir help panel
- `Cmd+K` → Global search
- `Cmd+N` → New project (desde /projects)
- `Cmd+S` → Save (en editors)
- `Esc` → Close dialogs

**Help Panel:**
- Dialog modal con tabla de shortcuts
- Categorías: Navigation, Actions, Editors
- Toggle con `/` o `?` key

#### 3.6. Favorites

**Feature:**
- Botón "Star" en project cards y agent cards
- LocalStorage: `nexus_favorites: { projects: [], agents: [] }`
- Dashboard: Sección "Favorites" con quick links
- Badge amarillo en favoritos

**Implementación:**
- Hook: `useFavorites(type: 'project' | 'agent')`
- Actions: toggleFavorite(id), isFavorite(id)
- Storage: localStorage wrapper

---

### Fase 4: Documentación (P2)

**Objetivo:** Crear documentación técnica completa del módulo Nexus.

**Archivo:** `docs/modulos/admin/nexus.md`

**Estructura Completa:**

```markdown
# Módulo Nexus AI

> Sistema de gestión de agentes autónomos empresariales integrado en FOMO Platform

## Descripción

Nexus AI permite a super admins gestionar proyectos de agentes conversacionales con capacidades avanzadas...

## Arquitectura

### Componentes
- fomo-core: Servidor backend (Fastify + PostgreSQL)
- marketpaper-demo: UI administrativa (Next.js)

### Diagrama de flujo
[Diagrama del sistema]

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/nexus` | Dashboard principal |
| `/admin/nexus/projects` | Listado de proyectos |
| `/admin/nexus/projects/new` | Crear proyecto (wizard) |
| `/admin/nexus/projects/[id]` | Detalle de proyecto |
| `/admin/nexus/projects/[id]/edit` | Editar proyecto |
| `/admin/nexus/projects/[id]/agents` | Agentes del proyecto |
| `/admin/nexus/projects/[id]/agents/new` | Crear agente |
| `/admin/nexus/projects/[id]/agents/[agentId]/chat` | Chat de prueba |
| `/admin/nexus/projects/[id]/agents/[agentId]/edit` | Editar agente |
| `/admin/nexus/projects/[id]/prompts` | Editor de prompts |
| `/admin/nexus/projects/[id]/integrations` | Integraciones |
| `/admin/nexus/projects/[id]/costs` | Análisis de costos |
| `/admin/nexus/projects/[id]/tasks` | Tareas programadas |
| `/admin/nexus/projects/[id]/traces` | Traces y logs |
| `/admin/nexus/projects/[id]/sessions` | Sesiones activas |
| `/admin/nexus/projects/[id]/memory` | Memoria del proyecto |
| `/admin/nexus/projects/[id]/contacts` | Contactos |
| `/admin/nexus/projects/[id]/templates` | Plantillas |
| `/admin/nexus/projects/[id]/catalog` | Catálogo de productos |
| `/admin/nexus/projects/[id]/files` | Gestión de archivos |
| `/admin/nexus/projects/[id]/webhooks` | Webhooks |
| `/admin/nexus/approvals` | Aprobaciones globales |

## API Endpoints

### Projects
```
GET    /api/admin/nexus/projects
POST   /api/admin/nexus/projects
GET    /api/admin/nexus/projects/[projectId]
PATCH  /api/admin/nexus/projects/[projectId]
DELETE /api/admin/nexus/projects/[projectId]
POST   /api/admin/nexus/projects/[projectId]/pause
POST   /api/admin/nexus/projects/[projectId]/resume
GET    /api/admin/nexus/projects/[projectId]/stats
```

[... continuar con todos los endpoints]

## Componentes UI

### ChatMessage
Renderiza mensajes de usuario y asistente con avatar y timestamp.

**Ubicación:** `components/nexus/chat-message.tsx`

**Props:**
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}
```

### ChatToolCall
[...]

### ChatApprovalCard
[...]

## Hooks React Query

### useProjects()
Lista todos los proyectos.

**Ubicación:** `lib/nexus/hooks/use-projects.ts`

**Retorna:** `{ data: NexusProject[], isLoading, error }`

[... continuar con todos los hooks]

## Tipos TypeScript

### NexusProject
```typescript
interface NexusProject {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'archived'
  config: NexusProjectConfig
  createdAt: string
  updatedAt: string
}
```

[... continuar con todos los tipos]

## WebSocket

### Conexión
```typescript
const ws = createNexusWebSocket({
  url: 'ws://localhost:3002/ws',
  projectId: 'proj-123',
  agentId: 'agent-456',
  onMessage: (event) => { ... }
})
```

### Eventos

#### Inbound (servidor → cliente)
- `session.created`: Sesión creada
- `message.content_delta`: Chunk de texto streaming
- `message.tool_start`: Herramienta inicia ejecución
- `message.tool_complete`: Herramienta completa
- `message.approval_required`: Aprobación requerida
- `message.complete`: Mensaje completo
- `session.cost_alert`: Alerta de costo
- `error`: Error

#### Outbound (cliente → servidor)
- `message.send`: Enviar mensaje
- `approval.decide`: Resolver aprobación

## Integración con fomo-core

### Configuración

**Variables de entorno:**
```bash
NEXUS_API_URL=http://localhost:3002
```

**Autenticación:**
- Todos los endpoints requieren `super_admin` role
- Validación en cada API route proxy

### Flujo de Request

1. UI llama hook de React Query
2. Hook llama API client (`lib/nexus/api.ts`)
3. API client hace request a `/api/admin/nexus/*`
4. API route valida autenticación
5. API route forward a `http://localhost:3002/api/v1/*`
6. fomo-core procesa request
7. Response vuelve por el mismo camino
8. React Query actualiza cache

## Guía de Uso

### Crear un Proyecto

1. Ir a `/admin/nexus/projects/new`
2. Completar wizard de 5 pasos:
   - **Básicos:** Nombre, descripción, provider, modelo
   - **Identidad:** Prompt de identidad del agente
   - **Tools:** Seleccionar herramientas disponibles
   - **Límites:** Presupuestos y límites de sesión
   - **Review:** Revisar y confirmar
3. Click "Create Project"

### Configurar un Agente

1. Ir a `/admin/nexus/projects/[id]/agents/new`
2. Completar formulario:
   - Nombre y descripción
   - Prompts (identity, instructions, safety)
   - Tools allowlist
   - Límites (max turns, budget per day)
3. Click "Create Agent"

### Chat de Prueba

1. Ir a `/admin/nexus/projects/[id]/agents/[agentId]/chat`
2. WebSocket se conecta automáticamente
3. Escribir mensaje y presionar Enter
4. Ver respuesta en tiempo real
5. Si tool requiere aprobación, aparece card inline
6. Aprobar/Denegar según corresponda

### Gestionar Aprobaciones

1. Ir a `/admin/nexus/approvals`
2. Ver lista de aprobaciones pending
3. Ver detalles de tool call (input JSON)
4. Click "Approve" o "Deny"
5. Agente continúa o aborta según decisión

### Ver Traces

1. Ir a `/admin/nexus/projects/[id]/traces`
2. Filtrar por status, date range, sessionId
3. Expandir trace para ver eventos
4. Ver timeline de ejecución
5. Analizar cost breakdown

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `app/admin/nexus/page.tsx` | Dashboard principal |
| `app/admin/nexus/projects/new/page.tsx` | Wizard de creación (569 líneas) |
| `lib/nexus/types.ts` | Tipos TypeScript (307 líneas) |
| `lib/nexus/api.ts` | Cliente HTTP (210 líneas) |
| `lib/nexus/websocket.ts` | Cliente WebSocket (81 líneas) |
| `lib/nexus/hooks/use-projects.ts` | Hooks de proyectos (115 líneas) |
| `lib/nexus/hooks/use-agents.ts` | Hooks de agentes (116 líneas) |
| `components/nexus/chat-message.tsx` | Mensaje de chat (39 líneas) |
| `components/nexus/chat-tool-call.tsx` | Tool call card (77 líneas) |
| `components/nexus/chat-approval-card.tsx` | Aprobación card (51 líneas) |
| `app/api/admin/nexus/projects/route.ts` | API proxy proyectos |
| `app/api/admin/nexus/stats/route.ts` | API proxy stats |

## Troubleshooting

### Error: "No autorizado"
- Verificar que el usuario sea super_admin
- Revisar sesión en Supabase

### Error: "Nexus server error"
- Verificar que fomo-core esté corriendo en localhost:3002
- Revisar logs del servidor
- Verificar DATABASE_URL en fomo-core

### WebSocket no conecta
- Verificar URL: ws://localhost:3002/ws
- Revisar CORS en fomo-core
- Ver console del browser para errores

### Prompts no se guardan
- Verificar que content tenga entre 1-100,000 chars
- Verificar changeReason esté presente
- Ver response de API en Network tab

## Ver También

- [Configuración de Super Admin](../super-admin.md)
- [Variables de Entorno](../../config/env.md)
```

---

## Roadmap de Features

### Fase 1 (MVP) - Semana 1-2

**Objetivo:** Conectar UI existente al servidor real

- ✅ Completar API routes proxy (16 grupos)
- ✅ Probar conexión con fomo-core
- ✅ Verificar autenticación super_admin
- ✅ Testing manual de CRUD básico
- ✅ Documentación técnica (P2)

**Entregables:**
- 16 archivos de API routes
- Tests manuales exitosos
- `docs/modulos/admin/nexus.md`

### Fase 2 (Extended) - Semana 3-4

**Objetivo:** Agregar funcionalidades nuevas

**Prioridad Alta:**
- Traces (debugging crítico)
- Sessions (monitoreo en vivo)
- Agent Edit (falta completar CRUD)

**Prioridad Media:**
- Memory (valor agregado)
- Contacts (multi-channel)
- Files (upload/download)

**Prioridad Baja:**
- Templates
- Catalog
- Webhooks

**Entregables:**
- 9 páginas nuevas
- Hooks correspondientes
- API routes adicionales

### Fase 3 (Polish) - Semana 5

**Objetivo:** Mejorar UX y productividad

- Global search (Cmd+K)
- Real-time notifications
- Bulk actions
- Export/Import
- Keyboard shortcuts
- Favorites

**Entregables:**
- Componentes de UX mejorados
- Documentación de shortcuts

### Fase 4 (Future)

**Features Futuras:**
- Dashboard customizable (widgets)
- Agent performance metrics (latency, accuracy)
- Scheduled reports (email)
- Multi-language support
- Custom roles & permissions
- Audit log completo

---

## Verificación y Testing

### Checklist de Implementación

#### Fase 1: API Routes

**Projects:**
- [ ] GET /api/admin/nexus/projects
- [ ] POST /api/admin/nexus/projects
- [ ] GET /api/admin/nexus/projects/[id]
- [ ] PATCH /api/admin/nexus/projects/[id]
- [ ] DELETE /api/admin/nexus/projects/[id]
- [ ] POST /api/admin/nexus/projects/[id]/pause
- [ ] POST /api/admin/nexus/projects/[id]/resume
- [ ] GET /api/admin/nexus/projects/[id]/stats

**Agents:**
- [ ] GET /api/admin/nexus/projects/[id]/agents
- [ ] POST /api/admin/nexus/projects/[id]/agents
- [ ] GET /api/admin/nexus/projects/[id]/agents/[agentId]
- [ ] PATCH /api/admin/nexus/projects/[id]/agents/[agentId]
- [ ] DELETE /api/admin/nexus/projects/[id]/agents/[agentId]
- [ ] POST /api/admin/nexus/projects/[id]/agents/[agentId]/pause
- [ ] POST /api/admin/nexus/projects/[id]/agents/[agentId]/resume
- [ ] GET /api/admin/nexus/projects/[id]/agents/[agentId]/stats

**Prompt Layers:**
- [ ] GET /api/admin/nexus/projects/[id]/prompt-layers
- [ ] POST /api/admin/nexus/projects/[id]/prompt-layers
- [ ] GET /api/admin/nexus/projects/[id]/prompt-layers/active
- [ ] POST /api/admin/nexus/prompt-layers/[id]/activate

**Approvals:**
- [ ] GET /api/admin/nexus/approvals
- [ ] POST /api/admin/nexus/approvals/[id]/resolve

**Scheduled Tasks:**
- [ ] GET /api/admin/nexus/projects/[id]/scheduled-tasks
- [ ] POST /api/admin/nexus/projects/[id]/scheduled-tasks
- [ ] POST /api/admin/nexus/scheduled-tasks/[id]/approve
- [ ] POST /api/admin/nexus/scheduled-tasks/[id]/reject
- [ ] POST /api/admin/nexus/scheduled-tasks/[id]/pause
- [ ] POST /api/admin/nexus/scheduled-tasks/[id]/resume

**Usage & Traces:**
- [ ] GET /api/admin/nexus/projects/[id]/usage
- [ ] GET /api/admin/nexus/sessions/[sessionId]/traces

**Stats:**
- [ ] GET /api/admin/nexus/stats

#### Fase 2: Páginas Nuevas

- [ ] `/admin/nexus/projects/[id]/traces`
- [ ] `/admin/nexus/projects/[id]/sessions`
- [ ] `/admin/nexus/projects/[id]/memory`
- [ ] `/admin/nexus/projects/[id]/contacts`
- [ ] `/admin/nexus/projects/[id]/templates`
- [ ] `/admin/nexus/projects/[id]/catalog`
- [ ] `/admin/nexus/projects/[id]/files`
- [ ] `/admin/nexus/projects/[id]/webhooks`
- [ ] `/admin/nexus/projects/[id]/agents/[agentId]/edit`

#### Fase 3: UX Features

- [ ] Global search (Cmd+K)
- [ ] Real-time notifications
- [ ] Bulk actions (approvals)
- [ ] Bulk actions (tasks)
- [ ] Export project config
- [ ] Import project config
- [ ] Keyboard shortcuts panel
- [ ] Favorites (projects)
- [ ] Favorites (agents)

#### Fase 4: Documentación

- [ ] `docs/modulos/admin/nexus.md` completo
- [ ] Rutas documentadas
- [ ] API endpoints documentados
- [ ] Componentes documentados
- [ ] Hooks documentados
- [ ] Tipos documentados
- [ ] WebSocket documentado
- [ ] Guía de uso completa

### Testing Manual

**Escenario 1: Crear Proyecto**
1. Login como super_admin
2. Ir a `/admin/nexus/projects/new`
3. Completar wizard:
   - Básicos: "Test Project", Anthropic, claude-sonnet-4-5
   - Identidad: "Sos un asistente virtual..."
   - Tools: calculator, datetime
   - Límites: $10 daily, $200 monthly
   - Review: Confirmar
4. Click "Create Project"
5. Verificar redirect a `/admin/nexus/projects/{id}`
6. Verificar proyecto aparece en lista

**Escenario 2: Crear Agente**
1. Desde proyecto creado, ir a Agents
2. Click "New Agent"
3. Completar formulario:
   - Name: "Test Agent"
   - Identity: "Sos un vendedor..."
   - Instructions: "Ayudas a los clientes..."
   - Safety: "Nunca reveles información..."
   - Tools: calculator, datetime
   - Limits: 20 turns, $5/day
4. Click "Create Agent"
5. Verificar agente aparece en lista

**Escenario 3: Chat de Prueba**
1. Desde agente creado, click "Test Chat"
2. Verificar WebSocket conecta
3. Enviar mensaje: "Hola, cuánto es 2+2?"
4. Verificar:
   - Streaming de respuesta
   - Tool call "calculator" aparece
   - Result "4" mostrado
   - Respuesta completa del agente
5. Enviar mensaje con tool que requiera aprobación
6. Verificar card de aprobación aparece
7. Aprobar
8. Verificar agente continúa

**Escenario 4: Prompt Layers**
1. Ir a `/admin/nexus/projects/{id}/prompts`
2. Tab "Identity"
3. Editar contenido en Monaco
4. Click "Save"
5. Verificar nueva versión en history
6. Verificar badge "Active" en nueva versión
7. Click en versión anterior
8. Verificar contenido cambia
9. Click "Activate"
10. Verificar badge "Active" se mueve

**Escenario 5: Aprobaciones**
1. Ir a `/admin/nexus/approvals`
2. Verificar lista de pending approvals
3. Ver detalles de tool call
4. Click "Approve"
5. Verificar card desaparece
6. Ir a chat donde se solicitó
7. Verificar agente continuó

**Escenario 6: Costos**
1. Ir a `/admin/nexus/projects/{id}/costs`
2. Verificar stat cards:
   - Daily Spend
   - Monthly Spend
   - Avg Cost/Session
   - Total Tokens
3. Verificar gráfico con datos reales
4. Verificar progress bars de budget

**Escenario 7: Scheduled Tasks**
1. Ir a `/admin/nexus/projects/{id}/tasks`
2. Click "New Task"
3. Completar:
   - Name: "Daily Report"
   - Cron: "0 9 * * *"
   - Message: "Generate daily report"
4. Click "Create"
5. Verificar task aparece con status "active"
6. Click "Pause"
7. Verificar status cambia a "paused"

### Testing de Integración

**Test 1: fomo-core Connectivity**
```bash
# Verificar servidor corriendo
curl http://localhost:3002/api/v1/projects

# Debe retornar: { "data": [...] }
```

**Test 2: Auth Validation**
```bash
# Sin auth (debe fallar)
curl http://localhost:3000/api/admin/nexus/projects

# Con auth super_admin (debe funcionar)
curl http://localhost:3000/api/admin/nexus/projects \
  -H "Cookie: sb-access-token=..."
```

**Test 3: WebSocket Connection**
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:3002/ws')
ws.onopen = () => console.log('Connected')
ws.onerror = (e) => console.error('Error:', e)
ws.onmessage = (e) => console.log('Message:', e.data)
```

**Test 4: Proxy Forwarding**
```bash
# Desde UI, crear proyecto
# Verificar en logs de fomo-core:
# "POST /api/v1/projects" aparece

# Desde UI, listar proyectos
# Verificar en logs:
# "GET /api/v1/projects" aparece
```

### Métricas de Éxito

**Coverage:**
- ✅ 100% de API routes proxy implementados
- ✅ 100% de páginas del dashboard viejo replicadas
- ✅ +50% de nuevas funcionalidades vs dashboard viejo

**Performance:**
- ⏱️ Load time de dashboard < 2s
- ⏱️ API response time < 500ms
- ⏱️ WebSocket latency < 100ms

**UX:**
- ✅ Todas las páginas responsive (mobile, tablet, desktop)
- ✅ Loading states en todas las acciones
- ✅ Error handling con toast notifications
- ✅ Confirmaciones para acciones destructivas

**Code Quality:**
- ✅ TypeScript strict mode sin errores
- ✅ Todos los componentes tipados
- ✅ Hooks con error handling
- ✅ API routes con try/catch

---

## Documentación Técnica

### Variables de Entorno

**Requeridas:**

```bash
# URL del servidor Nexus Core
NEXUS_API_URL=http://localhost:3002

# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Opcionales:**

```bash
# Para desarrollo local
NODE_ENV=development
```

### Configuración de fomo-core

Para que el servidor fomo-core funcione correctamente, debe tener:

**Database:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_db
```

**LLM Providers:**
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Redis (opcional, para scheduled tasks):**
```bash
REDIS_URL=redis://localhost:6379
```

**Channels (opcional):**
```bash
TELEGRAM_BOT_TOKEN=...
WHATSAPP_ACCESS_TOKEN=...
SLACK_BOT_TOKEN=...
```

### Estructura de Archivos

```
marketpaper-demo/
├── app/
│   ├── admin/
│   │   ├── nexus/
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx                # Lista proyectos
│   │   │   │   ├── new/page.tsx            # Wizard crear
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx            # Detalle proyecto
│   │   │   │       ├── edit/page.tsx       # Editar proyecto
│   │   │   │       ├── agents/
│   │   │   │       │   ├── page.tsx        # Lista agentes
│   │   │   │       │   ├── new/page.tsx    # Crear agente
│   │   │   │       │   └── [agentId]/
│   │   │   │       │       ├── chat/page.tsx  # Chat test
│   │   │   │       │       └── edit/page.tsx  # Editar agente
│   │   │   │       ├── prompts/page.tsx    # Editor prompts
│   │   │   │       ├── integrations/page.tsx
│   │   │   │       ├── costs/page.tsx
│   │   │   │       ├── tasks/page.tsx
│   │   │   │       ├── traces/page.tsx     # ⭐ NUEVO
│   │   │   │       ├── sessions/page.tsx   # ⭐ NUEVO
│   │   │   │       ├── memory/page.tsx     # ⭐ NUEVO
│   │   │   │       ├── contacts/page.tsx   # ⭐ NUEVO
│   │   │   │       ├── templates/page.tsx  # ⭐ NUEVO
│   │   │   │       ├── catalog/page.tsx    # ⭐ NUEVO
│   │   │   │       ├── files/page.tsx      # ⭐ NUEVO
│   │   │   │       └── webhooks/page.tsx   # ⭐ NUEVO
│   │   │   └── approvals/page.tsx
│   └── api/
│       └── admin/
│           └── nexus/
│               ├── stats/route.ts
│               ├── projects/
│               │   ├── route.ts
│               │   └── [projectId]/
│               │       ├── route.ts
│               │       ├── stats/route.ts
│               │       ├── pause/route.ts
│               │       ├── resume/route.ts
│               │       ├── agents/
│               │       │   ├── route.ts
│               │       │   └── [agentId]/
│               │       │       ├── route.ts
│               │       │       ├── stats/route.ts
│               │       │       ├── pause/route.ts
│               │       │       └── resume/route.ts
│               │       ├── prompt-layers/
│               │       │   ├── route.ts
│               │       │   └── active/route.ts
│               │       ├── scheduled-tasks/route.ts
│               │       ├── usage/route.ts
│               │       └── [... más endpoints]
│               ├── prompt-layers/
│               │   └── [id]/activate/route.ts
│               ├── approvals/
│               │   ├── route.ts
│               │   └── [id]/resolve/route.ts
│               ├── scheduled-tasks/
│               │   └── [id]/
│               │       ├── approve/route.ts
│               │       ├── reject/route.ts
│               │       ├── pause/route.ts
│               │       └── resume/route.ts
│               └── sessions/
│                   └── [sessionId]/traces/route.ts
├── components/
│   └── nexus/
│       ├── chat-message.tsx
│       ├── chat-tool-call.tsx
│       ├── chat-approval-card.tsx
│       ├── global-search.tsx           # ⭐ NUEVO
│       └── nexus-notifications.tsx     # ⭐ NUEVO
├── lib/
│   └── nexus/
│       ├── types.ts
│       ├── api.ts
│       ├── websocket.ts
│       └── hooks/
│           ├── use-projects.ts
│           ├── use-agents.ts
│           ├── use-traces.ts           # ⭐ NUEVO
│           ├── use-sessions.ts         # ⭐ NUEVO
│           ├── use-memory.ts           # ⭐ NUEVO
│           ├── use-contacts.ts         # ⭐ NUEVO
│           ├── use-templates.ts        # ⭐ NUEVO
│           ├── use-catalog.ts          # ⭐ NUEVO
│           ├── use-files.ts            # ⭐ NUEVO
│           └── use-webhooks.ts         # ⭐ NUEVO
└── docs/
    └── modulos/
        └── admin/
            ├── nexus.md                # ⭐ DOCUMENTACIÓN
            └── nexus-plan-incorporacion.md  # Este archivo
```

### Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Framework | Next.js | 15 | App Router, SSR |
| UI | React | 19 | Componentes |
| Lenguaje | TypeScript | Strict | Type safety |
| Estilos | Tailwind CSS | v4 | Utility-first CSS |
| Componentes | shadcn/ui | Latest | Componentes accesibles |
| State | TanStack Query | v5 | Server state |
| WebSocket | Native | - | Real-time chat |
| Iconos | Lucide React | Latest | Iconografía |
| Notificaciones | Sonner | Latest | Toast messages |
| Temas | next-themes | Latest | Dark/light mode |
| Auth | Supabase Auth | Latest | Autenticación |

---

## Próximos Pasos

### Inmediato (Esta Semana)

1. ✅ Crear todas las API routes proxy (Fase 1)
2. ✅ Verificar conexión con fomo-core
3. ✅ Testing manual de flujos básicos
4. ✅ Crear documentación técnica

### Corto Plazo (Próximas 2 Semanas)

1. Implementar páginas nuevas prioritarias:
   - Traces (debugging)
   - Sessions (monitoreo)
   - Agent Edit (completar CRUD)
2. Testing exhaustivo con data real
3. Fix de bugs encontrados

### Mediano Plazo (Próximo Mes)

1. Resto de páginas nuevas:
   - Memory, Contacts, Files
   - Templates, Catalog, Webhooks
2. Features de UX:
   - Global search
   - Real-time notifications
   - Bulk actions
3. Polish y refinamiento

### Largo Plazo (Próximos 3 Meses)

1. Features avanzadas:
   - Dashboard customizable
   - Agent performance metrics
   - Scheduled reports
2. Optimizaciones de performance
3. Multi-language support
4. Audit log completo

---

## Conclusión

Este plan de incorporación establece una hoja de ruta clara para integrar completamente Nexus AI en FOMO Platform. El objetivo es crear una UI administrativa que no solo replique las funcionalidades del dashboard anterior, sino que las supere significativamente con:

- ✅ **Conexión real** al servidor fomo-core (vs mock data)
- ✅ **13 nuevas páginas** no disponibles anteriormente
- ✅ **Mejoras de UX** (búsqueda global, notificaciones, bulk actions)
- ✅ **Documentación completa** para mantenimiento futuro

El resultado será un módulo de gestión de agentes AI de nivel empresarial, completamente integrado con el ecosistema FOMO Platform.

---

**Autor:** Claude Sonnet 4.5
**Fecha:** 2026-02-16
**Versión:** 1.0
**Estado:** Pendiente de aprobación
