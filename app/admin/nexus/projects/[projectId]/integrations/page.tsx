'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Wrench,
  Server,
  Radio,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusProject } from '@/lib/nexus/types'

export default function IntegrationsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<NexusProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nexusApi
      .getProject(projectId)
      .then(setProject)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  const tools = project?.config?.allowedTools || []
  const mcpServers = project?.config?.mcpServers || []
  const builtInTools = tools.filter((t) => !t.startsWith('mcp:'))
  const mcpTools = tools.filter((t) => t.startsWith('mcp:'))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integraciones</h1>
          <p className="text-muted-foreground">
            Tools, MCP servers y canales de comunicación
          </p>
        </div>
      </div>

      <Tabs defaultValue="tools">
        <TabsList>
          <TabsTrigger value="tools" className="gap-2">
            <Wrench className="h-4 w-4" />
            Tools ({tools.length})
          </TabsTrigger>
          <TabsTrigger value="mcp" className="gap-2">
            <Server className="h-4 w-4" />
            MCP ({mcpServers.length})
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <Radio className="h-4 w-4" />
            Canales
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tools Habilitados</CardTitle>
              <CardDescription>
                Herramientas disponibles para los agentes de este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Built-in Tools */}
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Built-in ({builtInTools.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {builtInTools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="font-mono">
                        {tool}
                      </Badge>
                    ))}
                    {builtInTools.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sin tools built-in
                      </p>
                    )}
                  </div>
                </div>

                {/* MCP Tools */}
                {mcpTools.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      MCP ({mcpTools.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {mcpTools.map((tool) => (
                        <Badge key={tool} variant="outline" className="font-mono">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MCP Tab */}
        <TabsContent value="mcp" className="space-y-4">
          {mcpServers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Sin MCP servers configurados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mcpServers.map((server) => {
                const serverTools = mcpTools.filter((t) => {
                  const parts = t.split(':')
                  return parts[1] === server.name
                })
                return (
                  <Card key={server.name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Server className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-base">{server.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Transport: {server.transport} &middot;{' '}
                              {server.command && `Command: ${server.command}`}
                              {server.url && `URL: ${server.url}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Configured
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {server.args && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Args: </span>
                            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                              {server.args.join(' ')}
                            </code>
                          </div>
                        )}
                        {server.env && Object.keys(server.env).length > 0 && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Env vars: </span>
                            {Object.keys(server.env).map((key) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-[10px] mr-1 font-mono"
                              >
                                {key}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Tools ({serverTools.length}):
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {serverTools.map((tool) => (
                              <Badge
                                key={tool}
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {tool.split(':').pop()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'WhatsApp', icon: MessageSquare, configured: false },
              { name: 'Telegram', icon: MessageSquare, configured: false },
              { name: 'Slack', icon: MessageSquare, configured: false },
              { name: 'Chatwoot', icon: MessageSquare, configured: false },
            ].map((channel) => (
              <Card key={channel.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <channel.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {channel.configured ? 'Conectado' : 'No configurado'}
                        </p>
                      </div>
                    </div>
                    {channel.configured ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Configurar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
