"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Building,
  Calendar,
  Star,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace-context";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CrmContact {
  id: string
  type: 'client' | 'lead'
  name: string
  email: string | null
  phone: string | null
  company_name: string | null
  position: string | null
  status: string
  lead_score: number
  source: string | null
  created_at: string
  last_interaction: string
  // Campos simulados para compatibilidad UI por ahora
  tags?: string[]
  value?: number
  owner?: string
}

const getLeadScoreColor = (score: number) => {
  if (score >= 80) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  if (score >= 60) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'hot': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'warm': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'client': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'cold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getChannelColor = (channel: string | null) => {
  switch (channel?.toLowerCase()) {
    case 'web': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'linkedin': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'whatsapp': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'construction': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function ContactsClientPage() {
  const { companyId } = useWorkspace();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    type: 'lead',
    name: '',
    email: '',
    phone: '',
    company_name: '',
    position: '',
    notes: ''
  });

  const fetchContacts = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/workspace/crm-fomo/contacts?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        // Enriquecer datos faltantes
        const enrichedContacts = (data.contacts || []).map((c: CrmContact) => ({
          ...c,
          tags: c.type === 'client' ? ['Cliente Activo'] : ['Prospecto'],
          value: c.type === 'client' ? 0 : 0, // TODO: Calcular valor real
          owner: 'Sin asignar' // TODO: Obtener owner real
        }));
        setContacts(enrichedContacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [companyId]);

  const handleCreateContact = async () => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/workspace/crm-fomo/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContact, company_id: companyId })
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setNewContact({
          type: 'lead',
          name: '',
          email: '',
          phone: '',
          company_name: '',
          position: '',
          notes: ''
        });
        fetchContacts(); // Recargar lista
      } else {
        console.error("Error creating contact");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
    } finally {
      setIsCreating(false);
    }
  };


  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hotLeads = contacts.filter(c => c.lead_score >= 80).length;
  const totalValue = contacts.reduce((sum, contact) => sum + (contact.value || 0), 0);
  
  // Si no hay contactos, mostrar mensaje o skeleton
  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-brilliant-blue" />
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Gestión de Contactos"
          description="Vista unificada de Clientes (Construcción) y Leads (CRM)"
          accentColor="blue"
        />

        {/* Métricas de Contactos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contactos</CardTitle>
              <Users className="h-5 w-5 text-brilliant-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{contacts.length}</div>
              <p className="text-xs text-muted-foreground">Clientes + Leads</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Calientes</CardTitle>
              <Star className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{hotLeads}</div>
              <p className="text-xs text-muted-foreground">Score &gt; 80</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Pipeline</CardTitle>
              <Building className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${(totalValue / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Valor potencial total</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos Esta Semana</CardTitle>
              <Calendar className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {contacts.filter(c => {
                  const date = new Date(c.created_at);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - date.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  return diffDays <= 7;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Últimos 7 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Contactos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Contactos</CardTitle>
                <CardDescription>
                  Gestiona tu base de contactos con lead scoring y filtros avanzados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-brilliant-blue hover:bg-brilliant-blue/90">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Nuevo Contacto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Contacto</DialogTitle>
                      <DialogDescription>
                        Añade un nuevo contacto a tu base de datos. Elige entre Lead o Cliente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                          Tipo
                        </Label>
                        <Select 
                          value={newContact.type} 
                          onValueChange={(val: any) => setNewContact({...newContact, type: val})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Prospecto (Lead)</SelectItem>
                            <SelectItem value="client">Cliente (Construcción)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nombre
                        </Label>
                        <Input
                          id="name"
                          value={newContact.name}
                          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                          className="col-span-3"
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newContact.email}
                          onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                          className="col-span-3"
                          placeholder="ejemplo@correo.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Teléfono
                        </Label>
                        <Input
                          id="phone"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                          className="col-span-3"
                          placeholder="+54 9 11..."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="company" className="text-right">
                          Empresa
                        </Label>
                        <Input
                          id="company"
                          value={newContact.company_name}
                          onChange={(e) => setNewContact({...newContact, company_name: e.target.value})}
                          className="col-span-3"
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="position" className="text-right">
                          Cargo
                        </Label>
                        <Input
                          id="position"
                          value={newContact.position}
                          onChange={(e) => setNewContact({...newContact, position: e.target.value})}
                          className="col-span-3"
                          placeholder="Puesto o Cargo"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                          Notas
                        </Label>
                        <Textarea
                          id="notes"
                          value={newContact.notes}
                          onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                          className="col-span-3"
                          placeholder="Información adicional..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreateContact} disabled={isCreating}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Guardar Contacto
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros y Búsqueda */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar contactos..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <select className="px-3 py-2 border rounded-md text-sm bg-background">
                <option>Todos los canales</option>
                <option>Web</option>
                <option>LinkedIn</option>
                <option>Email</option>
                <option>Construction</option>
              </select>
              <select className="px-3 py-2 border rounded-md text-sm bg-background">
                <option>Todos los estados</option>
                <option>Client</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
            </div>

            {/* Lista de Contactos */}
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar y Info Principal */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${contact.type === 'client' ? 'bg-green-600' : 'bg-gradient-to-br from-brilliant-blue to-signal-yellow'}`}>
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground truncate">{contact.name}</h4>
                        {contact.type === 'client' && (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Cliente Activo
                          </Badge>
                        )}
                        <Badge className={getLeadScoreColor(contact.lead_score)}>
                          {contact.lead_score}
                        </Badge>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status?.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{contact.company_name || 'Sin empresa'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{contact.email || 'Sin email'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getChannelColor(contact.source)} variant="outline">
                          {contact.source}
                        </Badge>
                        {contact.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Métricas y Acciones */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-semibold text-lg">${((contact.value || 0) / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-muted-foreground">Valor potencial</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{contact.owner}</div>
                      <div className="text-xs text-muted-foreground">Responsable</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm">{new Date(contact.last_interaction).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">Última interacción</div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/workspace/crm-fomo/contacts/${contact.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredContacts.length} contactos
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" className="bg-brilliant-blue text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
} 
