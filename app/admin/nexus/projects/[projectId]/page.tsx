'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusProject, NexusAgent } from '@/lib/nexus/types'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<NexusProject | null>(null)
  const [agents, setAgents] = useState<NexusAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [proj, agentsRes] = await Promise.all([
          nexusApi.getProject(projectId),
          nexusApi.listAgents(projectId),
        ])
        setProject(proj)
        setAgents(agentsRes.data)
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [projectId])

  if (loading) {
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

  const navItems = [
    {
      href: `/admin/nexus/projects/${projectId}/agents`,
      icon: Bot,
      label: 'Agentes',
      description: `${agents.length} configurados`,
    },
    {
      href: `/admin/nexus/projects/${projectId}/prompts`,
      icon: FileText,
      label: 'Prompts',
      description: '3 capas (identidad, instrucciones, seguridad)',
    },
    {
      href: `/admin/nexus/projects/${projectId}/integrations`,
      icon: Plug,
      label: 'Integraciones',
      description: `${project.config?.mcpServers?.length || 0} MCP, ${project.config?.allowedTools?.length || 0} tools`,
    },
    {
      href: `/admin/nexus/projects/${projectId}/costs`,
      icon: DollarSign,
      label: 'Costos',
      description: project.config?.costConfig
        ? `$${project.config.costConfig.dailyBudgetUSD}/día`
        : 'Sin límite',
    },
    {
      href: `/admin/nexus/projects/${projectId}/tasks`,
      icon: CalendarClock,
      label: 'Tareas Programadas',
      description: 'Cron jobs y tareas recurrentes',
    },
    {
      href: `/admin/nexus/projects/${projectId}/traces`,
      icon: Activity,
      label: 'Traces',
      description: 'Historial de ejecuciones',
    },
    {
      href: `/admin/nexus/projects/${projectId}/sessions`,
      icon: MessageSquare,
      label: 'Sesiones',
      description: 'Conversaciones activas',
    },
    {
      href: `/admin/nexus/projects/${projectId}/memory`,
      icon: Brain,
      label: 'Memoria',
      description: 'Base de conocimiento vectorial',
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
      href: `/admin/nexus/projects/${projectId}/catalog`,
      icon: ShoppingBag,
      label: 'Catálogo',
      description: 'Productos con búsqueda semántica',
    },
    {
      href: `/admin/nexus/projects/${projectId}/files`,
      icon: FileIcon,
      label: 'Archivos',
      description: 'Archivos del proyecto',
    },
    {
      href: `/admin/nexus/projects/${projectId}/webhooks`,
      icon: Webhook,
      label: 'Webhooks',
      description: 'Endpoints para integraciones',
    },
  ]

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
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Provider
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{project.config?.provider?.provider}</div>
            <p className="text-xs text-muted-foreground">
              {project.config?.provider?.model}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agentes
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter((a) => a.status === 'active').length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tools
            </CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.config?.allowedTools?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">herramientas habilitadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${project.config?.costConfig?.dailyBudgetUSD || '∞'}
            </div>
            <p className="text-xs text-muted-foreground">USD / día</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Agentes</CardTitle>
            <CardDescription>Agentes configurados en este proyecto</CardDescription>
          </div>
          <Link href={`/admin/nexus/projects/${projectId}/agents`}>
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay agentes configurados
            </p>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.config?.role || 'agent'} &middot;{' '}
                        {agent.config?.model || project.config?.provider?.model}
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
                    <Link
                      href={`/admin/nexus/projects/${projectId}/agents/${agent.id}/chat`}
                    >
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block group">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
