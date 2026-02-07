'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, X, Clock, MessageSquare, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link: string
    is_read: boolean
    created_at: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/workspace/notifications?limit=10')
            const data = await response.json()
            if (data.success) {
                setNotifications(data.notifications || [])
                setUnreadCount(data.unread_count || 0)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const markAsRead = async (ids?: string[]) => {
        try {
            await fetch('/api/workspace/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ids ? { notification_ids: ids } : { mark_all: true })
            })
            fetchNotifications()
        } catch (error) {
            console.error('Error marking notifications:', error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'task_ready':
            case 'task_assigned':
                return <Clock className="h-4 w-4 text-blue-500" />
            case 'task_completed':
                return <Check className="h-4 w-4 text-green-500" />
            case 'ticket_response':
                return <MessageSquare className="h-4 w-4 text-purple-500" />
            case 'ticket_waiting':
                return <Ticket className="h-4 w-4 text-orange-500" />
            default:
                return <Bell className="h-4 w-4 text-gray-500" />
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 60) return `${minutes}m`
        if (hours < 24) return `${hours}h`
        return `${days}d`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1"
                            onClick={() => markAsRead()}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Marcar todas
                        </Button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Cargando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No hay notificaciones
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <Link
                                key={notification.id}
                                href={notification.link || '#'}
                                onClick={() => {
                                    if (!notification.is_read) {
                                        markAsRead([notification.id])
                                    }
                                    setOpen(false)
                                }}
                                className={cn(
                                    "flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors border-b last:border-0",
                                    !notification.is_read && "bg-primary/5"
                                )}
                            >
                                <div className="mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm truncate",
                                        !notification.is_read && "font-medium"
                                    )}>
                                        {notification.title}
                                    </p>
                                    {notification.message && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {notification.message}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatTime(notification.created_at)}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2">
                        <Link
                            href="/workspace/notifications"
                            className="text-xs text-primary hover:text-primary/80 hover:underline"
                            onClick={() => setOpen(false)}
                        >
                            Ver todas las notificaciones
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
