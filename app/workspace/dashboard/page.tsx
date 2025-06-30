'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Activity,
  Building2,
  Crown,
  Shield,
  Eye
} from 'lucide-react'
import { useWorkspace } from '@/components/workspace-context'

interface Metrics {
  leads: {
    total: number
    hot: number
    warm: number
    cold: number
    thisWeek: number
    conversionRate: number
  }
  pipeline: {
    totalValue: number
    totalOpportunities: number
    averageValue: number
    closeRate: number
  }
}

export default function DashboardPage() {
  const { companyName, companyId, isLoading, userName, userRole } = useWorkspace()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (companyId && !isLoading) {
      loadDashboardData()
    }
  }, [companyId, isLoading])

  const loadDashboardData = async () => {
    try {
      setLoadingData(true)
      
      // Mock data for now since we're removing the server imports
      const mockMetrics = {
        leads: {
          total: 156,
          hot: 23,
          warm: 45,
          cold: 88,
          thisWeek: 12,
          conversionRate: 15.4
        },
        pipeline: {
          totalValue: 450000,
          totalOpportunities: 34,
          averageValue: 13235,
          closeRate: 22.5
        }
      }

      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'professional':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'starter':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading || loadingData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!companyName) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay empresa seleccionada
          </h3>
          <p className="text-gray-500">
            Selecciona una empresa para ver el dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-gray-500">Bienvenido a</span>
            <span className="font-medium text-gray-900">{companyName}</span>
            <Badge className={getPlanColor('professional')}>
              professional
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getRoleIcon(userRole || 'member')}
          <span className="text-sm text-gray-600 capitalize">
            {userRole || 'member'}
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.leads.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.leads.thisWeek || 0} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Calientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.leads.hot || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.leads.warm || 0} warm, {metrics?.leads.cold || 0} cold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.pipeline.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pipeline.totalOpportunities || 0} oportunidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.leads.conversionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio mensual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>¡Bienvenido/a {userName}!</CardTitle>
          <CardDescription>
            Este es tu workspace para gestionar {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Desde aquí puedes acceder a todas las herramientas y funcionalidades de tu empresa.
            Utiliza el menú lateral para navegar entre las diferentes secciones.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}