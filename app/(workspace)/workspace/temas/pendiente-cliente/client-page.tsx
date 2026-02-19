'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  UserCheck,
  Building2,
  FolderKanban,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TemasNav } from '../components/temas-nav'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendienteTask {
  id: string
  title: string
  tema_id: string
  tema_title: string
  created_at: string
  due_date: string | null
  days_waiting: number
}

interface PendienteProject {
  project: { id: string; name: string; address?: string }
  tasks: PendienteTask[]
}

interface PendienteClient {
  client: { id: string; name: string; email?: string; phone?: string }
  projects: PendienteProject[]
  total_pending: number
}

interface PendienteData {
  clients: PendienteClient[]
  summary: {
    total_tasks: number
    total_clients: number
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysWaitingLabel(days: number): {
  text: string
  className: string
  showIcon: boolean
} {
  const label = `Hace ${days} ${days === 1 ? 'dia' : 'dias'}`
  if (days > 14) {
    return { text: label, className: 'text-destructive', showIcon: true }
  }
  if (days >= 7) {
    return { text: label, className: 'text-accent-foreground', showIcon: false }
  }
  return { text: label, className: 'text-muted-foreground', showIcon: false }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PendienteSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-48 ml-6" />
            <div className="ml-10 space-y-2">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PendienteClienteClientPage() {
  const [data, setData] = useState<PendienteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspace/temas/pendiente-cliente')
      const json = await response.json()
      if (json.success) {
        const clients: PendienteClient[] = json.clients || []
        setData({
          clients,
          summary: json.summary || {
            total_tasks: clients.reduce((acc, c) => acc + c.total_pending, 0),
            total_clients: clients.length,
          },
        })
        // Expand all clients by default
        const expanded: Record<string, boolean> = {}
        clients.forEach((c) => {
          expanded[c.client.id] = true
        })
        setExpandedClients(expanded)
      }
    } catch (error) {
      console.error('Error fetching pendiente-cliente data:', error)
      toast.error('Error al cargar datos de pendientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // -----------------------------------------------------------------------
  // Copy summary
  // -----------------------------------------------------------------------

  const handleCopyResumen = useCallback(() => {
    if (!data || data.clients.length === 0) return

    const lines: string[] = []

    for (const client of data.clients) {
      lines.push(`PENDIENTE DEL CLIENTE: ${client.client.name}`)

      for (const proj of client.projects) {
        lines.push(`Proyecto: ${proj.project.name}`)

        for (const task of proj.tasks) {
          const solicitado = formatDateShort(task.created_at)
          lines.push(
            `- ${task.title} (solicitado ${solicitado}, hace ${task.days_waiting} ${task.days_waiting === 1 ? 'dia' : 'dias'})`
          )
        }
      }

      lines.push(`Total: ${client.total_pending} ${client.total_pending === 1 ? 'item pendiente' : 'items pendientes'}`)
      lines.push('---')
    }

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => toast.success('Resumen copiado al portapapeles'))
      .catch(() => toast.error('No se pudo copiar al portapapeles'))
  }, [data])

  // -----------------------------------------------------------------------
  // Toggle client expand/collapse
  // -----------------------------------------------------------------------

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }))
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const totalTasks = data?.summary.total_tasks ?? 0
  const totalClients = data?.summary.total_clients ?? 0
  const hasData = data && data.clients.length > 0

  return (
    <div className="p-6 space-y-6">
      <TemasNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pendiente del Cliente</h1>
            <p className="text-muted-foreground text-sm">
              Tareas que requieren accion por parte del cliente
            </p>
          </div>
        </div>

        {!loading && hasData && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {totalTasks} {totalTasks === 1 ? 'tarea' : 'tareas'} en{' '}
              {totalClients} {totalClients === 1 ? 'cliente' : 'clientes'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopyResumen} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar Resumen
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <PendienteSkeleton />
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UserCheck className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No hay tareas pendientes del cliente</p>
            <p className="text-sm mt-1">
              Cuando se asignen tareas al cliente, apareceran aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.clients.map((client) => {
            const isOpen = expandedClients[client.client.id] ?? true

            return (
              <Collapsible
                key={client.client.id}
                open={isOpen}
                onOpenChange={() => toggleClient(client.client.id)}
              >
                <Card>
                  {/* Client header (trigger) */}
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer select-none hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {client.client.name}
                          </span>
                          {client.client.email && (
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                              {client.client.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {client.total_pending}
                          </Badge>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  {/* Expanded content */}
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 space-y-4">
                      {client.projects.map((proj) => (
                        <div key={proj.project.id} className="space-y-2">
                          {/* Project sub-header */}
                          <div className="flex items-center gap-2 ml-6">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {proj.project.name}
                            </span>
                          </div>

                          {/* Task list */}
                          <div className="ml-10 space-y-1">
                            {proj.tasks.map((task) => {
                              const waiting = daysWaitingLabel(task.days_waiting)
                              return (
                                <div
                                  key={task.id}
                                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                                >
                                  {/* Task title */}
                                  <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                                    {task.title}
                                  </span>

                                  {/* Tema reference */}
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    Tema: {task.tema_title}
                                  </span>

                                  {/* Days waiting + due date */}
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span
                                      className={cn(
                                        'flex items-center gap-1 text-xs font-medium whitespace-nowrap',
                                        waiting.className
                                      )}
                                    >
                                      {waiting.showIcon && (
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                      )}
                                      {waiting.text}
                                    </span>

                                    {task.due_date && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                        <Calendar className="h-3 w-3" />
                                        {formatDateShort(task.due_date)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}
