'use client'

import { useState, useEffect } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useProject, useUpdateProject, useDeleteProject } from '@/lib/nexus/hooks/use-projects'
import { toast } from 'sonner'

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

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'archived', label: 'Archivado' },
]

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const { data: project, isLoading } = useProject(projectId)
  const updateProject = useUpdateProject(projectId)
  const deleteProject = useDeleteProject()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'paused' | 'archived'>('active')
  const [provider, setProvider] = useState('anthropic')
  const [model, setModel] = useState('claude-sonnet-4-5-20250929')
  const [temperature, setTemperature] = useState(0.7)
  const [dailyBudget, setDailyBudget] = useState(10)
  const [monthlyBudget, setMonthlyBudget] = useState(200)
  const [maxTurns, setMaxTurns] = useState(20)
  const [maxSessions, setMaxSessions] = useState(3)

  // Load project data when available
  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status)
      setProvider(project.config.provider.provider)
      setModel(project.config.provider.model)
      setTemperature(project.config.provider.temperature || 0.7)
      setDailyBudget(project.config.costConfig?.dailyBudgetUSD || 10)
      setMonthlyBudget(project.config.costConfig?.monthlyBudgetUSD || 200)
      setMaxTurns(project.config.maxTurnsPerSession || 20)
      setMaxSessions(project.config.maxConcurrentSessions || 3)
    }
  }, [project])

  async function handleSave() {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      await updateProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        status,
        config: {
          ...project!.config,
          provider: {
            provider,
            model,
            apiKeyEnvVar: provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY',
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

      toast.success('Proyecto actualizado exitosamente')
      router.push(`/admin/nexus/projects/${projectId}`)
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Error al actualizar proyecto')
    }
  }

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(projectId)
      toast.success('Proyecto eliminado exitosamente')
      router.push('/admin/nexus/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Error al eliminar proyecto')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/nexus/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Proyecto</h1>
            <p className="text-muted-foreground">
              Modificá la configuración del proyecto
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el proyecto y todos sus agentes, sesiones y datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar Proyecto
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>Nombre, descripción y estado del proyecto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre del Proyecto *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Modelo</CardTitle>
          <CardDescription>Provider, modelo y temperatura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => {
                  setProvider(v)
                  const models = MODELS[v]
                  setModel(models?.[0]?.value || '')
                }}
              >
                <SelectTrigger id="provider">
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
              <Label htmlFor="model">Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
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

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature ({temperature})</Label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuestos</CardTitle>
          <CardDescription>Límites de costo diarios y mensuales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dailyBudget">Presupuesto Diario (USD)</Label>
              <Input
                id="dailyBudget"
                type="number"
                min={0}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyBudget">Presupuesto Mensual (USD)</Label>
              <Input
                id="monthlyBudget"
                type="number"
                min={0}
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Límites de Sesión</CardTitle>
          <CardDescription>Configuración de turns y sesiones concurrentes</CardDescription>
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
              <Label htmlFor="maxSessions">Max Sesiones Concurrentes</Label>
              <Input
                id="maxSessions"
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

      {/* Actions */}
      <div className="flex justify-between">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>

        <Button
          onClick={handleSave}
          disabled={updateProject.isPending || !name.trim()}
        >
          {updateProject.isPending ? 'Guardando...' : 'Guardar Cambios'}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
