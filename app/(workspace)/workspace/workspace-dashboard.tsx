'use client'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  Building2,
  Settings,
  BarChart3,
  Hammer,
  DollarSign,
  Ticket,
  FolderOpen,
  ListTodo,
  Calculator,
  WifiOff,
  Briefcase,
  ArrowRight,
  type LucideIcon
} from 'lucide-react'
import Link from 'next/link'
import { useWorkspace } from '@/components/workspace-context'

// Mapeo de nombres de iconos a componentes
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  Building2,
  Settings,
  BarChart3,
  Hammer,
  DollarSign,
  Ticket,
  FolderOpen,
  ListTodo,
  Calculator,
  Briefcase
}

// Colores sólidos por categoría usando la paleta del proyecto
const CATEGORY_STYLES: Record<string, {
  cardBg: string
  cardBorder: string
  iconBg: string
  iconColor: string
  titleColor: string
  badge: string
  badgeText: string
}> = {
  'Dashboard': {
    cardBg: 'bg-white dark:bg-gray-900',
    cardBorder: 'border-[#CED600]',
    iconBg: 'bg-[#CED600]',
    iconColor: 'text-[#1C1C1C]',
    titleColor: 'text-[#272727] dark:text-white',
    badge: 'bg-[#CED600]',
    badgeText: 'text-[#1C1C1C]'
  },
  'Workspace': {
    cardBg: 'bg-white dark:bg-gray-900',
    cardBorder: 'border-[#272727] dark:border-gray-600',
    iconBg: 'bg-[#272727] dark:bg-gray-700',
    iconColor: 'text-white',
    titleColor: 'text-[#272727] dark:text-white',
    badge: 'bg-[#E5E5E5] dark:bg-gray-700',
    badgeText: 'text-[#272727] dark:text-gray-200'
  },
  'Analytics': {
    cardBg: 'bg-white dark:bg-gray-900',
    cardBorder: 'border-[#EE9B00]',
    iconBg: 'bg-[#EE9B00]',
    iconColor: 'text-white',
    titleColor: 'text-[#272727] dark:text-white',
    badge: 'bg-[#EE9B00]',
    badgeText: 'text-white'
  },
  'Tools': {
    cardBg: 'bg-white dark:bg-gray-900',
    cardBorder: 'border-[#666666]',
    iconBg: 'bg-[#666666]',
    iconColor: 'text-white',
    titleColor: 'text-[#272727] dark:text-white',
    badge: 'bg-[#666666]',
    badgeText: 'text-white'
  },
  'Admin': {
    cardBg: 'bg-white dark:bg-gray-900',
    cardBorder: 'border-[#E5E5E5] dark:border-gray-700',
    iconBg: 'bg-[#F2F2F2] dark:bg-gray-800',
    iconColor: 'text-[#666666] dark:text-gray-300',
    titleColor: 'text-[#272727] dark:text-white',
    badge: 'bg-[#F2F2F2] dark:bg-gray-800',
    badgeText: 'text-[#666666] dark:text-gray-300'
  },
}

export function WorkspaceDashboard() {
  const { companyId, companyName, isLoading, userName, availableModules } = useWorkspace()

  // Filtrar el módulo Overview del grid
  const modulesToShow = availableModules
    .filter(m => m.route_path !== '/workspace' && m.name !== 'Overview')
    .sort((a, b) => (a.display_order || 100) - (b.display_order || 100))

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CED600] mx-auto mb-4"></div>
            <p className="text-[#666666]">Cargando workspace...</p>
          </div>
        </div>
      ) : companyName ? (
        <>
          {/* Header con bienvenida */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#272727] dark:text-white">
              Bienvenido{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-[#666666] dark:text-gray-400 text-lg">
              {companyName} · {modulesToShow.length} módulos disponibles
            </p>
          </div>

          {/* Grid de Módulos */}
          {modulesToShow.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {modulesToShow.map((module) => {
                const Icon = module.icon ? ICON_MAP[module.icon] || LayoutDashboard : LayoutDashboard
                const styles = CATEGORY_STYLES[module.category] || CATEGORY_STYLES['Workspace']

                // Construir href
                const basePath = module.route_path.startsWith('/workspace')
                  ? module.route_path
                  : `/workspace${module.route_path}`
                const href = `${basePath}?company_id=${companyId}`

                return (
                  <Link key={module.id} href={href}>
                    <Card className={`${styles.cardBg} border-2 ${styles.cardBorder} hover:shadow-lg transition-all duration-200 cursor-pointer group h-full`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                            <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${styles.badge} ${styles.badgeText}`}>
                            {module.category}
                          </span>
                        </div>
                        <h3 className={`font-semibold text-lg mb-2 ${styles.titleColor}`}>
                          {module.name}
                        </h3>
                        <p className="text-sm text-[#666666] dark:text-gray-400 line-clamp-2 mb-4">
                          {module.description || `Accede al módulo de ${module.name.toLowerCase()}`}
                        </p>
                        <div className="flex items-center text-sm font-medium text-[#CED600] group-hover:translate-x-1 transition-transform">
                          Abrir <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="bg-[#F2F2F2] dark:bg-gray-800 border-[#E5E5E5] dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-[#666666] dark:text-gray-400">
                  No hay módulos configurados para esta empresa. Contacta al administrador.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          <PageHeader
            title="Dashboard"
            description="Workspace sin empresa asignada"
            accentColor="orange"
          />

          <Card className="bg-[#F2F2F2] dark:bg-gray-800 border-[#EE9B00]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EE9B00] rounded-xl flex items-center justify-center">
                  <WifiOff className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#272727] dark:text-white">Sin empresa asignada</h3>
                  <p className="text-sm text-[#666666] dark:text-gray-400">
                    Navega desde el panel de administración para seleccionar una empresa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
