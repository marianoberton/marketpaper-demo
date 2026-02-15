// ─── Types ────────────────────────────────────────────────────────

export interface WebSocketConfig {
  url: string
  projectId: string
  agentId: string
  onMessage: (event: NexusEvent) => void
  onError?: (error: Event) => void
  onClose?: () => void
}

export type NexusEvent =
  | { type: 'session.created'; sessionId: string }
  | { type: 'message.content_delta'; text: string; role: 'assistant' | 'user' }
  | { type: 'message.tool_start'; toolCallId: string; tool: string; input: unknown }
  | {
      type: 'message.tool_complete'
      toolCallId: string
      success: boolean
      output: unknown
      durationMs: number
    }
  | { type: 'message.approval_required'; approvalId: string; tool: string; action: unknown }
  | { type: 'message.complete'; messageId: string; usage: Usage; traceId: string }
  | { type: 'session.cost_alert'; currentSpend: number; budget: number; percent: number }
  | { type: 'error'; code: string; message: string }

export interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
}

// ─── WebSocket Client ─────────────────────────────────────────────

export function createNexusWebSocket(config: WebSocketConfig) {
  const ws = new WebSocket(config.url)

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'auth',
        projectId: config.projectId,
        agentId: config.agentId,
      }),
    )
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string) as NexusEvent
      config.onMessage(data)
    } catch {
      // Ignore parse errors
    }
  }

  ws.onerror = config.onError ?? (() => {})
  ws.onclose = config.onClose ?? (() => {})

  return {
    send(content: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message.send', content }))
      }
    },
    createSession(metadata?: Record<string, unknown>) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'session.create', metadata }))
      }
    },
    close() {
      ws.close()
    },
    get readyState() {
      return ws.readyState
    },
  }
}
