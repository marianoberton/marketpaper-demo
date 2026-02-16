'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Folder,
  Bot,
  Plug,
  DollarSign,
  Eye,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import { toast } from 'sonner'

// ─── Wizard Steps ─────────────────────────────────────────────────

const STEPS = [
  { key: 'basics', label: 'Datos Básicos', icon: Folder },
  { key: 'identity', label: 'Identidad', icon: Bot },
  { key: 'tools', label: 'Integraciones', icon: Plug },
  { key: 'limits', label: 'Límites', icon: DollarSign },
  { key: 'review', label: 'Revisar', icon: Eye },
] as const

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
]

const MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
}

const AVAILABLE_TOOLS = [
  { id: 'calculator', label: 'Calculator', description: 'Operaciones matemáticas' },
  { id: 'date-time', label: 'Date/Time', description: 'Fecha y hora actual' },
  { id: 'send-notification', label: 'Notificaciones', description: 'Enviar notificaciones' },
  { id: 'catalog-search', label: 'Catálogo', description: 'Buscar en catálogo de productos' },
  { id: 'http-request', label: 'HTTP Request', description: 'Llamadas HTTP externas' },
  { id: 'propose-scheduled-task', label: 'Proponer Tarea', description: 'Proponer tareas programadas' },
]

const TEMPLATES = [
  { value: 'custom', label: 'Custom', description: 'Configuración personalizada' },
  { value: 'sales', label: 'Ventas', description: 'Agente de ventas B2B' },
  { value: 'support', label: 'Soporte', description: 'Atención al cliente' },
  { value: 'internal', label: 'Interno', description: 'Asistente interno con MCP' },
]

interface WizardState {
  name: string
  description: string
  template: string
  provider: string
  model: string
  apiKeyEnvVar: string
  temperature: number
  identityPrompt: string
  instructionsPrompt: string
  safetyPrompt: string
  tools: string[]
  dailyBudget: number
  monthlyBudget: number
  maxTurns: number
  maxConcurrentSessions: number
}

const DEFAULT_STATE: WizardState = {
  name: '',
  description: '',
  template: 'custom',
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  temperature: 0.7,
  identityPrompt: '',
  instructionsPrompt: '',
  safetyPrompt: '',
  tools: ['calculator', 'date-time'],
  dailyBudget: 10,
  monthlyBudget: 200,
  maxTurns: 20,
  maxConcurrentSessions: 3,
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(DEFAULT_STATE)
  const [creating, setCreating] = useState(false)

  function update(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return state.name.trim().length > 0
      case 1:
        return state.identityPrompt.trim().length > 0
      default:
        return true
    }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      // 1. Crear proyecto
      const project = await nexusApi.createProject({
        name: state.name,
        description: state.description || null,
        status: 'active',
        config: {
          provider: {
            provider: state.provider,
            model: state.model,
            apiKeyEnvVar: state.apiKeyEnvVar,
            temperature: state.temperature,
          },
          allowedTools: state.tools,
          costConfig: {
            dailyBudgetUSD: state.dailyBudget,
            monthlyBudgetUSD: state.monthlyBudget,
          },
          maxTurnsPerSession: state.maxTurns,
          maxConcurrentSessions: state.maxConcurrentSessions,
        },
      })

      // 2. Crear y activar prompt layers
      const promptLayers = []

      if (state.identityPrompt.trim()) {
        promptLayers.push(
          nexusApi.createPromptLayer(project.id, {
            layerType: 'identity',
            content: state.identityPrompt,
            createdBy: 'admin',
            changeReason: 'Initial setup from wizard',
          }).then(layer => nexusApi.activatePromptLayer(layer.id))
        )
      }

      if (state.instructionsPrompt.trim()) {
        promptLayers.push(
          nexusApi.createPromptLayer(project.id, {
            layerType: 'instructions',
            content: state.instructionsPrompt,
            createdBy: 'admin',
            changeReason: 'Initial setup from wizard',
          }).then(layer => nexusApi.activatePromptLayer(layer.id))
        )
      }

      if (state.safetyPrompt.trim()) {
        promptLayers.push(
          nexusApi.createPromptLayer(project.id, {
            layerType: 'safety',
            content: state.safetyPrompt,
            createdBy: 'admin',
            changeReason: 'Initial setup from wizard',
          }).then(layer => nexusApi.activatePromptLayer(layer.id))
        )
      }

      await Promise.all(promptLayers)

      toast.success('Proyecto creado exitosamente')
      router.push(`/admin/nexus/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Error al crear proyecto')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/nexus/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            Wizard de creación paso a paso
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => i <= step && setStep(i)}
            >
              {i < step ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
              <span className="hidden md:inline">{s.label}</span>
              <span className="md:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="mb-1">Datos Básicos</CardTitle>
                <CardDescription>Nombre y configuración del provider</CardDescription>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre del Proyecto *</Label>
                  <Input
                    placeholder="ej. Ferretería Mayorista"
                    value={state.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción del proyecto..."
                    value={state.description}
                    onChange={(e) => update({ description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={state.template} onValueChange={(v) => update({ template: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label} — {t.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={state.provider}
                    onValueChange={(v) => {
                      const models = MODELS[v]
                      update({
                        provider: v,
                        model: models?.[0]?.value || '',
                        apiKeyEnvVar: v === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY',
                      })
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select value={state.model} onValueChange={(v) => update({ model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(MODELS[state.provider] || []).map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Temperature ({state.temperature})</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={state.temperature}
                    onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="mb-1">Identidad del Agente</CardTitle>
                <CardDescription>Define quién es, qué hace y qué no debe hacer</CardDescription>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Identidad (quién es) *</Label>
                  <Textarea
                    placeholder="Sos un asistente virtual de ventas para..."
                    value={state.identityPrompt}
                    onChange={(e) => update({ identityPrompt: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instrucciones (qué debe hacer)</Label>
                  <Textarea
                    placeholder="1. Cuando el cliente pregunte por precios...\n2. Si pide una cotización..."
                    value={state.instructionsPrompt}
                    onChange={(e) => update({ instructionsPrompt: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Seguridad (qué NO debe hacer)</Label>
                  <Textarea
                    placeholder="Nunca des descuentos sin aprobación.\nNo compartas información de otros clientes."
                    value={state.safetyPrompt}
                    onChange={(e) => update({ safetyPrompt: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tools */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="mb-1">Integraciones</CardTitle>
                <CardDescription>Seleccioná las herramientas disponibles para el agente</CardDescription>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {AVAILABLE_TOOLS.map((tool) => {
                  const selected = state.tools.includes(tool.id)
                  return (
                    <button
                      key={tool.id}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                      onClick={() => {
                        if (selected) {
                          update({ tools: state.tools.filter((t) => t !== tool.id) })
                        } else {
                          update({ tools: [...state.tools, tool.id] })
                        }
                      }}
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
            </div>
          )}

          {/* Step 3: Limits */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="mb-1">Límites y Presupuesto</CardTitle>
                <CardDescription>Configurá los límites de uso y costo</CardDescription>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Presupuesto Diario (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={state.dailyBudget}
                    onChange={(e) => update({ dailyBudget: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Presupuesto Mensual (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={state.monthlyBudget}
                    onChange={(e) => update({ monthlyBudget: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Turns por Sesión</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={state.maxTurns}
                    onChange={(e) => update({ maxTurns: parseInt(e.target.value) || 20 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Sesiones Concurrentes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={state.maxConcurrentSessions}
                    onChange={(e) => update({ maxConcurrentSessions: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <CardTitle className="mb-1">Revisar Configuración</CardTitle>
                <CardDescription>Verificá los datos antes de crear el proyecto</CardDescription>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 p-4 rounded-lg bg-muted">
                  <h3 className="font-medium">Datos Básicos</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Nombre:</span> {state.name}</p>
                    <p><span className="text-muted-foreground">Provider:</span> {state.provider}</p>
                    <p><span className="text-muted-foreground">Modelo:</span> {state.model}</p>
                    <p><span className="text-muted-foreground">Temperature:</span> {state.temperature}</p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted">
                  <h3 className="font-medium">Límites</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Budget diario:</span> ${state.dailyBudget}</p>
                    <p><span className="text-muted-foreground">Budget mensual:</span> ${state.monthlyBudget}</p>
                    <p><span className="text-muted-foreground">Max turns:</span> {state.maxTurns}</p>
                    <p><span className="text-muted-foreground">Max sesiones:</span> {state.maxConcurrentSessions}</p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted md:col-span-2">
                  <h3 className="font-medium">Tools ({state.tools.length})</h3>
                  <div className="flex flex-wrap gap-1">
                    {state.tools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="font-mono text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                {state.identityPrompt && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted md:col-span-2">
                    <h3 className="font-medium">Identidad</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {state.identityPrompt}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => void handleCreate()} disabled={creating}>
            {creating ? 'Creando...' : 'Crear Proyecto'}
            <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
