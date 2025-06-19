"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Activity, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Video,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  ArrowRight,
  MoreHorizontal,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useState } from "react";

// Tipos de actividades
const activityTypes = [
  { id: 'email', name: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  { id: 'call', name: 'Llamada', icon: Phone, color: 'bg-green-100 text-green-800' },
  { id: 'meeting', name: 'Reunión', icon: Video, color: 'bg-purple-100 text-purple-800' },
  { id: 'task', name: 'Tarea', icon: CheckCircle, color: 'bg-orange-100 text-orange-800' },
  { id: 'note', name: 'Nota', icon: FileText, color: 'bg-gray-100 text-gray-800' },
  { id: 'social', name: 'Social Media', icon: MessageSquare, color: 'bg-pink-100 text-pink-800' }
];

// Mock data de actividades
const mockActivities = [
  {
    id: 1,
    type: 'email',
    title: 'Propuesta comercial enviada',
    description: 'Enviada propuesta personalizada para implementación CRM con descuento del 15%',
    contact: 'María González',
    company: 'TechStart Solutions',
    avatar: '/avatars/maria.jpg',
    assignedTo: 'Carlos Ruiz',
    status: 'completed',
    priority: 'high',
    createdAt: '2024-01-28T10:30:00',
    dueDate: '2024-01-28T10:30:00',
    completedAt: '2024-01-28T10:30:00',
    tags: ['Propuesta', 'CRM', 'Enterprise'],
    outcome: 'positive',
    nextAction: 'Seguimiento en 2 días',
    channel: 'email',
    duration: null,
    attachments: ['propuesta-techstart.pdf', 'caso-estudio.pdf'],
    notes: 'Cliente muy interesado en funcionalidades de automatización. Mencionó presupuesto aprobado para Q1.'
  },
  {
    id: 2,
    type: 'call',
    title: 'Llamada de seguimiento',
    description: 'Seguimiento post-demo para resolver dudas técnicas',
    contact: 'Ana López',
    company: 'Digital Corp',
    avatar: '/avatars/ana.jpg',
    assignedTo: 'María González',
    status: 'completed',
    priority: 'high',
    createdAt: '2024-01-28T14:00:00',
    dueDate: '2024-01-28T14:00:00',
    completedAt: '2024-01-28T14:15:00',
    tags: ['Seguimiento', 'Demo', 'Técnico'],
    outcome: 'positive',
    nextAction: 'Preparar propuesta técnica',
    channel: 'phone',
    duration: 15,
    attachments: [],
    notes: 'Resueltas todas las dudas técnicas. Cliente listo para recibir propuesta. Muy probable cierre.'
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Demo personalizada programada',
    description: 'Demo enfocada en funcionalidades de consultoría y reporting',
    contact: 'Laura Martín',
    company: 'Consulting Pro',
    avatar: '/avatars/laura.jpg',
    assignedTo: 'Laura Martín',
    status: 'scheduled',
    priority: 'high',
    createdAt: '2024-01-27T16:00:00',
    dueDate: '2024-01-29T15:00:00',
    completedAt: null,
    tags: ['Demo', 'Consultoría', 'Personalizada'],
    outcome: null,
    nextAction: 'Preparar casos de uso específicos',
    channel: 'video-call',
    duration: 60,
    attachments: ['agenda-demo.pdf'],
    notes: 'Preparar demo específica para consultoría. Enfoque en reporting y gestión de clientes finales.'
  },
  {
    id: 4,
    type: 'social',
    title: 'Interacción LinkedIn',
    description: 'Respondió positivamente a post sobre automatización',
    contact: 'Carlos Ruiz',
    company: 'InnovaTech',
    avatar: '/avatars/carlos.jpg',
    assignedTo: 'Ana López',
    status: 'completed',
    priority: 'medium',
    createdAt: '2024-01-28T09:15:00',
    dueDate: '2024-01-28T09:15:00',
    completedAt: '2024-01-28T09:15:00',
    tags: ['LinkedIn', 'Engagement', 'Automatización'],
    outcome: 'positive',
    nextAction: 'Enviar mensaje directo',
    channel: 'linkedin',
    duration: null,
    attachments: [],
    notes: 'Mostró interés en post sobre ROI de automatización. Buen momento para contacto directo.'
  },
  {
    id: 5,
    type: 'task',
    title: 'Calificar presupuesto',
    description: 'Validar presupuesto y timeline para StartupLab',
    contact: 'David Chen',
    company: 'StartupLab',
    avatar: '/avatars/david.jpg',
    assignedTo: 'David Chen',
    status: 'pending',
    priority: 'low',
    createdAt: '2024-01-27T11:00:00',
    dueDate: '2024-01-30T17:00:00',
    completedAt: null,
    tags: ['Calificación', 'Startup', 'Presupuesto'],
    outcome: null,
    nextAction: 'Llamada de calificación',
    channel: 'internal',
    duration: null,
    attachments: [],
    notes: 'Startup en fase temprana. Validar si tienen presupuesto real o solo están explorando.'
  },
  {
    id: 6,
    type: 'email',
    title: 'Email de bienvenida',
    description: 'Secuencia de onboarding para nuevo cliente',
    contact: 'Roberto Silva',
    company: 'ShopTech',
    avatar: '/avatars/roberto.jpg',
    assignedTo: 'Carlos Ruiz',
    status: 'completed',
    priority: 'medium',
    createdAt: '2024-01-28T08:00:00',
    dueDate: '2024-01-28T08:00:00',
    completedAt: '2024-01-28T08:00:00',
    tags: ['Onboarding', 'Cliente Nuevo', 'Bienvenida'],
    outcome: 'positive',
    nextAction: 'Programar kick-off',
    channel: 'email',
    duration: null,
    attachments: ['guia-onboarding.pdf'],
    notes: 'Cliente muy entusiasmado. Listo para comenzar implementación.'
  },
  {
    id: 7,
    type: 'note',
    title: 'Investigación de competencia',
    description: 'Cliente mencionó estar evaluando HubSpot',
    contact: 'María González',
    company: 'TechStart Solutions',
    avatar: '/avatars/maria.jpg',
    assignedTo: 'Carlos Ruiz',
    status: 'completed',
    priority: 'high',
    createdAt: '2024-01-27T13:30:00',
    dueDate: '2024-01-27T13:30:00',
    completedAt: '2024-01-27T13:30:00',
    tags: ['Competencia', 'HubSpot', 'Investigación'],
    outcome: 'neutral',
    nextAction: 'Preparar comparativa',
    channel: 'internal',
    duration: null,
    attachments: [],
    notes: 'Preparar documento comparativo destacando nuestras ventajas vs HubSpot. Enfoque en precio y personalización.'
  }
];

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(t => t.id === type);
    return activityType ? activityType.icon : Activity;
  };

  const getActivityColor = (type: string) => {
    const activityType = activityTypes.find(t => t.id === type);
    return activityType ? activityType.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeIcon = (outcome: string | null) => {
    switch (outcome) {
      case 'positive':
        return '✅';
      case 'negative':
        return '❌';
      case 'neutral':
        return '➖';
      default:
        return '⏳';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || activity.type === selectedType;
    const matchesStatus = !selectedStatus || activity.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Estadísticas
  const totalActivities = mockActivities.length;
  const completedActivities = mockActivities.filter(a => a.status === 'completed').length;
  const pendingActivities = mockActivities.filter(a => a.status === 'pending').length;
  const scheduledActivities = mockActivities.filter(a => a.status === 'scheduled').length;

  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Centro de Actividades"
          description="Seguimiento completo de todas las interacciones y comunicaciones con leads y clientes"
          accentColor="blue"
        />

        {/* Métricas de Actividades */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActivities}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedActivities}</div>
              <p className="text-xs text-muted-foreground">{Math.round((completedActivities/totalActivities)*100)}% del total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledActivities}</div>
              <p className="text-xs text-muted-foreground">Próximas actividades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingActivities}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de Actividades */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Actividades</CardTitle>
            <CardDescription>Distribución por canal de comunicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {activityTypes.map((type) => {
                const count = mockActivities.filter(a => a.type === type.id).length;
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedType === type.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-muted-foreground">{count} actividades</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={type.color}>
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Actividades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registro de Actividades</CardTitle>
                <CardDescription>
                  {selectedType || selectedStatus 
                    ? `Actividades filtradas` 
                    : 'Todas las actividades recientes'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar actividades..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex border rounded-md">
                  <Button
                    variant={selectedStatus === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedStatus(selectedStatus === 'pending' ? null : 'pending')}
                  >
                    🟡 Pendientes
                  </Button>
                  <Button
                    variant={selectedStatus === 'scheduled' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedStatus(selectedStatus === 'scheduled' ? null : 'scheduled')}
                  >
                    📅 Programadas
                  </Button>
                  <Button
                    variant={selectedStatus === 'completed' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedStatus(selectedStatus === 'completed' ? null : 'completed')}
                  >
                    ✅ Completadas
                  </Button>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Actividad
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(selectedType || selectedStatus) && (
              <div className="mb-4 flex items-center space-x-2">
                {selectedType && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedType(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← Quitar filtro de tipo
                  </Button>
                )}
                {selectedStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStatus(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← Quitar filtro de estado
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {filteredActivities
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedActivity === activity.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} flex-shrink-0`}>
                          <ActivityIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{activity.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                              <span className="text-lg">{getOutcomeIcon(activity.outcome)}</span>
                              <Badge variant="outline" className={getStatusColor(activity.status)}>
                                {activity.status}
                              </Badge>
                              <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                                {activity.priority}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={activity.avatar} />
                                <AvatarFallback className="text-xs">
                                  {activity.contact.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{activity.contact}</p>
                                <p className="text-xs">{activity.company}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>Asignado: {activity.assignedTo}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{getTimeAgo(activity.createdAt)}</span>
                            </div>
                            {activity.duration && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{activity.duration} min</span>
                              </div>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 mb-3">
                            <div>
                              <p className="text-sm font-medium mb-1">Fecha programada</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(activity.dueDate)}</p>
                            </div>
                            {activity.completedAt && (
                              <div>
                                <p className="text-sm font-medium mb-1">Completada</p>
                                <p className="text-sm text-muted-foreground">{formatDateTime(activity.completedAt)}</p>
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Tags</p>
                            <div className="flex flex-wrap gap-1">
                              {activity.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {activity.notes && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Notas</p>
                              <p className="text-sm text-muted-foreground">{activity.notes}</p>
                            </div>
                          )}

                          {activity.nextAction && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1 text-blue-600">Próxima acción</p>
                              <p className="text-sm text-blue-600">{activity.nextAction}</p>
                            </div>
                          )}

                          {activity.attachments.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Archivos adjuntos</p>
                              <div className="flex flex-wrap gap-2">
                                {activity.attachments.map((file, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {file}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Canal: {activity.channel}</span>
                              {activity.outcome && (
                                <span>Resultado: {activity.outcome}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {filteredActivities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || selectedType || selectedStatus
                  ? "No se encontraron actividades con los filtros aplicados"
                  : "No hay actividades registradas"
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas Actividades */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Actividades</CardTitle>
            <CardDescription>Actividades programadas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockActivities
                .filter(activity => activity.status === 'scheduled' || activity.status === 'pending')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.avatar} />
                          <AvatarFallback className="text-xs">
                            {activity.contact.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.contact} - {activity.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(activity.dueDate)}
                        </span>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}