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
    cardBg: 'bg-card',
    cardBorder: 'border-primary',
    iconBg: 'bg-primary',
    iconColor: 'text-primary-foreground',
    titleColor: 'text-foreground',
    badge: 'bg-primary',
    badgeText: 'text-primary-foreground'
  },
  'Workspace': {
    cardBg: 'bg-card',
    cardBorder: 'border-border',
    iconBg: 'bg-muted',
    iconColor: 'text-foreground',
    titleColor: 'text-foreground',
    badge: 'bg-muted',
    badgeText: 'text-muted-foreground'
  },
  'Analytics': {
    cardBg: 'bg-card',
    cardBorder: 'border-[#EE9B00]',
    iconBg: 'bg-[#EE9B00]',
    iconColor: 'text-white',
    titleColor: 'text-foreground',
    badge: 'bg-[#EE9B00]',
    badgeText: 'text-white'
  },
  'Tools': {
    cardBg: 'bg-card',
    cardBorder: 'border-muted-foreground',
    iconBg: 'bg-muted-foreground',
    iconColor: 'text-card',
    titleColor: 'text-foreground',
    badge: 'bg-muted-foreground',
    badgeText: 'text-card'
  },
  'Admin': {
    cardBg: 'bg-card',
    cardBorder: 'border-border',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    titleColor: 'text-foreground',
    badge: 'bg-muted',
    badgeText: 'text-muted-foreground'
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando workspace...</p>
          </div>
        </div>
      ) : companyName ? (
        <>
          {/* Header con bienvenida */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground text-lg">
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
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {module.description || `Accede al módulo de ${module.name.toLowerCase()}`}
                        </p>
                        <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                          Abrir <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="bg-muted border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
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

          <Card className="bg-muted border-[#EE9B00]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EE9B00] rounded-xl flex items-center justify-center">
                  <WifiOff className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sin empresa asignada</h3>
                  <p className="text-sm text-muted-foreground">
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
