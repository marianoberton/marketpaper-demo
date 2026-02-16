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
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useCreateAgent } from '@/lib/nexus/hooks/use-agents'
import { toast } from 'sonner'

// ─── Available Tools ──────────────────────────────────────────────

const AVAILABLE_TOOLS = [
  { id: 'calculator', label: 'Calculator', description: 'Operaciones matemáticas' },
  { id: 'date-time', label: 'Date/Time', description: 'Fecha y hora actual' },
  { id: 'send-notification', label: 'Notificaciones', description: 'Enviar notificaciones' },
  { id: 'catalog-search', label: 'Catálogo', description: 'Buscar en catálogo de productos' },
  { id: 'http-request', label: 'HTTP Request', description: 'Llamadas HTTP externas' },
  { id: 'propose-scheduled-task', label: 'Proponer Tarea', description: 'Proponer tareas programadas' },
]

// ─── Component ────────────────────────────────────────────────────

export default function NewAgentPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const createAgent = useCreateAgent(projectId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [identityPrompt, setIdentityPrompt] = useState('')
  const [instructionsPrompt, setInstructionsPrompt] = useState('')
  const [safetyPrompt, setSafetyPrompt] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['calculator', 'date-time'])
  const [maxTurns, setMaxTurns] = useState(20)
  const [budgetPerDay, setBudgetPerDay] = useState(5)

  function toggleTool(toolId: string) {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolId))
    } else {
      setSelectedTools([...selectedTools, toolId])
    }
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
      const agent = await createAgent.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        promptConfig: {
          identity: identityPrompt.trim(),
          instructions: instructionsPrompt.trim(),
          safety: safetyPrompt.trim(),
        },
        toolAllowlist: selectedTools,
        limits: {
          maxTurns,
          budgetPerDayUsd: budgetPerDay,
        },
      })

      toast.success('Agente creado exitosamente')
      router.push(`/admin/nexus/projects/${projectId}/agents`)
    } catch (error) {
      console.error('Error creating agent:', error)
      toast.error('Error al crear agente')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}/agents`}>
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
          <CardDescription>Nombre y descripción del agente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Agente *</Label>
            <Input
              id="name"
              placeholder="ej. Asistente de Ventas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción del agente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prompt Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Prompts</CardTitle>
          <CardDescription>Define la identidad, instrucciones y límites de seguridad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identity">Identidad (quién es) *</Label>
            <Textarea
              id="identity"
              placeholder="Sos un asistente virtual especializado en..."
              value={identityPrompt}
              onChange={(e) => setIdentityPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instrucciones (qué debe hacer)</Label>
            <Textarea
              id="instructions"
              placeholder="1. Cuando el usuario pregunte por...\n2. Si solicita..."
              value={instructionsPrompt}
              onChange={(e) => setInstructionsPrompt(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="safety">Seguridad (qué NO debe hacer)</Label>
            <Textarea
              id="safety"
              placeholder="Nunca proporciones información confidencial.\nNo compartas datos de otros usuarios."
              value={safetyPrompt}
              onChange={(e) => setSafetyPrompt(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas Disponibles</CardTitle>
          <CardDescription>Seleccioná las herramientas que el agente puede usar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {AVAILABLE_TOOLS.map((tool) => {
              const selected = selectedTools.includes(tool.id)
              return (
                <button
                  key={tool.id}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => toggleTool(tool.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium font-mono text-sm">{tool.id}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tool.description}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Límites</CardTitle>
          <CardDescription>Configurá los límites de uso y costo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxTurns">Max Turns por Sesión</Label>
              <Input
                id="maxTurns"
                type="number"
                min={1}
                max={100}
                value={maxTurns}
                onChange={(e) => setMaxTurns(parseInt(e.target.value) || 20)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto Diario (USD)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                step={0.5}
                value={budgetPerDay}
                onChange={(e) => setBudgetPerDay(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Link href={`/admin/nexus/projects/${projectId}/agents`}>
          <Button variant="outline">Cancelar</Button>
        </Link>

        <Button
          onClick={handleCreate}
          disabled={createAgent.isPending || !name.trim() || !identityPrompt.trim()}
        >
          {createAgent.isPending ? 'Creando...' : 'Crear Agente'}
          <CheckCircle2 className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
