# Nexus AI - Costos y Uso

> [Inicio](../README.md) > [Nexus AI](vision-general.md) > Costos y Uso

## Tracking de costos

Nexus registra el costo de cada interacción con modelos de IA para mantener control presupuestario.

## Estructura de registros

```typescript
interface NexusUsageRecord {
  date: string          // Fecha (día)
  totalCost: number     // Costo total en USD
  totalTokens: number   // Tokens consumidos
  totalRequests: number // Requests al modelo
}
```

## Presupuesto

Los límites se configuran a nivel de proyecto y opcionalmente por agente:

### Nivel proyecto

```typescript
config.costConfig = {
  dailyBudgetUSD: 10.00,    // Máximo USD por día
  monthlyBudgetUSD: 200.00  // Máximo USD por mes
}
```

### Nivel agente

```typescript
agent.config.budgetPerDayUsd = 5.00  // Override diario
```

## Alertas de costo

Cuando el gasto se acerca al límite, Nexus emite un evento WebSocket:

```json
{
  "type": "session.cost_alert",
  "currentSpend": 8.50,
  "budget": 10.00,
  "percent": 85
}
```

## Trazas de ejecución

Cada sesión genera trazas detalladas:

```typescript
interface NexusExecutionTrace {
  id: string
  projectId: string
  sessionId: string
  agentId: string
  startedAt: string
  completedAt: string | null
  status: 'running' | 'completed' | 'error'
  totalTokens: number
  totalCost: number
  events: NexusTraceEvent[]  // Eventos detallados
}

interface NexusTraceEvent {
  type: string           // Tipo de evento
  timestamp: string      // Timestamp exacto
  data: Record<string, unknown>  // Datos del evento
}
```

## Dashboard de costos

La página `/admin/nexus/projects/[id]/costs` muestra:
- Gráfico de costos diarios (Recharts)
- Total del día y del mes
- Progreso vs presupuesto (barra de progreso)
- Desglose por agente

## Stats globales

El dashboard principal (`/admin/nexus`) incluye:

```typescript
interface NexusDashboardStats {
  totalProjects: number
  activeProjects: number
  totalAgents: number
  activeAgents: number
  activeSessions: number
  costToday: number       // Gasto de hoy
  costMonth: number       // Gasto del mes
  pendingApprovals: number
}
```

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/projects/:id/usage` | Registros de uso |
| GET | `/api/v1/projects/:id/traces` | Trazas de ejecución |
| GET | `/api/v1/stats` | Stats globales del dashboard |

## Ver también

- [Proyectos](proyectos.md) - Configuración de presupuesto
- [Agentes](agentes.md) - Presupuesto por agente
- [Chat y WebSocket](chat-y-websocket.md) - Evento cost_alert
