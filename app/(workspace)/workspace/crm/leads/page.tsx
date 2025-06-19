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
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Eye,
  Edit,
  UserPlus,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Tag
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Mock data para leads con fuentes reales de tu lanzamiento
const mockLeads = [
  {
    id: 1,
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+34 612 345 678",
    company: "TechStart Solutions",
    position: "CEO",
    avatar: "/avatars/maria.jpg",
    source: "web-form",
    sourceDetail: "Formulario de contacto - Página principal",
    status: "new",
    score: 85,
    temperature: "hot",
    createdAt: "Hace 2 horas",
    lastActivity: "Descargó whitepaper",
    interests: ["Automatización", "CRM", "Analytics"],
    budget: "€10K-25K",
    timeline: "Inmediato",
    notes: "Interesada en demo personalizada. Mencionó competencia con HubSpot.",
    interactions: 5,
    campaignId: "launch-2024",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "brand-awareness"
  },
  {
    id: 2,
    name: "Carlos Ruiz",
    email: "carlos@innovatech.es",
    phone: "+34 623 456 789",
    company: "InnovaTech",
    position: "Director Marketing",
    avatar: "/avatars/carlos.jpg",
    source: "instagram-ad",
    sourceDetail: "Anuncio Instagram - Campaña Lanzamiento",
    status: "contacted",
    score: 72,
    temperature: "warm",
    createdAt: "Ayer",
    lastActivity: "Abrió email de seguimiento",
    interests: ["Marketing Digital", "Social Media", "ROI"],
    budget: "€5K-15K",
    timeline: "1-3 meses",
    notes: "Respondió positivamente al primer contacto. Programar demo.",
    interactions: 3,
    campaignId: "social-launch",
    utmSource: "instagram",
    utmMedium: "paid",
    utmCampaign: "lead-generation"
  },
  {
    id: 3,
    name: "Ana López",
    email: "ana.lopez@digitalcorp.com",
    phone: "+34 634 567 890",
    company: "Digital Corp",
    position: "Gerente Ventas",
    avatar: "/avatars/ana.jpg",
    source: "linkedin-organic",
    sourceDetail: "Post orgánico LinkedIn - Caso de éxito",
    status: "qualified",
    score: 91,
    temperature: "hot",
    createdAt: "Hace 3 días",
    lastActivity: "Solicitó propuesta comercial",
    interests: ["CRM", "Automatización", "Integración"],
    budget: "€25K+",
    timeline: "Inmediato",
    notes: "Lead muy calificado. Tiene presupuesto aprobado para Q1.",
    interactions: 8,
    campaignId: "content-marketing",
    utmSource: "linkedin",
    utmMedium: "organic",
    utmCampaign: "thought-leadership"
  }
];

const leadSources = [
  { name: "Formulario Web", count: 45, color: "bg-blue-100 text-blue-800", icon: Globe },
  { name: "Instagram Ads", count: 32, color: "bg-pink-100 text-pink-800", icon: Instagram },
  { name: "Facebook Ads", count: 28, color: "bg-blue-100 text-blue-800", icon: Facebook },
  { name: "LinkedIn Orgánico", count: 19, color: "bg-blue-100 text-blue-800", icon: Linkedin },
  { name: "Google Ads", count: 15, color: "bg-green-100 text-green-800", icon: Search },
  { name: "Referidos", count: 12, color: "bg-purple-100 text-purple-800", icon: Users }
];

const campaignPerformance = [
  { name: "Lanzamiento 2024", leads: 67, conversion: 24.5, cost: "€1,240", roi: "340%" },
  { name: "Social Media Launch", leads: 43, conversion: 18.2, cost: "€890", roi: "280%" },
  { name: "Content Marketing", leads: 29, conversion: 31.0, cost: "€450", roi: "420%" },
  { name: "Retargeting Web", leads: 38, conversion: 15.8, cost: "€720", roi: "210%" }
];

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTemperature, setSelectedTemperature] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'web-form':
      case 'web-demo':
        return <Globe className="h-4 w-4" />;
      case 'instagram-ad':
        return <Instagram className="h-4 w-4" />;
      case 'facebook-ad':
        return <Facebook className="h-4 w-4" />;
      case 'linkedin-organic':
        return <Linkedin className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warm':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'contacted':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'qualified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'demo-scheduled':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'nurturing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-orange-100 text-orange-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'demo-scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'nurturing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = !selectedSource || lead.source === selectedSource;
    const matchesTemperature = !selectedTemperature || lead.temperature === selectedTemperature;
    return matchesSearch && matchesSource && matchesTemperature;
  });

  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Gestión de Leads"
          description="Centro de captación y calificación de leads desde web, redes sociales y campañas de pauta"
          accentColor="blue"
        />

        {/* Métricas de Captación */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">151</div>
              <p className="text-xs text-muted-foreground">+23 esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Calientes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground">22.5% del total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.7%</div>
              <p className="text-xs text-muted-foreground">+3.2% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo por Lead</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€24</div>
              <p className="text-xs text-muted-foreground">-12% vs objetivo</p>
            </CardContent>
          </Card>
        </div>

        {/* Fuentes de Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fuentes de Captación</CardTitle>
                <CardDescription>Rendimiento por canal de adquisición</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leadSources.map((source) => (
                <div
                  key={source.name}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSource === source.name.toLowerCase().replace(' ', '-') ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedSource(
                    selectedSource === source.name.toLowerCase().replace(' ', '-') 
                      ? null 
                      : source.name.toLowerCase().replace(' ', '-')
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${source.color}`}>
                      <source.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-sm text-muted-foreground">{source.count} leads</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={source.color}>
                    {source.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rendimiento de Campañas */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento de Campañas</CardTitle>
            <CardDescription>Análisis de ROI por campaña activa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignPerformance.map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span>{campaign.leads} leads</span>
                      <span>•</span>
                      <span>{campaign.conversion}% conversión</span>
                      <span>•</span>
                      <span>{campaign.cost} invertido</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">
                      ROI: {campaign.roi}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Base de Leads</CardTitle>
                <CardDescription>
                  {selectedSource || selectedTemperature 
                    ? `Leads filtrados` 
                    : 'Todos los leads capturados'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar leads..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex border rounded-md">
                  <Button
                    variant={selectedTemperature === 'hot' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTemperature(selectedTemperature === 'hot' ? null : 'hot')}
                  >
                    🔥 Calientes
                  </Button>
                  <Button
                    variant={selectedTemperature === 'warm' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTemperature(selectedTemperature === 'warm' ? null : 'warm')}
                  >
                    🟡 Tibios
                  </Button>
                  <Button
                    variant={selectedTemperature === 'cold' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTemperature(selectedTemperature === 'cold' ? null : 'cold')}
                  >
                    🧊 Fríos
                  </Button>
                </div>
                <Button className="bg-brilliant-blue hover:bg-brilliant-blue/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Lead
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(selectedSource || selectedTemperature) && (
              <div className="mb-4 flex items-center space-x-2">
                {selectedSource && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSource(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← Quitar filtro de fuente
                  </Button>
                )}
                {selectedTemperature && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemperature(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← Quitar filtro de temperatura
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedLead === lead.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={lead.avatar} />
                        <AvatarFallback>
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <Badge variant="outline" className={getTemperatureColor(lead.temperature)}>
                            {lead.temperature}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(lead.status)}>
                            {getStatusIcon(lead.status)}
                            <span className="ml-1">{lead.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{lead.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getSourceIcon(lead.source)}
                            <span>{lead.sourceDetail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{lead.createdAt}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Lead Score</span>
                            <span className="font-semibold">{lead.score}/100</span>
                          </div>
                          <Progress value={lead.score} className="h-2" />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 mb-3">
                          <div>
                            <p className="text-sm font-medium">Empresa & Posición</p>
                            <p className="text-sm text-muted-foreground">{lead.company} - {lead.position}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Presupuesto & Timeline</p>
                            <p className="text-sm text-muted-foreground">{lead.budget} - {lead.timeline}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Intereses</p>
                          <div className="flex space-x-1">
                            {lead.interests.map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Última actividad</p>
                          <p className="text-sm text-muted-foreground">{lead.lastActivity}</p>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Notas</p>
                          <p className="text-sm text-muted-foreground">{lead.notes}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{lead.interactions} interacciones</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Tag className="h-4 w-4" />
                              <span>{lead.campaignId}</span>
                            </div>
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
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || selectedSource || selectedTemperature
                  ? "No se encontraron leads con los filtros aplicados"
                  : "No hay leads disponibles"
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
} 