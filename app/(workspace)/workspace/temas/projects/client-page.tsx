'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  PauseCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TemasNav } from '../components/temas-nav'

// =========================
// TYPES
// =========================

interface Project {
  id: string
  name: string
  address: string | null
  gerencia: string | null
  status: string
  priority: string
  start_date: string | null
  estimated_end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  client: { id: string; name: string; cuit: string | null } | null
  responsible: { id: string; full_name: string; avatar_url: string | null } | null
  created_by_user: { id: string; full_name: string } | null
  stats: {
    total: number
    completed: number
    overdue_tasks: number
  }
}

// =========================
// CONSTANTS
// =========================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  nuevo: { label: 'Nuevo', color: 'bg-primary/20 text-primary', icon: FolderKanban },
  en_curso: { label: 'En Curso', color: 'bg-accent-foreground/10 text-accent-foreground', icon: Clock },
  pausado: { label: 'Pausado', color: 'bg-muted text-muted-foreground', icon: PauseCircle },
  completado: { label: 'Completado', color: 'bg-foreground/10 text-foreground/70', icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'bg-muted text-muted-foreground' },
  media: { label: 'Media', color: 'bg-foreground/10 text-foreground' },
  alta: { label: 'Alta', color: 'bg-accent-foreground/15 text-accent-foreground border border-accent-foreground/30' },
  urgente: { label: 'Urgente', color: 'bg-destructive/10 text-destructive border border-destructive/20' },
}

const GERENCIA_CONFIG: Record<string, { label: string }> = {
  licitaciones: { label: 'Licitaciones' },
  construccion: { label: 'Construccion' },
}

// =========================
// HELPERS
// =========================

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

// =========================
// COMPONENT
// =========================

export default function ProjectsClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company_id')

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gerenciaFilter, setGerenciaFilter] = useState<string>('all')

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (companyId) params.set('company_id', companyId)

      const response = await fetch(`/api/workspace/temas/projects?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchQuery === '' ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.address?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesGerencia = gerenciaFilter === 'all' || project.gerencia === gerenciaFilter

      return matchesSearch && matchesStatus && matchesGerencia
    })
  }, [projects, searchQuery, statusFilter, gerenciaFilter])

  const stats = useMemo(() => {
    const total = projects.length
    const enCurso = projects.filter(p => p.status === 'en_curso').length
    const pausados = projects.filter(p => p.status === 'pausado').length
    const completados = projects.filter(p => p.status === 'completado').length
    return { total, enCurso, pausados, completados }
  }, [projects])

  const companyParam = companyId ? `?company_id=${companyId}` : ''

  return (
    <div className="p-6 space-y-6">
      <TemasNav />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
            <p className="text-muted-foreground">Gestion de proyectos y obras</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href={`/workspace/temas/projects/nuevo${companyParam}`}>
            <Plus className="h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
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
                <p className="text-sm text-muted-foreground">En Curso</p>
                <p className="text-3xl font-bold text-accent-foreground">{stats.enCurso}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent-foreground/10">
                <Clock className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pausados</p>
                <p className="text-3xl font-bold text-muted-foreground">{stats.pausados}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <PauseCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-3xl font-bold text-foreground/70">{stats.completados}</p>
              </div>
              <div className="p-2 rounded-lg bg-foreground/5">
                <CheckCircle2 className="h-8 w-8 text-foreground/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, direccion o cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gerenciaFilter} onValueChange={setGerenciaFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Gerencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las gerencias</SelectItem>
                {Object.entries(GERENCIA_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchProjects}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">No hay proyectos</p>
          <p className="text-sm">Crea tu primer proyecto para comenzar</p>
          <Button asChild className="mt-4">
            <Link href={`/workspace/temas/projects/nuevo${companyParam}`}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.nuevo
            const priorityConfig = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.media
            const progressPercent = project.stats.total > 0
              ? Math.round((project.stats.completed / project.stats.total) * 100)
              : 0

            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-sm"
                onClick={() => router.push(`/workspace/temas/projects/${project.id}${companyParam}`)}
              >
                <CardContent className="pt-6 space-y-4">
                  {/* Project Name + Client */}
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                    {project.client && (
                      <p className="text-sm text-muted-foreground truncate">
                        {project.client.name}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  {project.address && (
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  )}

                  {/* Badges Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.gerencia && (
                      <Badge variant="outline" className="text-xs">
                        {GERENCIA_CONFIG[project.gerencia]?.label || project.gerencia}
                      </Badge>
                    )}
                    <Badge className={cn('text-xs', statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                    <Badge className={cn('text-xs', priorityConfig.color)}>
                      {priorityConfig.label}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Temas: {project.stats.completed}/{project.stats.total}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>

                  {/* Overdue Tasks Badge */}
                  {project.stats.overdue_tasks > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {project.stats.overdue_tasks} tarea{project.stats.overdue_tasks !== 1 ? 's' : ''} vencida{project.stats.overdue_tasks !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}

                  {/* Responsible */}
                  {project.responsible && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.responsible.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {getInitials(project.responsible.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">
                        {project.responsible.full_name}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
