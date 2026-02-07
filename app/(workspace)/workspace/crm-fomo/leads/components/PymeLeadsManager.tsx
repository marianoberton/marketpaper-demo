"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Search, 
  Filter,
  Mail,
  Phone,
  Globe,
  Star,
  Clock,
  TrendingUp,
  Building,
  MapPin,
  DollarSign,
  RefreshCw,
  Eye,
  Edit,
  UserPlus
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

interface PymeLead {
  id: string;
  full_name: string;
  email: string;
  company: string;
  position: string;
  phone: string;
  website?: string;
  country: string;
  how_found_us: string;
  monthly_revenue: string;
  additional_info?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_score: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  notes?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

interface PymeLeadStats {
  total: number;
  by_status: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  avg_score: number;
  total_potential_value: number;
}

// Configuraciones de colores para estados y prioridades
const statusConfig = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contactado', color: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'Calificado', color: 'bg-purple-100 text-purple-800' },
  converted: { label: 'Convertido', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-800' }
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
};

const sourceConfig = {
  pyme_form: { label: 'Formulario PYME', color: 'bg-green-100 text-green-800' },
  referral: { label: 'Referencia', color: 'bg-purple-100 text-purple-800' },
  social: { label: 'Redes Sociales', color: 'bg-blue-100 text-blue-800' },
  other: { label: 'Otro', color: 'bg-gray-100 text-gray-800' }
};

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export default function PymeLeadsManager() {
  const searchParams = useSearchParams();
  const [pymeLeads, setPymeLeads] = useState<PymeLead[]>([]);
  const [stats, setStats] = useState<PymeLeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    country: '',
    monthly_revenue: '',
    how_found_us: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadPymeLeads();
  }, [searchParams, filters]);

  const loadPymeLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const companyId = searchParams.get('company_id');
      
      if (companyId) params.append('company_id', companyId);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.country) params.append('country', filters.country);
      if (filters.monthly_revenue) params.append('monthly_revenue', filters.monthly_revenue);
      if (filters.how_found_us) params.append('how_found_us', filters.how_found_us);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/workspace/crm-fomo/pyme-leads?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar PYME leads');
      }

      setPymeLeads(data.pyme_leads || []);
      setStats(data.statistics || null);

    } catch (err: any) {
      console.error('Error loading PYME leads:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-semibold">Error al cargar PYME Leads</p>
            <p className="text-sm mt-2">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={loadPymeLeads}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PYME Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Score promedio: {stats.avg_score}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <Star className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_priority.urgent || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.new || 0}</div>
              <p className="text-xs text-muted-foreground">
                Sin contactar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.converted || 0}</div>
              <p className="text-xs text-muted-foreground">
                Leads exitosos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <Input
                placeholder="Buscar por nombre, email, empresa..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="qualified">Calificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad</label>
              <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="urgent">🚨 Urgente</SelectItem>
                  <SelectItem value="high">🔥 Alta</SelectItem>
                  <SelectItem value="medium">⚠️ Media</SelectItem>
                  <SelectItem value="low">📝 Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Input
                placeholder="Filtrar por país..."
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PYME Leads</CardTitle>
              <CardDescription>
                Leads de PYMEs capturados desde formularios web con scoring automático
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadPymeLeads}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando PYME leads...</p>
            </div>
          ) : pymeLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hay PYME leads</h3>
              <p>Los leads de PYMEs aparecerán aquí automáticamente cuando se capturen desde el formulario web</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pymeLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {lead.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{lead.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {lead.position} - {lead.company}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(lead.submitted_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={statusConfig[lead.status].color}>
                          {statusConfig[lead.status].label}
                        </Badge>
                        <Badge className={priorityConfig[lead.priority].color}>
                          {priorityConfig[lead.priority].label}
                        </Badge>
                        <Badge className={sourceConfig[lead.source as keyof typeof sourceConfig]?.color || 'bg-gray-100 text-gray-800'}>
                          {sourceConfig[lead.source as keyof typeof sourceConfig]?.label || lead.source}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${getScoreColor(lead.lead_score)}`} />
                          <span className={`text-sm font-medium ${getScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-sm font-medium">Facturación Mensual</p>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{lead.monthly_revenue}</span>
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-sm font-medium">Cómo nos encontró</p>
                          <p className="text-sm mt-1">{lead.how_found_us}</p>
                        </div>
                      </div>

                      {lead.additional_info && (
                        <div className="bg-muted/50 rounded p-3 mb-3">
                          <p className="text-sm font-medium">Información Adicional</p>
                          <p className="text-sm mt-1">{lead.additional_info}</p>
                        </div>
                      )}

                      {lead.website && (
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={lead.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {lead.website}
                          </a>
                        </div>
                      )}

                      {lead.assigned_user && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserPlus className="h-4 w-4" />
                          <span>Asignado a: {lead.assigned_user.full_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 