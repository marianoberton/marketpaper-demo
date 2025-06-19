'use client'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  DollarSign, 
  Briefcase,
  WifiOff,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { useWorkspace } from '@/components/workspace-context'

export function WorkspaceDashboard() {
  const { companyFeatures, companyId, companyName, isLoading } = useWorkspace()

  console.log('🎯 WorkspaceDashboard - Context data:', {
    companyId,
    companyName,
    companyFeatures: companyFeatures.slice(0, 5), // Solo los primeros 5 para no spam
    featuresCount: companyFeatures.length,
    isLoading
  })

  return (
    <div className="flex-1 space-y-6 p-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando workspace...</p>
          </div>
        </div>
      ) : companyName ? (
        <>
          <PageHeader
            title={`Workspace de ${companyName}`}
            description={`Gestiona tu trabajo con los módulos habilitados. ${companyFeatures.length} módulos disponibles.`}
            accentColor="blue"
          />
          
          {/* Company Info */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Empresa: {companyName}</h3>
                  <p className="text-sm text-green-700">
                    Módulos activos: {companyFeatures.join(', ') || 'Ninguno'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Demostración */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contactos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,847</div>
                <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€18,450</div>
                <p className="text-xs text-muted-foreground">+5% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">3 próximos a vencer</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Módulos</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyFeatures.length}</div>
                <p className="text-xs text-muted-foreground">Funcionalidades activas</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <PageHeader
            title="Dashboard Operativo"
            description="Workspace funcional en modo offline."
            accentColor="orange"
          />
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Modo Offline Activo</h3>
                  <p className="text-sm text-orange-700">
                    No se especificó una empresa. Navegue desde el panel de administración.
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/companies">🏢 Ver Empresas</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 