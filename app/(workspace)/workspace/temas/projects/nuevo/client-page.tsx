'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Calendar,
  FolderKanban,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =========================
// TYPES
// =========================

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  cuit?: string
}

interface CompanyUser {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  role?: string
}

// =========================
// CONSTANTS
// =========================

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'completado', label: 'Completado' },
]

const PRIORITY_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

const GERENCIA_OPTIONS = [
  { value: 'licitaciones', label: 'Licitaciones' },
  { value: 'construccion', label: 'Construccion' },
]

// =========================
// HELPERS
// =========================

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

// =========================
// COMPONENT
// =========================

export default function NuevoProjectClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company_id')

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [address, setAddress] = useState('')
  const [gerencia, setGerencia] = useState('')
  const [status, setStatus] = useState('nuevo')
  const [priority, setPriority] = useState('media')
  const [startDate, setStartDate] = useState('')
  const [estimatedEndDate, setEstimatedEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [responsibleId, setResponsibleId] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)

      const params = new URLSearchParams()
      if (companyId) params.set('company_id', companyId)

      const [clientsRes, usersRes] = await Promise.all([
        fetch(`/api/workspace/temas/clients?${params.toString()}`),
        fetch(`/api/workspace/users?${params.toString()}`),
      ])

      const clientsData = await clientsRes.json()
      if (clientsData.success) {
        setClients(clientsData.clients || [])
      }

      const usersData = await usersRes.json()
      if (usersData.success) {
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('El nombre del proyecto es requerido')
      return
    }

    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (companyId) params.set('company_id', companyId)

      const response = await fetch(`/api/workspace/temas/projects?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          client_id: clientId || null,
          address: address || null,
          gerencia: gerencia || null,
          status,
          priority,
          start_date: startDate || null,
          estimated_end_date: estimatedEndDate || null,
          notes: notes || null,
          responsible_id: responsibleId || null,
        }),
      })

      const data = await response.json()

      if (data.success && data.project?.id) {
        toast.success('Proyecto creado exitosamente')
        router.push(`/workspace/temas/projects/${data.project.id}${companyId ? `?company_id=${companyId}` : ''}`)
      } else if (data.success) {
        toast.success('Proyecto creado exitosamente')
        router.push(`/workspace/temas/projects${companyId ? `?company_id=${companyId}` : ''}`)
      } else {
        toast.error(data.error || 'Error al crear el proyecto')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Error al crear el proyecto')
    } finally {
      setLoading(false)
    }
  }

  const companyParam = companyId ? `?company_id=${companyId}` : ''

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/workspace/temas/projects${companyParam}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">Crear un nuevo proyecto de obra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Card 1: Informacion del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Informacion del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Nombre del proyecto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex flex-col">
                            <span>{client.name}</span>
                            {client.cuit && (
                              <span className="text-xs text-muted-foreground">CUIT: {client.cuit}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gerencia">Gerencia</Label>
                  <Select value={gerencia} onValueChange={setGerencia}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar gerencia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GERENCIA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Direccion</Label>
                  <Input
                    id="address"
                    placeholder="Direccion de la obra"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Estado y Plazos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Estado y Plazos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Estimada de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={estimatedEndDate}
                    onChange={(e) => setEstimatedEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales del proyecto..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Responsable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsable
              </CardTitle>
              <CardDescription>
                Selecciona el responsable principal del proyecto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay usuarios disponibles</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        responsibleId === user.id
                          ? 'bg-primary/10 border-primary/30'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => setResponsibleId(responsibleId === user.id ? '' : user.id)}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        responsibleId === user.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}>
                        {responsibleId === user.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs bg-muted">
                          {getInitials(user.full_name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">
                          {user.full_name || user.email}
                        </p>
                        {user.full_name && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/workspace/temas/projects${companyParam}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Proyecto
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
