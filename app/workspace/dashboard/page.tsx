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
import { useCompany } from '@/app/providers/CompanyProvider'
import { getLeadMetrics, getPipelineMetrics, getLeads } from '@/lib/crm-multitenant'
import type { Lead } from '@/lib/supabase'

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
  const { currentCompany, userProfile, isLoading } = useCompany()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (currentCompany && !isLoading) {
      loadDashboardData()
    }
  }, [currentCompany, isLoading])

  const loadDashboardData = async () => {
    try {
      setLoadingData(true)
      
      const [leadMetrics, pipelineMetrics, leads] = await Promise.all([
        getLeadMetrics(),
        getPipelineMetrics(),
        getLeads({ limit: 5 })
      ])

      setMetrics({
        leads: leadMetrics,
        pipeline: pipelineMetrics
      })
      setRecentLeads(leads)
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

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warm':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cold':
        return 'bg-blue-100 text-blue-800 border-blue-200'
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

  if (!currentCompany) {
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
            <span className="font-medium text-gray-900">{currentCompany.name}</span>
            <Badge className={getPlanColor(currentCompany.plan)}>
              {currentCompany.plan}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getRoleIcon(userProfile?.role || 'member')}
          <span className="text-sm text-gray-600 capitalize">
            {userProfile?.role}
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
            <CardTitle className="text-sm font-medium">Conversión</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.leads.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tasa de cierre: {(metrics?.pipeline.closeRate || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Recientes</CardTitle>
          <CardDescription>
            Los últimos leads capturados en tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay leads aún
              </h3>
              <p className="text-gray-500 mb-4">
                Los leads aparecerán aquí cuando se capturen desde tu web o redes sociales
              </p>
              <Button>
                Ver configuración de captura
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {lead.name}
                      </h4>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                      {lead.company && (
                        <p className="text-xs text-gray-400">{lead.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getTemperatureColor(lead.temperature)}>
                      {lead.temperature}
                    </Badge>
                    <Badge variant="outline">
                      {lead.source}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {lead.score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Plan</h4>
              <Badge className={getPlanColor(currentCompany.plan)}>
                {currentCompany.plan}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Estado</h4>
              <Badge variant={currentCompany.status === 'active' ? 'default' : 'destructive'}>
                {currentCompany.status}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Límites</h4>
              <p className="text-sm text-gray-900">
                {currentCompany.max_users} usuarios, {currentCompany.max_contacts} contactos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}