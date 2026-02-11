'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Building2,
  Users,
  ArrowLeft,
  BarChart3,
  Calendar,
  Mail,
  Phone,
  Globe,
  PlusCircle,
  MoreHorizontal,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  FileStack
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { UserFormDialog } from '@/components/admin/UserFormDialog'
import { IntegrationsTab } from '@/components/admin/IntegrationsTab'
import { TemplateManagementTab } from '@/components/admin/TemplateManagementTab'
import { ColorCustomizer } from '@/components/admin/ColorCustomizer'
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
import { toast } from 'sonner'

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
  logo_url?: string
  template_id?: string | null
  client_portal_enabled?: boolean
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
  initialUsageStats: UsageStats | null;
}

export default function CompanyDetailsClient({
  initialCompany,
  initialUsers,

  initialUsageStats
}: CompanyDetailsClientProps) {

  const [company, setCompany] = useState<Company | null>(initialCompany)
  const [users, setUsers] = useState<CompanyUser[]>(initialUsers)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(initialUsageStats)
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<CompanyUser | null>(null);

  // Logo upload state
  const [isUploading, setIsUploading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

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
    return (
      <Badge variant="secondary">
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
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

  // Logo upload functions
  const handleLogoUpload = async (file: File) => {
    if (!company) return

    setIsUploading(true)
    try {
      console.log('🔧 Starting logo upload for company:', company.id)
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      // Create form data for API call
      const formData = new FormData()
      formData.append('file', file)

      console.log('📡 Calling API route for upload...')

      // Call our API route instead of direct Supabase call
      const response = await fetch(`/api/admin/companies/${company.id}/logo`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log('✅ Upload successful:', result)

      // Update local state with the new logo URL
      setCompany({ ...company, logo_url: result.logoUrl })
      toast.success('Logo actualizado exitosamente')

    } catch (error) {
      console.error('❌ Logo upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el logo'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setLogoFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2)
      })

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        console.error('❌ Invalid file type:', file.type)
        toast.error(`Formato no válido: ${file.type}. Use JPEG, PNG, SVG, WebP o GIF`)
        e.target.value = '' // Clear the input
        return
      }

      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        console.error('❌ File too large:', file.size, 'bytes')
        toast.error(`El archivo es muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 50MB`)
        e.target.value = '' // Clear the input
        return
      }

      console.log('✅ File validation passed')
      setLogoFile(file)
    }
  }

  const handleToggleClientPortal = async (enabled: boolean) => {
    if (!company) return

    try {
      const response = await fetch(`/api/admin/companies/${company.id}/portal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_portal_enabled: enabled })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al actualizar portal')
      }

      // Update local state
      setCompany(prev => prev ? { ...prev, client_portal_enabled: enabled } : null)
      toast.success(enabled ? 'Portal de clientes habilitado' : 'Portal de clientes deshabilitado')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar configuración de portal')
    }
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground">Empresa no encontrada</h2>
        <p className="text-muted-foreground mt-2">La empresa que buscas no existe o no tienes permisos para verla.</p>
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/companies" className="hover:text-foreground transition-colors">
          Empresas
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{company.name}</span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shadow-md text-primary-foreground font-bold text-xl shrink-0">
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={`Logo de ${company.name}`}
                  width={56}
                  height={56}
                  className="object-contain rounded-xl"
                />
              ) : (
                company.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {getStatusBadge(company.status)}
                {getPlanBadge(company.plan)}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="font-mono">/{company.slug}</span>
                {company.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {company.contact_email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(company.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/workspace?company_id=${company.id}`} passHref>
              <Button>
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir al Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat cards inline */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border divide-x divide-border">
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usuarios</p>
              <p className="text-lg font-semibold">{usageStats?.current_users || 0}<span className="text-sm font-normal text-muted-foreground"> / {company.max_users}</span></p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contactos</p>
              <p className="text-lg font-semibold">{usageStats?.current_contacts || 0}<span className="text-sm font-normal text-muted-foreground"> / {company.max_contacts}</span></p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Módulos</p>
              <p className="text-lg font-semibold">{company.features?.length || 0}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Última Actividad</p>
              <p className="text-sm font-medium">{usageStats?.last_activity ? formatDateTime(usageStats.last_activity) : 'Sin actividad'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="template">
            <FileStack className="w-4 h-4 mr-2" />
            Plantilla y Módulos
          </TabsTrigger>
          <TabsTrigger value="apikeys">Integraciones</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="usage">Facturación</TabsTrigger>
          <TabsTrigger value="settings">Configuración Avanzada</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información de contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${company.contact_email}`} className="text-sm text-primary hover:underline">{company.contact_email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm">{company.contact_phone || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dominio</p>
                    {company.domain ? (
                      <a href={company.domain} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{company.domain}</a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No disponible</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uso de recursos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uso de Recursos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Usuarios</span>
                    <span className="font-medium">{usageStats?.current_users || 0} / {company.max_users}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getUsageColor(getUsagePercentage(usageStats?.current_users || 0, company.max_users))}`}
                      style={{ width: `${Math.min(getUsagePercentage(usageStats?.current_users || 0, company.max_users), 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Contactos</span>
                    <span className="font-medium">{usageStats?.current_contacts || 0} / {company.max_contacts}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getUsageColor(getUsagePercentage(usageStats?.current_contacts || 0, company.max_contacts))}`}
                      style={{ width: `${Math.min(getUsagePercentage(usageStats?.current_contacts || 0, company.max_contacts), 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Módulos activos</span>
                    <span className="font-medium">{company.features?.length || 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {company.features?.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                          <span className="text-sm text-muted-foreground">{user.email}</span>
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

        <TabsContent value="template">
          <TemplateManagementTab
            companyId={company.id}
            initialTemplateId={company.template_id}
          />
        </TabsContent>

        <TabsContent value="apikeys">
          <IntegrationsTab companyId={company.id} />
        </TabsContent>

        <TabsContent value="branding">
          <div className="space-y-6">
            {/* Logo Management (movido desde tab Configuración) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo de la Empresa
                </CardTitle>
                <CardDescription>
                  Configura el logo que se mostrará en el workspace de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Logo Display */}
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-medium">Logo Actual:</Label>
                    <div className="mt-2 w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={`Logo de ${company.name}`}
                          width={120}
                          height={120}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Sin logo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="logo-upload" className="text-sm font-medium">
                        Subir Nuevo Logo
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos: JPEG, PNG, SVG, WebP, GIF. Tamaño máximo: 50MB
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {logoFile && (
                        <Button
                          onClick={() => handleLogoUpload(logoFile)}
                          disabled={isUploading}
                          className="flex items-center gap-2"
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Subir Logo
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {logoFile && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium text-foreground">
                          Archivo seleccionado: {logoFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tamaño: {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview in Workspace */}
                {company.logo_url && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Vista Previa en Workspace:</Label>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-card rounded border border-border">
                      <Image
                        src={company.logo_url}
                        alt={`Logo de ${company.name}`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                      <span className="font-logo text-xl font-bold text-primary">{company.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Colores Personalizados - NUEVO */}
            <Card>
              <CardHeader>
                <CardTitle>Colores Personalizados</CardTitle>
                <CardDescription>
                  Define los colores que se usarán en el workspace de esta empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ColorCustomizer companyId={company.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Uso y Facturación</CardTitle>
              <CardDescription>Estadísticas de uso y costos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Funcionalidad de facturación por implementar</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            {/* ID y configuraciones técnicas */}
            <Card>
              <CardHeader>
                <CardTitle>Información Técnica</CardTitle>
                <CardDescription>Identificadores y configuraciones del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">ID de Empresa:</span>
                  <code className="text-sm bg-muted text-foreground px-2 py-1 rounded">{company.id}</code>
                </div>
              </CardContent>
            </Card>

            {/* Other Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>Configuraciones adicionales de la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Portal Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-foreground">Portal de Clientes</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permite que esta empresa invite clientes externos con acceso de solo lectura a sus proyectos
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm text-muted-foreground">
                      {company.client_portal_enabled ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                    <Switch
                      checked={company.client_portal_enabled || false}
                      onCheckedChange={handleToggleClientPortal}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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