"use client";

import { useState, useEffect } from "react";
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
  Star,
  Clock,
  TrendingUp,
  Target,
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
  Tag,
  ExternalLink,
  Trash2,
  RefreshCw
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "next/navigation";

interface ContactLead {
  id: string;
  name: string;
  email: string;
  company: string;
  website?: string;
  pain_point: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_score: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_agent?: string;
  referrer?: string;
  page_url?: string;
  ip_address?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
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

interface ContactLeadStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_source: Record<string, number>;
}

const statusConfig = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: Star },
  contacted: { label: 'Contactado', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
  qualified: { label: 'Calificado', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  converted: { label: 'Convertido', color: 'bg-green-100 text-green-800', icon: Target },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
};

const sourceConfig = {
  website_form: { label: 'Formulario Web', icon: Globe },
  instagram_ad: { label: 'Instagram Ad', icon: Star },
  facebook_ad: { label: 'Facebook Ad', icon: Star },
  linkedin_ad: { label: 'LinkedIn Ad', icon: Star },
  google_ad: { label: 'Google Ad', icon: Search },
  organic_social: { label: 'Social Orgánico', icon: Users },
  referral: { label: 'Referido', icon: UserPlus },
  manual_entry: { label: 'Entrada Manual', icon: Edit },
  batch_import: { label: 'Importación', icon: Upload }
};

export default function ContactLeadsManager() {
  const searchParams = useSearchParams();
  const [contactLeads, setContactLeads] = useState<ContactLead[]>([]);
  const [stats, setStats] = useState<ContactLeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    source: 'all',
    assigned_to: '',
    date_from: '',
    date_to: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadContactLeads();
  }, [searchParams, filters]);

  const loadContactLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const companyId = searchParams.get('company_id');
      
      if (companyId) params.append('company_id', companyId);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.source && filters.source !== 'all') params.append('source', filters.source);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/workspace/crm-fomo/contact-leads?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar contact leads');
      }

      setContactLeads(data.contact_leads || []);
      setStats(data.statistics || null);

    } catch (err: any) {
      console.error('Error loading contact leads:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      setActionLoading(leadId);

      const response = await fetch('/api/workspace/crm-fomo/contact-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          status: newStatus,
          last_contacted_at: newStatus !== 'new' ? new Date().toISOString() : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el estado');
      }

      // Actualizar el lead en la lista
      setContactLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, ...data.contact_lead }
            : lead
        )
      );

      // Recargar estadísticas
      loadContactLeads();

    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Error al actualizar el estado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignUser = async (leadId: string, userId: string) => {
    try {
      setActionLoading(leadId);

      const response = await fetch('/api/workspace/crm-fomo/contact-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          assigned_to: userId || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar usuario');
      }

      // Actualizar el lead en la lista
      setContactLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, ...data.contact_lead }
            : lead
        )
      );

    } catch (err: any) {
      console.error('Error assigning user:', err);
      setError(err.message || 'Error al asignar usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNotes = async (leadId: string, notes: string) => {
    try {
      setActionLoading(leadId);

      const response = await fetch('/api/workspace/crm-fomo/contact-leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          notes: notes.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar notas');
      }

      // Actualizar el lead en la lista
      setContactLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, notes: notes.trim() || undefined }
            : lead
        )
      );

      setIsDialogOpen(false);
      setSelectedLead(null);

    } catch (err: any) {
      console.error('Error adding notes:', err);
      setError(err.message || 'Error al guardar notas');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contact lead?')) {
      return;
    }

    try {
      setActionLoading(leadId);

      const response = await fetch(`/api/workspace/crm-fomo/contact-leads?id=${leadId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el lead');
      }

      // Remover el lead de la lista
      setContactLeads(prev => prev.filter(lead => lead.id !== leadId));
      loadContactLeads(); // Recargar estadísticas

    } catch (err: any) {
      console.error('Error deleting lead:', err);
      setError(err.message || 'Error al eliminar el lead');
    } finally {
      setActionLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando contact leads...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
              <div>
                <h3 className="font-semibold text-red-900">Error al cargar datos</h3>
                <p className="text-red-700">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => loadContactLeads()} 
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contact Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {Object.entries(stats.by_status).map(([status, count]) => 
                  `${statusConfig[status as keyof typeof statusConfig]?.label || status}: ${count}`
                ).join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
              <Star className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.new || 0}</div>
              <p className="text-xs text-muted-foreground">
                Leads sin contactar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.by_priority.high || 0) + (stats.by_priority.urgent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Leads urgentes y alta prioridad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
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
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.source}
              onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                {Object.entries(sourceConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '', status: 'all', priority: 'all', source: 'all', 
                assigned_to: '', date_from: '', date_to: ''
              })}
            >
              Limpiar filtros
            </Button>
            <Button variant="outline" onClick={loadContactLeads}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contact Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Leads</CardTitle>
              <CardDescription>
                Leads capturados desde formularios web y otros canales
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contactLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hay contact leads</h3>
              <p>Los leads capturados aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contactLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{lead.name}</h3>
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.phone}</span>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-2">
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
                        <Badge variant="outline">
                          {sourceConfig[lead.source as keyof typeof sourceConfig]?.label || lead.source}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${getScoreColor(lead.lead_score)}`} />
                          <span className={`text-sm font-medium ${getScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded p-3 mb-3">
                        <p className="text-sm"><strong>Pain Point:</strong> {lead.pain_point}</p>
                        {lead.notes && (
                          <p className="text-sm mt-2"><strong>Notas:</strong> {lead.notes}</p>
                        )}
                      </div>

                      {lead.assigned_user && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <UserPlus className="h-4 w-4" />
                          <span>Asignado a: {lead.assigned_user.full_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleStatusUpdate(lead.id, value)}
                        disabled={actionLoading === lead.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-1">
                        <Dialog
                          open={isDialogOpen && selectedLead?.id === lead.id}
                          onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setSelectedLead(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Agregar Notas - {lead.name}</DialogTitle>
                              <DialogDescription>
                                Agrega notas o comentarios sobre este contact lead
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Escribe tus notas aquí..."
                                defaultValue={lead.notes || ''}
                                id="notes-textarea"
                                rows={4}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsDialogOpen(false);
                                    setSelectedLead(null);
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={() => {
                                    const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement;
                                    handleAddNotes(lead.id, textarea.value);
                                  }}
                                  disabled={actionLoading === lead.id}
                                >
                                  Guardar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={actionLoading === lead.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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