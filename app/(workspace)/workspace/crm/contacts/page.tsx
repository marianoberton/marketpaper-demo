"use client";

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
  Trash2
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo con lead scoring
const contacts = [
  {
    id: 1,
    name: "María González",
    email: "maria@techsolutions.com",
    phone: "+1 234 567 8901",
    company: "Tech Solutions",
    position: "CTO",
    channel: "web",
    leadScore: 95,
    status: "hot",
    lastInteraction: "2024-01-15",
    tags: ["enterprise", "tech"],
    value: 45000,
    owner: "Carlos Mendez"
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    email: "carlos@startup.io",
    phone: "+1 234 567 8902",
    company: "StartupCo",
    position: "CEO",
    channel: "linkedin",
    leadScore: 78,
    status: "warm",
    lastInteraction: "2024-01-14",
    tags: ["startup", "saas"],
    value: 25000,
    owner: "Ana Silva"
  },
  {
    id: 3,
    name: "Ana Martínez",
    email: "ana@corp.com",
    phone: "+1 234 567 8903",
    company: "Corporate Inc",
    position: "Marketing Director",
    channel: "email",
    leadScore: 65,
    status: "warm",
    lastInteraction: "2024-01-13",
    tags: ["corporate", "marketing"],
    value: 35000,
    owner: "Luis Torres"
  },
  {
    id: 4,
    name: "Luis Fernández",
    email: "luis@agency.com",
    phone: "+1 234 567 8904",
    company: "Creative Agency",
    position: "Founder",
    channel: "whatsapp",
    leadScore: 42,
    status: "cold",
    lastInteraction: "2024-01-10",
    tags: ["agency", "creative"],
    value: 15000,
    owner: "María López"
  },
  {
    id: 5,
    name: "Sofia Chen",
    email: "sofia@innovate.com",
    phone: "+1 234 567 8905",
    company: "Innovate Labs",
    position: "Product Manager",
    channel: "instagram",
    leadScore: 88,
    status: "hot",
    lastInteraction: "2024-01-16",
    tags: ["innovation", "product"],
    value: 55000,
    owner: "Carlos Mendez"
  }
];

const getLeadScoreColor = (score: number) => {
  if (score >= 80) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  if (score >= 60) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'hot': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'warm': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'cold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getChannelColor = (channel: string) => {
  switch (channel) {
    case 'web': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'linkedin': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'whatsapp': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'instagram': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function ContactsPage() {
  const hotLeads = contacts.filter(c => c.status === 'hot').length;
  const totalValue = contacts.reduce((sum, contact) => sum + contact.value, 0);
  const avgScore = Math.round(contacts.reduce((sum, contact) => sum + contact.leadScore, 0) / contacts.length);

  return (
    <WorkspaceLayout>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Gestión de Contactos"
          description="Base de contactos con lead scoring inteligente y segmentación avanzada"
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
              <div className="text-3xl font-bold text-foreground">2,847</div>
              <p className="text-xs text-muted-foreground">+12% este mes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Calientes</CardTitle>
              <Star className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">89</div>
              <p className="text-xs text-muted-foreground">Score promedio: 78</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Pipeline</CardTitle>
              <Building className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">$485K</div>
              <p className="text-xs text-muted-foreground">Valor potencial total</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos Esta Semana</CardTitle>
              <Calendar className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">24</div>
              <p className="text-xs text-muted-foreground">+8% vs semana anterior</p>
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
                <Button className="bg-brilliant-blue hover:bg-brilliant-blue/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Contacto
                </Button>
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
                <option>WhatsApp</option>
                <option>Instagram</option>
              </select>
              <select className="px-3 py-2 border rounded-md text-sm bg-background">
                <option>Todos los estados</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
            </div>

            {/* Lista de Contactos */}
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar y Info Principal */}
                    <div className="w-12 h-12 bg-gradient-to-br from-brilliant-blue to-signal-yellow rounded-full flex items-center justify-center text-white font-semibold">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground truncate">{contact.name}</h4>
                        <Badge className={getLeadScoreColor(contact.leadScore)}>
                          {contact.leadScore}
                        </Badge>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{contact.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getChannelColor(contact.channel)} variant="outline">
                          {contact.channel}
                        </Badge>
                        {contact.tags.map((tag) => (
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
                      <div className="font-semibold text-lg">${(contact.value / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-muted-foreground">Valor potencial</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{contact.owner}</div>
                      <div className="text-xs text-muted-foreground">Responsable</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm">{contact.lastInteraction}</div>
                      <div className="text-xs text-muted-foreground">Última interacción</div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/workspace/crm/contacts/${contact.id}`}>
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
                Mostrando 1-{contacts.length} de {contacts.length} contactos
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" className="bg-brilliant-blue text-white">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
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