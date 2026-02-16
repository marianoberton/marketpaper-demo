# Nexus AI - Chat y WebSocket

> [Inicio](../README.md) > [Nexus AI](vision-general.md) > Chat y WebSocket

## Comunicación en tiempo real

El chat con agentes de Nexus usa WebSocket para streaming de respuestas en tiempo real. Existe un fallback REST para entornos sin WebSocket.

## WebSocket

### Conexión

```typescript
import { createNexusWebSocket } from '@/lib/nexus/websocket'

const ws = createNexusWebSocket({
  url: 'ws://localhost:3002/ws',
  projectId: 'project-uuid',
  agentId: 'agent-uuid',
  onMessage: (event) => {
    // Manejar evento
  },
  onError: (error) => console.error(error),
  onClose: () => console.log('Desconectado'),
})
```

### Handshake

Al conectar, el cliente envía un mensaje de autenticación:

```json
{
  "type": "auth",
  "projectId": "project-uuid",
  "agentId": "agent-uuid"
}
```

### Enviar mensaje

```typescript
ws.send('Hola, necesito ayuda con...')
```

### Crear sesión

```typescript
ws.createSession({ metadata: { source: 'admin-ui' } })
```

## Eventos del servidor

| Evento | Descripción |
|--------|-------------|
| `session.created` | Sesión creada. Incluye `sessionId` |
| `message.content_delta` | Fragmento de texto de la respuesta (streaming) |
| `message.tool_start` | El agente inicia una tool call |
| `message.tool_complete` | Tool call completada (éxito/fallo, duración) |
| `message.approval_required` | El agente solicita aprobación humana |
| `message.complete` | Respuesta completa. Incluye usage y traceId |
| `session.cost_alert` | Alerta de costo (% del presupuesto alcanzado) |
| `error` | Error del servidor |

### Tipos TypeScript

```typescript
type NexusEvent =
  | { type: 'session.created'; sessionId: string }
  | { type: 'message.content_delta'; text: string; role: 'assistant' | 'user' }
  | { type: 'message.tool_start'; toolCallId: string; tool: string; input: unknown }
  | { type: 'message.tool_complete'; toolCallId: string; success: boolean; output: unknown; durationMs: number }
  | { type: 'message.approval_required'; approvalId: string; tool: string; action: unknown }
  | { type: 'message.complete'; messageId: string; usage: Usage; traceId: string }
  | { type: 'session.cost_alert'; currentSpend: number; budget: number; percent: number }
  | { type: 'error'; code: string; message: string }
```

### Usage (en message.complete)

```typescript
interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
}
```

## Fallback REST

Para enviar mensajes sin WebSocket:

```typescript
import { nexusApi } from '@/lib/nexus/api'

const { sessionId, response } = await nexusApi.sendMessage(
  projectId,
  agentId,
  'Hola, necesito ayuda'
)
```

## Componentes de UI

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| Chat Message | `components/nexus/chat-message.tsx` | Renderizar mensajes (user/assistant) |
| Tool Call | `components/nexus/chat-tool-call.tsx` | Mostrar tool calls con estado |
| Approval Card | `components/nexus/chat-approval-card.tsx` | Card para aprobar/rechazar inline |

## Métricas en toolbar

La UI del chat muestra en tiempo real:
- Turns consumidos
- Tokens usados (prompt + completion)
- Costo acumulado de la sesión

## Archivos clave

- `lib/nexus/websocket.ts` - Cliente WebSocket
- `lib/nexus/api.ts` - Fallback REST (`sendMessage`)
- `app/admin/nexus/projects/[projectId]/agents/[agentId]/chat/page.tsx` - Página de chat

## Ver también

- [Agentes](agentes.md) - Configuración de agentes
- [Aprobaciones](aprobaciones.md) - Evento approval_required
- [Costos y Uso](costos-y-uso.md) - Evento cost_alert
