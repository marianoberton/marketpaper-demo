'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
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
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  RefreshCw,
  FileCode2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemasNav } from '../../components/temas-nav'

// =============================
// TYPES
// =============================

interface TemplateTask {
  orden: number
  titulo: string
  tipo: string
  dias_estimados: number | null
  checklist: string[]
}

interface TemplateMetadata {
  name: string
  description: string
  gerencia: string
  categoria: string
  color: string
}

// =============================
// CONSTANTS
// =============================

const COLOR_PRESETS = [
  '#4F46E5',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#6B7280',
]

const DEFAULT_COLOR = '#6B7280'

// =============================
// COMPONENT
// =============================

export default function EditTemplateClientPage({
  templateId,
}: {
  templateId: string
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Metadata state
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: '',
    description: '',
    gerencia: '',
    categoria: '',
    color: DEFAULT_COLOR,
  })

  // Tasks state
  const [tasks, setTasks] = useState<TemplateTask[]>([])

  // Checklist input state per task
  const [checklistInputs, setChecklistInputs] = useState<Record<number, string>>({})

  // =============================
  // FETCH TEMPLATE
  // =============================

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/workspace/temas/types/${templateId}`)
        const data = await response.json()

        if (data.success && data.type) {
          const t = data.type
          setMetadata({
            name: t.name || '',
            description: t.description || '',
            gerencia: t.gerencia || '',
            categoria: t.categoria || '',
            color: t.color || DEFAULT_COLOR,
          })

          if (t.tareas_template && Array.isArray(t.tareas_template)) {
            setTasks(
              t.tareas_template.map((task: any, index: number) => ({
                orden: task.orden ?? index + 1,
                titulo: task.titulo || '',
                tipo: task.tipo || 'interna',
                dias_estimados: task.dias_estimados ?? null,
                checklist: Array.isArray(task.checklist) ? task.checklist : [],
              }))
            )
          }
        } else {
          toast.error('Template no encontrado')
          router.push('/workspace/temas/templates')
        }
      } catch (error) {
        console.error('Error fetching template:', error)
        toast.error('Error al cargar el template')
        router.push('/workspace/temas/templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId, router])

  // =============================
  // METADATA HANDLERS
  // =============================

  const updateMetadata = (field: keyof TemplateMetadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }))
  }

  // =============================
  // TASK HANDLERS
  // =============================

  const addTask = () => {
    const newTask: TemplateTask = {
      orden: tasks.length + 1,
      titulo: '',
      tipo: 'interna',
      dias_estimados: null,
      checklist: [],
    }
    setTasks((prev) => [...prev, newTask])
  }

  const removeTask = (index: number) => {
    setTasks((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((t, i) => ({ ...t, orden: i + 1 }))
    })
    setChecklistInputs((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const updateTask = (index: number, field: keyof TemplateTask, value: string | number | null | string[]) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= tasks.length) return

    setTasks((prev) => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[targetIndex]
      updated[targetIndex] = temp
      return updated.map((t, i) => ({ ...t, orden: i + 1 }))
    })
  }

  const addChecklistItem = (taskIndex: number, item: string) => {
    if (!item.trim()) return
    setTasks((prev) =>
      prev.map((t, i) =>
        i === taskIndex
          ? { ...t, checklist: [...t.checklist, item.trim()] }
          : t
      )
    )
    setChecklistInputs((prev) => ({ ...prev, [taskIndex]: '' }))
  }

  const removeChecklistItem = (taskIndex: number, itemIndex: number) => {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === taskIndex
          ? { ...t, checklist: t.checklist.filter((_, ci) => ci !== itemIndex) }
          : t
      )
    )
  }

  // =============================
  // SUBMIT
  // =============================

  const handleSubmit = async () => {
    if (!metadata.name.trim()) {
      toast.error('El nombre del template es requerido')
      return
    }

    try {
      setSaving(true)

      const body = {
        name: metadata.name.trim(),
        description: metadata.description.trim() || null,
        gerencia: metadata.gerencia || null,
        categoria: metadata.categoria.trim() || null,
        color: metadata.color,
        tareas_template: tasks.map((t) => ({
          orden: t.orden,
          titulo: t.titulo,
          tipo: t.tipo,
          dias_estimados: t.dias_estimados,
          checklist: t.checklist,
        })),
      }

      const response = await fetch(`/api/workspace/temas/types/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Template guardado correctamente')
        router.push('/workspace/temas/templates')
      } else {
        toast.error(data.error || 'Error al guardar template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Error al guardar template')
    } finally {
      setSaving(false)
    }
  }

  // =============================
  // LOADING STATE
  // =============================

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <TemasNav />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // =============================
  // RENDER
  // =============================

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <TemasNav />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workspace/temas/templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Template</h1>
          <p className="text-muted-foreground">
            Modifica la plantilla y sus tareas predefinidas
          </p>
        </div>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5" />
            Informacion del Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Permiso de Obra Nueva"
              value={metadata.name}
              onChange={(e) => updateMetadata('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              placeholder="Descripcion breve del template..."
              value={metadata.description}
              onChange={(e) => updateMetadata('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Gerencia + Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gerencia</Label>
              <Select
                value={metadata.gerencia}
                onValueChange={(v) => updateMetadata('gerencia', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar gerencia..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construccion">Construccion</SelectItem>
                  <SelectItem value="licitaciones">Licitaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                placeholder="ej: Permisos"
                value={metadata.categoria}
                onChange={(e) => updateMetadata('categoria', e.target.value)}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    metadata.color === color
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => updateMetadata('color', color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Tareas del Template
                {tasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tasks.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Define las tareas que se crean automaticamente al usar este template
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">
                No hay tareas definidas. Agrega tareas para que se creen automaticamente al usar este template.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-card"
                >
                  {/* Task Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      #{task.orden}
                    </span>
                    <Input
                      placeholder="Titulo de la tarea..."
                      value={task.titulo}
                      onChange={(e) => updateTask(index, 'titulo', e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveTask(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveTask(index, 'down')}
                        disabled={index === tasks.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeTask(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Task Body */}
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={task.tipo}
                          onValueChange={(v) => updateTask(index, 'tipo', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interna">Interna</SelectItem>
                            <SelectItem value="esperando_cliente">
                              Esperando cliente
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Dias estimados</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Ej: 5"
                          value={task.dias_estimados ?? ''}
                          onChange={(e) =>
                            updateTask(
                              index,
                              'dias_estimados',
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2">
                      <Label>Checklist</Label>
                      {task.checklist.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {task.checklist.map((item, ci) => (
                            <Badge
                              key={ci}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {item}
                              <button
                                type="button"
                                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                                onClick={() => removeChecklistItem(index, ci)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nuevo item del checklist..."
                          value={checklistInputs[index] || ''}
                          onChange={(e) =>
                            setChecklistInputs((prev) => ({
                              ...prev,
                              [index]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addChecklistItem(index, checklistInputs[index] || '')
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addChecklistItem(index, checklistInputs[index] || '')
                          }
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Task Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={addTask}
          >
            <Plus className="h-4 w-4" />
            Agregar Tarea
          </Button>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/workspace/temas/templates">Cancelar</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
