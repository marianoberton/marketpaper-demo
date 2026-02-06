'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    CheckCircle2,
    Clock,
    ListTodo,
    RefreshCw,
    Calendar,
    ArrowRight,
    CircleDot,
    AlertTriangle
} from 'lucide-react'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    due_date: string | null
    sort_order: number
    created_at: string
    completed_at: string | null
    tema: {
        id: string
        title: string
        reference_code: string
        status: string
        priority: string
        type: { id: string; name: string; color: string } | null
    } | null
}

interface Stats {
    total: number
    pendientes: number
    enProgreso: number
    completadas: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
    en_progreso: { label: 'En Progreso', color: 'bg-primary/20 text-primary border border-primary/30' },
    completada: { label: 'Completada', color: 'bg-foreground/10 text-foreground/70' },
}

export default function TareasClientPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const companyId = searchParams.get('company_id')

    const [tasks, setTasks] = useState<Task[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, pendientes: 0, enProgreso: 0, completadas: 0 })
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [showCompleted, setShowCompleted] = useState(false)
    const [updatingTask, setUpdatingTask] = useState<string | null>(null)

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (showCompleted) params.set('show_completed', 'true')

            const response = await fetch(`/api/workspace/tareas?${params.toString()}`)
            const data = await response.json()
            if (data.success) {
                setTasks(data.tasks || [])
                setStats(data.stats || { total: 0, pendientes: 0, enProgreso: 0, completadas: 0 })
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [statusFilter, showCompleted])

    const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
        setUpdatingTask(taskId)
        try {
            const newStatus = currentStatus === 'completada' ? 'pendiente' : 'completada'
            const response = await fetch('/api/workspace/tareas', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, status: newStatus })
            })

            const data = await response.json()
            if (data.success) {
                fetchTasks()
            }
        } catch (error) {
            console.error('Error toggling task:', error)
        } finally {
            setUpdatingTask(null)
        }
    }

    const getDueDateStatus = (dueDate: string | null) => {
        if (!dueDate) return null

        const due = new Date(dueDate)
        const now = new Date()
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { status: 'overdue', label: 'Vencida', color: 'text-destructive' }
        if (diffDays === 0) return { status: 'today', label: 'Hoy', color: 'text-primary' }
        if (diffDays <= 2) return { status: 'soon', label: `${diffDays}d`, color: 'text-accent-foreground' }
        return { status: 'ok', label: `${diffDays}d`, color: 'text-muted-foreground' }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short'
        })
    }

    // Agrupar tareas por tema
    const groupedTasks = useMemo(() => {
        const groups: Record<string, { tema: Task['tema'], tasks: Task[] }> = {}

        tasks.forEach(task => {
            const temaId = task.tema?.id || 'sin-tema'
            if (!groups[temaId]) {
                groups[temaId] = { tema: task.tema, tasks: [] }
            }
            groups[temaId].tasks.push(task)
        })

        return Object.values(groups)
    }, [tasks])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ListTodo className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Mis Tareas</h1>
                        <p className="text-muted-foreground">Tareas asignadas a ti en todos los temas</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10">
                                <ListTodo className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pendientes</p>
                                <p className="text-3xl font-bold text-foreground">{stats.pendientes}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-muted">
                                <CircleDot className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">En Progreso</p>
                                <p className="text-3xl font-bold text-primary">{stats.enProgreso}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Clock className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completadas</p>
                                <p className="text-3xl font-bold text-foreground/70">{stats.completadas}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-foreground/5">
                                <CheckCircle2 className="h-8 w-8 text-foreground/50" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="pendiente">Pendientes</SelectItem>
                                <SelectItem value="en_progreso">En Progreso</SelectItem>
                                <SelectItem value="completada">Completadas</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="show-completed"
                                checked={showCompleted}
                                onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                            />
                            <label htmlFor="show-completed" className="text-sm text-muted-foreground cursor-pointer">
                                Mostrar completadas
                            </label>
                        </div>
                        <Button variant="outline" size="icon" onClick={fetchTasks}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : tasks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mb-4 text-primary/50" />
                        <p className="text-lg font-medium text-foreground">¡Sin tareas pendientes!</p>
                        <p className="text-sm">No tenés tareas asignadas en este momento</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {groupedTasks.map((group) => (
                        <Card key={group.tema?.id || 'sin-tema'}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {group.tema?.type && (
                                            <Badge variant="outline" style={{ borderColor: group.tema.type.color, color: group.tema.type.color }}>
                                                {group.tema.type.name}
                                            </Badge>
                                        )}
                                        <CardTitle className="text-base font-medium">
                                            {group.tema?.title || 'Sin tema asociado'}
                                        </CardTitle>
                                    </div>
                                    {group.tema && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => router.push(`/workspace/temas/${group.tema!.id}${companyId ? `?company_id=${companyId}` : ''}`)}
                                        >
                                            Ver tema
                                            <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2">
                                    {group.tasks.map((task) => {
                                        const dueDateStatus = getDueDateStatus(task.due_date)
                                        const isCompleted = task.status === 'completada'
                                        const isUpdating = updatingTask === task.id

                                        return (
                                            <div
                                                key={task.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isCompleted
                                                        ? 'bg-muted/50 border-border opacity-70'
                                                        : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
                                                    }`}
                                            >
                                                <Checkbox
                                                    checked={isCompleted}
                                                    disabled={isUpdating}
                                                    onCheckedChange={() => toggleTaskComplete(task.id, task.status)}
                                                    className={isUpdating ? 'opacity-50' : ''}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {task.due_date && (
                                                    <div className={`flex items-center gap-1 text-xs ${dueDateStatus?.color || 'text-muted-foreground'}`}>
                                                        {dueDateStatus?.status === 'overdue' && <AlertTriangle className="h-3 w-3" />}
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(task.due_date)}</span>
                                                    </div>
                                                )}
                                                <Badge className={STATUS_CONFIG[task.status]?.color || 'bg-muted text-muted-foreground'}>
                                                    {STATUS_CONFIG[task.status]?.label || task.status}
                                                </Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
