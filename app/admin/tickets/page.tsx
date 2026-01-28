'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Ticket,
    Search,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Building2,
    User,
    Mail,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from 'lucide-react'

interface TicketData {
    id: string
    subject: string
    description: string
    status: string
    priority: string
    source: string
    created_at: string
    updated_at: string
    external_name: string | null
    external_email: string | null
    external_company: string | null
    category: { id: string; name: string; color: string; icon: string } | null
    company: { id: string; name: string; slug: string } | null
    user: { id: string; full_name: string; email: string; avatar_url: string | null } | null
    messages: { count: number }[]
}

interface Stats {
    total: number
    open: number
    in_progress: number
    waiting_user: number
    resolved: number
    closed: number
    urgent: number
    high: number
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Abierto', color: 'bg-blue-100 text-blue-700', icon: <AlertCircle className="h-3 w-3" /> },
    in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
    waiting_user: { label: 'Esperando Usuario', color: 'bg-purple-100 text-purple-700', icon: <MessageSquare className="h-3 w-3" /> },
    resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700', icon: <XCircle className="h-3 w-3" /> },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'Baja', color: 'bg-green-100 text-green-700 border-green-200' },
}

export default function AdminTicketsPage() {
    const router = useRouter()
    const [tickets, setTickets] = useState<TicketData[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filtros
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Paginación
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchTickets = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', '25')
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (priorityFilter !== 'all') params.set('priority', priorityFilter)
            if (searchQuery) params.set('search', searchQuery)

            const response = await fetch(`/api/admin/tickets?${params.toString()}`)
            const data = await response.json()

            if (data.success) {
                setTickets(data.tickets)
                setStats(data.stats)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)
            } else {
                setError(data.error || 'Error al cargar tickets')
            }
        } catch (err) {
            console.error('Error fetching tickets:', err)
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [page, statusFilter, priorityFilter])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchTickets()
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffHours < 1) return 'Hace unos minutos'
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays < 7) return `Hace ${diffDays} días`

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const getTicketCreator = (ticket: TicketData) => {
        if (ticket.user) {
            return {
                name: ticket.user.full_name || ticket.user.email,
                email: ticket.user.email,
                company: ticket.company?.name || 'Sin empresa',
                isExternal: false
            }
        }
        return {
            name: ticket.external_name || 'Anónimo',
            email: ticket.external_email || '-',
            company: ticket.external_company || 'Externo',
            isExternal: true
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tickets de Soporte</h1>
                    <p className="text-gray-500 mt-1">Gestiona todos los tickets de soporte</p>
                </div>
                <Button onClick={fetchTickets} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="text-2xl font-bold text-blue-700">{stats.open}</div>
                            <div className="text-xs text-blue-600">Abiertos</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-100">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="text-2xl font-bold text-yellow-700">{stats.in_progress}</div>
                            <div className="text-xs text-yellow-600">En Progreso</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-100">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="text-2xl font-bold text-purple-700">{stats.waiting_user}</div>
                            <div className="text-xs text-purple-600">Esperando</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
                            <div className="text-xs text-green-600">Resueltos</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-100">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
                            <div className="text-xs text-red-600">Urgentes</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-100">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
                            <div className="text-xs text-gray-600">Total</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700 block mb-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por asunto, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="w-40">
                            <label className="text-sm font-medium text-gray-700 block mb-1">Estado</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="open">Abiertos</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="waiting_user">Esperando Usuario</SelectItem>
                                    <SelectItem value="resolved">Resueltos</SelectItem>
                                    <SelectItem value="closed">Cerrados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <label className="text-sm font-medium text-gray-700 block mb-1">Prioridad</label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="low">Baja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" variant="secondary">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtrar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                        Lista de Tickets
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({total} tickets)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <p>{error}</p>
                            <Button onClick={fetchTickets} variant="outline" size="sm" className="mt-4">
                                Reintentar
                            </Button>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Ticket className="h-12 w-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No hay tickets</p>
                            <p className="text-sm">Los tickets aparecerán aquí cuando se creen</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Ticket</TableHead>
                                        <TableHead>Creado Por</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map((ticket) => {
                                        const creator = getTicketCreator(ticket)
                                        const status = statusConfig[ticket.status]
                                        const priority = priorityConfig[ticket.priority]
                                        const messageCount = ticket.messages?.[0]?.count || 0

                                        return (
                                            <TableRow
                                                key={ticket.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-gray-900 line-clamp-1">
                                                            {ticket.subject}
                                                        </div>
                                                        <div className="text-xs text-gray-500 line-clamp-1">
                                                            {ticket.description.substring(0, 80)}...
                                                        </div>
                                                        {ticket.source === 'external_form' && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                                Externo
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm font-medium">
                                                            {creator.isExternal ? (
                                                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                            ) : (
                                                                <User className="h-3 w-3 mr-1 text-gray-400" />
                                                            )}
                                                            {creator.name}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <Building2 className="h-3 w-3 mr-1" />
                                                            {creator.company}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${status.color} gap-1`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={priority.color}>
                                                        {priority.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.category ? (
                                                        <span
                                                            className="text-sm px-2 py-1 rounded"
                                                            style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
                                                        >
                                                            {ticket.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-600">
                                                        {formatDate(ticket.created_at)}
                                                    </div>
                                                    {messageCount > 0 && (
                                                        <div className="text-xs text-gray-400 flex items-center mt-1">
                                                            <MessageSquare className="h-3 w-3 mr-1" />
                                                            {messageCount} mensajes
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/admin/tickets/${ticket.id}`)
                                                        }}
                                                    >
                                                        Ver
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        Página {page} de {totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Siguiente
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
