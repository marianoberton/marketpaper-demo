'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Users, 
  DollarSign, 
  Settings,
  ArrowLeft,
  Edit,
  Key,
  BarChart3,
  Calendar,
  Mail,
  Phone,
  Globe,
  AlertTriangle,
  PlusCircle,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { UserFormDialog } from '@/components/admin/UserFormDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteUserAction } from './actions'

// Re-using interfaces from the original page
interface Company {
  id: string
  name: string
  slug: string
  contact_email: string
  contact_phone?: string
  domain?: string
  status: string
  plan: string
  created_at: string
  max_users: number
  max_contacts: number
  max_api_calls: number
  monthly_price: number
  trial_ends_at?: string
  features: string[]
}

interface CompanyUser {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  last_login: string
}

interface ApiKey {
  id: string
  service: string
  key_name: string
  status: string
  total_cost: number
  total_calls: number
  monthly_limit_calls?: number
  monthly_limit_cost?: number
  last_used?: string
}

interface UsageStats {
  current_users: number
  current_contacts: number
  current_api_calls: number
  monthly_cost: number
  last_activity: string
}

interface CompanyDetailsClientProps {
  initialCompany: Company | null;
  initialUsers: CompanyUser[];
  initialApiKeys: ApiKey[];
  initialUsageStats: UsageStats | null;
}

export default function CompanyDetailsClient({ 
  initialCompany, 
  initialUsers, 
  initialApiKeys, 
  initialUsageStats 
}: CompanyDetailsClientProps) {
  
  const [company, setCompany] = useState<Company | null>(initialCompany)
  const [users, setUsers] = useState<CompanyUser[]>(initialUsers)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(initialUsageStats)
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<CompanyUser | null>(null);

  // Helper functions from the original page
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'outline'
    }
    
    const labels: Record<string, string> = {
      active: 'Activo',
      trial: 'Prueba',
      suspended: 'Suspendido',
      cancelled: 'Cancelado'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: 'bg-green-100 text-green-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
      custom: 'bg-orange-100 text-orange-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[plan] || 'bg-gray-100 text-gray-800'}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    )
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((current / max) * 100)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    setActionError(null);
    const result = await deleteUserAction(userId, company!.id);
    if (!result.success) {
      setActionError(result.message);
      // Optionally, show a toast notification
      alert(`Error: ${result.message}`);
    }
  };

  const handleOpenEditDialog = (user: CompanyUser) => {
    setUserToEdit(user);
    setIsUserFormOpen(true);
  };

  const handleOpenCreateDialog = () => {
    setUserToEdit(null);
    setIsUserFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsUserFormOpen(false);
    setUserToEdit(null);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Empresa no encontrada</h2>
        <p className="text-gray-600 mt-2">La empresa que buscas no existe o no tienes permisos para verla.</p>
        <Link href="/admin/companies">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">Detalles y configuración de la empresa</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href={`/workspace?company_id=${company.id}`} passHref>
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir al Workspace
            </Button>
          </Link>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Company Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <div className="mt-1">
                  {getStatusBadge(company.status)}
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
                <p className="text-sm text-gray-600">Plan</p>
                <div className="mt-1">
                  {getPlanBadge(company.plan)}
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
                <p className="text-sm text-gray-600">Usuarios</p>
                <p className="text-lg font-bold">{usageStats?.current_users} / {company.max_users}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registro</p>
                <p className="text-lg font-semibold">{formatDate(company.created_at)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Uso y Facturación</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500"/>
                        <a href={`mailto:${company.contact_email}`} className="text-blue-600 hover:underline">{company.contact_email}</a>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500"/>
                        <span>{company.contact_phone || 'No disponible'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500"/>
                        <a href={company.domain} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.domain || 'No disponible'}</a>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500"/>
                        <span>ID de Empresa: {company.id}</span>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="users">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Usuarios ({users.length})</CardTitle>
                        <CardDescription>Usuarios asociados a esta empresa.</CardDescription>
                    </div>
                    <Button onClick={handleOpenCreateDialog}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir Usuario
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Último Inicio de Sesión</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{user.full_name}</span>
                                            <span className="text-sm text-gray-500">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>{formatDateTime(user.last_login)}</TableCell>
                                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {actionError && <p className="text-sm text-red-500 mt-2">{actionError}</p>}
                </CardContent>
            </Card>
        </TabsContent>
        {/* Other tabs content... */}
      </Tabs>
      <UserFormDialog
        isOpen={isUserFormOpen}
        onClose={handleCloseDialog}
        companyId={company.id}
        userToEdit={userToEdit}
      />
    </div>
  )
} 