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
  Plus,
  Package,
  Eye,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

// Types
interface Company {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  monthly_price: number | null
  current_users: number | null
  created_at: string
  contact_email: string
}

interface Module {
  id: string
  name: string
  category: string
}

interface Template {
  id: string
  name: string
  category: string
  is_active: boolean
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Get status badge
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    active: { variant: 'default', label: 'Activa' },
    trial: { variant: 'secondary', label: 'Prueba' },
    suspended: { variant: 'destructive', label: 'Suspendida' },
    cancelled: { variant: 'outline', label: 'Cancelada' },
  }
  const config = statusConfig[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

// Get plan badge
const getPlanBadge = (plan: string) => {
  const planConfig: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-700',
    professional: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
    custom: 'bg-orange-100 text-orange-700',
  }
  const className = planConfig[plan] || 'bg-gray-100 text-gray-700'
  return <Badge className={className}>{plan}</Badge>
}

// Data fetching
async function getDashboardData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  // Fetch companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Company[]>()

  // Fetch templates
  const { data: templates, error: templatesError } = await supabase
    .from('client_templates')
    .select('id, name, category, is_active')
    .returns<Template[]>()

  // Fetch modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, name, category')
    .returns<Module[]>()

  // Fetch total users count
  const { count: userCount, error: usersError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  if (companiesError) console.error('Error fetching companies:', companiesError)
  if (templatesError) console.error('Error fetching templates:', templatesError)
  if (modulesError) console.error('Error fetching modules:', modulesError)
  if (usersError) console.error('Error fetching users:', usersError)

  const safeCompanies = companies || []
  const safeTemplates = templates || []
  const safeModules = modules || []

  // Calculate stats
  const activeCompanies = safeCompanies.filter(c => c.status === 'active')
  const trialCompanies = safeCompanies.filter(c => c.status === 'trial')

  // Recent companies (last 5)
  const recentCompanies = safeCompanies.slice(0, 5)

  return {
    stats: {
      total_companies: safeCompanies.length,
      active_companies: activeCompanies.length,
      trial_companies: trialCompanies.length,
      total_users: userCount || 0,
      total_templates: safeTemplates.filter(t => t.is_active).length,
      total_modules: safeModules.length,
    },
    recentCompanies,
    modules: safeModules,
  }
}

export default async function AdminDashboard() {
  const { stats, recentCompanies, modules } = await getDashboardData()

  const dashboardModules = modules.filter(m => m.category === 'Dashboard')
  const workspaceModules = modules.filter(m => m.category === 'Workspace')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Vista general de la plataforma</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Empresas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_companies}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.active_companies} activas
              </span>
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.trial_companies} prueba
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              En todas las empresas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Módulos Activos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_modules}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-blue-600">{dashboardModules.length} dashboard</span>
              <span className="text-xs text-green-600">{workspaceModules.length} workspace</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/admin/companies/create" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Nueva Empresa</p>
                  <p className="text-xs text-muted-foreground">Registrar cliente</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/templates" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Plantillas</p>
                  <p className="text-xs text-muted-foreground">{stats.total_templates} disponibles</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/modules" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-green-100">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Módulos</p>
                  <p className="text-xs text-muted-foreground">{stats.total_modules} creados</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/users" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Usuarios</p>
                  <p className="text-xs text-muted-foreground">{stats.total_users} registrados</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1">
        {/* Recent Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Empresas Recientes</CardTitle>
              <CardDescription>Últimas empresas registradas</CardDescription>
            </div>
            <Link href="/admin/companies">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay empresas registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {company.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{company.contact_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDate(company.created_at)}</p>
                      </div>
                      {getStatusBadge(company.status)}
                      <Link href={`/admin/companies/${company.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
