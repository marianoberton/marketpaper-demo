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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FolderOpen,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  Building2,
  Star,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { TemasNav } from './components/temas-nav'

interface Tema {
  id: string
  title: string
  reference_code: string
  expediente_number: string
  status: string
  priority: string
  organismo: string
  due_date: string
  created_at: string
  updated_at: string
  type: { id: string; name: string; color: string } | null
  area: { id: string; name: string; color: string } | null
  assignees: Array<{
    id: string
    is_lead: boolean
    user: { id: string; full_name: string; avatar_url: string }
  }>
}

interface TemaArea {
  id: string
  name: string
  color: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  nuevo_expediente: { label: 'Nuevo Expediente', color: 'bg-primary/20 text-primary border border-primary/30', icon: FolderOpen },
  caratulado: { label: 'Caratulado', color: 'bg-primary/10 text-primary', icon: FileCheck },
  seguimiento: { label: 'Seguimiento', color: 'bg-accent-foreground/10 text-accent-foreground border border-accent-foreground/20', icon: Clock },
  subsanacion: { label: 'Subsanación', color: 'bg-accent-foreground/20 text-accent-foreground', icon: AlertCircle },
  observado: { label: 'Observado', color: 'bg-destructive/10 text-destructive border border-destructive/20', icon: AlertCircle },
  subsanacion_cerrada: { label: 'Subsanación Cerrada', color: 'bg-muted text-foreground/70', icon: CheckCircle2 },
  completado: { label: 'Completado', color: 'bg-foreground/10 text-foreground/70', icon: CheckCircle2 },
  finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'bg-muted text-muted-foreground' },
  media: { label: 'Media', color: 'bg-foreground/10 text-foreground' },
  alta: { label: 'Alta', color: 'bg-accent-foreground/15 text-accent-foreground border border-accent-foreground/30' },
}

export default function TemasClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company_id')

  const [temas, setTemas] = useState<Tema[]>([])
  const [areas, setAreas] = useState<TemaArea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTemas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspace/temas')
      const data = await response.json()
      if (data.success) {
        setTemas(data.temas || [])
      }
    } catch (error) {
      console.error('Error fetching temas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAreas = async () => {
    try {
      const response = await fetch('/api/workspace/temas/areas')
      const data = await response.json()
      if (data.success) {
        setAreas(data.areas || [])
      }
    } catch (error) {
      console.error('Error fetching areas:', error)
    }
  }

  const deleteTema = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workspace/temas/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setTemas(prev => prev.filter(t => t.id !== id))
        toast.success('Tema eliminado')
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting tema:', error)
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setConfirmingDeleteId(null)
    }
  }

  useEffect(() => {
    fetchTemas()
    fetchAreas()
  }, [])

  const filteredTemas = useMemo(() => {
    return temas.filter(tema => {
      const matchesSearch = searchQuery === '' ||
        tema.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tema.reference_code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tema.expediente_number?.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || tema.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || tema.priority === priorityFilter
      const matchesArea = areaFilter === 'all' || tema.area?.id === areaFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesArea
    })
  }, [temas, searchQuery, statusFilter, priorityFilter, areaFilter])

  const stats = useMemo(() => {
    const total = temas.length
    const enCurso = temas.filter(t => ['seguimiento', 'subsanacion', 'observado'].includes(t.status)).length
    const completados = temas.filter(t => ['completado', 'finalizado', 'subsanacion_cerrada'].includes(t.status)).length
    const nuevos = temas.filter(t => ['nuevo_expediente', 'caratulado'].includes(t.status)).length
    return { total, enCurso, completados, nuevos }
  }, [temas])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getActivityStatus = (updatedAt: string) => {
    if (!updatedAt) return { color: 'bg-muted-foreground', textColor: 'text-muted-foreground' }
    const diffDays = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays < 1) return { color: 'bg-primary', textColor: 'text-primary' }
    if (diffDays <= 3) return { color: 'bg-primary/60', textColor: 'text-primary' }
    if (diffDays <= 7) return { color: 'bg-accent-foreground', textColor: 'text-accent-foreground' }
    return { color: 'bg-destructive', textColor: 'text-destructive' }
  }

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '-'
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return formatDate(dateStr)
  }

  const confirmingTema = confirmingDeleteId ? temas.find(t => t.id === confirmingDeleteId) : null

  return (
    <div className="p-6 space-y-6">
      <TemasNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Temas</h1>
            <p className="text-muted-foreground">Gestión de expedientes y trabajos</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href={`/workspace/temas/nuevo${companyId ? `?company_id=${companyId}` : ''}`}>
            <Plus className="h-4 w-4" />
            Nuevo Tema
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Nuevos</p>
            <p className="text-2xl font-bold text-primary">{stats.nuevos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">En Curso</p>
            <p className="text-2xl font-bold text-accent-foreground">{stats.enCurso}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Completados</p>
            <p className="text-2xl font-bold text-foreground/60">{stats.completados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, referencia o expediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las áreas</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" style={{ color: area.color }} />
                  {area.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchTemas}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No hay temas</p>
              <p className="text-sm">Crea tu primer tema para comenzar</p>
              <Button asChild className="mt-4">
                <Link href={`/workspace/temas/nuevo${companyId ? `?company_id=${companyId}` : ''}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Tema
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Título</TableHead>
                  <TableHead className="w-[130px]">Estado</TableHead>
                  <TableHead className="w-[90px]">Prioridad</TableHead>
                  <TableHead className="hidden lg:table-cell">Organismo</TableHead>
                  <TableHead className="w-[100px]">Equipo</TableHead>
                  <TableHead className="hidden md:table-cell w-[90px]">Actividad</TableHead>
                  <TableHead className="hidden md:table-cell w-[110px]">Vencimiento</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemas.map((tema) => {
                  const statusConfig = STATUS_CONFIG[tema.status] || STATUS_CONFIG.nuevo_expediente
                  const priorityConfig = PRIORITY_CONFIG[tema.priority] || PRIORITY_CONFIG.media
                  const activityStatus = getActivityStatus(tema.updated_at)
                  return (
                    <TableRow
                      key={tema.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/workspace/temas/${tema.id}${companyId ? `?company_id=${companyId}` : ''}`)}
                    >
                      <TableCell>
                        <p className="font-medium text-sm leading-snug">{tema.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {tema.type && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4" style={{ borderColor: tema.type.color, color: tema.type.color }}>
                              {tema.type.name}
                            </Badge>
                          )}
                          {tema.expediente_number && (
                            <span className="text-[10px] text-muted-foreground">Exp: {tema.expediente_number}</span>
                          )}
                          {tema.reference_code && (
                            <span className="text-[10px] text-muted-foreground">#{tema.reference_code}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {tema.organismo || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-1.5">
                          {tema.assignees?.slice(0, 3).map((assignee) => (
                            <div key={assignee.id} className="relative">
                              <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={assignee.user?.avatar_url} />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(assignee.user?.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              {assignee.is_lead && (
                                <Star className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          ))}
                          {(tema.assignees?.length || 0) > 3 && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted border-2 border-background text-[10px] font-medium">
                              +{tema.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${activityStatus.color}`} />
                          <span className={`text-xs ${activityStatus.textColor}`}>
                            {formatTimeAgo(tema.updated_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(tema.due_date)}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive gap-2"
                              onClick={() => setConfirmingDeleteId(tema.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      {confirmingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Eliminar tema</h3>
                <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
              </div>
            </div>
            {confirmingTema && (
              <p className="text-sm text-foreground mb-5">
                ¿Eliminar <span className="font-medium">"{confirmingTema.title}"</span>? Se borrarán también sus tareas, actividad y adjuntos.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmingDeleteId(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                onClick={() => deleteTema(confirmingDeleteId)}
                disabled={deleting}
              >
                {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
