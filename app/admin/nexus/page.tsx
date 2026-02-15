'use client'

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
  Bot,
  Folder,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react'
import { nexusApi } from '@/lib/nexus/api'
import type { NexusProject, NexusApproval } from '@/lib/nexus/types'

export default function NexusDashboard() {
  const [projects, setProjects] = useState<NexusProject[]>([])
  const [approvals, setApprovals] = useState<NexusApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, approvalsRes] = await Promise.allSettled([
          nexusApi.listProjects(),
          nexusApi.listApprovals('pending'),
        ])

        if (projectsRes.status === 'fulfilled') {
          setProjects(projectsRes.value.data)
        }
        if (approvalsRes.status === 'fulfilled') {
          setApprovals(approvalsRes.value.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to Nexus Core')
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  const activeProjects = projects.filter((p) => p.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nexus AI</h1>
          <p className="text-muted-foreground">Agentes autónomos — Motor de IA</p>
          <div className="h-1 w-24 bg-primary rounded-full mt-2" />
        </div>
        <Link href="/admin/nexus/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Connection Status */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <strong>Error de conexión:</strong> {error}
          <p className="mt-1 text-xs text-muted-foreground">
            Verificá que Nexus Core esté corriendo en{' '}
            {process.env.NEXT_PUBLIC_NEXUS_API_URL || 'http://localhost:3002'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proyectos
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agentes
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : projects.reduce((acc, p) => acc + (p.config?.maxConcurrentSessions || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">configurados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sesiones
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">activas ahora</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprobaciones
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : approvals.length}</div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/admin/nexus/projects" className="block group">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Proyectos
                  </p>
                  <p className="text-xs text-muted-foreground">Ver todos</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/nexus/approvals" className="block group">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-yellow-500/5 hover:border-yellow-500/30 transition-all cursor-pointer">
                <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                  <ShieldAlert className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-yellow-500 transition-colors">
                    Aprobaciones
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {approvals.length} pendientes
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/admin/nexus/projects/new" className="block group">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Nuevo Proyecto
                  </p>
                  <p className="text-xs text-muted-foreground">Crear agente</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/nexus/activity" className="block group">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    Actividad
                  </p>
                  <p className="text-xs text-muted-foreground">Traces y logs</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Proyectos Recientes</CardTitle>
              <CardDescription>Últimos proyectos configurados</CardDescription>
            </div>
            <Link href="/admin/nexus/projects">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay proyectos</p>
                <Link href="/admin/nexus/projects/new">
                  <Button variant="link" size="sm">
                    Crear el primero
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/admin/nexus/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-sm">
                          {project.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.config?.provider?.model || 'No model'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                    >
                      {project.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Aprobaciones Pendientes</CardTitle>
              <CardDescription>Herramientas que requieren autorización</CardDescription>
            </div>
            <Link href="/admin/nexus/approvals">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : approvals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay aprobaciones pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.slice(0, 5).map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium font-mono">{approval.toolId}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(approval.createdAt).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-100/10"
                        onClick={async () => {
                          await nexusApi.approveAction(approval.id)
                          setApprovals((prev) => prev.filter((a) => a.id !== approval.id))
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                        onClick={async () => {
                          await nexusApi.denyAction(approval.id)
                          setApprovals((prev) => prev.filter((a) => a.id !== approval.id))
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
