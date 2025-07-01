'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { 
  MoreVertical, 
  Eye, 
  Search, 
  ArrowRight, 
  Users, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Info,
  Edit
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Company {
  id: string
  name: string
  slug: string
  contact_email: string
  contact_phone?: string
  domain?: string
  plan: string
  status: string
  created_at: string
  trial_ends_at?: string
  monthly_price?: number
  max_users?: number
  current_users?: number
  max_contacts?: number
  client_template_id: string | null
  template_name?: string
}

interface Template {
  id: string;
  name: string;
}

interface CompaniesClientPageProps {
  companies: Company[]
  templates: Template[]
}

const statusConfig = {
  active: { 
    label: 'Activa', 
    color: 'default', 
    icon: CheckCircle2, 
    description: 'Empresa activa con acceso completo a la plataforma' 
  },
  trial: { 
    label: 'Prueba', 
    color: 'secondary', 
    icon: Clock, 
    description: 'Empresa en período de prueba gratuita' 
  },
  suspended: { 
    label: 'Suspendida', 
    color: 'destructive', 
    icon: XCircle, 
    description: 'Acceso suspendido por problemas de pago o violación de términos' 
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'outline', 
    icon: XCircle, 
    description: 'Empresa canceló su suscripción' 
  }
} as const

export function CompaniesClientPage({ companies: initialCompanies, templates: initialTemplates }: CompaniesClientPageProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);
  
  useEffect(() => {
    let filtered = companies
    
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter)
    }
    
    setFilteredCompanies(filtered)
  }, [searchTerm, statusFilter, companies])

  const handleTemplateChange = async (companyId: string, newTemplateId: string) => {
    setIsUpdating(companyId)
    try {
      // Convert "none" back to null for the API
      const templateId = newTemplateId === "none" ? null : newTemplateId
      
      const response = await fetch(`/api/admin/companies?id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_template_id: templateId }),
      })

      if (!response.ok) throw new Error("No se pudo actualizar la plantilla.")

      const updatedCompany = await response.json();
      
      setCompanies(prevCompanies =>
        prevCompanies.map(c =>
          c.id === companyId ? { 
            ...c, 
            client_template_id: updatedCompany.template_id,
            template_name: templates.find(t => t.id === newTemplateId)?.name
          } : c
        )
      )
      toast.success("Plantilla actualizada correctamente")
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    setIsUpdating(companyId)
    try {
      const response = await fetch(`/api/admin/companies?id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("No se pudo actualizar el estado.")

      setCompanies(prevCompanies =>
        prevCompanies.map(c =>
          c.id === companyId ? { ...c, status: newStatus } : c
        )
      )
      toast.success("Estado actualizado correctamente")
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '€0'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const isTrialExpired = (trialDate: string | undefined) => {
    if (!trialDate) return false
    return new Date(trialDate) < new Date()
  }
  
  const getStatusBadge = (status: string, trialDate?: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    const isExpired = status === 'trial' && isTrialExpired(trialDate)
    
    return (
      <Badge 
        variant={config.color as any}
        className={`flex items-center gap-1 ${isExpired ? 'border-red-500 text-red-600' : ''}`}
        title={`${config.description}${isExpired ? ' - Período de prueba expirado' : ''}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
        {isExpired && <AlertCircle className="h-3 w-3" />}
      </Badge>
    )
  }

  const getTemplateDisplay = (company: Company) => {
    const template = templates.find(t => t.id === company.client_template_id)
    return template?.name || company.template_name || 'Sin plantilla'
  }

  const StatusEditDialog = ({ company }: { company: Company }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado - {company.name}</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado para esta empresa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon
            return (
              <div 
                key={status}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  company.status === status ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (company.status !== status) {
                    handleStatusChange(company.id, status)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lista de Empresas ({filteredCompanies.length})</span>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="trial">En prueba</SelectItem>
                <SelectItem value="suspended">Suspendidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, email o slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/2"
            />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Plan/Plantilla</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{company.name}</p>
                      <p className="text-sm text-gray-500">/{company.slug}</p>
                      {company.domain && (
                        <p className="text-xs text-blue-600">{company.domain}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{company.contact_email}</p>
                      {company.contact_phone && (
                        <p className="text-xs text-gray-500">{company.contact_phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(company.status, company.trial_ends_at)}
                      <StatusEditDialog company={company} />
                    </div>
                    {company.trial_ends_at && company.status === 'trial' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Expira: {formatDate(company.trial_ends_at)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {company.plan}
                      </Badge>
                      <Select
                        value={company.client_template_id || 'none'}
                        onValueChange={(newTemplateId) => handleTemplateChange(company.id, newTemplateId)}
                        disabled={isUpdating === company.id}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Asignar plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin plantilla</SelectItem>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {getTemplateDisplay(company)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{company.current_users || 0}/{company.max_users || '∞'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{formatCurrency(company.monthly_price)}/mes</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(company.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/admin/companies/${company.id}`} passHref>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/workspace?company_id=${company.id}`} passHref>
                          <DropdownMenuItem>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Ir al Workspace
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron empresas</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar tus filtros de búsqueda'
                  : 'Aún no hay empresas registradas en el sistema'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 