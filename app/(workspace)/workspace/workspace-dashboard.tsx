'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const { companyFeatures, companyId, companyName, isLoading, userName } = useWorkspace()
  const router = useRouter()

  console.log('🎯 WorkspaceDashboard - Context data:', {
    companyId,
    companyName,
    companyFeatures: companyFeatures.slice(0, 5), // Solo los primeros 5 para no spam
    featuresCount: companyFeatures.length,
    isLoading
  })

  // Redirigir automáticamente si solo hay 1 módulo activo
  useEffect(() => {
    if (!isLoading && companyFeatures.length === 1 && companyId) {
      const singleModule = companyFeatures[0]
      console.log('🚀 Solo 1 módulo activo, redirigiendo a:', singleModule)
      
      // Mapear el nombre del módulo a su ruta
      const moduleRoutes: { [key: string]: string } = {
                'construccion': '/workspace/construccion',
                'crm': '/workspace/crm',
                'settings': '/workspace/settings'
              }
      
      const targetRoute = moduleRoutes[singleModule]
      if (targetRoute) {
        router.replace(`${targetRoute}?company_id=${companyId}`)
      }
    }
  }, [isLoading, companyFeatures, companyId, router])

  // Si estamos redirigiendo (solo 1 módulo), mostrar loading
  if (!isLoading && companyFeatures.length === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al módulo de construcción...</p>
        </div>
      </div>
    )
  }

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
            title={`Bienvenida a ${companyName}`}
            description={`Plataforma especializada en gestión de proyectos de construcción. Gestiona obras, permisos y clientes desde un solo lugar.`}
            accentColor="blue"
          />
          
          {/* Welcome Message */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brilliant-blue to-plum rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">¡Hola{userName ? ` ${userName.split(' ')[0]}` : ''}! Tu plataforma de construcción está lista</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Empresa: <strong>{companyName}</strong> • Especializada en Construcción • Gestión integral de obras
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">1</div>
                  <div className="text-xs text-blue-600">Módulo activo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Construcción */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Proyectos Activos</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">2</div>
                <p className="text-xs text-green-600 font-medium">✓ Ambos en AVO 1</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Presupuesto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">€100.5M</div>
                <p className="text-xs text-blue-600">Valor de cartera actual</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Clientes</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">2</div>
                <p className="text-xs text-gray-600">SG Construcción</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Superficie Total</CardTitle>
                <Building2 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">242.5k</div>
                <p className="text-xs text-gray-600">m² en desarrollo</p>
              </CardContent>
            </Card>
          </div>

          {/* Acceso al Módulo de Construcción */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Área de Trabajo</CardTitle>
              <CardDescription>Accede directamente al módulo de gestión de construcción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-1">
                <Button 
                  asChild 
                  size="lg"
                  className="h-24 flex flex-col gap-3 bg-gradient-to-r from-brilliant-blue to-plum hover:from-brilliant-blue/90 hover:to-plum/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href={`/workspace/construccion?company_id=${companyId}`}>
                    <Building2 className="h-10 w-10" />
                    <div className="text-center">
                      <div className="text-lg font-semibold">Módulo de Construcción</div>
                      <div className="text-sm opacity-90">Gestión completa de proyectos y obras</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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