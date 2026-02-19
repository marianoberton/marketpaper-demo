'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  MapPin,
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  FolderKanban,
  FolderOpen,
  PauseCircle,
  User,
  AlertTriangle,
  Star,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =========================
// TYPES
// =========================

interface ProjectUser {
  id: string
  full_name: string
  email?: string
  avatar_url?: string | null
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  cuit: string | null
}

interface TemaAssignee {
  id: string
  is_lead: boolean
  user: { id: string; full_name: string; avatar_url: string | null }
}

interface ProjectTema {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  expediente_number: string | null
  organismo: string | null
  updated_at: string
  sequential_order: number | null
  depends_on_tema_id: string | null
  type: { id: string; name: string; color: string } | null
  assignees: TemaAssignee[]
  task_stats: {
    total: number
    completed: number
  }
}

interface Project {
  id: string
  name: string
  address: string | null
  gerencia: string | null
  status: string
  priority: string
  start_date: string | null
  estimated_end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  client: Client | null
  responsible: ProjectUser | null
  created_by_user: { id: string; full_name: string } | null
  temas: ProjectTema[]
}

// =========================
// CONSTANTS
// =========================

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: 'bg-primary/20 text-primary border-primary/30' },
  en_curso: { label: 'En Curso', color: 'bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20' },
  pausado: { label: 'Pausado', color: 'bg-muted text-muted-foreground border-border' },
  completado: { label: 'Completado', color: 'bg-foreground/10 text-foreground/70 border-foreground/20' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'bg-muted text-muted-foreground border-border' },
  media: { label: 'Media', color: 'bg-foreground/10 text-foreground border-foreground/20' },
  alta: { label: 'Alta', color: 'bg-accent-foreground/15 text-accent-foreground border-accent-foreground/30' },
  urgente: { label: 'Urgente', color: 'bg-destructive/10 text-destructive border-destructive/20' },
}

const TEMA_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  nuevo_expediente: { label: 'Nuevo Expediente', color: 'bg-primary/20 text-primary border-primary/30' },
  caratulado: { label: 'Caratulado', color: 'bg-primary/10 text-primary border-primary/20' },
  seguimiento: { label: 'En Seguimiento', color: 'bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20' },
  subsanacion: { label: 'Subsanacion', color: 'bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30' },
  observado: { label: 'Observado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  subsanacion_cerrada: { label: 'Subsanacion Cerrada', color: 'bg-muted text-foreground/70 border-border' },
  completado: { label: 'Completado', color: 'bg-foreground/10 text-foreground/70 border-foreground/20' },
  finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground border-border' },
}

const GERENCIA_CONFIG: Record<string, { label: string }> = {
  licitaciones: { label: 'Licitaciones' },
  construccion: { label: 'Construccion' },
}

// =========================
// HELPERS
// =========================

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

const getDueDateStatus = (dueDate: string | null) => {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { status: 'overdue', label: 'Vencido', color: 'text-destructive' }
  if (diffDays === 0) return { status: 'today', label: 'Hoy', color: 'text-primary' }
  if (diffDays <= 3) return { status: 'soon', label: `${diffDays} dias`, color: 'text-accent-foreground' }
  return { status: 'ok', label: `${diffDays} dias`, color: 'text-muted-foreground' }
}

// =========================
// COMPONENT
// =========================

interface ProjectDetailClientPageProps {
  projectId: string
}

export default function ProjectDetailClientPage({ projectId }: ProjectDetailClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company_id')

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [reorderableTemas, setReorderableTemas] = useState<ProjectTema[]>([])

  const companyParam = companyId ? `?company_id=${companyId}` : ''

  // =========================
  // DATA FETCHING
  // =========================

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspace/temas/projects/${projectId}`)
      const data = await response.json()

      if (data.success) {
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // =========================
  // UPDATE HANDLERS
  // =========================

  const updateProject = async (field: string, value: string) => {
    if (!project) return

    setSaving(true)
    try {
      const response = await fetch(`/api/workspace/temas/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      const data = await response.json()
      if (data.success) {
        setProject(prev => prev ? { ...prev, [field]: value } : null)
        toast.success('Proyecto actualizado')
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Error al actualizar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // REORDER HANDLERS
  // =========================

  const enterReorderMode = () => {
    const sorted = [...(project?.temas || [])].sort((a, b) => (a.sequential_order ?? 999) - (b.sequential_order ?? 999))
    setReorderableTemas(sorted)
    setReorderMode(true)
  }

  const cancelReorder = () => {
    setReorderMode(false)
    setReorderableTemas([])
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    setReorderableTemas(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const moveDown = (index: number) => {
    setReorderableTemas(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const saveOrder = async () => {
    setSaving(true)
    try {
      const order = reorderableTemas.map((tema, index) => ({
        tema_id: tema.id,
        sequential_order: index + 1,
      }))

      const response = await fetch(`/api/workspace/temas/projects/${projectId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Orden actualizado')
        setReorderMode(false)
        setReorderableTemas([])
        fetchProject()
      } else {
        toast.error(data.error || 'Error al reordenar')
      }
    } catch (error) {
      console.error('Error reordering:', error)
      toast.error('Error al reordenar')
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // RENDER
  // =========================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <Button
          variant="link"
          onClick={() => router.push(`/workspace/temas/projects${companyParam}`)}
        >
          Volver a la lista
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.nuevo
  const priorityConfig = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.media
  const totalTemas = project.temas?.length || 0
  const completedTemas = project.temas?.filter(t =>
    t.status === 'completado' || t.status === 'finalizado'
  ).length || 0
  const progressPercent = totalTemas > 0 ? Math.round((completedTemas / totalTemas) * 100) : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ==================== HEADER ==================== */}
      <div className="mb-6">
        {/* Back button + Title row */}
        <div className="flex items-start gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/workspace/temas/projects${companyParam}`)}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {project.gerencia && (
                <Badge variant="outline" className="text-xs">
                  {GERENCIA_CONFIG[project.gerencia]?.label || project.gerencia}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold text-foreground mt-2">{project.name}</h1>

            {/* Client + Address */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {project.client && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {project.client.name}
                </span>
              )}
              {project.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </span>
              )}
            </div>
          </div>

          {/* Saving indicator */}
          {saving && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Guardando...
            </div>
          )}
        </div>

        {/* Quick actions row */}
        <div className="flex items-center gap-3 flex-wrap ml-12">
          {/* Status selector (inline) */}
          <Select
            value={project.status}
            onValueChange={(value) => updateProject('status', value)}
          >
            <SelectTrigger className={cn('w-auto border', statusConfig.color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority selector (inline) */}
          <Select
            value={project.priority}
            onValueChange={(value) => updateProject('priority', value)}
          >
            <SelectTrigger className={cn('w-auto border', priorityConfig.color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Temas progress */}
          {totalTemas > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>{completedTemas}/{totalTemas} temas</span>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Temas list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          {project.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{project.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Temas en este Proyecto */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Temas en este Proyecto
                  {totalTemas > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {totalTemas}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!reorderMode ? (
                    <>
                      {totalTemas > 1 && (
                        <Button size="sm" variant="outline" onClick={enterReorderMode} className="gap-1.5">
                          <GripVertical className="h-4 w-4" />
                          Reordenar
                        </Button>
                      )}
                      <Button asChild size="sm" className="gap-1">
                        <Link href={`/workspace/temas/nuevo?project_id=${projectId}${companyId ? `&company_id=${companyId}` : ''}`}>
                          <Plus className="h-4 w-4" />
                          Nuevo Tema
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={cancelReorder} disabled={saving}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={saveOrder} disabled={saving} className="gap-1.5">
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Guardar Orden
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {totalTemas > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progreso: {completedTemas}/{totalTemas} completados</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* ---- REORDER MODE ---- */}
              {reorderMode && (
                <div className="space-y-2">
                  {reorderableTemas.map((tema, index) => (
                    <div key={tema.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-border bg-background text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{tema.title}</p>
                        {tema.type && (
                          <p className="text-xs text-muted-foreground">{tema.type.name}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => moveUp(index)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={index === reorderableTemas.length - 1}
                          onClick={() => moveDown(index)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Usá las flechas para cambiar el orden. Luego guardá.
                  </p>
                </div>
              )}

              {/* ---- NORMAL MODE ---- */}
              {!reorderMode && project.temas && project.temas.length > 0 && (
                <div className="space-y-0">
                  {[...project.temas]
                    .sort((a, b) => (a.sequential_order ?? 999) - (b.sequential_order ?? 999))
                    .map((tema, index) => {
                    const temaStatusConfig = TEMA_STATUS_CONFIG[tema.status] || TEMA_STATUS_CONFIG.nuevo_expediente
                    const temaDueStatus = getDueDateStatus(tema.due_date)
                    const temaProgress = tema.task_stats.total > 0
                      ? Math.round((tema.task_stats.completed / tema.task_stats.total) * 100)
                      : 0

                    // Check dependency status
                    const completedStatuses = ['completado', 'finalizado']
                    const dependsOnTema = tema.depends_on_tema_id
                      ? project.temas.find(t => t.id === tema.depends_on_tema_id)
                      : null
                    const isBlocked = dependsOnTema && !completedStatuses.includes(dependsOnTema.status)
                    const hasSequence = tema.sequential_order !== null && tema.sequential_order !== undefined

                    return (
                      <div key={tema.id} className="flex gap-3">
                        {/* Sequence indicator column */}
                        <div className="flex flex-col items-center shrink-0 w-8">
                          {hasSequence ? (
                            <div className={cn(
                              'flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border-2',
                              isBlocked
                                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                                : completedStatuses.includes(tema.status)
                                  ? 'border-primary bg-primary/20 text-primary'
                                  : 'border-border bg-muted text-foreground'
                            )}>
                              {tema.sequential_order}
                            </div>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            </div>
                          )}
                          {/* Connecting line */}
                          {index < project.temas.length - 1 && (
                            <div className="w-px flex-1 min-h-[12px] bg-border" />
                          )}
                        </div>

                        {/* Tema card */}
                        <div
                          className={cn(
                            'flex-1 p-4 mb-3 rounded-lg border cursor-pointer transition-all',
                            isBlocked
                              ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
                              : 'border-border hover:border-primary/50 hover:bg-primary/5'
                          )}
                          onClick={() => router.push(`/workspace/temas/${tema.id}${companyParam}`)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-foreground">{tema.title}</h4>
                                {tema.type && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: tema.type.color, color: tema.type.color }}
                                  >
                                    {tema.type.name}
                                  </Badge>
                                )}
                              </div>

                              {/* Dependency indicator */}
                              {isBlocked && dependsOnTema && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
                                  <Lock className="h-3 w-3" />
                                  <span>Bloqueado por: {dependsOnTema.title}</span>
                                </div>
                              )}
                              {dependsOnTema && !isBlocked && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary">
                                  <Unlock className="h-3 w-3" />
                                  <span>Desbloqueado</span>
                                </div>
                              )}

                              {/* Meta info */}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <Badge className={cn('text-xs border', temaStatusConfig.color)}>
                                  {temaStatusConfig.label}
                                </Badge>

                                {tema.expediente_number && (
                                  <span className="text-xs text-muted-foreground">
                                    Exp: {tema.expediente_number}
                                  </span>
                                )}

                                {temaDueStatus && (
                                  <div className={cn('flex items-center gap-1 text-xs', temaDueStatus.color)}>
                                    {temaDueStatus.status === 'overdue' && <AlertTriangle className="h-3 w-3" />}
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {format(new Date(tema.due_date!), 'dd MMM', { locale: es })}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Task progress bar */}
                              {tema.task_stats.total > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Tareas: {tema.task_stats.completed}/{tema.task_stats.total}</span>
                                    <span>{temaProgress}%</span>
                                  </div>
                                  <Progress value={temaProgress} className="h-1" />
                                </div>
                              )}
                            </div>

                            {/* Assignees */}
                            <div className="flex -space-x-2 shrink-0">
                              {tema.assignees?.slice(0, 3).map((assignee) => (
                                <div key={assignee.id} className="relative">
                                  <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarImage src={assignee.user?.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px] bg-muted">
                                      {getInitials(assignee.user?.full_name || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {assignee.is_lead && (
                                    <Star className="absolute -top-1 -right-1 h-3 w-3 text-primary fill-primary" />
                                  )}
                                </div>
                              ))}
                              {(tema.assignees?.length || 0) > 3 && (
                                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted border-2 border-background text-[10px] font-medium">
                                  +{tema.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {!reorderMode && (!project.temas || project.temas.length === 0) && (
                <div className="text-center py-8">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay temas en este proyecto</p>
                  <p className="text-sm text-muted-foreground mt-1">Agrega el primer tema para comenzar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <div className="space-y-6">
          {/* Responsible Card */}
          {project.responsible && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={project.responsible.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted">
                      {getInitials(project.responsible.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{project.responsible.full_name}</p>
                    {project.responsible.email && (
                      <p className="text-xs text-muted-foreground">{project.responsible.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Card */}
          {project.client && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cliente Asociado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold text-foreground">{project.client.name}</p>
                {project.client.cuit && (
                  <p className="text-sm text-muted-foreground">CUIT: {project.client.cuit}</p>
                )}
                {project.client.email && (
                  <p className="text-sm text-muted-foreground">{project.client.email}</p>
                )}
                {project.client.phone && (
                  <p className="text-sm text-muted-foreground">{project.client.phone}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.start_date && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inicio</span>
                    <span className="text-foreground">
                      {format(new Date(project.start_date), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                  <Separator />
                </>
              )}
              {project.estimated_end_date && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin estimado</span>
                    <span className="text-foreground">
                      {format(new Date(project.estimated_end_date), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span className="text-foreground">
                  {format(new Date(project.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actualizado</span>
                <span className="text-foreground">
                  {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: es })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado por</span>
                <span className="text-foreground">{project.created_by_user?.full_name || '-'}</span>
              </div>
              {project.gerencia && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gerencia</span>
                    <span className="text-foreground">
                      {GERENCIA_CONFIG[project.gerencia]?.label || project.gerencia}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
