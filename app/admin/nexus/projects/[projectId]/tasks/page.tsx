'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CalendarClock,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusScheduledTask } from '@/lib/nexus/types'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  active: { variant: 'default', label: 'Activa' },
  paused: { variant: 'secondary', label: 'Pausada' },
  proposed: { variant: 'outline', label: 'Propuesta' },
  rejected: { variant: 'destructive', label: 'Rechazada' },
}

export default function TasksPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [tasks, setTasks] = useState<NexusScheduledTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    nexusApi
      .listScheduledTasks(projectId)
      .then((res) => setTasks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleApprove(id: string) {
    try {
      await nexusApi.approveTask(id)
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'active' } : t)),
      )
      toast.success('Tarea aprobada')
    } catch {
      toast.error('Error')
    }
  }

  async function handleReject(id: string) {
    try {
      await nexusApi.rejectTask(id)
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t)),
      )
      toast.success('Tarea rechazada')
    } catch {
      toast.error('Error')
    }
  }

  const proposed = tasks.filter((t) => t.status === 'proposed')
  const active = tasks.filter((t) => t.status === 'active')
  const other = tasks.filter((t) => t.status !== 'proposed' && t.status !== 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/nexus/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas Programadas</h1>
          <p className="text-muted-foreground">
            Cron jobs y tareas recurrentes del proyecto
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarClock className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Sin tareas programadas</p>
          <p className="text-sm">Los agentes pueden proponer tareas recurrentes</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Proposed (need approval) */}
          {proposed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pendientes de Aprobación ({proposed.length})
              </h2>
              <div className="space-y-3">
                {proposed.map((task) => (
                  <Card
                    key={task.id}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{task.name}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                              {task.cronExpression}
                            </code>
                            <span>Tipo: {task.taskType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(task.id)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(task.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active */}
          {active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Activas ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{task.name}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                              {task.cronExpression}
                            </code>
                            {task.lastRunAt && (
                              <span>
                                Última ejecución:{' '}
                                {new Date(task.lastRunAt).toLocaleString('es-AR')}
                              </span>
                            )}
                            {task.nextRunAt && (
                              <span>
                                Próxima:{' '}
                                {new Date(task.nextRunAt).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Activa
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other */}
          {other.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Otras ({other.length})</h2>
              <div className="space-y-3">
                {other.map((task) => {
                  const config = STATUS_CONFIG[task.status] || {
                    variant: 'outline' as const,
                    label: task.status,
                  }
                  return (
                    <Card key={task.id} className="opacity-60">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{task.name}</p>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                              {task.cronExpression}
                            </code>
                          </div>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
