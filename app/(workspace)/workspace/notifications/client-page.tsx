'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Check, CheckCheck, Trash2, Clock, MessageSquare,
  Ticket, Inbox, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string
  is_read: boolean
  created_at: string
}

type Filter = 'all' | 'unread' | 'read'

export default function NotificationsClientPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/notifications?limit=100')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (ids?: string[]) => {
    try {
      const res = await fetch('/api/workspace/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids ? { notification_ids: ids } : { mark_all: true })
      })
      if (res.ok) {
        toast.success(ids ? 'Notificación marcada como leída' : 'Todas marcadas como leídas')
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notifications:', error)
      toast.error('Error al marcar notificaciones')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch('/api/workspace/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [id] })
      })
      if (res.ok) {
        toast.success('Notificación eliminada')
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Error al eliminar notificación')
    }
  }

  const deleteAllRead = async () => {
    try {
      const res = await fetch('/api/workspace/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_read: true })
      })
      if (res.ok) {
        toast.success('Notificaciones leídas eliminadas')
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error deleting read notifications:', error)
      toast.error('Error al eliminar notificaciones')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_ready':
      case 'task_assigned':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'task_completed':
        return <Check className="h-5 w-5 text-green-500" />
      case 'ticket_response':
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case 'ticket_waiting':
        return <Ticket className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task_ready': return 'Tarea lista'
      case 'task_assigned': return 'Tarea asignada'
      case 'task_completed': return 'Tarea completada'
      case 'ticket_response': return 'Respuesta ticket'
      case 'ticket_waiting': return 'Ticket en espera'
      default: return 'Notificación'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes}m`
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  const readCount = notifications.filter(n => n.is_read).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas leídas
            </Button>
          )}
          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={deleteAllRead}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar leídas
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'unread', 'read'] as Filter[]).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
          >
            {f === 'all' && `Todas (${notifications.length})`}
            {f === 'unread' && `No leídas (${unreadCount})`}
            {f === 'read' && `Leídas (${readCount})`}
          </Button>
        ))}
      </div>

      {/* Notification List */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Cargando notificaciones...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {filter === 'unread' ? 'No hay notificaciones sin leer' :
               filter === 'read' ? 'No hay notificaciones leídas' :
               'No hay notificaciones'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Las notificaciones de tareas y tickets aparecerán aquí
            </p>
          </div>
        ) : (
          filtered.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 transition-colors",
                !notification.is_read && "bg-primary/5"
              )}
            >
              <div className="mt-0.5 flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className={cn(
                          "text-sm hover:underline block truncate",
                          !notification.is_read ? "font-semibold text-foreground" : "text-foreground"
                        )}
                      >
                        {notification.title}
                      </Link>
                    ) : (
                      <p className={cn(
                        "text-sm truncate",
                        !notification.is_read ? "font-semibold text-foreground" : "text-foreground"
                      )}>
                        {notification.title}
                      </p>
                    )}
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead([notification.id])}
                        title="Marcar como leída"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
