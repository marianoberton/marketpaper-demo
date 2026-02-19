'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  FolderKanban,
  FolderOpen,
  AlertTriangle,
  UserCheck,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemasNav } from '../components/temas-nav'

// =========================
// TYPES
// =========================

interface DashboardStats {
  active_projects: number
  active_temas: number
  overdue_tasks: number
  waiting_on_client: number
}

interface GerenciaBreakdown {
  projects: number
  temas: number
  overdue_tasks: number
  observados: number
}

interface Alert {
  type: 'overdue_tema' | 'long_waiting_client'
  tema_id?: string
  task_id?: string
  title: string
  days_overdue?: number
  days_waiting?: number
  client_name?: string | null
  tema_title?: string | null
}

interface OverdueByPerson {
  user_id: string
  full_name: string
  avatar_url: string | null
  count: number
}

interface DashboardData {
  stats: DashboardStats
  by_gerencia: Record<string, GerenciaBreakdown>
  alerts: Alert[]
  overdue_by_person: OverdueByPerson[]
}

// =========================
// HELPERS
// =========================

const getInitials = (name: string) => {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '?'
  )
}

const GERENCIA_LABELS: Record<string, string> = {
  construccion: 'Construccion',
  licitaciones: 'Licitaciones',
}

// =========================
// SKELETON COMPONENTS
// =========================

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function GerenciaCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function OverdueByPersonSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// =========================
// COMPONENT
// =========================

export default function TemasDashboardClientPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/workspace/temas/dashboard')
        const json = await response.json()
        if (json.success) {
          setData({
            stats: json.stats,
            by_gerencia: json.by_gerencia,
            alerts: json.alerts,
            overdue_by_person: json.overdue_by_person,
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const stats = data?.stats ?? {
    active_projects: 0,
    active_temas: 0,
    overdue_tasks: 0,
    waiting_on_client: 0,
  }

  const alerts = data?.alerts ?? []
  const overdueByPerson = data?.overdue_by_person ?? []
  const byGerencia = data?.by_gerencia ?? {}
  const maxOverdueCount =
    overdueByPerson.length > 0
      ? Math.max(...overdueByPerson.map((p) => p.count))
      : 0

  return (
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <TemasNav />

      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Ejecutivo
          </h1>
          <p className="text-muted-foreground">
            Vision general de proyectos y temas
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Proyectos Activos
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.active_projects}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Temas Activos</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.active_temas}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'border-l-4',
              stats.overdue_tasks > 0
                ? 'border-l-destructive'
                : 'border-l-primary'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tareas Vencidas
                  </p>
                  <p
                    className={cn(
                      'text-3xl font-bold',
                      stats.overdue_tasks > 0
                        ? 'text-destructive'
                        : 'text-foreground'
                    )}
                  >
                    {stats.overdue_tasks}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    stats.overdue_tasks > 0
                      ? 'bg-destructive/10'
                      : 'bg-primary/10'
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'h-8 w-8',
                      stats.overdue_tasks > 0
                        ? 'text-destructive'
                        : 'text-primary'
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Esperando Cliente
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.waiting_on_client}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gerencia Breakdown */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GerenciaCardSkeleton />
          <GerenciaCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['construccion', 'licitaciones'].map((gerencia) => {
            const breakdown = byGerencia[gerencia] ?? {
              projects: 0,
              temas: 0,
              overdue_tasks: 0,
              observados: 0,
            }
            return (
              <Card key={gerencia}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {GERENCIA_LABELS[gerencia] ?? gerencia}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Proyectos activos
                    </span>
                    <span className="font-semibold text-foreground">
                      {breakdown.projects}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Temas en curso
                    </span>
                    <span className="font-semibold text-foreground">
                      {breakdown.temas}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tareas vencidas
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        breakdown.overdue_tasks > 0
                          ? 'text-destructive'
                          : 'text-foreground'
                      )}
                    >
                      {breakdown.overdue_tasks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Temas observados
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        breakdown.observados > 0
                          ? 'text-destructive'
                          : 'text-foreground'
                      )}
                    >
                      {breakdown.observados}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Alerts Card */}
      {!loading && alerts.length > 0 && (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={`${alert.type}-${alert.tema_id ?? alert.task_id ?? index}`}
                  className="flex items-start gap-3 text-sm"
                >
                  {alert.type === 'overdue_tema' ? (
                    <>
                      <Clock className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          {alert.title}
                        </span>
                        <span className="ml-2 text-destructive font-semibold">
                          {alert.days_overdue} dia{alert.days_overdue !== 1 ? 's' : ''} vencido
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          {alert.title ?? alert.tema_title}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {alert.days_waiting} dia{alert.days_waiting !== 1 ? 's' : ''} esperando
                        </span>
                        {alert.client_name && (
                          <span className="ml-1 text-muted-foreground">
                            ({alert.client_name})
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue by Person */}
      {loading ? (
        <OverdueByPersonSkeleton />
      ) : (
        overdueByPerson.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tareas Vencidas por Persona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueByPerson.map((person) => (
                  <div
                    key={person.user_id}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {getInitials(person.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {person.full_name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-2 shrink-0 bg-destructive/10 text-destructive border border-destructive/20"
                        >
                          {person.count}
                        </Badge>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive/20 transition-all duration-300"
                          style={{
                            width:
                              maxOverdueCount > 0
                                ? `${(person.count / maxOverdueCount) * 100}%`
                                : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
