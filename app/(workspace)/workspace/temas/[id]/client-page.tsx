'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ArrowLeft,
    RefreshCw,
    Calendar,
    Users,
    Building2,
    FileText,
    MessageSquare,
    History,
    Plus,
    CheckCircle2,
    Circle,
    Star,
    Send,
    Paperclip,
    Clock,
    AlertTriangle,
    Trash2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'

// =========================
// TYPES
// =========================

interface User {
    id: string
    full_name: string
    email: string
    avatar_url?: string
}

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
    sort_order: number
    due_date: string | null
    completed_at: string | null
    assigned_user: User | null
}

interface Comment {
    id: string
    content: string
    created_at: string
    created_by: User | null
}

interface Activity {
    id: string
    action: string
    old_value: string | null
    new_value: string | null
    comment: string | null
    created_at: string
    user: User | null
}

interface Assignee {
    id: string
    role: string
    is_lead: boolean
    assigned_at: string
    user: User
}

interface Client {
    id: string
    name: string
    email: string | null
    phone: string | null
    cuit: string | null
}

interface Tema {
    id: string
    title: string
    description: string | null
    reference_code: string | null
    expediente_number: string | null
    organismo: string | null
    status: string
    priority: string
    due_date: string | null
    notes: string | null
    created_at: string
    updated_at: string
    type: { id: string; name: string; color: string; icon?: string } | null
    area: { id: string; name: string; color: string } | null
    created_by_user: User | null
    assignees: Assignee[]
    tasks: Task[]
    activity: Activity[]
    client: Client | null
}

// =========================
// CONSTANTS
// =========================

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    nuevo_expediente: { label: 'Nuevo Expediente', color: 'bg-primary/20 text-primary border-primary/30' },
    caratulado: { label: 'Caratulado', color: 'bg-primary/10 text-primary border-primary/20' },
    seguimiento: { label: 'En Seguimiento', color: 'bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20' },
    subsanacion: { label: 'Subsanación', color: 'bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30' },
    observado: { label: 'Observado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
    subsanacion_cerrada: { label: 'Subsanación Cerrada', color: 'bg-muted text-foreground/70 border-border' },
    completado: { label: 'Completado', color: 'bg-foreground/10 text-foreground/70 border-foreground/20' },
    finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground border-border' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    baja: { label: 'Baja', color: 'bg-muted text-muted-foreground border-border', icon: '○' },
    media: { label: 'Media', color: 'bg-foreground/10 text-foreground border-foreground/20', icon: '◐' },
    alta: { label: 'Alta', color: 'bg-accent-foreground/15 text-accent-foreground border-accent-foreground/30', icon: '●' },
}

const ACTION_LABELS: Record<string, string> = {
    created: 'creó el tema',
    status_changed: 'cambió el estado',
    assigned: 'asignó responsable',
    comment: 'comentó',
    updated: 'actualizó',
    task_completed: 'completó tarea',
    task_created: 'agregó tarea',
}

// =========================
// HELPERS
// =========================

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { status: 'overdue', label: 'Vencido', color: 'text-destructive' }
    if (diffDays === 0) return { status: 'today', label: 'Hoy', color: 'text-primary' }
    if (diffDays <= 3) return { status: 'soon', label: `${diffDays} días`, color: 'text-accent-foreground' }
    return { status: 'ok', label: `${diffDays} días`, color: 'text-muted-foreground' }
}

// =========================
// COMPONENT
// =========================

interface TemaDetailClientPageProps {
    temaId: string
}

export default function TemaDetailClientPage({ temaId }: TemaDetailClientPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const companyId = searchParams.get('company_id')

    // State
    const [tema, setTema] = useState<Tema | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [comments, setComments] = useState<Comment[]>([])

    // Inline editing state
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskAssignee, setNewTaskAssignee] = useState('')
    const [newTaskDueDate, setNewTaskDueDate] = useState('')
    const [newComment, setNewComment] = useState('')
    const [addingTask, setAddingTask] = useState(false)
    const [submittingComment, setSubmittingComment] = useState(false)

    // =========================
    // DATA FETCHING
    // =========================

    const fetchTema = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/workspace/temas/${temaId}`)
            const data = await response.json()

            if (data.success) {
                setTema(data.tema)
            }
        } catch (error) {
            console.error('Error fetching tema:', error)
        } finally {
            setLoading(false)
        }
    }, [temaId])

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/workspace/users')
            const data = await response.json()
            if (data.success) {
                setUsers(data.users)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }, [])

    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`/api/workspace/temas/${temaId}/comments`)
            const data = await response.json()
            if (data.success) {
                setComments(data.comments || [])
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
        }
    }, [temaId])

    useEffect(() => {
        fetchTema()
        fetchUsers()
        fetchComments()
    }, [fetchTema, fetchUsers, fetchComments])

    // =========================
    // INLINE UPDATE HANDLERS
    // =========================

    const updateTema = async (field: string, value: any) => {
        if (!tema) return

        setSaving(true)
        try {
            const response = await fetch(`/api/workspace/temas/${temaId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            })

            const data = await response.json()
            if (data.success) {
                // Optimistic update
                setTema(prev => prev ? { ...prev, [field]: value } : null)
                // Refresh to get updated activity
                setTimeout(() => fetchTema(), 500)
            }
        } catch (error) {
            console.error('Error updating tema:', error)
        } finally {
            setSaving(false)
        }
    }

    // =========================
    // TASK HANDLERS
    // =========================

    const addTask = async () => {
        if (!newTaskTitle.trim()) return

        setAddingTask(true)
        try {
            const response = await fetch(`/api/workspace/temas/${temaId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTaskTitle,
                    assigned_to: (newTaskAssignee && newTaskAssignee !== 'unassigned') ? newTaskAssignee : null,
                    due_date: newTaskDueDate || null
                })
            })

            const data = await response.json()
            if (data.success) {
                setNewTaskTitle('')
                setNewTaskAssignee('')
                setNewTaskDueDate('')
                fetchTema()
            }
        } catch (error) {
            console.error('Error adding task:', error)
        } finally {
            setAddingTask(false)
        }
    }

    const toggleTask = async (taskId: string, completed: boolean) => {
        try {
            const response = await fetch(`/api/workspace/temas/${temaId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: completed ? 'completada' : 'pendiente'
                })
            })

            if (response.ok) {
                fetchTema()
            }
        } catch (error) {
            console.error('Error toggling task:', error)
        }
    }

    const updateTask = async (taskId: string, field: string, value: any) => {
        try {
            const response = await fetch(`/api/workspace/temas/${temaId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            })

            if (response.ok) {
                fetchTema()
            }
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    // =========================
    // COMMENT HANDLERS
    // =========================

    const addComment = async () => {
        if (!newComment.trim()) return

        setSubmittingComment(true)
        try {
            const response = await fetch(`/api/workspace/temas/${temaId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            })

            const data = await response.json()
            if (data.success) {
                setNewComment('')
                fetchComments()
                fetchTema() // Refresh activity
            }
        } catch (error) {
            console.error('Error adding comment:', error)
        } finally {
            setSubmittingComment(false)
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

    if (!tema) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Tema no encontrado</p>
                <Button
                    variant="link"
                    onClick={() => router.push(`/workspace/temas${companyId ? `?company_id=${companyId}` : ''}`)}
                >
                    Volver a la lista
                </Button>
            </div>
        )
    }

    const statusConfig = STATUS_CONFIG[tema.status] || STATUS_CONFIG.nuevo_expediente
    const priorityConfig = PRIORITY_CONFIG[tema.priority] || PRIORITY_CONFIG.media
    const dueDateStatus = getDueDateStatus(tema.due_date)
    const leadAssignee = tema.assignees.find(a => a.is_lead)
    const completedTasks = tema.tasks?.filter(t => t.status === 'completada').length || 0
    const totalTasks = tema.tasks?.length || 0

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* ==================== HEADER ==================== */}
            <div className="mb-6">
                {/* Back button + Title row */}
                <div className="flex items-start gap-4 mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/workspace/temas${companyId ? `?company_id=${companyId}` : ''}`)}
                        className="mt-1"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Type badge */}
                            {tema.type && (
                                <Badge
                                    variant="outline"
                                    style={{ borderColor: tema.type.color, color: tema.type.color }}
                                    className="text-xs"
                                >
                                    {tema.type.name}
                                </Badge>
                            )}
                            {/* Area badge */}
                            {tema.area && (
                                <Badge
                                    variant="outline"
                                    style={{ borderColor: tema.area.color, color: tema.area.color }}
                                    className="text-xs"
                                >
                                    📁 {tema.area.name}
                                </Badge>
                            )}
                            {/* Reference */}
                            {tema.reference_code && (
                                <span className="text-muted-foreground text-sm font-mono">
                                    #{tema.reference_code}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mt-2">{tema.title}</h1>

                        {/* Expediente info */}
                        {(tema.expediente_number || tema.organismo) && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {tema.expediente_number && (
                                    <span className="flex items-center gap-1">
                                        <FileText className="h-4 w-4" />
                                        Exp: {tema.expediente_number}
                                    </span>
                                )}
                                {tema.organismo && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        {tema.organismo}
                                    </span>
                                )}
                            </div>
                        )}
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
                        value={tema.status}
                        onValueChange={(value) => updateTema('status', value)}
                    >
                        <SelectTrigger className={`w-auto ${statusConfig.color} border`}>
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
                        value={tema.priority}
                        onValueChange={(value) => updateTema('priority', value)}
                    >
                        <SelectTrigger className={`w-auto ${priorityConfig.color} border`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                                <SelectItem key={value} value={value}>
                                    {config.icon} {config.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Due date */}
                    {dueDateStatus && (
                        <div className={`flex items-center gap-1.5 text-sm ${dueDateStatus.color}`}>
                            {dueDateStatus.status === 'overdue' && <AlertTriangle className="h-4 w-4" />}
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(tema.due_date!), 'dd MMM yyyy', { locale: es })}</span>
                            <span className="text-muted-foreground">({dueDateStatus.label})</span>
                        </div>
                    )}

                    {/* Task progress */}
                    {totalTasks > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{completedTasks}/{totalTasks} tareas</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== MAIN CONTENT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Descripción</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground whitespace-pre-wrap">
                                {tema.description || 'Sin descripción'}
                            </p>
                            {tema.notes && (
                                <div className="mt-4 p-3 bg-accent-foreground/10 border border-accent-foreground/20 rounded-lg">
                                    <p className="text-sm text-accent-foreground">
                                        <strong>Notas:</strong> {tema.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs for Tasks, Comments, Activity */}
                    <Tabs defaultValue="tasks" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="tasks" className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Tareas {totalTasks > 0 && `(${completedTasks}/${totalTasks})`}
                            </TabsTrigger>
                            <TabsTrigger value="comments" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Comentarios {comments.length > 0 && `(${comments.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Actividad
                            </TabsTrigger>
                        </TabsList>

                        {/* ===== TASKS TAB ===== */}
                        <TabsContent value="tasks" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {/* Add task form - expanded */}
                                    <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-lg border border-dashed border-border">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Título de la nueva tarea..."
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                disabled={addingTask}
                                                className="flex-1"
                                            />
                                        </div>
                                        <div className="flex gap-2 items-center flex-wrap">
                                            {/* User selector for new task */}
                                            <Select
                                                value={newTaskAssignee || 'unassigned'}
                                                onValueChange={setNewTaskAssignee}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <SelectValue placeholder="Asignar a..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-5 w-5">
                                                                    <AvatarImage src={user.avatar_url} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getInitials(user.full_name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                {user.full_name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Due date for new task */}
                                            <Input
                                                type="date"
                                                value={newTaskDueDate}
                                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                className="w-[160px]"
                                            />

                                            <Button
                                                onClick={addTask}
                                                disabled={addingTask || !newTaskTitle.trim()}
                                            >
                                                {addingTask ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <Plus className="h-4 w-4 mr-2" />
                                                )}
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Task list */}
                                    {tema.tasks && tema.tasks.length > 0 ? (
                                        <div className="space-y-2">
                                            {tema.tasks
                                                .sort((a, b) => a.sort_order - b.sort_order)
                                                .map((task) => {
                                                    const taskDueStatus = getDueDateStatus(task.due_date)
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${task.status === 'completada'
                                                                ? 'bg-muted/50 border-border opacity-70'
                                                                : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
                                                                }`}
                                                        >
                                                            <Checkbox
                                                                checked={task.status === 'completada'}
                                                                onCheckedChange={(checked) =>
                                                                    toggleTask(task.id, checked as boolean)
                                                                }
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium ${task.status === 'completada'
                                                                    ? 'text-muted-foreground line-through'
                                                                    : 'text-foreground'
                                                                    }`}>
                                                                    {task.title}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                    {/* Assignee selector inline */}
                                                                    <Select
                                                                        value={task.assigned_user?.id || 'unassigned'}
                                                                        onValueChange={(value) => updateTask(task.id, 'assigned_to', value === 'unassigned' ? null : value)}
                                                                    >
                                                                        <SelectTrigger className="h-7 w-[140px] text-xs border-dashed">
                                                                            {task.assigned_user ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    <Avatar className="h-4 w-4">
                                                                                        <AvatarImage src={task.assigned_user.avatar_url} />
                                                                                        <AvatarFallback className="text-[8px]">
                                                                                            {getInitials(task.assigned_user.full_name)}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="truncate">{task.assigned_user.full_name.split(' ')[0]}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">Asignar...</span>
                                                                            )}
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                                                                            {users.map((user) => (
                                                                                <SelectItem key={user.id} value={user.id}>
                                                                                    {user.full_name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {/* Due date inline */}
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            type="date"
                                                                            value={task.due_date ? task.due_date.split('T')[0] : ''}
                                                                            onChange={(e) => updateTask(task.id, 'due_date', e.target.value || null)}
                                                                            className={`h-7 w-[130px] text-xs border-dashed ${taskDueStatus?.status === 'overdue' ? 'border-destructive/50 bg-destructive/5' : ''
                                                                                }`}
                                                                        />
                                                                        {taskDueStatus && taskDueStatus.status !== 'ok' && (
                                                                            <span className={`text-xs ${taskDueStatus.color}`}>
                                                                                {taskDueStatus.status === 'overdue' ? '⚠️' : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No hay tareas. Agregá una arriba.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ===== COMMENTS TAB ===== */}
                        <TabsContent value="comments" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {/* Comment input */}
                                    <div className="flex gap-2 mb-4">
                                        <Textarea
                                            placeholder="Escribí un comentario..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            disabled={submittingComment}
                                            rows={2}
                                            className="resize-none"
                                        />
                                        <Button
                                            onClick={addComment}
                                            disabled={submittingComment || !newComment.trim()}
                                            size="icon"
                                            className="self-end"
                                        >
                                            {submittingComment ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Comments list */}
                                    {comments.length > 0 ? (
                                        <div className="space-y-4">
                                            {comments.map((comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={comment.created_by?.avatar_url} />
                                                        <AvatarFallback className="text-xs bg-muted">
                                                            {comment.created_by
                                                                ? getInitials(comment.created_by.full_name)
                                                                : '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm text-foreground">
                                                                {comment.created_by?.full_name || 'Usuario'}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(comment.created_at), {
                                                                    addSuffix: true,
                                                                    locale: es
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No hay comentarios. Sé el primero en comentar.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ===== ACTIVITY TAB ===== */}
                        <TabsContent value="activity" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {tema.activity && tema.activity.length > 0 ? (
                                        <div className="space-y-4">
                                            {tema.activity
                                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .map((activity) => (
                                                    <div key={activity.id} className="flex gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={activity.user?.avatar_url} />
                                                            <AvatarFallback className="text-xs bg-muted">
                                                                {activity.user ? getInitials(activity.user.full_name) : '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-sm text-foreground">
                                                                    {activity.user?.full_name || 'Sistema'}
                                                                </span>
                                                                <span className="text-muted-foreground text-sm">
                                                                    {ACTION_LABELS[activity.action] || activity.action}
                                                                </span>
                                                                {activity.action === 'status_changed' && activity.new_value && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {STATUS_CONFIG[activity.new_value]?.label || activity.new_value}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDistanceToNow(new Date(activity.created_at), {
                                                                    addSuffix: true,
                                                                    locale: es
                                                                })}
                                                            </p>
                                                            {activity.comment && (
                                                                <p className="text-sm text-foreground/80 mt-2 bg-muted/50 p-2 rounded">
                                                                    {activity.comment}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            Sin actividad registrada
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* ==================== RIGHT SIDEBAR ==================== */}
                <div className="space-y-6">
                    {/* Client Card */}
                    {tema.client && (
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Cliente Asociado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="font-semibold text-foreground">{tema.client.name}</p>
                                {tema.client.cuit && (
                                    <p className="text-sm text-muted-foreground">CUIT: {tema.client.cuit}</p>
                                )}
                                {tema.client.email && (
                                    <p className="text-sm text-muted-foreground">{tema.client.email}</p>
                                )}
                                {tema.client.phone && (
                                    <p className="text-sm text-muted-foreground">{tema.client.phone}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Assignees Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Responsables
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tema.assignees && tema.assignees.length > 0 ? (
                                <div className="space-y-3">
                                    {tema.assignees
                                        .sort((a, b) => (b.is_lead ? 1 : 0) - (a.is_lead ? 1 : 0))
                                        .map((assignee) => (
                                            <div key={assignee.id} className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={assignee.user.avatar_url} />
                                                    <AvatarFallback className="text-xs bg-muted">
                                                        {getInitials(assignee.user.full_name || assignee.user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <p className="font-medium text-sm truncate text-foreground">
                                                            {assignee.user.full_name || assignee.user.email}
                                                        </p>
                                                        {assignee.is_lead && (
                                                            <Star className="h-4 w-4 text-primary fill-primary" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {assignee.is_lead ? 'Líder' : assignee.role}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-2">
                                    Sin responsables asignados
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Details Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Creado</span>
                                <span className="text-foreground">{format(new Date(tema.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Actualizado</span>
                                <span className="text-foreground">{formatDistanceToNow(new Date(tema.updated_at), { addSuffix: true, locale: es })}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Creado por</span>
                                <span className="text-foreground">{tema.created_by_user?.full_name || '-'}</span>
                            </div>
                            {tema.due_date && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Vencimiento
                                        </span>
                                        <span className={dueDateStatus?.status === 'overdue' ? 'text-destructive font-medium' : 'text-foreground'}>
                                            {format(new Date(tema.due_date), 'dd/MM/yyyy', { locale: es })}
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
