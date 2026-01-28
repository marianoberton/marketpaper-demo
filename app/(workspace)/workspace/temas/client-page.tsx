'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Filter,
  Building2,
  Star,
  Activity
} from 'lucide-react'

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
  nuevo_expediente: { label: 'Nuevo Expediente', color: 'bg-blue-100 text-blue-800', icon: FolderOpen },
  caratulado: { label: 'Caratulado', color: 'bg-indigo-100 text-indigo-800', icon: FileCheck },
  seguimiento: { label: 'Seguimiento', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  subsanacion: { label: 'Subsanación', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  observado: { label: 'Observado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  subsanacion_cerrada: { label: 'Subsanación Cerrada', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
  completado: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  finalizado: { label: 'Finalizado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  media: { label: 'Media', color: 'bg-blue-100 text-blue-600' },
  alta: { label: 'Alta', color: 'bg-red-100 text-red-600' },
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

  // Traffic light for last activity
  const getActivityStatus = (updatedAt: string) => {
    if (!updatedAt) return { color: 'bg-gray-400', label: 'Sin actividad', textColor: 'text-gray-500' }

    const updated = new Date(updatedAt)
    const now = new Date()
    const diffHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60)
    const diffDays = diffHours / 24

    if (diffHours < 24) {
      return { color: 'bg-green-500', label: 'Hoy', textColor: 'text-green-700' }
    } else if (diffDays <= 3) {
      return { color: 'bg-yellow-500', label: `${Math.floor(diffDays)}d`, textColor: 'text-yellow-700' }
    } else if (diffDays <= 7) {
      return { color: 'bg-orange-500', label: `${Math.floor(diffDays)}d`, textColor: 'text-orange-700' }
    } else {
      return { color: 'bg-red-500', label: `${Math.floor(diffDays)}d`, textColor: 'text-red-700' }
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return formatDate(dateStr)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Temas</h1>
            <p className="text-gray-500">Gestión de expedientes y trabajos</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <FolderOpen className="h-10 w-10 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Nuevos</p>
                <p className="text-3xl font-bold text-blue-600">{stats.nuevos}</p>
              </div>
              <FileCheck className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Curso</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.enCurso}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-3xl font-bold text-green-600">{stats.completados}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-200" />
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título, referencia o expediente..."
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[160px]">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
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
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Organismo</TableHead>
                  <TableHead>Responsables</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead>Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemas.map((tema) => {
                  const statusConfig = STATUS_CONFIG[tema.status] || STATUS_CONFIG.nuevo_expediente
                  const priorityConfig = PRIORITY_CONFIG[tema.priority] || PRIORITY_CONFIG.media
                  return (
                    <TableRow
                      key={tema.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/workspace/temas/${tema.id}${companyId ? `?company_id=${companyId}` : ''}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{tema.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {tema.expediente_number && (
                              <span>Exp: {tema.expediente_number}</span>
                            )}
                            {tema.reference_code && (
                              <span>• Ref: {tema.reference_code}</span>
                            )}
                            {tema.type && (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: tema.type.color, color: tema.type.color }}>
                                {tema.type.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityConfig.color}>
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tema.organismo ? (
                          <span className="text-sm font-medium">{tema.organismo}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {tema.assignees?.slice(0, 3).map((assignee) => (
                            <div key={assignee.id} className="relative">
                              <Avatar className="h-8 w-8 border-2 border-white">
                                <AvatarImage src={assignee.user?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(assignee.user?.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              {assignee.is_lead && (
                                <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          ))}
                          {(tema.assignees?.length || 0) > 3 && (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium">
                              +{tema.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const activityStatus = getActivityStatus(tema.updated_at)
                          return (
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${activityStatus.color}`} />
                              <span className={`text-xs font-medium ${activityStatus.textColor}`}>
                                {formatTimeAgo(tema.updated_at)}
                              </span>
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(tema.due_date)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
