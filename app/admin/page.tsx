import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  BarChart3,
  Key,
  Calendar,
} from 'lucide-react'

// Define a local type for Company based on the database schema
interface Company {
    id: string;
    name: string;
    status: string;
    monthly_price: number | null;
    current_users: number | null;
    plan: string;
    // Add other fields from your 'companies' table as needed
}

// Define a type for the data returned by topCompanies map
interface TopCompany {
    id: string;
    name: string;
    plan: string;
    monthly_revenue: number;
    monthly_cost: number;
    profit: number;
    status: string;
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Data fetching and processing logic
async function getDashboardData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .returns<Company[]>()
  
  const { data: templates, error: templatesError } = await supabase
    .from('client_templates')
    .select('id')

  if (companiesError) throw new Error(companiesError.message)
  if (templatesError) throw new Error(templatesError.message)
  if (!companies) {
    return {
        stats: { total_companies: 0, active_companies: 0, total_revenue: 0, total_costs: 0, profit_margin: 0, total_users: 0, total_api_keys: 0, total_templates: 0 },
        topCompanies: [] as TopCompany[]
    };
  }


  let totalRevenue = 0
  let totalUsers = 0
  const activeCompanies = companies.filter((c: Company) => c.status === 'active').length

  for (const company of companies) {
    totalRevenue += company.monthly_price || 0
    totalUsers += company.current_users || 0
  }
  
  // Mocking costs and profit margin for now, as getCompanyCostSummary is complex
  const totalCosts = totalRevenue * 0.3; // Mock 30% cost
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0

  const stats = {
    total_companies: companies.length,
    active_companies: activeCompanies,
    total_revenue: totalRevenue,
    total_costs: totalCosts,
    profit_margin: profitMargin,
    total_users: totalUsers,
    total_api_keys: 0, // Mocked
    total_templates: templates?.length || 0,
  }

  // Mocking top companies for now
  const topCompanies: TopCompany[] = companies
    .sort((a: Company, b: Company) => (b.monthly_price || 0) - (a.monthly_price || 0))
    .slice(0, 5)
    .map((c: Company) => ({
        id: c.id,
        name: c.name,
        plan: c.plan,
        monthly_revenue: c.monthly_price || 0,
        monthly_cost: (c.monthly_price || 0) * 0.3, // Mocked
        profit: (c.monthly_price || 0) * 0.7, // Mocked
        status: c.status
    }));

  return { stats, topCompanies }
}

export default async function AdminDashboard() {
  const { stats, topCompanies } = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Resumen general de la plataforma
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/companies/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Empresa
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Empresas</p>
                <p className="text-2xl font-bold">{stats.total_companies}</p>
                <p className="text-xs text-green-600">
                  {stats.active_companies} activas
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        {/* Other stat cards */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Margen de Beneficio</p>
                <p className={`text-2xl font-bold ${stats.profit_margin >= 20 ? 'text-green-600' : stats.profit_margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.profit_margin.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${stats.profit_margin >= 20 ? 'text-green-500' : stats.profit_margin >= 10 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Totales</p>
                <p className="text-2xl font-bold">{stats.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Top por Beneficio</CardTitle>
            <CardDescription>Las 5 empresas más rentables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCompanies.map((company: TopCompany, index: number) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {company.plan}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(company.profit)}
                    </p>
                    <p className="text-xs text-gray-500">beneficio</p>
                  </div>
                </div>
              ))}
              {topCompanies.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No hay empresas registradas aún.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimos eventos en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-gray-500">
              La funcionalidad de actividad reciente se implementará.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 