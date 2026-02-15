import React, { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, X, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatTimeRemaining } from '@/lib/construction-deadlines'
import { Project } from '@/lib/construction'
import { ProjectWithDeadline } from '@/types/construction-deadlines'

// Función auxiliar para filtrar proyectos urgentes
const getUrgentProjectsFromArray = (projects: ProjectWithDeadline[]): ProjectWithDeadline[] => {
  return projects.filter(project => 
    project.daysRemaining !== undefined && 
    (project.deadlineStatus === 'expired' || project.deadlineStatus === 'warning')
  ).sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
}

interface DeadlineNotification {
  id: string
  projectId: string
  projectName: string
  message: string
  type: 'urgent' | 'warning' | 'info'
  daysRemaining: number
  isRead: boolean
  createdAt: Date
}

interface DeadlineNotificationsProps {
  projects?: ProjectWithDeadline[]
  onNotificationClick?: (projectId: string) => void
  className?: string
}

export function DeadlineNotifications({ 
  projects = [], 
  onNotificationClick,
  className = '' 
}: DeadlineNotificationsProps) {
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    generateNotifications()
  }, [projects])

  const generateNotifications = (): void => {
    const urgentProjects = getUrgentProjectsFromArray(projects)
    const newNotifications: DeadlineNotification[] = []

    urgentProjects.forEach((project: ProjectWithDeadline) => {
      if (project.daysRemaining !== undefined) {
        let type: 'urgent' | 'warning' | 'info' = 'info'
        let message = ''

        if (project.daysRemaining <= 0) {
          type = 'urgent'
          message = `¡Plazo vencido! El proyecto "${project.name}" ha superado su fecha límite.`
        } else if (project.daysRemaining <= 7) {
          type = 'urgent'
          message = `¡Urgente! El proyecto "${project.name}" vence en ${formatTimeRemaining(project.daysRemaining)}.`
        } else if (project.daysRemaining <= 30) {
          type = 'warning'
          message = `Atención: El proyecto "${project.name}" vence en ${formatTimeRemaining(project.daysRemaining)}.`
        }

        if (message) {
          newNotifications.push({
            id: `${project.id}-${Date.now()}`,
            projectId: project.id,
            projectName: project.name,
            message,
            type,
            daysRemaining: project.daysRemaining,
            isRead: false,
            createdAt: new Date()
          })
        }
      }
    })

    setNotifications(newNotifications)
    setUnreadCount(newNotifications.filter(n => !n.isRead).length)
  }

  const markAsRead = (notificationId: string): void => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = (): void => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const dismissNotification = (notificationId: string): void => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleNotificationClick = (notification: DeadlineNotification): void => {
    markAsRead(notification.id)
    onNotificationClick?.(notification.projectId)
  }

  const getNotificationIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  const getNotificationBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'urgent':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Botón de notificaciones */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Notificaciones de Plazos
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No hay notificaciones pendientes</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={getNotificationBadgeVariant(notification.type)}
                            className="text-xs"
                          >
                            {notification.type === 'urgent' ? 'Urgente' : 
                             notification.type === 'warning' ? 'Atención' : 'Info'}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-sm text-foreground mb-1">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {notification.createdAt.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissNotification(notification.id)
                        }}
                        className="flex-shrink-0 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Componente para mostrar alertas globales en el dashboard
export function DeadlineAlerts({ projects = [] }: { projects?: ProjectWithDeadline[] }) {
  const urgentProjects = getUrgentProjectsFromArray(projects).filter(p => 
    p.daysRemaining !== undefined && p.daysRemaining <= 7
  )

  if (urgentProjects.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {urgentProjects.map((project) => (
        <Alert key={project.id} variant={project.daysRemaining! <= 0 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {project.daysRemaining! <= 0 
              ? `¡Plazo vencido! El proyecto "${project.name}" ha superado su fecha límite.`
              : `¡Urgente! El proyecto "${project.name}" vence en ${formatTimeRemaining(project.daysRemaining!)}.`
            }
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}