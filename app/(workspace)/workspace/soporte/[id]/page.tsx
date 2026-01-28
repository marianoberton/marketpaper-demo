'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft,
    Send,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Calendar,
    RefreshCw,
    User,
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
    created_at: string
    updated_at: string
    resolved_at: string | null
    category: { id: string; name: string; color: string; icon: string } | null
    messages: Message[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    open: {
        label: 'Abierto',
        color: 'bg-blue-100 text-blue-700',
        icon: <AlertCircle className="h-4 w-4" />,
        description: 'Tu ticket está siendo revisado por nuestro equipo'
    },
    in_progress: {
        label: 'En Progreso',
        color: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className="h-4 w-4" />,
        description: 'Estamos trabajando en tu solicitud'
    },
    waiting_user: {
        label: 'Esperando tu Respuesta',
        color: 'bg-purple-100 text-purple-700',
        icon: <MessageSquare className="h-4 w-4" />,
        description: 'Te hemos respondido, por favor revisa y responde'
    },
    resolved: {
        label: 'Resuelto',
        color: 'bg-green-100 text-green-700',
        icon: <CheckCircle2 className="h-4 w-4" />,
        description: 'Este ticket ha sido resuelto'
    },
    closed: {
        label: 'Cerrado',
        color: 'bg-gray-100 text-gray-700',
        icon: <XCircle className="h-4 w-4" />,
        description: 'Este ticket ha sido cerrado'
    },
}

const priorityConfig: Record<string, { label: string; emoji: string }> = {
    urgent: { label: 'Urgente', emoji: '🔴' },
    high: { label: 'Alta', emoji: '🟠' },
    medium: { label: 'Media', emoji: '🟡' },
    low: { label: 'Baja', emoji: '🟢' },
}

export default function WorkspaceTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [ticket, setTicket] = useState<TicketDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [ticket?.messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !ticket) return

        try {
            setSending(true)
            const response = await fetch(`/api/workspace/tickets/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage.trim() })
            })

            const data = await response.json()

            if (data.success) {
                setNewMessage('')
                fetchTicket()
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()

        if (isToday) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
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
            <div className="flex flex-col items-center justify-center h-96 p-6">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-red-500 text-lg">{error || 'Ticket no encontrado'}</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/workspace/soporte">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Soporte
                    </Link>
                </Button>
            </div>
        )
    }

    const status = statusConfig[ticket.status]
    const priority = priorityConfig[ticket.priority]
    const isResolved = ['resolved', 'closed'].includes(ticket.status)

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/workspace/soporte">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <Badge className={`${status.color} gap-1`}>
                            {status.icon}
                            {status.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            {priority.emoji} {priority.label}
                        </span>
                        {ticket.category && (
                            <span
                                className="text-sm px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
                            >
                                {ticket.category.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-lg ${status.color.replace('text-', 'border-').replace('100', '200')} border`}>
                <div className="flex items-center gap-2">
                    {status.icon}
                    <span className="font-medium">{status.label}</span>
                </div>
                <p className="text-sm mt-1 opacity-80">{status.description}</p>
            </div>

            {/* Original Description */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Tu solicitud
                        </CardTitle>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ticket.created_at)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </CardContent>
            </Card>

            {/* Conversation */}
            <Card className="flex flex-col">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Conversación
                        {ticket.messages.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {ticket.messages.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>

                <CardContent
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                    style={{ maxHeight: '400px', minHeight: ticket.messages.length > 0 ? '200px' : '100px' }}
                >
                    {ticket.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <MessageSquare className="h-10 w-10 mb-2" />
                            <p className="text-sm">Aún no hay respuestas</p>
                            <p className="text-xs">Te notificaremos cuando respondamos</p>
                        </div>
                    ) : (
                        ticket.messages.filter(m => !m.is_internal).map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${msg.sender_type === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 border'
                                        }`}
                                >
                                    {msg.sender_type === 'admin' && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                            <User className="h-3 w-3" />
                                            Equipo de Soporte
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                    <div className={`text-xs mt-2 text-right ${msg.sender_type === 'user' ? 'text-blue-100' : 'text-gray-400'
                                        }`}>
                                        {formatShortDate(msg.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Reply Box */}
                {!isResolved ? (
                    <div className="p-4 border-t bg-gray-50">
                        <Textarea
                            placeholder="Escribe tu mensaje..."
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
                            <span className="text-xs text-gray-400">
                                Ctrl + Enter para enviar
                            </span>
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
                ) : (
                    <div className="p-4 border-t bg-gray-50 text-center">
                        <p className="text-sm text-gray-500">
                            Este ticket está {ticket.status === 'resolved' ? 'resuelto' : 'cerrado'} y no acepta nuevos mensajes.
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-2">
                            <Link href="/workspace/soporte/nuevo">
                                Crear nuevo ticket
                            </Link>
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}
