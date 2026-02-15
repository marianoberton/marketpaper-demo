'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChatMessage } from '@/components/nexus/chat-message'
import { ChatToolCall } from '@/components/nexus/chat-tool-call'
import { ChatApprovalCard } from '@/components/nexus/chat-approval-card'
import {
  ArrowLeft,
  Send,
  Trash2,
  Download,
  TerminalSquare,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { createNexusWebSocket } from '@/lib/nexus/websocket'
import type { NexusEvent } from '@/lib/nexus/websocket'
import { nexusApi } from '@/lib/nexus/api'
import { toast } from 'sonner'

type MessageItem =
  | { type: 'text'; id: string; role: 'user' | 'assistant'; content: string }
  | {
      type: 'tool'
      id: string
      tool: string
      input: unknown
      output?: unknown
      status: 'running' | 'success' | 'error'
      durationMs?: number
    }
  | { type: 'approval'; id: string; tool: string; action: unknown }

export default function ChatPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const agentId = params.agentId as string

  const [messages, setMessages] = useState<MessageItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [sessionStats, setSessionStats] = useState({ turns: 0, cost: 0, tokens: 0 })
  const [sending, setSending] = useState(false)

  const wsRef = useRef<ReturnType<typeof createNexusWebSocket> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // WebSocket connection
  useEffect(() => {
    const wsUrl =
      (process.env.NEXT_PUBLIC_NEXUS_API_URL || 'http://localhost:3002').replace(
        'http',
        'ws',
      ) + '/ws'

    try {
      wsRef.current = createNexusWebSocket({
        url: wsUrl,
        projectId,
        agentId,
        onMessage: handleWsMessage,
        onError: () => setIsConnected(false),
        onClose: () => setIsConnected(false),
      })
      setIsConnected(true)
    } catch {
      setIsConnected(false)
    }

    return () => {
      wsRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, agentId])

  function handleWsMessage(event: NexusEvent) {
    switch (event.type) {
      case 'message.content_delta':
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.type === 'text' && last.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + event.text },
            ]
          }
          return [
            ...prev,
            {
              type: 'text',
              id: crypto.randomUUID(),
              role: 'assistant',
              content: event.text,
            },
          ]
        })
        setSending(false)
        break

      case 'message.tool_start':
        setMessages((prev) => [
          ...prev,
          {
            type: 'tool',
            id: event.toolCallId,
            tool: event.tool,
            input: event.input,
            status: 'running',
          },
        ])
        break

      case 'message.tool_complete':
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.type === 'tool' && msg.id === event.toolCallId) {
              return {
                ...msg,
                status: event.success ? 'success' : 'error',
                output: event.output,
                durationMs: event.durationMs,
              }
            }
            return msg
          }),
        )
        break

      case 'message.approval_required':
        setMessages((prev) => [
          ...prev,
          {
            type: 'approval',
            id: event.approvalId,
            tool: event.tool,
            action: event.action,
          },
        ])
        break

      case 'message.complete':
        setSessionStats((prev) => ({
          turns: prev.turns + 1,
          cost: prev.cost + event.usage.cost,
          tokens: prev.tokens + event.usage.totalTokens,
        }))
        setSending(false)
        break

      case 'error':
        toast.error(event.message)
        setSending(false)
        break
    }
  }

  async function handleSend() {
    if (!inputValue.trim()) return

    const content = inputValue
    setInputValue('')
    setSending(true)

    // Add user message
    setMessages((prev) => [
      ...prev,
      { type: 'text', id: crypto.randomUUID(), role: 'user', content },
    ])

    // Send via WebSocket or REST fallback
    if (wsRef.current && isConnected) {
      wsRef.current.send(content)
    } else {
      try {
        const res = await nexusApi.sendMessage(projectId, agentId, content)
        setMessages((prev) => [
          ...prev,
          {
            type: 'text',
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.response,
          },
        ])
      } catch (err) {
        // Simulate response if backend not available
        setMessages((prev) => [
          ...prev,
          {
            type: 'text',
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Nexus Core no está conectado. Verificá que el servidor esté corriendo.',
          },
        ])
      } finally {
        setSending(false)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}/agents`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Test Chat</h1>
          <p className="text-sm text-muted-foreground">
            Agente: {agentId.slice(0, 12)}...
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[calc(100vh-14rem)] border rounded-lg bg-background overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/20">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <div>
              Turns: <span className="text-foreground">{sessionStats.turns}</span>
            </div>
            <div>
              Tokens: <span className="text-foreground">{sessionStats.tokens}</span>
            </div>
            <div>
              Cost:{' '}
              <span className="text-foreground font-medium">
                ${sessionStats.cost.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Limpiar chat"
              onClick={() => {
                setMessages([])
                setSessionStats({ turns: 0, cost: 0, tokens: 0 })
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Exportar"
              onClick={() => {
                const blob = new Blob([JSON.stringify(messages, null, 2)], {
                  type: 'application/json',
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `chat-${agentId}-${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          ref={scrollRef}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
              <TerminalSquare className="h-12 w-12 mb-4" />
              <p>Iniciá una conversación con el agente</p>
              <p className="text-xs mt-1">
                Shift+Enter para nueva línea, Enter para enviar
              </p>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.type === 'text') {
              return (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              )
            }
            if (msg.type === 'tool') {
              return (
                <div key={msg.id} className="pl-12">
                  <ChatToolCall
                    tool={msg.tool}
                    input={msg.input}
                    output={msg.output}
                    status={msg.status}
                    durationMs={msg.durationMs}
                  />
                </div>
              )
            }
            if (msg.type === 'approval') {
              return (
                <div key={msg.id} className="pl-12">
                  <ChatApprovalCard
                    approvalId={msg.id}
                    tool={msg.tool}
                    action={msg.action}
                    onApprove={(id) => {
                      nexusApi
                        .approveAction(id)
                        .then(() => toast.success('Aprobado'))
                        .catch(() => toast.error('Error'))
                    }}
                    onDeny={(id) => {
                      nexusApi
                        .denyAction(id)
                        .then(() => toast.success('Rechazado'))
                        .catch(() => toast.error('Error'))
                    }}
                  />
                </div>
              )
            }
            return null
          })}

          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <TerminalSquare className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              placeholder="Escribí un mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
              disabled={sending}
            />
            <Button onClick={() => void handleSend()} disabled={!inputValue.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
