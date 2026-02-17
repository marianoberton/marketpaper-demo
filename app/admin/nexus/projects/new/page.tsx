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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react'
import { useCreateProject } from '@/lib/nexus/hooks/use-projects'
import { PROVIDERS, MODELS, DEFAULT_API_KEY_ENV, TEMPLATES } from '@/lib/nexus/constants'
import { toast } from 'sonner'

interface FormState {
  name: string
  description: string
  template: string
  provider: string
  model: string
  temperature: number
  dailyBudget: number
  monthlyBudget: number
  maxTurns: number
  maxConcurrentSessions: number
}

const DEFAULT_STATE: FormState = {
  name: '',
  description: '',
  template: 'custom',
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  dailyBudget: 10,
  monthlyBudget: 200,
  maxTurns: 20,
  maxConcurrentSessions: 3,
}

export default function NewProjectPage() {
  const router = useRouter()
  const [state, setState] = useState<FormState>(DEFAULT_STATE)
  const [limitsOpen, setLimitsOpen] = useState(false)
  const createProject = useCreateProject()

  function update(partial: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  async function handleCreate() {
    if (!state.name.trim()) {
      toast.error('El nombre del proyecto es requerido')
      return
    }

    try {
      const project = await createProject.mutateAsync({
        name: state.name,
        description: state.description || null,
        environment: 'development',
        owner: 'fomo-platform',
        tags: [],
        status: 'active',
        config: {
          provider: {
            provider: state.provider,
            model: state.model,
            apiKeyEnvVar: DEFAULT_API_KEY_ENV[state.provider] || 'ANTHROPIC_API_KEY',
            temperature: state.temperature,
          },
          allowedTools: [],
          costConfig: {
            dailyBudgetUSD: state.dailyBudget,
            monthlyBudgetUSD: state.monthlyBudget,
          },
          maxTurnsPerSession: state.maxTurns,
          maxConcurrentSessions: state.maxConcurrentSessions,
        },
      })

      toast.success('Proyecto creado exitosamente')
      router.push(`/admin/nexus/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Error al crear proyecto')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            Caso de uso que agrupa agentes y recursos compartidos
          </p>
        </div>
      </div>

      {/* Datos Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Básicos</CardTitle>
          <CardDescription>Nombre y tipo de caso de uso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Proyecto *</Label>
            <Input
              placeholder="ej. Ferretería Mayorista"
              value={state.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción del caso de uso..."
              value={state.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={state.template} onValueChange={(v) => update({ template: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} — {t.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Modelo IA */}
      <Card>
        <CardHeader>
          <CardTitle>Modelo IA</CardTitle>
          <CardDescription>Provider y modelo para los agentes del proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={state.provider}
                onValueChange={(v) => {
                  const models = MODELS[v]
                  update({
                    provider: v,
                    model: models?.[0]?.value || '',
                  })
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
              <Select value={state.model} onValueChange={(v) => update({ model: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODELS[state.provider] || []).map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Temperature ({state.temperature})</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={state.temperature}
                onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
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

      {/* Límites Avanzados */}
      <Collapsible open={limitsOpen} onOpenChange={setLimitsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Límites Avanzados</CardTitle>
                  <CardDescription>Presupuesto y límites de sesión</CardDescription>
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/admin/nexus/projects">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button
          onClick={() => void handleCreate()}
          disabled={createProject.isPending || !state.name.trim()}
        >
          {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Proyecto
        </Button>
      </div>
    </div>
  )
}
