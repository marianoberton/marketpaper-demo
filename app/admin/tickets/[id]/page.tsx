'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    ArrowLeft,
    Send,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Building2,
    User,
    Mail,
    Phone,
    Calendar,
    RefreshCw,
    Lock,
    ExternalLink,
} from 'lucide-react'

interface Message {
    id: string
    ticket_id: string
    sender_type: 'user' | 'admin' | 'external' | 'system'
    sender_id: string | null
    sender_name: string
    sender_email: string | null
    message: string
    is_internal: boolean
    created_at: string
}

interface TicketDetail {
    id: string
    subject: string
    description: string
    status: string
    priority: string
    source: string
    created_at: string
    updated_at: string
    resolved_at: string | null
    closed_at: string | null
    external_name: string | null
    external_email: string | null
    external_company: string | null
    external_phone: string | null
    category: { id: string; name: string; color: string; icon: string } | null
    company: { id: string; name: string } | null
    user: { id: string; full_name: string; email: string; avatar_url: string | null } | null
    messages: Message[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Abierto', color: 'bg-blue-100 text-blue-700', icon: <AlertCircle className="h-4 w-4" /> },
    in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-4 w-4" /> },
    waiting_user: { label: 'Esperando Usuario', color: 'bg-purple-100 text-purple-700', icon: <MessageSquare className="h-4 w-4" /> },
    resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> },
    closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700', icon: <XCircle className="h-4 w-4" /> },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
    medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700' },
    low: { label: 'Baja', color: 'bg-green-100 text-green-700' },
}

export default function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [ticket, setTicket] = useState<TicketDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [newMessage, setNewMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [sending, setSending] = useState(false)

    const [updatingStatus, setUpdatingStatus] = useState(false)

    const fetchTicket = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/workspace/tickets/${id}`)
            const data = await response.json()

            if (data.success) {
                setTicket(data.ticket)
            } else {
                setError(data.error || 'Error al cargar ticket')
            }
        } catch (err) {
            console.error('Error fetching ticket:', err)
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTicket()
    }, [id])

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [ticket?.messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !ticket) return

        try {
            setSending(true)
            const response = await fetch(`/api/workspace/tickets/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage.trim(),
                    is_internal: isInternal
                })
            })

            const data = await response.json()

            if (data.success) {
                setNewMessage('')
                setIsInternal(false)
                fetchTicket() // Refetch to get updated messages
            } else {
                alert(data.error || 'Error al enviar mensaje')
            }
        } catch (err) {
            console.error('Error sending message:', err)
            alert('Error de conexión')
        } finally {
            setSending(false)
        }
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!ticket) return

        try {
            setUpdatingStatus(true)
            const response = await fetch(`/api/workspace/tickets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            const data = await response.json()

            if (data.success) {
                setTicket({ ...ticket, status: newStatus })
            } else {
                alert(data.error || 'Error al actualizar estado')
            }
        } catch (err) {
            console.error('Error updating status:', err)
            alert('Error de conexión')
        } finally {
            setUpdatingStatus(false)
        }
    }

    const handleUpdatePriority = async (newPriority: string) => {
        if (!ticket) return

        try {
            const response = await fetch(`/api/workspace/tickets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority })
            })

            const data = await response.json()

            if (data.success) {
                setTicket({ ...ticket, priority: newPriority })
            } else {
                alert(data.error || 'Error al actualizar prioridad')
            }
        } catch (err) {
            console.error('Error updating priority:', err)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getCreatorInfo = () => {
        if (!ticket) return null

        if (ticket.user) {
            return {
                name: ticket.user.full_name || ticket.user.email,
                email: ticket.user.email,
                company: ticket.company?.name,
                isExternal: false
            }
        }

        return {
            name: ticket.external_name || 'Anónimo',
            email: ticket.external_email,
            company: ticket.external_company,
            phone: ticket.external_phone,
            isExternal: true
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error || !ticket) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-red-500 text-lg">{error || 'Ticket no encontrado'}</p>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
            </div>
        )
    }

    const status = statusConfig[ticket.status]
    const priority = priorityConfig[ticket.priority]
    const creator = getCreatorInfo()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
                        {ticket.source === 'external_form' && (
                            <Badge variant="outline" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Externo
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Ticket #{ticket.id.substring(0, 8)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Messages */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Original Description */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Descripción Original
                                </CardTitle>
                                <span className="text-xs text-gray-400">
                                    {formatDate(ticket.created_at)}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                        </CardContent>
                    </Card>

                    {/* Messages */}
                    <Card className="flex flex-col" style={{ minHeight: '400px' }}>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Conversación
                                <Badge variant="secondary" className="ml-2">
                                    {ticket.messages.length} mensajes
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
                            {ticket.messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <MessageSquare className="h-12 w-12 mb-2" />
                                    <p>Sin mensajes aún</p>
                                </div>
                            ) : (
                                ticket.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${msg.sender_type === 'admin'
                                                    ? msg.is_internal
                                                        ? 'bg-amber-50 border border-amber-200'
                                                        : 'bg-blue-500 text-white'
                                                    : 'bg-gray-100'
                                                }`}
                                        >
                                            {msg.is_internal && (
                                                <div className="flex items-center gap-1 text-amber-600 text-xs mb-1">
                                                    <Lock className="h-3 w-3" />
                                                    Nota interna
                                                </div>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                            <div className={`text-xs mt-2 flex items-center justify-between ${msg.sender_type === 'admin' && !msg.is_internal ? 'text-blue-100' : 'text-gray-400'
                                                }`}>
                                                <span>{msg.sender_name}</span>
                                                <span>{formatDate(msg.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>

                        {/* Reply Box */}
                        <div className="p-4 border-t bg-gray-50">
                            <Textarea
                                placeholder="Escribe tu respuesta..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="min-h-[80px] mb-3"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        handleSendMessage()
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <Checkbox
                                        checked={isInternal}
                                        onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                                    />
                                    <Lock className="h-3 w-3" />
                                    Nota interna (solo visible para admins)
                                </label>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sending}
                                >
                                    {sending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Status & Priority */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Estado y Prioridad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Estado</label>
                                <Select
                                    value={ticket.status}
                                    onValueChange={handleUpdateStatus}
                                    disabled={updatingStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-blue-500" />
                                                Abierto
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-yellow-500" />
                                                En Progreso
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="waiting_user">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-purple-500" />
                                                Esperando Usuario
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="resolved">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                Resuelto
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="closed">
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-gray-500" />
                                                Cerrado
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Prioridad</label>
                                <Select value={ticket.priority} onValueChange={handleUpdatePriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="urgent">🔴 Urgente</SelectItem>
                                        <SelectItem value="high">🟠 Alta</SelectItem>
                                        <SelectItem value="medium">🟡 Media</SelectItem>
                                        <SelectItem value="low">🟢 Baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {ticket.category && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Categoría</label>
                                    <Badge
                                        variant="outline"
                                        style={{ backgroundColor: `${ticket.category.color}20`, borderColor: ticket.category.color }}
                                    >
                                        {ticket.category.name}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Creator Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Información del Usuario</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {creator && (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span>{creator.name}</span>
                                        {creator.isExternal && (
                                            <Badge variant="outline" className="text-xs">Externo</Badge>
                                        )}
                                    </div>
                                    {creator.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <a href={`mailto:${creator.email}`} className="text-blue-600 hover:underline">
                                                {creator.email}
                                            </a>
                                        </div>
                                    )}
                                    {creator.company && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <span>{creator.company}</span>
                                        </div>
                                    )}
                                    {creator.isExternal && (creator as any).phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{(creator as any).phone}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Fechas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div>
                                    <div className="text-gray-500">Creado</div>
                                    <div>{formatDate(ticket.created_at)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <div>
                                    <div className="text-gray-500">Última actualización</div>
                                    <div>{formatDate(ticket.updated_at)}</div>
                                </div>
                            </div>
                            {ticket.resolved_at && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <div>
                                        <div className="text-gray-500">Resuelto</div>
                                        <div>{formatDate(ticket.resolved_at)}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
