'use client'

import Link from 'next/link'
import { 
  Users, 
  UserPlus, 
  Target, 
  Activity, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Settings,
  BookOpen,
  Zap,
  Inbox,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CrmDashboardProps {
  companyId?: string;
}

export function CrmDashboard({ companyId }: CrmDashboardProps) {
  // Helper function to build URLs with company_id
  const buildUrl = (path: string) => {
    if (!companyId) return path;
    
    // Check if URL already has query parameters
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}company_id=${companyId}`;
  };

  const crmModules = [
    {
      title: 'Contact Leads',
      description: 'Gestiona leads capturados desde formularios web',
      icon: UserPlus,
      href: '/workspace/crm/leads',
      color: 'bg-blue-500',
      featured: true
    },
    {
      title: 'Contactos',
      description: 'Base de datos de clientes y prospectos',
      icon: Users,
      href: '/workspace/crm/contacts',
      color: 'bg-green-500'
    },
    {
      title: 'Pipeline',
      description: 'Gestión del embudo de ventas',
      icon: Target,
      href: '/workspace/crm/pipeline',
      color: 'bg-purple-500'
    },
    {
      title: 'Actividades',
      description: 'Seguimiento de interacciones',
      icon: Activity,
      href: '/workspace/crm/activities',
      color: 'bg-orange-500'
    },
    {
      title: 'Campañas',
      description: 'Marketing y promociones',
      icon: Mail,
      href: '/workspace/crm/campaigns',
      color: 'bg-pink-500'
    },
    {
      title: 'Inbox',
      description: 'Comunicaciones centralizadas',
      icon: Inbox,
      href: '/workspace/crm/inbox',
      color: 'bg-indigo-500'
    },
    {
      title: 'Automatización',
      description: 'Flujos de trabajo automáticos',
      icon: Zap,
      href: '/workspace/crm/automation',
      color: 'bg-yellow-500'
    },
    {
      title: 'Reportes',
      description: 'Análisis y métricas de ventas',
      icon: BarChart3,
      href: '/workspace/crm/reports',
      color: 'bg-red-500'
    },
    {
      title: 'Documentación',
      description: 'Guías y ejemplos de integración',
      icon: BookOpen,
      href: '/workspace/crm/documentation',
      color: 'bg-gray-500'
    },
    {
      title: 'Configuración',
      description: 'Ajustes del módulo CRM',
      icon: Settings,
      href: '/workspace/crm/settings',
      color: 'bg-slate-500'
    }
  ];
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Sistema completo de gestión de relaciones con clientes
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Leads Nuevos
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+0</div>
              <p className="text-xs text-muted-foreground">
                Desde la última semana
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contactos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Base de datos de clientes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Oportunidades Activas
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                En el pipeline
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Conversión
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Último mes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Module */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">⭐ Módulo Destacado</h2>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Contact Leads</CardTitle>
                <CardDescription>
                  Sistema completo de captura y gestión de leads desde formularios web
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">✅ Características:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Widget JavaScript para captura</li>
                    <li>• Lead scoring automático</li>
                    <li>• Tracking UTM completo</li>
                    <li>• API webhook pública</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🎯 Beneficios:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Captura leads 24/7</li>
                    <li>• Integración con cualquier web</li>
                    <li>• Análisis de fuentes de tráfico</li>
                    <li>• Gestión centralizada</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={buildUrl("/workspace/crm/leads")}>
                    Gestionar Contact Leads
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={buildUrl("/workspace/crm/documentation")}>
                    Ver Documentación
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📋 Todos los Módulos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crmModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Card key={module.href} className="group hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${module.color} text-white rounded-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {module.description}
                  </CardDescription>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={buildUrl(module.href)}>
                      Acceder
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">🚀 Acciones Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Crear Nuevo Lead
              </CardTitle>
              <CardDescription>
                Agregar un nuevo prospecto manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={buildUrl("/workspace/crm/leads?action=create")}>
                  Crear Lead
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Integrar Widget
              </CardTitle>
              <CardDescription>
                Configurar captura de leads en tu sitio web
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={buildUrl("/workspace/crm/documentation")}>
                  Ver Guía de Integración
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 