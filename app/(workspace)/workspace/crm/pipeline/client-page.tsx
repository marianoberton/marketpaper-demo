"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  User,
  Building,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  FileText,
  Zap,
  Users,
  BarChart3
} from "lucide-react";
import { useState } from "react";

// Etapas del pipeline
const pipelineStages = [
  {
    id: 'leads',
    name: 'Leads',
    description: 'Nuevos contactos sin calificar',
    color: 'bg-blue-100 border-blue-200',
    headerColor: 'bg-blue-500',
    count: 23,
    value: 0
  },
  {
    id: 'qualified',
    name: 'Calificados',
    description: 'Leads validados con presupuesto',
    color: 'bg-orange-100 border-orange-200',
    headerColor: 'bg-orange-500',
    count: 15,
    value: 285000
  },
  {
    id: 'proposal',
    name: 'Propuesta',
    description: 'Propuesta comercial enviada',
    color: 'bg-purple-100 border-purple-200',
    headerColor: 'bg-purple-500',
    count: 8,
    value: 420000
  },
  {
    id: 'negotiation',
    name: 'Negociación',
    description: 'En proceso de negociación',
    color: 'bg-yellow-100 border-yellow-200',
    headerColor: 'bg-yellow-500',
    count: 5,
    value: 180000
  },
  {
    id: 'closed-won',
    name: 'Cerrado Ganado',
    description: 'Oportunidades ganadas',
    color: 'bg-green-100 border-green-200',
    headerColor: 'bg-green-500',
    count: 12,
    value: 340000
  },
  {
    id: 'closed-lost',
    name: 'Cerrado Perdido',
    description: 'Oportunidades perdidas',
    color: 'bg-red-100 border-red-200',
    headerColor: 'bg-red-500',
    count: 7,
    value: 0
  }
];

// Mock data de oportunidades
const mockOpportunities = [
  {
    id: 1,
    title: "Implementación CRM - TechStart",
    company: "TechStart Solutions",
    contact: "María González",
    avatar: "/avatars/maria.jpg",
    value: 25000,
    probability: 85,
    stage: 'qualified',
    priority: 'high',
    closeDate: '2024-02-15',
    daysInStage: 5,
    lastActivity: 'Demo realizada',
    nextAction: 'Enviar propuesta',
    tags: ['Enterprise', 'CRM', 'Automatización'],
    notes: 'Muy interesada en funcionalidades de automatización. Presupuesto confirmado.',
    source: 'web-form',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2024-01-20',
    activities: 8
  },
  {
    id: 2,
    title: "Consultoría Digital - InnovaTech",
    company: "InnovaTech",
    contact: "Carlos Ruiz",
    avatar: "/avatars/carlos.jpg",
    value: 15000,
    probability: 60,
    stage: 'proposal',
    priority: 'medium',
    closeDate: '2024-03-01',
    daysInStage: 12,
    lastActivity: 'Propuesta enviada',
    nextAction: 'Seguimiento propuesta',
    tags: ['Consultoría', 'Marketing Digital'],
    notes: 'Propuesta enviada hace 3 días. Pendiente de respuesta.',
    source: 'instagram-ad',
    assignedTo: 'Ana López',
    createdAt: '2024-01-10',
    activities: 5
  },
  {
    id: 3,
    title: "Plataforma Analytics - Digital Corp",
    company: "Digital Corp",
    contact: "Ana López",
    avatar: "/avatars/ana.jpg",
    value: 45000,
    probability: 90,
    stage: 'negotiation',
    priority: 'high',
    closeDate: '2024-02-28',
    daysInStage: 8,
    lastActivity: 'Negociación precios',
    nextAction: 'Llamada cierre',
    tags: ['Analytics', 'Enterprise', 'Integración'],
    notes: 'Negociando descuento por volumen. Muy probable cierre.',
    source: 'linkedin-organic',
    assignedTo: 'María González',
    createdAt: '2024-01-05',
    activities: 12
  },
  {
    id: 4,
    title: "Startup Package - StartupLab",
    company: "StartupLab",
    contact: "David Chen",
    avatar: "/avatars/david.jpg",
    value: 5000,
    probability: 30,
    stage: 'leads',
    priority: 'low',
    closeDate: '2024-04-15',
    daysInStage: 3,
    lastActivity: 'Primer contacto',
    nextAction: 'Calificar presupuesto',
    tags: ['Startup', 'Básico'],
    notes: 'Startup en fase temprana. Presupuesto limitado.',
    source: 'facebook-ad',
    assignedTo: 'David Chen',
    createdAt: '2024-01-25',
    activities: 2
  },
  {
    id: 5,
    title: "Consulting Pro - Solución Completa",
    company: "Consulting Pro",
    contact: "Laura Martín",
    avatar: "/avatars/laura.jpg",
    value: 35000,
    probability: 75,
    stage: 'proposal',
    priority: 'high',
    closeDate: '2024-02-20',
    daysInStage: 6,
    lastActivity: 'Demo personalizada',
    nextAction: 'Preparar contrato',
    tags: ['Consultoría', 'Personalización'],
    notes: 'Demo muy exitosa. Preparando propuesta personalizada.',
    source: 'web-demo',
    assignedTo: 'María González',
    createdAt: '2024-01-08',
    activities: 9
  }
];

export default function PipelineClientPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<number | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getOpportunitiesByStage = (stageId: string) => {
    return mockOpportunities.filter(opp => opp.stage === stageId);
  };

  const filteredOpportunities = mockOpportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = !selectedStage || opp.stage === selectedStage;
    const matchesPriority = !selectedPriority || opp.priority === selectedPriority;
    return matchesSearch && matchesStage && matchesPriority;
  });

  const totalPipelineValue = mockOpportunities
    .filter(opp => !['closed-won', 'closed-lost'].includes(opp.stage))
    .reduce((sum, opp) => sum + opp.value, 0);

  const weightedPipelineValue = mockOpportunities
    .filter(opp => !['closed-won', 'closed-lost'].includes(opp.stage))
    .reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);

  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Pipeline de Ventas"
          description="Gestión visual de oportunidades desde lead hasta cierre"
          accentColor="yellow"
        />

        {/* Métricas del Pipeline */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Total</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
              <p className="text-xs text-muted-foreground">51 oportunidades activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Ponderado</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(weightedPipelineValue)}</div>
              <p className="text-xs text-muted-foreground">Basado en probabilidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cierre</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">63.2%</div>
              <p className="text-xs text-muted-foreground">+5.3% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ciclo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32 días</div>
              <p className="text-xs text-muted-foreground">-4 días vs objetivo</p>
            </CardContent>
          </Card>
        </div>

        {/* Controles y Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestión de Pipeline</CardTitle>
                <CardDescription>Vista Kanban de todas las oportunidades</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar oportunidades..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex border rounded-md">
                  <Button
                    variant={selectedPriority === 'high' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPriority(selectedPriority === 'high' ? null : 'high')}
                  >
                    🔴 Alta
                  </Button>
                  <Button
                    variant={selectedPriority === 'medium' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPriority(selectedPriority === 'medium' ? null : 'medium')}
                  >
                    🟡 Media
                  </Button>
                  <Button
                    variant={selectedPriority === 'low' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPriority(selectedPriority === 'low' ? null : 'low')}
                  >
                    🔵 Baja
                  </Button>
                </div>
                <Button className="bg-signal-yellow hover:bg-signal-yellow/90 text-slate-900">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Oportunidad
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Pipeline Kanban */}
        <div className="grid gap-6 lg:grid-cols-6">
          {pipelineStages.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.id);
            const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
            
            return (
              <Card key={stage.id} className={`${stage.color} min-h-[600px]`}>
                <CardHeader className={`${stage.headerColor} text-white rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                      <CardDescription className="text-white/80 text-xs">
                        {stage.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {stageOpportunities.length}
                    </Badge>
                  </div>
                  {stage.value > 0 && (
                    <div className="text-xs text-white/90 mt-1">
                      {formatCurrency(stageValue)}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-3 space-y-3">
                  {stageOpportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
                        selectedOpportunity === opportunity.id ? 'border-blue-500 shadow-md' : ''
                      }`}
                      onClick={() => setSelectedOpportunity(
                        selectedOpportunity === opportunity.id ? null : opportunity.id
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm leading-tight mb-1">
                            {opportunity.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {opportunity.company}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">
                            {getPriorityIcon(opportunity.priority)}
                          </span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={opportunity.avatar} />
                          <AvatarFallback className="text-xs">
                            {opportunity.contact.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {opportunity.contact}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(opportunity.value)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.probability}%
                          </Badge>
                        </div>

                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Probabilidad</span>
                            <span>{opportunity.probability}%</span>
                          </div>
                          <Progress value={opportunity.probability} className="h-1" />
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Cierre: {opportunity.closeDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{opportunity.daysInStage} días en etapa</span>
                          </div>
                        </div>

                        <div className="text-xs">
                          <p className="font-medium text-muted-foreground">Última actividad:</p>
                          <p className="text-muted-foreground">{opportunity.lastActivity}</p>
                        </div>

                        <div className="text-xs">
                          <p className="font-medium text-blue-600">Próxima acción:</p>
                          <p className="text-blue-600">{opportunity.nextAction}</p>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {opportunity.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {opportunity.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              +{opportunity.tags.length - 2}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>{opportunity.activities}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Calendar className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageOpportunities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay oportunidades</p>
                      <p className="text-xs">en esta etapa</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resumen de Actividades Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle>Actividades Pendientes</CardTitle>
            <CardDescription>Próximas acciones requeridas en el pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockOpportunities
                .filter(opp => !['closed-won', 'closed-lost'].includes(opp.stage))
                .sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime())
                .slice(0, 5)
                .map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={opp.avatar} />
                        <AvatarFallback className="text-xs">
                          {opp.contact.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{opp.nextAction}</p>
                        <p className="text-xs text-muted-foreground">
                          {opp.title} - {opp.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getPriorityColor(opp.priority)}>
                        {opp.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {opp.closeDate}
                      </span>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}