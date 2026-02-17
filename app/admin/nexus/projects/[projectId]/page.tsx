'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  FileText,
  Plug,
  DollarSign,
  CalendarClock,
  Settings,
  Play,
  Pause,
  Activity,
  Brain,
  Users,
  FileCode,
  ShoppingBag,
  FileIcon,
  Webhook,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useProject, useUpdateProject, usePauseProject, useResumeProject, useDeleteProject } from '@/lib/nexus/hooks/use-projects'
import { useAgents, useDeleteAgent, usePauseAgent, useResumeAgent } from '@/lib/nexus/hooks/use-agents'
import { PROVIDERS, MODELS, DEFAULT_API_KEY_ENV } from '@/lib/nexus/constants'
import type { NexusAgent, NexusProject } from '@/lib/nexus/types'
import { toast } from 'sonner'

export default function ProjectDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const defaultTab = searchParams.get('tab') || 'agentes'

  const { data: project, isLoading } = useProject(projectId)
  const { data: agents, isLoading: agentsLoading } = useAgents(projectId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Proyecto no encontrado</p>
        <Link href="/admin/nexus/projects">
          <Button variant="link">Volver a proyectos</Button>
        </Link>
      </div>
    )
  }

  const agentList = agents || []
  const activeAgents = agentList.filter((a) => a.status === 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/nexus/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge
                variant={
                  project.status === 'active'
                    ? 'default'
                    : project.status === 'paused'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <ProjectActions projectId={projectId} status={project.status} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="text-lg font-bold">{project.config?.provider?.provider}</p>
                <p className="text-xs text-muted-foreground">{project.config?.provider?.model}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agentes</p>
                <p className="text-2xl font-bold">{agentList.length}</p>
                <p className="text-xs text-muted-foreground">{activeAgents.length} activos</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tools</p>
                <p className="text-2xl font-bold">{project.config?.allowedTools?.length || 0}</p>
                <p className="text-xs text-muted-foreground">habilitadas</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Plug className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">
                  ${project.config?.costConfig?.dailyBudgetUSD || '∞'}
                </p>
                <p className="text-xs text-muted-foreground">USD / día</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue={defaultTab}
        onValueChange={(value) => {
          const url = new URL(window.location.href)
          url.searchParams.set('tab', value)
          window.history.replaceState({}, '', url.toString())
        }}
      >
        <TabsList>
          <TabsTrigger value="agentes">Agentes</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
          <TabsTrigger value="monitoreo">Monitoreo</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="agentes">
          <AgentsTab projectId={projectId} agents={agentList} loading={agentsLoading} />
        </TabsContent>

        <TabsContent value="recursos">
          <ResourcesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="integraciones">
          <IntegrationsTab projectId={projectId} project={project} />
        </TabsContent>

        <TabsContent value="monitoreo">
          <MonitoringTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="config">
          <ConfigTab projectId={projectId} project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Project Actions ──────────────────────────────────────────────

function ProjectActions({ projectId, status }: { projectId: string; status: string }) {
  const pauseProject = usePauseProject()
  const resumeProject = useResumeProject()
  const deleteProject = useDeleteProject()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handlePause() {
    try {
      await pauseProject.mutateAsync(projectId)
      toast.success('Proyecto pausado')
    } catch {
      toast.error('Error al pausar proyecto')
    }
  }

  async function handleResume() {
    try {
      await resumeProject.mutateAsync(projectId)
      toast.success('Proyecto reanudado')
    } catch {
      toast.error('Error al reanudar proyecto')
    }
  }

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(projectId)
      toast.success('Proyecto eliminado')
      router.push('/admin/nexus/projects')
    } catch {
      toast.error('Error al eliminar proyecto')
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === 'active' ? (
          <Button variant="outline" size="sm" onClick={() => void handlePause()}>
            <Pause className="mr-1 h-4 w-4" />
            Pausar
          </Button>
        ) : status === 'paused' ? (
          <Button variant="outline" size="sm" onClick={() => void handleResume()}>
            <Play className="mr-1 h-4 w-4" />
            Reanudar
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Eliminar
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los agentes, sesiones y datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Tab: Agentes ─────────────────────────────────────────────────

function AgentsTab({
  projectId,
  agents,
  loading,
}: {
  projectId: string
  agents: NexusAgent[]
  loading: boolean
}) {
  const deleteAgent = useDeleteAgent(projectId)
  const pauseAgent = usePauseAgent(projectId)
  const resumeAgent = useResumeAgent(projectId)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)

  async function handleDelete() {
    if (!agentToDelete) return
    try {
      await deleteAgent.mutateAsync(agentToDelete)
      toast.success('Agente eliminado')
      setDeleteDialogOpen(false)
      setAgentToDelete(null)
    } catch {
      toast.error('Error al eliminar agente')
    }
  }

  async function handlePause(agentId: string) {
    try {
      await pauseAgent.mutateAsync(agentId)
      toast.success('Agente pausado')
    } catch {
      toast.error('Error al pausar agente')
    }
  }

  async function handleResume(agentId: string) {
    try {
      await resumeAgent.mutateAsync(agentId)
      toast.success('Agente reanudado')
    } catch {
      toast.error('Error al reanudar agente')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Agentes configurados en este proyecto
        </p>
        <Link href={`/admin/nexus/projects/${projectId}/agents/new`}>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nuevo Agente
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="mb-2">No hay agentes configurados</p>
          <Link href={`/admin/nexus/projects/${projectId}/agents/new`}>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Crear Primer Agente
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-all duration-200">
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
                          <DropdownMenuItem onClick={() => void handlePause(agent.id)}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => void handleResume(agent.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Reanudar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setAgentToDelete(agent.id)
                            setDeleteDialogOpen(true)
                          }}
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
              <CardContent className="space-y-3">
                {agent.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description}
                  </p>
                )}

                <div className="space-y-1 text-xs text-muted-foreground">
                  {agent.config?.model && (
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3" />
                      <span>{agent.config.model}</span>
                    </div>
                  )}
                  {agent.config?.channelConfig?.channels && agent.config.channelConfig.channels.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Plug className="h-3 w-3" />
                      <span>{agent.config.channelConfig.channels.join(', ')}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/nexus/projects/${projectId}/agents/${agent.id}/chat`}
                  className="block"
                >
                  <Button className="w-full" size="sm">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Test Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el agente y todas sus sesiones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Tab: Recursos ────────────────────────────────────────────────

function ResourcesTab({ projectId }: { projectId: string }) {
  const resources = [
    {
      href: `/admin/nexus/projects/${projectId}/memory`,
      icon: Brain,
      label: 'Memoria',
      description: 'Base de conocimiento vectorial',
    },
    {
      href: `/admin/nexus/projects/${projectId}/catalog`,
      icon: ShoppingBag,
      label: 'Catálogo',
      description: 'Productos con búsqueda semántica',
    },
    {
      href: `/admin/nexus/projects/${projectId}/contacts`,
      icon: Users,
      label: 'Contactos',
      description: 'Contactos multi-canal',
    },
    {
      href: `/admin/nexus/projects/${projectId}/templates`,
      icon: FileCode,
      label: 'Plantillas',
      description: 'Templates con variables',
    },
    {
      href: `/admin/nexus/projects/${projectId}/files`,
      icon: FileIcon,
      label: 'Archivos',
      description: 'Archivos del proyecto',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {resources.map((item) => (
        <Link key={item.href} href={item.href} className="block group">
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// ─── Tab: Integraciones ───────────────────────────────────────────

function IntegrationsTab({ projectId, project }: { projectId: string; project: NexusProject }) {
  const integrationItems = [
    {
      href: `/admin/nexus/projects/${projectId}/integrations`,
      icon: Plug,
      label: 'Integraciones',
      description: 'MCP servers, canales y tools',
    },
    {
      href: `/admin/nexus/projects/${projectId}/prompts`,
      icon: FileText,
      label: 'Prompts',
      description: 'Capas de identidad, instrucciones y seguridad',
    },
    {
      href: `/admin/nexus/projects/${projectId}/webhooks`,
      icon: Webhook,
      label: 'Webhooks',
      description: 'Endpoints para integraciones externas',
    },
  ]

  return (
    <div className="space-y-4">
      {project.config?.mcpServers && project.config.mcpServers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">MCP Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.config.mcpServers.map((mcp) => (
                <Badge key={mcp.name} variant="secondary" className="font-mono text-xs">
                  {mcp.name} ({mcp.transport})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {project.config?.allowedTools && project.config.allowedTools.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tools Habilitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.config.allowedTools.map((tool: string) => (
                <Badge key={tool} variant="outline" className="font-mono text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {integrationItems.map((item) => (
          <Link key={item.href} href={item.href} className="block group">
            <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Monitoreo ───────────────────────────────────────────────

function MonitoringTab({ projectId }: { projectId: string }) {
  const monitoring = [
    {
      href: `/admin/nexus/projects/${projectId}/sessions`,
      icon: MessageSquare,
      label: 'Sesiones',
      description: 'Conversaciones activas e historial',
    },
    {
      href: `/admin/nexus/projects/${projectId}/traces`,
      icon: Activity,
      label: 'Traces',
      description: 'Historial de ejecuciones',
    },
    {
      href: `/admin/nexus/projects/${projectId}/costs`,
      icon: DollarSign,
      label: 'Costos',
      description: 'Uso y costos de API',
    },
    {
      href: `/admin/nexus/projects/${projectId}/tasks`,
      icon: CalendarClock,
      label: 'Tareas Programadas',
      description: 'Cron jobs y tareas recurrentes',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {monitoring.map((item) => (
        <Link key={item.href} href={item.href} className="block group">
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// ─── Tab: Config ──────────────────────────────────────────────────

function ConfigTab({ projectId, project }: { projectId: string; project: NexusProject }) {
  const updateProject = useUpdateProject(projectId)

  const [provider, setProvider] = useState(project.config?.provider?.provider || 'anthropic')
  const [model, setModel] = useState(project.config?.provider?.model || '')
  const [temperature, setTemperature] = useState(project.config?.provider?.temperature ?? 0.7)
  const [dailyBudget, setDailyBudget] = useState(project.config?.costConfig?.dailyBudgetUSD ?? 10)
  const [monthlyBudget, setMonthlyBudget] = useState(project.config?.costConfig?.monthlyBudgetUSD ?? 200)
  const [maxTurns, setMaxTurns] = useState(project.config?.maxTurnsPerSession ?? 20)
  const [maxSessions, setMaxSessions] = useState(project.config?.maxConcurrentSessions ?? 3)

  async function handleSave() {
    try {
      await updateProject.mutateAsync({
        config: {
          ...project.config,
          provider: {
            ...project.config?.provider,
            provider,
            model,
            apiKeyEnvVar: DEFAULT_API_KEY_ENV[provider] || project.config?.provider?.apiKeyEnvVar,
            temperature,
          },
          costConfig: {
            dailyBudgetUSD: dailyBudget,
            monthlyBudgetUSD: monthlyBudget,
          },
          maxTurnsPerSession: maxTurns,
          maxConcurrentSessions: maxSessions,
        },
      })
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar configuración')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Modelo IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => {
                  setProvider(v)
                  setModel(MODELS[v]?.[0]?.value || '')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODELS[provider] || []).map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Temperature ({temperature})</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Preciso</span>
                <span>Creativo</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Límites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Presupuesto Diario (USD)</Label>
              <Input
                type="number"
                min={0}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Presupuesto Mensual (USD)</Label>
              <Input
                type="number"
                min={0}
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Turns por Sesión</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={maxTurns}
                onChange={(e) => setMaxTurns(parseInt(e.target.value) || 20)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Sesiones Concurrentes</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxSessions}
                onChange={(e) => setMaxSessions(parseInt(e.target.value) || 3)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void handleSave()} disabled={updateProject.isPending}>
        {updateProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar Configuración
      </Button>
    </div>
  )
}
