'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Settings,
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
  max_users?: number
  current_users?: number
  client_template_id: string | null
  template_name?: string
  logo_url?: string
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
    description: 'Empresa activa con acceso'
  },
  suspended: {
    label: 'Suspendida',
    color: 'destructive',
    icon: XCircle,
    description: 'Acceso bloqueado'
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

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon

    return (
      <Badge
        variant={config.color as any}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {config.label}
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
                className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${company.status === status ? 'border-primary bg-primary/10' : 'border-border'
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
                    <p className="text-sm text-muted-foreground">{config.description}</p>
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
      <CardHeader className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Empresas</CardTitle>
            <CardDescription>Gestiona el acceso y configuración de tus clientes</CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="suspended">Suspendidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-muted/30 min-h-[500px]">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron empresas</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar tus filtros de búsqueda.'
                : 'Comienza registrando tu primera empresa.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 flex flex-col"
              >
                {/* Card Header: Avatar & Info */}
                <div className="p-5 border-b border-border flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-sm text-primary-foreground font-bold text-lg shrink-0">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={`Logo de ${company.name}`}
                          width={48}
                          height={48}
                          className="object-contain rounded-xl"
                        />
                      ) : (
                        company.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground leading-tight line-clamp-1" title={company.name}>
                        {company.name}
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono">/{company.slug}</p>
                    </div>
                  </div>
                  <StatusEditDialog company={company} />
                </div>

                {/* Card Body: Details */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{company.current_users || 0} Usuarios</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(company.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                      Plantilla
                    </label>
                    <Select
                      value={company.client_template_id || 'none'}
                      onValueChange={(newTemplateId) => handleTemplateChange(company.id, newTemplateId)}
                      disabled={isUpdating === company.id}
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="Seleccionar..." />
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
                  </div>

                  {company.domain && (
                    <div className="text-xs text-primary truncate bg-primary/10 px-2 py-1 rounded w-fit max-w-full">
                      {company.domain}
                    </div>
                  )}
                </div>

                {/* Card Footer: Actions */}
                <div className="p-4 bg-muted/50 rounded-b-xl border-t border-border grid grid-cols-2 gap-3">
                  <Link href={`/admin/companies/${company.id}`} passHref className="w-full">
                    <Button variant="outline" className="w-full hover:border-primary hover:text-primary">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuración
                    </Button>
                  </Link>
                  <Link href={`/workspace?company_id=${company.id}`} passHref className="w-full">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Entrar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}