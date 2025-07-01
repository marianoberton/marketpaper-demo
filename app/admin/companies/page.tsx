import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { getAllCompanies } from '@/lib/super-admin'
import { CompaniesClientPage } from './client-page'
import { createClient } from '@/utils/supabase/server'

export default async function CompaniesPage() {
  const companies = await getAllCompanies()
  
  // Fetch available templates
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('client_templates')
    .select('id, name, category, monthly_price')
    .eq('is_active', true)
    .order('name')

  // Transform companies data to include template mapping
  const transformedCompanies = companies.map(company => ({
    ...company,
    client_template_id: company.template_id || null,
    template_name: company.client_template?.name || null
  }))

  const stats = {
    total: transformedCompanies.length,
    active: transformedCompanies.filter(c => c.status === 'active').length,
    trial: transformedCompanies.filter(c => c.status === 'trial').length,
    suspended: transformedCompanies.filter(c => c.status === 'suspended').length,
    totalRevenue: transformedCompanies.reduce((sum, c) => sum + (c.monthly_price || 0), 0),
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="text-gray-600">Administra todas las empresas registradas en la plataforma</p>
        </div>
        <Link href="/admin/companies/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
          </Button>
        </Link>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Empresas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Prueba</p>
                <p className="text-2xl font-bold text-blue-600">{stats.trial}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspendidas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced Status Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg">Guía de Estados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Activa</Badge>
              <span className="text-blue-800">Acceso completo a la plataforma</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Prueba</Badge>
              <span className="text-blue-800">Período de prueba gratuita</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Suspendida</Badge>
              <span className="text-blue-800">Acceso bloqueado</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Cancelada</Badge>
              <span className="text-blue-800">Suscripción cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CompaniesClientPage companies={transformedCompanies} templates={templates || []} />
    </div>
  )
} 