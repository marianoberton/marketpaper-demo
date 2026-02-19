'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { TemasNav } from '../components/temas-nav'
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Calendar,
    Users,
    FolderOpen,
    Building2,
    Star,
    ListChecks,
    FolderKanban,
    CheckCircle2,
    FileCode2,
} from 'lucide-react'

interface TemplateTask {
    orden: number
    titulo: string
    tipo?: string
    asignado_default?: string
    checklist?: string[]
    dias_estimados?: number
    assigned_to?: string
    due_date?: string
    enabled: boolean
}

interface TemaType {
    id: string
    name: string
    color: string
    area_id?: string
    tareas_template?: TemplateTask[]
    gerencia?: string
    categoria?: string
}

interface Project {
    id: string
    name: string
    client_id?: string
    gerencia?: string
}

interface TemaArea {
    id: string
    name: string
    color: string
}

interface User {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    role?: string
}

interface Client {
    id: string
    name: string
    email?: string
    phone?: string
    cuit?: string
}

const ORGANISMO_OPTIONS = [
    { value: 'DGROC', label: 'DGROC' },
    { value: 'AGC', label: 'AGC' },
    { value: 'otro', label: 'Otro' },
]

const STATUS_OPTIONS = [
    { value: 'nuevo_expediente', label: 'Nuevo Expediente' },
    { value: 'caratulado', label: 'Caratulado' },
    { value: 'seguimiento', label: 'Seguimiento' },
    { value: 'subsanacion', label: 'Subsanación' },
    { value: 'observado', label: 'Observado' },
    { value: 'subsanacion_cerrada', label: 'Subsanación Cerrada' },
    { value: 'completado', label: 'Completado' },
    { value: 'finalizado', label: 'Finalizado' },
]

const PRIORITY_OPTIONS = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
]

export default function NuevoTemaClientPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const companyId = searchParams.get('company_id')

    const [loading, setLoading] = useState(false)
    const [types, setTypes] = useState<TemaType[]>([])
    const [areas, setAreas] = useState<TemaArea[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingData, setLoadingData] = useState(true)

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [referenceCode, setReferenceCode] = useState('')
    const [typeId, setTypeId] = useState('')
    const [status, setStatus] = useState('nuevo_expediente')
    const [priority, setPriority] = useState('media')
    const [dueDate, setDueDate] = useState('')
    const [notes, setNotes] = useState('')
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
    const [leadAssignee, setLeadAssignee] = useState<string>('')
    const [areaId, setAreaId] = useState<string>('')
    const [expedienteNumber, setExpedienteNumber] = useState('')
    const [organismo, setOrganismo] = useState('')
    const [clientId, setClientId] = useState('')
    const [projectId, setProjectId] = useState(searchParams.get('project_id') || '')
    const [dependsOnTemaId, setDependsOnTemaId] = useState('')
    const [projectTemas, setProjectTemas] = useState<{ id: string; title: string; sequential_order: number | null }[]>([])

    // Template tasks state
    const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([])
    // Track if title was auto-filled from template (to allow replacement when switching)
    const [titleAutoFilled, setTitleAutoFilled] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    // Fetch project temas when project changes (for dependency selector)
    useEffect(() => {
        if (projectId && projectId !== 'none') {
            fetch(`/api/workspace/temas/projects/${projectId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.project?.temas) {
                        setProjectTemas(data.project.temas.map((t: any) => ({
                            id: t.id,
                            title: t.title,
                            sequential_order: t.sequential_order
                        })))
                    }
                })
                .catch(() => setProjectTemas([]))
        } else {
            setProjectTemas([])
            setDependsOnTemaId('')
        }
    }, [projectId])

    const fetchInitialData = async () => {
        try {
            setLoadingData(true)

            // Fetch types
            const typesResponse = await fetch('/api/workspace/temas/types')
            const typesData = await typesResponse.json()
            if (typesData.success) {
                setTypes(typesData.types || [])
            }

            // Fetch areas
            const areasResponse = await fetch('/api/workspace/temas/areas')
            const areasData = await areasResponse.json()
            if (areasData.success) {
                setAreas(areasData.areas || [])
            }

            // Fetch company users via API
            const usersResponse = await fetch('/api/workspace/users')
            const usersData = await usersResponse.json()
            if (usersData.success) {
                setUsers(usersData.users || [])
            }

            // Fetch company clients via API
            const clientsResponse = await fetch('/api/workspace/temas/clients')
            const clientsData = await clientsResponse.json()
            if (clientsData.success) {
                setClients(clientsData.clients || [])
            }

            // Fetch projects
            const projectsResponse = await fetch('/api/workspace/temas/projects')
            const projectsData = await projectsResponse.json()
            if (projectsData.success) {
                setProjects(projectsData.projects || [])
            }
        } catch (error) {
            console.error('Error fetching initial data:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const handleTypeChange = (newTypeId: string) => {
        setTypeId(newTypeId)
        const selectedType = types.find(t => t.id === newTypeId)
        if (selectedType) {
            // Auto-fill title from template name if empty or was previously auto-filled
            if (!title.trim() || titleAutoFilled) {
                setTitle(selectedType.name)
                setTitleAutoFilled(true)
            }
            if (selectedType.tareas_template && selectedType.tareas_template.length > 0) {
                setTemplateTasks(selectedType.tareas_template.map(t => ({
                    ...t,
                    enabled: true
                })))
            } else {
                setTemplateTasks([])
            }
        } else {
            setTemplateTasks([])
        }
    }

    const handleTitleChange = (val: string) => {
        setTitle(val)
        // Once user manually edits, stop auto-filling
        if (titleAutoFilled && val !== types.find(t => t.id === typeId)?.name) {
            setTitleAutoFilled(false)
        }
    }

    const toggleTemplateTask = (index: number) => {
        setTemplateTasks(prev => prev.map((t, i) =>
            i === index ? { ...t, enabled: !t.enabled } : t
        ))
    }

    const updateTemplateTaskAssignee = (index: number, userId: string) => {
        setTemplateTasks(prev => prev.map((t, i) =>
            i === index ? { ...t, assigned_to: userId === 'unassigned' ? undefined : userId } : t
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            alert('El título es requerido')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/workspace/temas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    reference_code: referenceCode,
                    type_id: typeId || null,
                    area_id: areaId || null,
                    expediente_number: expedienteNumber || null,
                    organismo: organismo || null,
                    status,
                    priority,
                    due_date: dueDate || null,
                    notes,
                    assignee_ids: selectedAssignees,
                    lead_assignee_id: leadAssignee || null,
                    client_id: clientId && clientId.length > 0 ? clientId : null,
                    project_id: (projectId && projectId !== 'none') ? projectId : null,
                    depends_on_tema_id: dependsOnTemaId || null,
                    sequential_order: projectTemas.length > 0 ? projectTemas.length + 1 : null,
                    tasks_from_template: templateTasks
                        .filter(t => t.enabled)
                        .map(t => ({
                            titulo: t.titulo,
                            tipo: t.tipo,
                            orden: t.orden,
                            checklist: t.checklist || [],
                            assigned_to: t.assigned_to || null,
                            due_date: t.due_date || null
                        }))
                })
            })

            const data = await response.json()

            if (data.success && data.tema?.id) {
                router.push(`/workspace/temas/${data.tema.id}${companyId ? `?company_id=${companyId}` : ''}`)
            } else if (data.success) {
                // Tema created but no id returned - go to list
                router.push(`/workspace/temas${companyId ? `?company_id=${companyId}` : ''}`)
            } else {
                toast.error(data.error || 'Error al crear el tema')
            }
        } catch (error) {
            console.error('Error creating tema:', error)
            toast.error('Error al crear el tema')
        } finally {
            setLoading(false)
        }
    }

    const toggleAssignee = (userId: string) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
        // Clear lead if removed from assignees
        if (leadAssignee === userId) {
            setLeadAssignee('')
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <TemasNav />
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/workspace/temas${companyId ? `?company_id=${companyId}` : ''}`)}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nuevo Tema</h1>
                    <p className="text-muted-foreground">Crear un nuevo expediente o tema de seguimiento</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {/* Catálogo de Templates */}
                    {types.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileCode2 className="h-5 w-5" />
                                    Seleccionar Template de Trámite
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Elegí un template para cargar las tareas automáticamente, o completá el formulario sin template.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {types.map((type) => {
                                        const taskCount = Array.isArray(type.tareas_template) ? type.tareas_template.length : 0
                                        const isSelected = typeId === type.id
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => handleTypeChange(type.id)}
                                                className={`relative text-left p-4 rounded-lg border-2 transition-all hover:border-primary/50 focus:outline-none ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border bg-card hover:bg-muted/30'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
                                                )}
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                                        style={{ backgroundColor: type.color || '#6B7280' }}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className={`font-medium text-sm leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                            {type.name}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {type.gerencia && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                                                    {type.gerencia}
                                                                </Badge>
                                                            )}
                                                            {taskCount > 0 && (
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                    <ListChecks className="h-2.5 w-2.5" />
                                                                    {taskCount} tareas
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                    {/* Sin template option */}
                                    <button
                                        type="button"
                                        onClick={() => { setTypeId(''); setTemplateTasks([]); setTitleAutoFilled(false) }}
                                        className={`text-left p-4 rounded-lg border-2 transition-all hover:border-border focus:outline-none ${
                                            typeId === ''
                                                ? 'border-border bg-muted/30'
                                                : 'border-border/50 bg-card hover:bg-muted/20'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-3 h-3 rounded-full mt-1 bg-muted-foreground/30 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-sm text-muted-foreground">Sin template</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">Crear tema manualmente</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Información básica */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderOpen className="h-5 w-5" />
                                Información del Tema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="title">Título *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Nombre del tema o expediente"
                                        value={title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference">Número de Referencia</Label>
                                    <Input
                                        id="reference"
                                        placeholder="Ej: EXP-2024-001"
                                        value={referenceCode}
                                        onChange={(e) => setReferenceCode(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="area">Área</Label>
                                    <Select value={areaId} onValueChange={setAreaId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar área..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {areas.map((area) => (
                                                <SelectItem key={area.id} value={area.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-3 w-3" style={{ color: area.color }} />
                                                        {area.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expediente">N° Expediente</Label>
                                    <Input
                                        id="expediente"
                                        placeholder="Ej: 123456-2024"
                                        value={expedienteNumber}
                                        onChange={(e) => setExpedienteNumber(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="organismo">Organismo</Label>
                                    <Select value={organismo} onValueChange={setOrganismo}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar organismo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORGANISMO_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client">Cliente Asociado</Label>
                                    <Select value={clientId} onValueChange={setClientId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar cliente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    <div className="flex flex-col">
                                                        <span>{client.name}</span>
                                                        {client.cuit && (
                                                            <span className="text-xs text-muted-foreground">CUIT: {client.cuit}</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project">Proyecto</Label>
                                    <Select value={projectId} onValueChange={setProjectId}>
                                        <SelectTrigger>
                                            <FolderKanban className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder="Sin proyecto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin proyecto</SelectItem>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Dependency selector - only shown when project is selected */}
                                {projectId && projectId !== 'none' && projectTemas.length > 0 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="depends_on">Tema anterior (dependencia)</Label>
                                        <Select value={dependsOnTemaId} onValueChange={setDependsOnTemaId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin dependencia..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin dependencia</SelectItem>
                                                {projectTemas.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.sequential_order ? `#${t.sequential_order} ` : ''}{t.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Este tema no podra iniciar hasta que el tema seleccionado se complete</p>
                                    </div>
                                )}

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Descripción detallada del tema..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estado y Prioridad */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Estado y Plazos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Estado inicial</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
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

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Prioridad</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITY_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas adicionales</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Notas internas..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Responsables */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Responsables
                            </CardTitle>
                            <CardDescription>
                                Selecciona los usuarios responsables. Haz clic en la estrella para marcar al líder.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingData ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No hay usuarios disponibles</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAssignees.includes(user.id)
                                                ? 'bg-primary/10 border-primary/30'
                                                : 'hover:bg-muted'
                                                }`}
                                            onClick={() => toggleAssignee(user.id)}
                                        >
                                            <Checkbox
                                                checked={selectedAssignees.includes(user.id)}
                                                onCheckedChange={() => toggleAssignee(user.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-foreground">
                                                    {user.full_name || user.email}
                                                </p>
                                                {user.full_name && (
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                )}
                                            </div>
                                            {selectedAssignees.includes(user.id) && (
                                                <button
                                                    type="button"
                                                    className={`p-1 rounded-full transition-colors ${leadAssignee === user.id
                                                        ? 'text-primary bg-primary/20'
                                                        : 'text-muted-foreground hover:text-primary'
                                                        }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setLeadAssignee(leadAssignee === user.id ? '' : user.id)
                                                    }}
                                                    title={leadAssignee === user.id ? 'Quitar líder' : 'Marcar como líder'}
                                                >
                                                    <Star className={`h-4 w-4 ${leadAssignee === user.id ? 'fill-current' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Template Tasks Preview */}
                    {templateTasks.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ListChecks className="h-5 w-5" />
                                    Tareas del Template ({templateTasks.filter(t => t.enabled).length}/{templateTasks.length})
                                </CardTitle>
                                <CardDescription>
                                    Estas tareas se crean automaticamente. Podes desactivar o asignar cada una.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {templateTasks.map((task, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                task.enabled
                                                    ? 'bg-card border-border'
                                                    : 'bg-muted/30 border-border/50 opacity-60'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={task.enabled}
                                                onCheckedChange={() => toggleTemplateTask(index)}
                                            />
                                            <span className="text-sm text-muted-foreground w-6">
                                                {task.orden}.
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${task.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                                    {task.titulo}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {task.tipo === 'esperando_cliente' && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-accent-foreground/30 text-accent-foreground">
                                                            Esperando cliente
                                                        </Badge>
                                                    )}
                                                    {task.checklist && task.checklist.length > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {task.checklist.length} items checklist
                                                        </span>
                                                    )}
                                                    {task.dias_estimados && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ~{task.dias_estimados}d
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {task.enabled && (
                                                <Select
                                                    value={task.assigned_to || 'unassigned'}
                                                    onValueChange={(v) => updateTemplateTaskAssignee(index, v)}
                                                >
                                                    <SelectTrigger className="w-[150px] h-8 text-xs">
                                                        <SelectValue placeholder="Asignar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                                                        {users.map((u) => (
                                                            <SelectItem key={u.id} value={u.id}>
                                                                {u.full_name || u.email}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/workspace/temas${companyId ? `?company_id=${companyId}` : ''}`)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Crear Tema
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
