'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Wrench,
  Server,
  Radio,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  MessageSquare,
  Send,
  Hash,
  Globe,
} from 'lucide-react'
import { useProject, useUpdateProject } from '@/lib/nexus/hooks/use-projects'
import { useIntegrations, useCreateIntegration, useDeleteIntegration } from '@/lib/nexus/hooks/use-integrations'
import { useCreateSecret } from '@/lib/nexus/hooks/use-secrets'
import { McpServerForm } from '@/components/nexus/mcp-server-form'
import { CHANNEL_OPTIONS, CHANNEL_SECRET_KEYS } from '@/lib/nexus/constants'
import type { NexusMcpServerConfig, ChannelIntegration } from '@/lib/nexus/types'
import type { IntegrationProvider } from '@/lib/nexus/constants'
import { toast } from 'sonner'

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  telegram: Send,
  slack: Hash,
  chatwoot: Globe,
}

const PROVIDER_FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  telegram: [
    { key: 'TELEGRAM_BOT_TOKEN', label: 'Bot Token', secret: true },
  ],
  whatsapp: [
    { key: 'WHATSAPP_ACCESS_TOKEN', label: 'Access Token', secret: true },
    { key: 'phoneNumberId', label: 'Phone Number ID' },
  ],
  slack: [
    { key: 'SLACK_BOT_TOKEN', label: 'Bot Token', secret: true },
    { key: 'SLACK_SIGNING_SECRET', label: 'Signing Secret', secret: true },
  ],
  chatwoot: [
    { key: 'baseUrl', label: 'Base URL' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'inboxId', label: 'Inbox ID' },
    { key: 'CHATWOOT_API_TOKEN', label: 'API Token', secret: true },
  ],
}

export default function IntegrationsPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const { data: project, isLoading } = useProject(projectId)
  const { data: integrations, isLoading: integrationsLoading } = useIntegrations(projectId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!project) return null

  const tools = project.config?.allowedTools || []
  const mcpServers = project.config?.mcpServers || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}?tab=integraciones`}>
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
            Canales ({integrations?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <ToolsTab projectId={projectId} tools={tools} />
        </TabsContent>

        {/* MCP Tab */}
        <TabsContent value="mcp" className="space-y-4">
          <McpTab projectId={projectId} project={project} mcpServers={mcpServers} />
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <ChannelsTab
            projectId={projectId}
            integrations={integrations || []}
            loading={integrationsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Tools Tab ────────────────────────────────────────────────────

function ToolsTab({ projectId, tools }: { projectId: string; tools: string[] }) {
  const builtInTools = tools.filter((t) => !t.startsWith('mcp:'))
  const mcpTools = tools.filter((t) => t.startsWith('mcp:'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools Habilitados</CardTitle>
        <CardDescription>
          Herramientas disponibles para los agentes de este proyecto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Built-in ({builtInTools.length})</h3>
          <div className="flex flex-wrap gap-2">
            {builtInTools.map((tool) => (
              <Badge key={tool} variant="secondary" className="font-mono">
                {tool}
              </Badge>
            ))}
            {builtInTools.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin tools built-in</p>
            )}
          </div>
        </div>

        {mcpTools.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">MCP ({mcpTools.length})</h3>
            <div className="flex flex-wrap gap-2">
              {mcpTools.map((tool) => (
                <Badge key={tool} variant="outline" className="font-mono">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── MCP Tab ──────────────────────────────────────────────────────

function McpTab({
  projectId,
  project,
  mcpServers,
}: {
  projectId: string
  project: any
  mcpServers: NexusMcpServerConfig[]
}) {
  const updateProject = useUpdateProject(projectId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMcp, setEditingMcp] = useState<NexusMcpServerConfig | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mcpToDelete, setMcpToDelete] = useState<string | null>(null)

  async function handleSaveMcp(data: NexusMcpServerConfig) {
    const currentServers = project.config?.mcpServers || []

    let updatedServers: NexusMcpServerConfig[]
    if (editingMcp) {
      updatedServers = currentServers.map((s: NexusMcpServerConfig) =>
        s.name === editingMcp.name ? data : s
      )
    } else {
      if (currentServers.some((s: NexusMcpServerConfig) => s.name === data.name)) {
        toast.error('Ya existe un MCP con ese nombre')
        return
      }
      updatedServers = [...currentServers, data]
    }

    try {
      await updateProject.mutateAsync({
        config: {
          ...project.config,
          mcpServers: updatedServers,
        },
      })
      toast.success(editingMcp ? 'MCP server actualizado' : 'MCP server agregado')
      setDialogOpen(false)
      setEditingMcp(null)
    } catch {
      toast.error('Error al guardar MCP server')
    }
  }

  async function handleDeleteMcp() {
    if (!mcpToDelete) return

    const updatedServers = (project.config?.mcpServers || []).filter(
      (s: NexusMcpServerConfig) => s.name !== mcpToDelete
    )

    try {
      await updateProject.mutateAsync({
        config: {
          ...project.config,
          mcpServers: updatedServers,
        },
      })
      toast.success('MCP server eliminado')
      setDeleteDialogOpen(false)
      setMcpToDelete(null)
    } catch {
      toast.error('Error al eliminar MCP server')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          MCP servers configurados en este proyecto
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditingMcp(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Agregar MCP
        </Button>
      </div>

      {mcpServers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Sin MCP servers configurados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mcpServers.map((server) => (
            <Card key={server.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{server.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {server.transport}
                        {server.command && ` · ${server.command}`}
                        {server.url && ` · ${server.url}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingMcp(server)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setMcpToDelete(server.name)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {server.args && server.args.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Args: </span>
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
                        {server.args.join(' ')}
                      </code>
                    </div>
                  )}
                  {server.env && Object.keys(server.env).length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Env: </span>
                      {Object.keys(server.env).map((key) => (
                        <Badge key={key} variant="outline" className="text-[10px] font-mono">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MCP Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMcp ? 'Editar MCP Server' : 'Agregar MCP Server'}
            </DialogTitle>
            <DialogDescription>
              Configurá la conexión al MCP server
            </DialogDescription>
          </DialogHeader>
          <McpServerForm
            initialData={editingMcp || undefined}
            onSave={handleSaveMcp}
            onCancel={() => {
              setDialogOpen(false)
              setEditingMcp(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar MCP server?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{mcpToDelete}&quot; de la configuración del proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteMcp()}
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

// ─── Channels Tab ─────────────────────────────────────────────────

function ChannelsTab({
  projectId,
  integrations,
  loading,
}: {
  projectId: string
  integrations: ChannelIntegration[]
  loading: boolean
}) {
  const createIntegration = useCreateIntegration(projectId)
  const deleteIntegration = useDeleteIntegration(projectId)
  const createSecret = useCreateSecret(projectId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | ''>('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null)

  function openAddDialog() {
    setSelectedProvider('')
    setFieldValues({})
    setDialogOpen(true)
  }

  async function handleSaveChannel() {
    if (!selectedProvider) return
    setSaving(true)

    try {
      const fields = PROVIDER_FIELDS[selectedProvider] || []
      const config: Record<string, unknown> = {}

      // Save secrets and build config
      for (const field of fields) {
        const value = fieldValues[field.key] || ''
        if (!value) continue

        if (field.secret) {
          await createSecret.mutateAsync({
            key: field.key,
            value,
            description: `${selectedProvider} - ${field.label}`,
          })
          config[`${field.key}_secret`] = field.key
        } else {
          config[field.key] = value
        }
      }

      await createIntegration.mutateAsync({
        provider: selectedProvider,
        config,
      })

      toast.success(`Canal ${selectedProvider} conectado`)
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving channel:', error)
      toast.error('Error al conectar canal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteIntegration() {
    if (!integrationToDelete) return
    try {
      await deleteIntegration.mutateAsync(integrationToDelete)
      toast.success('Canal eliminado')
      setDeleteDialogOpen(false)
      setIntegrationToDelete(null)
    } catch {
      toast.error('Error al eliminar canal')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Canales de comunicación conectados
        </p>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="mr-1 h-4 w-4" />
          Conectar Canal
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Radio className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="mb-2">Sin canales conectados</p>
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="mr-1 h-4 w-4" />
            Conectar Primer Canal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = PROVIDER_ICONS[integration.provider] || Globe
            const channelInfo = CHANNEL_OPTIONS.find((c) => c.id === integration.provider)

            return (
              <Card key={integration.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {channelInfo?.label || integration.provider}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {integration.status === 'active' ? 'Conectado' : 'Pausado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={integration.status === 'active' ? 'default' : 'secondary'}
                      >
                        {integration.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setIntegrationToDelete(integration.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Channel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conectar Canal</DialogTitle>
            <DialogDescription>
              Configurá las credenciales para conectar un canal de comunicación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(v) => {
                  setSelectedProvider(v as IntegrationProvider)
                  setFieldValues({})
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar canal..." />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((channel) => {
                    const alreadyConnected = integrations.some(
                      (i) => i.provider === channel.id
                    )
                    return (
                      <SelectItem
                        key={channel.id}
                        value={channel.id}
                        disabled={alreadyConnected}
                      >
                        {channel.label}
                        {alreadyConnected && ' (ya conectado)'}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedProvider && PROVIDER_FIELDS[selectedProvider] && (
              <div className="space-y-3">
                {PROVIDER_FIELDS[selectedProvider].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type={field.secret ? 'password' : 'text'}
                      placeholder={field.secret ? '••••••••' : field.label}
                      value={fieldValues[field.key] || ''}
                      onChange={(e) =>
                        setFieldValues({ ...fieldValues, [field.key]: e.target.value })
                      }
                    />
                    {field.secret && (
                      <p className="text-xs text-muted-foreground">
                        Se guardará encriptado como secret del proyecto
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => void handleSaveChannel()}
                disabled={saving || !selectedProvider}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desconectar canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la integración. Los secrets asociados se mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteIntegration()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
