# Nexus AI - Agentes

> [Inicio](../README.md) > [Nexus AI](vision-general.md) > Agentes

## Qué es un agente

Un agente es una instancia de IA dentro de un proyecto con un rol y configuración específicos. Cada agente puede tener su propio modelo, herramientas, canales de comunicación y límites. Los agentes operan dentro del contexto de un [Proyecto](proyectos.md) y heredan su configuración base.

## Estructura

```typescript
interface NexusAgent {
  id: string
  projectId: string
  name: string
  description: string | null
  status: 'active' | 'idle' | 'paused' | 'error'
  config: {
    role?: string                       // Descripción del rol
    model?: string                      // Override del modelo del proyecto
    promptSummary?: {
      identity: string                  // Resumen del prompt de identidad
      instructions: string              // Resumen de instrucciones
      safety: string                    // Resumen de seguridad
    }
    toolAllowlist?: string[]            // Subset de tools permitidos
    mcpServers?: NexusMcpServerConfig[]
    channelConfig?: {
      channels: string[]                // Canales habilitados
    }
    maxTurns?: number                   // Máximo de turnos por sesión
    maxTokensPerTurn?: number           // Tokens por turno
    budgetPerDayUsd?: number            // Presupuesto diario
  }
  createdAt: string
  updatedAt: string
}
```

## Estados

| Estado | Descripción | Badge |
|--------|-------------|-------|
| `active` | Ejecutando una sesión activamente | Verde |
| `idle` | Disponible, esperando interacción | Gris |
| `paused` | Pausado manualmente | Gris secundario |
| `error` | En estado de error | Rojo |

## Configuración vs proyecto

Un agente **hereda** la configuración del proyecto pero puede **override**:

| Config | Proyecto | Agente |
|--------|----------|--------|
| Modelo | Base para todos | Puede usar otro |
| Tools | Lista completa permitida | Subset (allowlist) |
| MCP Servers | Compartidos | Puede agregar propios |
| Presupuesto | Global del proyecto | Límite individual |
| Turnos | Máximo global | Máximo individual |

## Herramientas disponibles (built-in)

Las herramientas se configuran a nivel de proyecto y se restringen por agente:

| Tool ID | Descripción |
|---------|-------------|
| `calculator` | Cálculos matemáticos |
| `date-time` | Fecha y hora actual |
| `notifications` | Enviar notificaciones |
| `catalog-search` | Buscar en catálogo de productos |
| `http-request` | Hacer requests HTTP |
| `propose-scheduled-task` | Proponer tareas programadas |

Además de las built-in, se pueden agregar herramientas de **MCP Servers** (Model Context Protocol).

## Canales

Los agentes pueden estar conectados a diferentes canales de comunicación:

| Canal | Estado | Descripción |
|-------|--------|-------------|
| Chat directo | Implementado | UI de admin en `/admin/nexus/projects/[id]/agents/[id]/chat` |
| WhatsApp | Placeholder | Configuración futura |
| Telegram | Placeholder | Configuración futura |
| Slack | Placeholder | Configuración futura |
| Chatwoot | Placeholder | Configuración futura |

Los canales se gestionan desde la página de integraciones del proyecto (`/admin/nexus/projects/[id]/integrations`), en la tab "Canales".

## Página de agentes

**Ruta:** `/admin/nexus/projects/[projectId]/agents`
**Archivo:** `app/admin/nexus/projects/[projectId]/agents/page.tsx`

Muestra un grid de cards de agentes con:

- Ícono de Bot con status badge
- Nombre y descripción (2 líneas máx)
- Rol del agente
- Modelo configurado
- Cantidad de tools habilitados
- Canales activos
- Botón "Test Chat" para iniciar conversación

## Chat con agente

**Ruta:** `/admin/nexus/projects/[projectId]/agents/[agentId]/chat`
**Archivo:** `app/admin/nexus/projects/[projectId]/agents/[agentId]/chat/page.tsx` (~396 líneas)

### Interfaz

La página de chat ofrece una interfaz completa de conversación:

- **Barra de estadísticas**: estado de conexión (ícono Wifi), turnos, tokens, costo acumulado
- **Historial de mensajes**: burbujas de usuario y asistente
- **Tool calls**: expandibles con input/output JSON y duración
- **Approval cards**: inline cuando el agente solicita aprobación
- **Input**: Enter para enviar, Shift+Enter para nueva línea
- **Acciones**: Limpiar chat, Exportar JSON

### Conexión

1. Intenta conectar via **WebSocket** al Nexus Core
2. Si WebSocket no disponible, usa **REST fallback** (`nexusApi.sendMessage()`)
3. Muestra indicador de estado de conexión en la barra

### Streaming

Los mensajes del agente llegan como stream via WebSocket:

```
message.content_delta → acumula texto token por token
message.tool_start    → muestra card de tool (spinner)
message.tool_complete → actualiza card con resultado
message.approval_required → muestra approval card inline
message.complete      → finaliza mensaje, muestra uso
```

### Componentes de chat

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `ChatMessage` | `components/nexus/chat-message.tsx` | Burbuja de mensaje (user/assistant) |
| `ChatToolCall` | `components/nexus/chat-tool-call.tsx` | Card de ejecución de herramienta |
| `ChatApprovalCard` | `components/nexus/chat-approval-card.tsx` | Card de aprobación inline |

#### ChatMessage

- Avatar con ícono: User (fondo primary) o Bot (fondo muted)
- Burbuja con max-width 80%
- Preserva whitespace para código

#### ChatToolCall

- Ícono Wrench con nombre de tool (monospace)
- Status badge: Running (spinner animado) / Success (verde) / Error (rojo)
- Duración en milisegundos
- Secciones colapsables `<details>` para Input y Output (JSON formateado)

#### ChatApprovalCard

- Borde amarillo (warning)
- Ícono ShieldAlert con "Approval Required"
- Badge con nombre del tool
- Preview JSON de la acción propuesta
- Botones: Aprobar (verde) / Rechazar (rojo)

## Sesiones

```typescript
interface NexusSession {
  id: string
  projectId: string
  agentId: string
  status: 'active' | 'completed' | 'expired'
  metadata: Record<string, unknown>
  startedAt: string
  completedAt: string | null
}
```

Cada conversación crea una sesión. Las estadísticas de sesión (turnos, tokens, costo) se muestran en la barra superior del chat.

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/projects/:projectId/agents` | Listar agentes |
| GET | `/api/v1/projects/:projectId/agents/:agentId` | Obtener agente |
| POST | `/api/v1/projects/:projectId/agents/:agentId/chat` | Enviar mensaje (REST fallback) |

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/admin/nexus/projects/[projectId]/agents/page.tsx` | Lista de agentes |
| `app/admin/nexus/projects/[projectId]/agents/[agentId]/chat/page.tsx` | Chat interactivo |
| `components/nexus/chat-message.tsx` | Componente de mensaje |
| `components/nexus/chat-tool-call.tsx` | Componente de tool call |
| `components/nexus/chat-approval-card.tsx` | Componente de aprobación |
| `lib/nexus/websocket.ts` | Cliente WebSocket |
| `lib/nexus/types.ts` | Tipos de agente, sesión, eventos |

## Ver también

- [Proyectos](proyectos.md) — Configuración heredada
- [Chat y WebSocket](chat-y-websocket.md) — Protocolo de comunicación
- [Prompts](prompts.md) — Prompts del agente
- [Aprobaciones](aprobaciones.md) — Flujo de aprobación en chat
