'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import { useCreateAgent } from '@/lib/nexus/hooks/use-agents'
import { useProject } from '@/lib/nexus/hooks/use-projects'
import { useIntegrations } from '@/lib/nexus/hooks/use-integrations'
import { ChannelSelector } from '@/components/nexus/channel-selector'
import { AVAILABLE_TOOLS } from '@/lib/nexus/constants'
import { toast } from 'sonner'

export default function NewAgentPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const createAgent = useCreateAgent(projectId)
  const { data: project } = useProject(projectId)
  const { data: integrations } = useIntegrations(projectId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [identityPrompt, setIdentityPrompt] = useState('')
  const [instructionsPrompt, setInstructionsPrompt] = useState('')
  const [safetyPrompt, setSafetyPrompt] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['calculator', 'date-time'])
  const [maxTurns, setMaxTurns] = useState(20)
  const [budgetPerDay, setBudgetPerDay] = useState(5)
  const [limitsOpen, setLimitsOpen] = useState(false)

  function toggleTool(toolId: string) {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolId))
    } else {
      setSelectedTools([...selectedTools, toolId])
    }
  }

  // Get available channels from project integrations
  const availableChannels = integrations
    ? [...new Set(integrations.map((i) => i.provider))]
    : undefined

  // Group tools by category
  type ToolItem = (typeof AVAILABLE_TOOLS)[number]
  const toolsByCategory = AVAILABLE_TOOLS.reduce<Record<string, ToolItem[]>>((acc, tool) => {
    const cat = tool.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tool)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    utility: 'Utilidades',
    integration: 'Integración',
    memory: 'Memoria',
    communication: 'Comunicación',
    data: 'Datos',
    scheduling: 'Programación',
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (!identityPrompt.trim()) {
      toast.error('La identidad del agente es requerida')
      return
    }

    try {
      await createAgent.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        promptConfig: {
          identity: identityPrompt.trim(),
          instructions: instructionsPrompt.trim(),
          safety: safetyPrompt.trim(),
        },
        toolAllowlist: selectedTools,
        channelConfig: selectedChannels.length > 0
          ? { allowedChannels: selectedChannels, defaultChannel: selectedChannels[0] }
          : undefined,
        limits: {
          maxTurns,
          budgetPerDayUsd: budgetPerDay,
        },
      })

      toast.success('Agente creado exitosamente')
      router.push(`/admin/nexus/projects/${projectId}?tab=agentes`)
    } catch (error) {
      console.error('Error creating agent:', error)
      toast.error('Error al crear agente')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}?tab=agentes`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Agente</h1>
          <p className="text-muted-foreground">
            Configurá un nuevo agente para el proyecto
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Agente *</Label>
            <Input
              placeholder="ej. Asistente de Ventas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Rol / Descripción</Label>
            <Textarea
              placeholder="Descripción del agente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canales de Despliegue</CardTitle>
          <CardDescription>
            Seleccioná dónde va a estar disponible este agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChannelSelector
            selectedChannels={selectedChannels}
            onChange={setSelectedChannels}
            availableChannels={availableChannels}
          />
        </CardContent>
      </Card>

      {/* Identity & Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Identidad y Comportamiento</CardTitle>
          <CardDescription>
            Define quién es, qué hace y qué no debe hacer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Identidad (quién es) *</Label>
            <Textarea
              placeholder="Sos un asistente virtual especializado en..."
              value={identityPrompt}
              onChange={(e) => setIdentityPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Instrucciones (qué debe hacer)</Label>
            <Textarea
              placeholder="1. Cuando el usuario pregunte por...\n2. Si solicita..."
              value={instructionsPrompt}
              onChange={(e) => setInstructionsPrompt(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Podés completar las instrucciones más tarde
            </p>
          </div>

          <div className="space-y-2">
            <Label>Seguridad (qué NO debe hacer)</Label>
            <Textarea
              placeholder="Nunca proporciones información confidencial.\nNo compartas datos de otros usuarios."
              value={safetyPrompt}
              onChange={(e) => setSafetyPrompt(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas</CardTitle>
          <CardDescription>
            Herramientas que el agente puede usar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(toolsByCategory).map(([category, tools]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {categoryLabels[category] || category}
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {tools.map((tool) => {
                  const selected = selectedTools.includes(tool.id)
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                      onClick={() => toggleTool(tool.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{tool.label}</span>
                        {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tool.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {project?.config?.mcpServers && project.config.mcpServers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                MCP Servers
              </p>
              <div className="space-y-2">
                {project.config.mcpServers.map((mcp) => (
                  <div
                    key={mcp.name}
                    className="p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {mcp.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {mcp.transport}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las herramientas de este MCP estarán disponibles automáticamente
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Limits (Collapsible) */}
      <Collapsible open={limitsOpen} onOpenChange={setLimitsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Límites</CardTitle>
                  <CardDescription>Turns y presupuesto diario</CardDescription>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    limitsOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>Presupuesto Diario (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={budgetPerDay}
                    onChange={(e) => setBudgetPerDay(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href={`/admin/nexus/projects/${projectId}?tab=agentes`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button
          onClick={() => void handleCreate()}
          disabled={createAgent.isPending || !name.trim() || !identityPrompt.trim()}
        >
          {createAgent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Agente
        </Button>
      </div>
    </div>
  )
}
