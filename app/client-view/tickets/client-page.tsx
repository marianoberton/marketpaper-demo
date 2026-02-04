'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Ticket,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Building,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface TicketData {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  category: { id: string; name: string; color: string; icon: string } | null
  messages: { count: number }[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Abierto', color: 'bg-blue-100 text-blue-700', icon: <AlertCircle className="h-3 w-3" /> },
  in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  waiting_user: { label: 'Esperando tu Respuesta', color: 'bg-purple-100 text-purple-700', icon: <MessageSquare className="h-3 w-3" /> },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700', icon: <XCircle className="h-3 w-3" /> },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: 'text-red-600' },
  high: { label: 'Alta', color: 'text-orange-600' },
  medium: { label: 'Media', color: 'text-yellow-600' },
  low: { label: 'Baja', color: 'text-green-600' },
}

interface ClientTicketsPageProps {
  userName: string
  companyName: string
}

export default function ClientTicketsPage({ userName, companyName }: ClientTicketsPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspace/tickets')
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
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
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/client-login')
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

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short'
    })
  }

  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status))
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y navegación */}
            <div className="flex items-center gap-4">
              <Link href="/client-view" className="flex items-center">
                <Image
                  src="/inted.png"
                  alt="Logo"
                  width={180}
                  height={60}
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/client-view">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#1B293F]">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Mis Proyectos</span>
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-[#1B293F]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="h-6 w-6 text-[#1B293F]" />
              Mis Tickets de Soporte
            </h1>
            <p className="text-gray-500 mt-1">
              Gestiona tus consultas y solicitudes de soporte
            </p>
          </div>
          <Button asChild className="bg-[#1B293F] hover:bg-[#243447]">
            <Link href="/client-view/tickets/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-[#1B293F]">{openTickets.length}</div>
              <div className="text-sm text-gray-500">Abiertos</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-purple-600">
                {tickets.filter(t => t.status === 'waiting_user').length}
              </div>
              <div className="text-sm text-gray-500">Esperando Respuesta</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-green-600">{closedTickets.length}</div>
              <div className="text-sm text-gray-500">Resueltos</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-gray-600">{tickets.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Tickets */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader className="bg-[#1B293F] text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Tickets Activos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchTickets} className="text-white hover:bg-white/10">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error}</p>
                <Button onClick={fetchTickets} variant="outline" size="sm" className="mt-4">
                  Reintentar
                </Button>
              </div>
            ) : openTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mb-4 text-green-400" />
                <p className="text-lg font-medium">No tienes tickets abiertos</p>
                <p className="text-sm mt-1">
                  Si tienes alguna consulta, crea un nuevo ticket
                </p>
                <Button asChild className="mt-4 bg-[#1B293F] hover:bg-[#243447]">
                  <Link href="/client-view/tickets/nuevo">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Ticket
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {openTickets.map((ticket) => {
                  const status = statusConfig[ticket.status]
                  const priority = priorityConfig[ticket.priority]
                  const messageCount = ticket.messages?.[0]?.count || 0
                  const needsResponse = ticket.status === 'waiting_user'

                  return (
                    <div
                      key={ticket.id}
                      className={`border rounded-lg p-4 hover:border-[#1B293F] hover:bg-gray-50 transition-colors cursor-pointer ${needsResponse ? 'border-purple-300 bg-purple-50/50' : ''
                        }`}
                      onClick={() => router.push(`/client-view/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {ticket.subject}
                            </h3>
                            {needsResponse && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                Responde
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge className={`${status.color} gap-1 text-xs`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                            <span className={`text-xs font-medium ${priority.color}`}>
                              {priority.label}
                            </span>
                            {ticket.category && (
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
                              >
                                {ticket.category.name}
                              </span>
                            )}
                            {messageCount > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {messageCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-gray-400">
                            {formatDate(ticket.updated_at)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolved Tickets */}
        {closedTickets.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Tickets Resueltos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {closedTickets.slice(0, 5).map((ticket) => {
                  return (
                    <div
                      key={ticket.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/client-view/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">{ticket.subject}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(ticket.updated_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {closedTickets.length > 5 && (
                  <p className="text-sm text-gray-400 text-center pt-2">
                    Y {closedTickets.length - 5} tickets más...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
