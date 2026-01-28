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

      {/* Stats Cards - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-sm text-gray-600">Inactivas</p>
                <p className="text-2xl font-bold text-gray-500">{stats.total - stats.active}</p>
              </div>
              {/* Using a neutral icon for inactive */}
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <CompaniesClientPage companies={transformedCompanies} templates={templates || []} />
    </div>
  )
} 