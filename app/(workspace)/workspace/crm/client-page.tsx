'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/workspace-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  UserPlus,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { ClientCompanyForm } from './components/ClientCompanyForm'
import { CrmFilters, type FilterState } from './components/CrmFilters'
import { SOURCE_LABELS } from './constants'

interface ClientCompany {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  cuit: string | null
  website_url: string | null
  notes: string | null
  source: string | null
  tags: string[]
  contact_count: number
  created_at: string
}

interface Stats {
  totalClients: number
  totalContacts: number
  newThisMonth: number
  withoutContacts: number
}

export default function CrmClientPage() {
  const { companyId } = useWorkspace()
  const router = useRouter()
  const [clients, setClients] = useState<ClientCompany[]>([])
  const [stats, setStats] = useState<Stats>({ totalClients: 0, totalContacts: 0, newThisMonth: 0, withoutContacts: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})

  const fetchClients = useCallback(async () => {
    if (!companyId) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (companyId) params.set('company_id', companyId)
      if (searchTerm) params.set('search', searchTerm)
      if (filters.source) params.set('source', filters.source)
      if (filters.tag) params.set('tag', filters.tag)
      if (filters.hasContacts && filters.hasContacts !== 'all') params.set('has_contacts', filters.hasContacts)
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)

      const response = await fetch(`/api/workspace/crm?${params}`)
      const result = await response.json()

      if (result.success) {
        setClients(result.data || [])
        setStats(result.stats || { totalClients: 0, totalContacts: 0, newThisMonth: 0, withoutContacts: 0 })
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [companyId, searchTerm, filters])

  useEffect(() => {
    fetchClients()
  }, [companyId, filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleClientCreated = () => {
    setIsCreateOpen(false)
    fetchClients()
    toast.success('Empresa cliente creada exitosamente')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Gestiona tus empresas clientes y sus contactos
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Empresas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contactos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nuevas este mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sin contactos
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withoutContacts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o CUIT..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
        {showFilters && <CrmFilters filters={filters} onChange={setFilters} />}
      </div>

      {/* Client List */}
      {clients.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No hay empresas clientes</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Agrega tu primera empresa cliente para comenzar'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Empresa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/workspace/crm/${client.id}?company_id=${companyId}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{client.name}</h3>
                        <Badge variant="secondary" className="flex-shrink-0">
                          <Users className="h-3 w-3 mr-1" />
                          {client.contact_count}
                        </Badge>
                        {client.source && (
                          <Badge variant="outline" className="flex-shrink-0 text-xs">
                            {SOURCE_LABELS[client.source] || client.source}
                          </Badge>
                        )}
                        {client.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {client.tags?.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{client.tags.length - 3}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {client.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {client.phone}
                          </span>
                        )}
                        {client.cuit && (
                          <span className="hidden md:flex items-center gap-1">
                            CUIT: {client.cuit}
                          </span>
                        )}
                        {client.address && (
                          <span className="hidden lg:flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {client.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground flex-shrink-0 ml-4 hidden sm:block">
                    {formatDate(client.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <ClientCompanyForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        companyId={companyId || ''}
        onSuccess={handleClientCreated}
      />
    </div>
  )
}
