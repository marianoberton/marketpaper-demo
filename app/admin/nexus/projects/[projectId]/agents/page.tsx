'use client'

import { useEffect, useState } from 'react'
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
  ArrowLeft,
  Bot,
  MessageSquare,
  Settings,
  Wrench,
  Plug2,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusAgent } from '@/lib/nexus/types'

export default function AgentsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [agents, setAgents] = useState<NexusAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nexusApi
      .listAgents(projectId)
      .then((res) => setAgents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay agentes configurados</p>
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
                  {agent.config?.channelConfig?.channels && (
                    <div className="flex items-center gap-2">
                      <Plug2 className="h-3 w-3" />
                      <span>
                        Canales: {agent.config.channelConfig.channels.join(', ')}
                      </span>
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
          ))}
        </div>
      )}
    </div>
  )
}
