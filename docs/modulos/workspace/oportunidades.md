# Módulo de Oportunidades

> [Inicio](../../README.md) > [Módulos](../README.md) > Oportunidades

## Descripción

Pipeline de oportunidades de venta con vista Kanban. Permite gestionar oportunidades comerciales a través de 4 etapas, con drag & drop, cálculo automático de probabilidad y valores ponderados, y cierre con resultado (ganada/perdida).

## Rutas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/workspace/oportunidades` | `app/(workspace)/workspace/oportunidades/page.tsx` | Server Component wrapper |
| — | `app/(workspace)/workspace/oportunidades/client-page.tsx` | Kanban board (client) |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workspace/oportunidades` | Listar oportunidades + stats |
| POST | `/api/workspace/oportunidades` | Crear oportunidad |
| GET | `/api/workspace/oportunidades/[id]` | Obtener detalle |
| PUT | `/api/workspace/oportunidades/[id]` | Actualizar oportunidad |
| DELETE | `/api/workspace/oportunidades/[id]` | Eliminar (solo admins) |
| PATCH | `/api/workspace/oportunidades/[id]/stage` | Cambiar etapa (drag & drop) |

### Parámetros de filtro (GET)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `stage` | string | Filtrar por etapa |
| `assigned_to` | UUID | Filtrar por asignado |
| `client_id` | UUID | Filtrar por cliente |

### Respuesta del GET

```typescript
{
  opportunities: Opportunity[]
  stats: {
    pipelineValue: number    // Suma de estimated_value (etapas activas)
    weightedValue: number    // Suma de weighted_value (etapas activas)
    wonValue: number         // Suma de estimated_value (ganadas)
    totalCount: number       // Total de oportunidades
  }
}
```

## Tabla: `opportunities`

Migración: `0047_create_opportunities.sql`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK a companies (multi-tenant) |
| `title` | TEXT | Título (requerido) |
| `description` | TEXT | Descripción opcional |
| `client_id` | UUID | FK a clients |
| `assigned_to` | UUID | FK a user_profiles |
| `quote_id` | UUID | FK para futuro cotizador |
| `stage` | TEXT | Etapa actual |
| `outcome` | TEXT | `'won'` o `'lost'` (solo en cierre) |
| `probability` | INTEGER | 0–100, auto-set por etapa |
| `estimated_value` | DECIMAL(12,2) | Valor estimado |
| `weighted_value` | DECIMAL(12,2) | Columna generada: `estimated_value × probability / 100` |
| `currency` | TEXT | Moneda (default: `'USD'`) |
| `expected_close_date` | DATE | Fecha estimada de cierre |
| `closed_at` | TIMESTAMPTZ | Fecha real de cierre |
| `loss_reason` | TEXT | Razón de pérdida |
| `position_order` | INTEGER | Orden dentro de la etapa |
| `created_at` | TIMESTAMPTZ | Creación |
| `updated_at` | TIMESTAMPTZ | Última actualización (trigger) |

### Índices

- `idx_opportunities_company_id` — Filtrado multi-tenant
- `idx_opportunities_company_stage` — Queries del Kanban (company + etapa)
- `idx_opportunities_client_id` — Búsqueda por cliente
- `idx_opportunities_assigned_to` — Filtro por asignado
- `idx_opportunities_expected_close` — Fechas de cierre futuras

### RLS

Patrón de 3 capas estándar:
1. Super admin: acceso total
2. Company admin: CRUD en su empresa
3. Usuarios: lectura de su empresa, creación/actualización; solo admins eliminan

## Etapas del pipeline

| Etapa | Probabilidad default | Ícono | Color |
|-------|---------------------|-------|-------|
| `calificacion` | 25% | `Target` | `state-info` (azul) |
| `propuesta` | 50% | `FileText` | `state-warning` (naranja) |
| `negociacion` | 75% | `HandCoins` | `state-info` (azul) |
| `cierre` | 100% (ganada) / 0% (perdida) | `Trophy` | `state-success` (verde) |

### Reglas de transición

- Se puede mover libremente entre `calificacion`, `propuesta` y `negociacion`
- Al mover a `cierre`: se abre el `CloseDialog` para elegir resultado (ganada/perdida)
- Si se elige "Perdida": campo opcional para `loss_reason`
- Al volver de `cierre` a otra etapa: se resetean `outcome`, `closed_at` y `loss_reason`

## Kanban board

### Implementación

El tablero usa **drag & drop nativo** (HTML5 Drag Events), sin librerías externas:

1. `handleDragStart` → guarda la oportunidad arrastrada en state
2. `handleDragOver` → detecta la columna destino
3. `handleDrop` → ejecuta el movimiento
4. **Optimistic update**: la UI se actualiza inmediatamente; si el server falla, hace rollback

### Estructura de una card

```
┌──────────────────────────────┐
│ [Grip] Título         [Menu] │
│ 🏢 Nombre del cliente        │
│ 👤 Asignado a                │
│ 📅 Fecha de cierre           │
├──────────────────────────────┤
│ $X,XXX    [Badge prob/result]│
└──────────────────────────────┘
```

### Acciones por card

| Acción | Descripción |
|--------|-------------|
| Editar | Abre el formulario de edición |
| Duplicar | Crea copia con prefijo "[Copia]" en `calificacion` |
| Eliminar | Requiere confirmación (solo admins) |

### Stats bar (header)

3 métricas principales visibles arriba del tablero:

| Métrica | Cálculo |
|---------|---------|
| Pipeline Activo | Suma de `estimated_value` donde `stage ≠ 'cierre'` |
| Valor Ponderado | Suma de `weighted_value` para oportunidades activas |
| Ganadas | Suma de `estimated_value` donde `outcome = 'won'` |

## Componentes

| Archivo | Propósito |
|---------|-----------|
| `oportunidades/client-page.tsx` | Kanban board principal |
| `oportunidades/components/OpportunityCard.tsx` | Card draggable individual |
| `oportunidades/components/OpportunityForm.tsx` | Dialog de crear/editar |
| `oportunidades/components/CloseDialog.tsx` | Dialog de cierre (ganada/perdida) |

## Data flow

### Carga inicial

Al montar el componente, se hacen 3 fetches en paralelo:
1. `GET /api/workspace/oportunidades` → oportunidades + stats
2. `GET /api/workspace/crm` → lista de clientes (para dropdowns)
3. `GET /api/workspace/settings/team` → miembros del equipo (para asignación)

### Tipo `Opportunity`

```typescript
interface Opportunity {
  id: string
  company_id: string
  title: string
  description: string | null
  client_id: string | null
  assigned_to: string | null
  quote_id: string | null
  stage: 'calificacion' | 'propuesta' | 'negociacion' | 'cierre'
  outcome: 'won' | 'lost' | null
  probability: number
  estimated_value: number
  weighted_value: number
  currency: string
  expected_close_date: string | null
  closed_at: string | null
  loss_reason: string | null
  position_order: number
  created_at: string
  updated_at: string
  // Relaciones (joins)
  client: { id: string; name: string } | null
  assignee: { id: string; full_name: string; avatar_url: string | null } | null
}
```

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/(workspace)/workspace/oportunidades/client-page.tsx` | Kanban board |
| `app/(workspace)/workspace/oportunidades/components/` | Card, Form, CloseDialog |
| `app/api/workspace/oportunidades/route.ts` | GET/POST |
| `app/api/workspace/oportunidades/[id]/route.ts` | GET/PUT/DELETE |
| `app/api/workspace/oportunidades/[id]/stage/route.ts` | PATCH (cambio de etapa) |
| `supabase/migrations/0047_create_opportunities.sql` | Schema + RLS |

## Ver también

- [CRM](crm.md) — Gestión de clientes y leads
- [Cotizador](cotizador.md) — Cotizaciones vinculadas via `quote_id`
- [HubSpot](hubspot.md) — Pipeline de HubSpot (analytics separado)
