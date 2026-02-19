'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Card,
    CardContent,
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    CheckCircle2,
    Clock,
    ListTodo,
    RefreshCw,
    Calendar,
    CircleDot,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    UserCheck,
} from 'lucide-react'

interface Task {
    id: string
    title: string
    description: string | null
    status: string
    task_type: string | null
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
        project: { id: string; name: string } | null
    } | null
}

interface Stats {
    total: number
    pendientes: number
    enProgreso: number
    completadas: number
}

type UrgencyGroup = 'overdue' | 'today' | 'this_week' | 'upcoming'

interface UrgencySection {
    key: UrgencyGroup
    label: string
    icon: React.ReactNode
    headerClass: string
    countClass: string
    tasks: Task[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'En Progreso', color: 'bg-primary/20 text-primary border border-primary/30' },
    completed: { label: 'Completada', color: 'bg-foreground/10 text-foreground/70' },
    blocked: { label: 'Bloqueada', color: 'bg-destructive/10 text-destructive border border-destructive/20' },
}

function getToday(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function classifyTask(task: Task): UrgencyGroup {
    if (!task.due_date) return 'upcoming'

    const today = getToday()
    const due = new Date(task.due_date + 'T00:00:00')
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

    const diffMs = dueDay.getTime() - today.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays <= 7) return 'this_week'
    return 'upcoming'
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
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

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
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
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

    const toggleSection = (key: string) => {
        setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Sin fecha'
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
        })
    }

    const getDueDateColorClass = (task: Task): string => {
        if (!task.due_date) return 'text-muted-foreground'
        const group = classifyTask(task)
        switch (group) {
            case 'overdue': return 'text-destructive'
            case 'today': return 'text-accent-foreground'
            case 'this_week': return 'text-primary'
            default: return 'text-muted-foreground'
        }
    }

    const urgencySections: UrgencySection[] = useMemo(() => {
        const groups: Record<UrgencyGroup, Task[]> = {
            overdue: [],
            today: [],
            this_week: [],
            upcoming: [],
        }

        tasks.forEach(task => {
            const group = classifyTask(task)
            groups[group].push(task)
        })

        const sections: UrgencySection[] = [
            {
                key: 'overdue',
                label: 'Vencidas',
                icon: <AlertTriangle className="h-4 w-4" />,
                headerClass: 'bg-destructive/10 text-destructive border-destructive/20',
                countClass: 'bg-destructive/20 text-destructive',
                tasks: groups.overdue,
            },
            {
                key: 'today',
                label: 'Hoy',
                icon: <Clock className="h-4 w-4" />,
                headerClass: 'bg-accent/10 text-accent-foreground border-accent/20',
                countClass: 'bg-accent/20 text-accent-foreground',
                tasks: groups.today,
            },
            {
                key: 'this_week',
                label: 'Esta semana',
                icon: <Calendar className="h-4 w-4" />,
                headerClass: 'bg-primary/10 text-primary border-primary/20',
                countClass: 'bg-primary/20 text-primary',
                tasks: groups.this_week,
            },
            {
                key: 'upcoming',
                label: 'Proximas',
                icon: <Calendar className="h-4 w-4" />,
                headerClass: 'bg-muted text-muted-foreground border-border',
                countClass: 'bg-muted text-muted-foreground',
                tasks: groups.upcoming,
            },
        ]

        return sections.filter(s => s.tasks.length > 0)
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
                                <SelectItem value="pending">Pendientes</SelectItem>
                                <SelectItem value="in_progress">En Progreso</SelectItem>
                                <SelectItem value="completed">Completadas</SelectItem>
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

            {/* Task List grouped by urgency */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : tasks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mb-4 text-primary/50" />
                        <p className="text-lg font-medium text-foreground">Sin tareas pendientes</p>
                        <p className="text-sm">No tenes tareas asignadas en este momento</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {urgencySections.map((section) => {
                        const isCollapsed = collapsedSections[section.key] ?? false

                        return (
                            <Collapsible
                                key={section.key}
                                open={!isCollapsed}
                                onOpenChange={() => toggleSection(section.key)}
                            >
                                <div className="rounded-xl border border-border overflow-hidden">
                                    {/* Section Header */}
                                    <CollapsibleTrigger asChild>
                                        <button
                                            className={`w-full flex items-center justify-between px-4 py-3 border-b ${section.headerClass} transition-colors hover:opacity-90`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCollapsed ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                                {section.icon}
                                                <span className="font-semibold text-sm">
                                                    {section.label}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.countClass}`}>
                                                {section.tasks.length}
                                            </span>
                                        </button>
                                    </CollapsibleTrigger>

                                    {/* Section Content */}
                                    <CollapsibleContent>
                                        <div className="divide-y divide-border bg-card">
                                            {section.tasks.map((task) => {
                                                const isCompleted = task.status === 'completed'
                                                const isUpdating = updatingTask === task.id
                                                const dueDateColor = getDueDateColorClass(task)

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                                            isCompleted
                                                                ? 'opacity-60'
                                                                : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <Checkbox
                                                            checked={isCompleted}
                                                            disabled={isUpdating}
                                                            onCheckedChange={() => toggleTaskComplete(task.id, task.status)}
                                                            className={`shrink-0 ${isUpdating ? 'opacity-50' : ''}`}
                                                        />

                                                        {/* Task info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-sm font-medium ${
                                                                    isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                                                                }`}>
                                                                    {task.title}
                                                                </span>
                                                                {task.task_type === 'esperando_cliente' && (
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-accent/40 text-accent-foreground">
                                                                        <UserCheck className="h-3 w-3 mr-1" />
                                                                        Esperando cliente
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {/* Tema context row */}
                                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                {task.tema && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            router.push(`/workspace/temas/${task.tema!.id}${companyId ? `?company_id=${companyId}` : ''}`)
                                                                        }}
                                                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                                    >
                                                                        <FolderOpen className="h-3 w-3 shrink-0" />
                                                                        <span className="truncate max-w-[200px]">{task.tema.title}</span>
                                                                    </button>
                                                                )}
                                                                {task.tema?.type && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[10px] px-1.5 py-0 h-4"
                                                                        style={{ borderColor: task.tema.type.color, color: task.tema.type.color }}
                                                                    >
                                                                        {task.tema.type.name}
                                                                    </Badge>
                                                                )}
                                                                {task.tema?.project && (
                                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                        {task.tema.project.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Due date */}
                                                        <div className={`flex items-center gap-1 text-xs shrink-0 ${dueDateColor}`}>
                                                            {classifyTask(task) === 'overdue' && <AlertTriangle className="h-3 w-3" />}
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{formatDate(task.due_date)}</span>
                                                        </div>

                                                        {/* Status badge */}
                                                        <Badge className={`shrink-0 text-[10px] ${STATUS_CONFIG[task.status]?.color || 'bg-muted text-muted-foreground'}`}>
                                                            {STATUS_CONFIG[task.status]?.label || task.status}
                                                        </Badge>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
