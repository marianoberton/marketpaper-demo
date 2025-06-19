'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Activity,
  AlertTriangle,
  Download,
  RefreshCw,
  Target,
  Zap,
  Clock
} from 'lucide-react'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    growth: number
    monthly: Array<{ month: string; amount: number; customers: number }>
  }
  usage: {
    totalApiCalls: number
    totalCosts: number
    averageResponseTime: number
    errorRate: number
    daily: Array<{ date: string; calls: number; costs: number; errors: number }>
  }
  customers: {
    total: number
    active: number
    churn: number
    growth: number
    byPlan: Array<{ plan: string; count: number; revenue: number }>
  }
  alerts: Array<{
    id: string
    type: 'cost' | 'usage' | 'error' | 'performance'
    message: string
    severity: 'low' | 'medium' | 'high'
    timestamp: string
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // Mock data for now - replace with actual API call
      const mockData: AnalyticsData = {
        revenue: {
          current: 2900,
          previous: 2400,
          growth: 20.8,
          monthly: [
            { month: 'Ene', amount: 1200, customers: 2 },
            { month: 'Feb', amount: 1800, customers: 3 },
            { month: 'Mar', amount: 2400, customers: 4 },
            { month: 'Abr', amount: 2900, customers: 5 }
          ]
        },
        usage: {
          totalApiCalls: 45000,
          totalCosts: 890,
          averageResponseTime: 245,
          errorRate: 0.8,
          daily: [
            { date: '2024-01-01', calls: 1200, costs: 23, errors: 2 },
            { date: '2024-01-02', calls: 1400, costs: 28, errors: 1 },
            { date: '2024-01-03', calls: 1100, costs: 22, errors: 3 }
          ]
        },
        customers: {
          total: 5,
          active: 4,
          churn: 5,
          growth: 25,
          byPlan: [
            { plan: 'starter', count: 3, revenue: 1740 },
            { plan: 'professional', count: 1, revenue: 790 },
            { plan: 'enterprise', count: 1, revenue: 370 }
          ]
        },
        alerts: [
          {
            id: '1',
            type: 'cost',
            message: 'Costos de API han aumentado 15% este mes',
            severity: 'medium',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'usage',
            message: 'Empresa Fomo está cerca del límite de API calls',
            severity: 'high',
            timestamp: new Date().toISOString()
          }
        ]
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? TrendingUp : TrendingDown
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error cargando analytics</h3>
          <p className="text-gray-600 mb-4">No se pudieron cargar los datos de analytics</p>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics y Reportes</h1>
          <p className="text-gray-600">Análisis detallado del rendimiento de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold">{formatCurrency(data.revenue.current)}</p>
                <div className={`flex items-center text-sm ${getGrowthColor(data.revenue.growth)}`}>
                  {React.createElement(getGrowthIcon(data.revenue.growth), { className: "h-3 w-3 mr-1" })}
                  {Math.abs(data.revenue.growth).toFixed(1)}% vs mes anterior
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold">{formatNumber(data.customers.active)}</p>
                <div className={`flex items-center text-sm ${getGrowthColor(data.customers.growth)}`}>
                  {React.createElement(getGrowthIcon(data.customers.growth), { className: "h-3 w-3 mr-1" })}
                  {Math.abs(data.customers.growth).toFixed(1)}% crecimiento
                </div>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">API Calls (mes)</p>
                <p className="text-2xl font-bold">{formatNumber(data.usage.totalApiCalls)}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <Activity className="h-3 w-3 mr-1" />
                  {formatCurrency(data.usage.totalCosts)} en costos
                </div>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                <p className="text-2xl font-bold">{data.usage.averageResponseTime}ms</p>
                <div className="flex items-center text-sm text-gray-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {data.usage.errorRate.toFixed(2)}% errores
                </div>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="usage">Uso de API</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ingresos</CardTitle>
                <CardDescription>Ingresos mensuales y número de clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de ingresos por implementar</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Plan</CardTitle>
                <CardDescription>Ingresos y clientes por tipo de plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.customers.byPlan.map((plan) => (
                    <div key={plan.plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{plan.plan}</div>
                        <div className="text-sm text-gray-600">{plan.count} clientes</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(plan.revenue)}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(plan.revenue / plan.count)} por cliente
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso de API Diario</CardTitle>
                <CardDescription>Llamadas y costos por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de API calls por implementar</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Costos de API</CardTitle>
                <CardDescription>Evolución de costos diarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de costos por implementar</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>Estadísticas clave de la API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tiempo promedio de respuesta</span>
                    <span className="font-medium">{data.usage.averageResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasa de errores</span>
                    <span className="font-medium">{data.usage.errorRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total llamadas (mes)</span>
                    <span className="font-medium">{formatNumber(data.usage.totalApiCalls)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Costo total (mes)</span>
                    <span className="font-medium">{formatCurrency(data.usage.totalCosts)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento de Clientes</CardTitle>
                <CardDescription>Nuevos clientes por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de crecimiento por implementar</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Clientes</CardTitle>
                <CardDescription>Resumen del estado de clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de clientes</span>
                    <span className="font-medium">{formatNumber(data.customers.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Clientes activos</span>
                    <span className="font-medium text-green-600">{formatNumber(data.customers.active)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasa de retención</span>
                    <span className="font-medium">{(100 - data.customers.churn).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crecimiento mensual</span>
                    <span className={`font-medium ${getGrowthColor(data.customers.growth)}`}>
                      {data.customers.growth > 0 ? '+' : ''}{data.customers.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas del Sistema ({data.alerts.length})</CardTitle>
              <CardDescription>Notificaciones importantes sobre el rendimiento y uso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alerts.length > 0 ? (
                  data.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'high' ? 'text-red-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{alert.message}</p>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(alert.timestamp).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
                    <p className="text-gray-600">Todo está funcionando correctamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}