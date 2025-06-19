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
import { MoreVertical, Eye, Building2, Search, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Company {
  id: string
  name: string
  slug: string
  contact_email: string
  plan: string
  status: string
  created_at: string
  client_template_id: string | null
}

interface Template {
  id: string;
  name: string;
}

interface CompaniesClientPageProps {
  companies: Company[]
  templates: Template[]
}

export function CompaniesClientPage({ companies: initialCompanies, templates: initialTemplates }: CompaniesClientPageProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    // This effect ensures the component updates if the initialCompanies prop changes.
    setCompanies(initialCompanies);
  }, [initialCompanies]);
  
  useEffect(() => {
    // This effect synchronizes the local state with the initial search term and company list.
    let filtered = companies
    if (searchTerm) {
      filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredCompanies(filtered)
  }, [searchTerm, companies])

  const handleTemplateChange = async (companyId: string, newTemplateId: string) => {
    setIsUpdating(companyId)
    try {
      const response = await fetch(`/api/admin/companies?id=${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_template_id: newTemplateId }),
      })

      if (!response.ok) throw new Error("No se pudo actualizar la plantilla.")

      const updatedCompany = await response.json();
      
      setCompanies(prevCompanies =>
        prevCompanies.map(c =>
          c.id === companyId ? { ...c, client_template_id: updatedCompany.client_template_id } : c
        )
      )
      toast.success("Plantilla de la empresa actualizada.")
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
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'outline'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Empresas ({filteredCompanies.length})</CardTitle>
        <CardDescription>
            <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full md:w-1/3"
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
                <TableHead>Email Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[250px]">Plantilla</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-[50px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.contact_email}</TableCell>
                  <TableCell>{getStatusBadge(company.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={company.client_template_id || ''}
                      onValueChange={(newTemplateId) => handleTemplateChange(company.id, newTemplateId)}
                      disabled={isUpdating === company.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar plantilla..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDate(company.created_at)}</TableCell>
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
        </div>
        
        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar los filtros de búsqueda o crea una nueva empresa.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 