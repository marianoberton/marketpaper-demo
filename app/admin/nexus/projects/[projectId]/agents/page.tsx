'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Settings,
  Wrench,
  Plug2,
  MoreVertical,
  Pencil,
  Trash2,
  Pause,
  Play,
  Plus,
  Send,
  Hash,
  Globe,
} from 'lucide-react'
import { useAgents, useDeleteAgent, usePauseAgent, useResumeAgent } from '@/lib/nexus/hooks/use-agents'
import type { NexusAgent } from '@/lib/nexus/types'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AgentsPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: agents, isLoading } = useAgents(projectId)
  const deleteAgent = useDeleteAgent(projectId)
  const pauseAgent = usePauseAgent(projectId)
  const resumeAgent = useResumeAgent(projectId)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)

  async function handleDelete() {
    if (!agentToDelete) return

    try {
      await deleteAgent.mutateAsync(agentToDelete)
      toast.success('Agente eliminado exitosamente')
      setDeleteDialogOpen(false)
      setAgentToDelete(null)
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast.error('Error al eliminar agente')
    }
  }

  async function handlePause(agentId: string) {
    try {
      await pauseAgent.mutateAsync(agentId)
      toast.success('Agente pausado')
    } catch (error) {
      console.error('Error pausing agent:', error)
      toast.error('Error al pausar agente')
    }
  }

  async function handleResume(agentId: string) {
    try {
      await resumeAgent.mutateAsync(agentId)
      toast.success('Agente reanudado')
    } catch (error) {
      console.error('Error resuming agent:', error)
      toast.error('Error al reanudar agente')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/nexus/projects/${projectId}?tab=agentes`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agentes</h1>
            <p className="text-muted-foreground">
              Agentes configurados en el proyecto
            </p>
          </div>
        </div>

        <Link href={`/admin/nexus/projects/${projectId}/agents/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Agente
          </Button>
        </Link>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !agents || agents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No hay agentes configurados</p>
          <Link href={`/admin/nexus/projects/${projectId}/agents/new`}>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Agente
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              projectId={projectId}
              onDelete={(id) => {
                setAgentToDelete(id)
                setDeleteDialogOpen(true)
              }}
              onPause={handlePause}
              onResume={handleResume}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el agente y todas sus sesiones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Agente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Agent Card Component ─────────────────────────────────────────

interface AgentCardProps {
  agent: NexusAgent
  projectId: string
  onDelete: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}

function AgentCard({ agent, projectId, onDelete, onPause, onResume }: AgentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {agent.config?.role || 'agent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                agent.status === 'active'
                  ? 'default'
                  : agent.status === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {agent.status}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/nexus/projects/${projectId}/agents/${agent.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>

                {agent.status === 'active' ? (
                  <DropdownMenuItem onClick={() => onPause(agent.id)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onResume(agent.id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Reanudar
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onDelete(agent.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {agent.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
        )}

        <div className="space-y-2 text-xs text-muted-foreground">
          {agent.config?.model && (
            <div className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              <span>Modelo: {agent.config.model}</span>
            </div>
          )}
          {agent.config?.toolAllowlist && (
            <div className="flex items-center gap-2">
              <Wrench className="h-3 w-3" />
              <span>{agent.config.toolAllowlist.length} tools</span>
            </div>
          )}
          {agent.config?.channelConfig?.channels && agent.config.channelConfig.channels.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Plug2 className="h-3 w-3" />
              {agent.config.channelConfig.channels.map((ch: string) => {
                const icons: Record<string, React.ElementType> = { whatsapp: MessageSquare, telegram: Send, slack: Hash, chatwoot: Globe }
                const Icon = icons[ch] || Plug2
                return (
                  <Badge key={ch} variant="outline" className="text-[10px] gap-1 py-0 px-1.5">
                    <Icon className="h-2.5 w-2.5" />
                    {ch}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        {agent.config?.promptSummary && (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {agent.config.promptSummary.identity}
            </Badge>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link
            href={`/admin/nexus/projects/${projectId}/agents/${agent.id}/chat`}
            className="flex-1"
          >
            <Button className="w-full" size="sm">
              <MessageSquare className="mr-1 h-3 w-3" />
              Test Chat
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
