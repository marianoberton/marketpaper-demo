"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  LineChart,
  Download,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Target,
  Activity,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Share,
  Plus,
  Settings,
  RefreshCw,
  FileText,
  Zap
} from "lucide-react";
import { useState } from "react";

// Mock data para analytics
const kpiData = [
  {
    title: "Ingresos Totales",
    value: "€127,450",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Nuevos Clientes",
    value: "47",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Tasa de Conversión",
    value: "24.8%",
    change: "-2.1%",
    trend: "down",
    icon: Target,
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  {
    title: "Productividad",
    value: "89%",
    change: "+5.3%",
    trend: "up",
    icon: Activity,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  }
];

const departmentPerformance = [
  { name: "Ventas", performance: 92, target: 85, trend: "up", color: "bg-blue-500" },
  { name: "Marketing", performance: 87, target: 90, trend: "down", color: "bg-purple-500" },
  { name: "Desarrollo", performance: 94, target: 88, trend: "up", color: "bg-green-500" },
  { name: "Soporte", performance: 89, target: 85, trend: "up", color: "bg-orange-500" },
  { name: "Recursos Humanos", performance: 91, target: 87, trend: "up", color: "bg-pink-500" }
];

const recentReports = [
  {
    id: 1,
    title: "Análisis de Ventas Q4 2024",
    type: "Ventas",
    createdBy: "María González",
    createdAt: "Hace 2 horas",
    status: "completed",
    views: 23,
    format: "PDF"
  },
  {
    id: 2,
    title: "Rendimiento del Equipo - Diciembre",
    type: "Recursos Humanos",
    createdBy: "Laura Martín",
    createdAt: "Ayer",
    status: "processing",
    views: 15,
    format: "Excel"
  },
  {
    id: 3,
    title: "ROI Campañas Marketing",
    type: "Marketing",
    createdBy: "Ana López",
    createdAt: "Hace 3 días",
    status: "completed",
    views: 41,
    format: "PDF"
  },
  {
    id: 4,
    title: "Análisis de Productividad",
    type: "Operaciones",
    createdBy: "Carlos Ruiz",
    createdAt: "Hace 1 semana",
    status: "completed",
    views: 67,
    format: "Dashboard"
  }
];

const alertsData = [
  {
    id: 1,
    type: "warning",
    title: "Meta de Ventas en Riesgo",
    description: "Las ventas están 15% por debajo del objetivo mensual",
    priority: "high",
    department: "Ventas"
  },
  {
    id: 2,
    type: "success",
    title: "Productividad Excepcional",
    description: "El equipo de desarrollo superó las expectativas en 20%",
    priority: "medium",
    department: "Desarrollo"
  },
  {
    id: 3,
    type: "info",
    title: "Nuevo Reporte Disponible",
    description: "Análisis mensual de satisfacción del cliente completado",
    priority: "low",
    department: "Soporte"
  }
];

const quickMetrics = [
  { label: "Tareas Completadas", value: "1,247", change: "+18%" },
  { label: "Tiempo Promedio", value: "2.4h", change: "-12%" },
  { label: "Satisfacción Cliente", value: "4.8/5", change: "+0.2" },
  { label: "Eficiencia Operativa", value: "91%", change: "+7%" }
];

export default function AnalyticsClientPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Activity className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Analytics & Reportes"
          description="Análisis de rendimiento y generación de reportes empresariales"
          accentColor="orange"
        />

        {/* Controles de Período */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Período de Análisis:</span>
                <div className="flex border rounded-md">
                  <Button
                    variant={selectedPeriod === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPeriod('week')}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPeriod('month')}
                  >
                    Mes
                  </Button>
                  <Button
                    variant={selectedPeriod === 'quarter' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPeriod('quarter')}
                  >
                    Trimestre
                  </Button>
                  <Button
                    variant={selectedPeriod === 'year' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPeriod('year')}
                  >
                    Año
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Reporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center space-x-1 text-xs">
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {kpi.change}
                  </span>
                  <span className="text-muted-foreground">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rendimiento por Departamento */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rendimiento por Departamento</CardTitle>
                    <CardDescription>Comparación con objetivos establecidos</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver Gráfico
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentPerformance.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                          <span className="font-medium">{dept.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {dept.performance}% / {dept.target}%
                          </span>
                          {dept.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={dept.performance} className="h-2" />
                        <div 
                          className="absolute top-0 h-2 w-0.5 bg-gray-400"
                          style={{ left: `${dept.target}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métricas Rápidas */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Métricas Rápidas</CardTitle>
                <CardDescription>Indicadores clave en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {quickMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{metric.label}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={
                          metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }>
                          {metric.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Alertas y Notificaciones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Alertas</CardTitle>
                  <Badge variant="secondary">{alertsData.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsData.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <Badge variant="outline" className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {alert.department}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reportes Recientes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Reportes Recientes</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(report.status)}
                          <h4 className="font-medium text-sm">{report.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {report.format}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Por {report.createdBy}</p>
                        <p>{report.createdAt}</p>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-3 w-3" />
                          <span>{report.views} visualizaciones</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generar Reporte Personalizado
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <PieChart className="mr-2 h-4 w-4" />
                    Dashboard Ejecutivo
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="mr-2 h-4 w-4" />
                    Análisis Predictivo
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Share className="mr-2 h-4 w-4" />
                    Compartir Insights
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Alertas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
} 