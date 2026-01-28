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
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Calendar,
    Users,
    FolderOpen,
    Building2,
    Star
} from 'lucide-react'

interface TemaType {
    id: string
    name: string
    color: string
    area_id?: string
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

    useEffect(() => {
        fetchInitialData()
    }, [])

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
        } catch (error) {
            console.error('Error fetching initial data:', error)
        } finally {
            setLoadingData(false)
        }
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
                    client_id: clientId && clientId.length > 0 ? clientId : null
                })
            })

            const data = await response.json()

            if (data.success && data.tema?.id) {
                router.push(`/workspace/temas/${data.tema.id}${companyId ? `?company_id=${companyId}` : ''}`)
            } else if (data.success) {
                // Tema created but no id returned - go to list
                router.push(`/workspace/temas${companyId ? `?company_id=${companyId}` : ''}`)
            } else {
                alert(data.error || 'Error al crear el tema')
            }
        } catch (error) {
            console.error('Error creating tema:', error)
            alert('Error al crear el tema')
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
                    <h1 className="text-2xl font-bold text-gray-900">Nuevo Tema</h1>
                    <p className="text-gray-500">Crear un nuevo expediente o tema de seguimiento</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
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
                                        onChange={(e) => setTitle(e.target.value)}
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
                                    <Label htmlFor="type">Tipo</Label>
                                    <Select value={typeId} onValueChange={setTypeId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: type.color }}
                                                        />
                                                        {type.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                                            <span className="text-xs text-gray-500">CUIT: {client.cuit}</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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
                                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay usuarios disponibles</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAssignees.includes(user.id)
                                                ? 'bg-blue-50 border-blue-300'
                                                : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleAssignee(user.id)}
                                        >
                                            <Checkbox
                                                checked={selectedAssignees.includes(user.id)}
                                                onCheckedChange={() => toggleAssignee(user.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {user.full_name || user.email}
                                                </p>
                                                {user.full_name && (
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                )}
                                            </div>
                                            {selectedAssignees.includes(user.id) && (
                                                <button
                                                    type="button"
                                                    className={`p-1 rounded-full transition-colors ${leadAssignee === user.id
                                                        ? 'text-yellow-500 bg-yellow-100'
                                                        : 'text-gray-300 hover:text-yellow-400'
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
