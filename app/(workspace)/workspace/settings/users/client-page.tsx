'use client'

import { useState, useEffect, useMemo } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Users,
    UserPlus,
    Shield,
    ShieldCheck,
    User,
    Eye,
    MoreVertical,
    Ban,
    CheckCircle,
    Clock,
    Mail,
    Trash2,
    Link as LinkIcon,
    ExternalLink,
    Building,
    Info,
    Box
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RoleModulesMatrix } from './components/RoleModulesMatrix'
import { UserModuleOverrides } from './components/UserModuleOverrides'

interface ClientInfo {
    id: string
    name: string
    portal_enabled?: boolean
}

interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: string
    status: string
    last_login: string | null
    created_at: string
    avatar_url: string | null
    client_id: string | null
    phone?: string | null
    position?: string | null
    department?: string | null
}

interface Invitation {
    id: string
    email: string
    target_role: string
    status: string
    created_at: string
    expires_at: string
    token: string
    client_id: string | null
    client: ClientInfo | null
    invited_by_user?: {
        full_name: string | null
        email: string
    }
}

const roleLabels: Record<string, string> = {
    'super_admin': 'Super Admin',
    'company_owner': 'Propietario',
    'company_admin': 'Administrador',
    'manager': 'Manager',
    'employee': 'Empleado',
    'viewer': 'Portal Cliente'
}

const roleIcons: Record<string, React.ElementType> = {
    'super_admin': ShieldCheck,
    'company_owner': Shield,
    'company_admin': Shield,
    'manager': Users,
    'employee': User,
    'viewer': Eye
}

const statusColors: Record<string, string> = {
    'active': 'bg-state-success-muted text-state-success',
    'inactive': 'bg-muted text-muted-foreground',
    'pending': 'bg-state-warning-muted text-state-warning',
    'expired': 'bg-state-error-muted text-state-error',
    'cancelled': 'bg-muted text-muted-foreground'
}

const statusLabels: Record<string, string> = {
    'active': 'Activo',
    'inactive': 'Inactivo',
    'pending': 'Pendiente',
    'expired': 'Expirado',
    'cancelled': 'Cancelado'
}

export default function CompanyUsersClientPage() {
    const { companyId, clientPortalEnabled } = useWorkspace()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [clients, setClients] = useState<ClientInfo[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false)
    const [isTeamInviteDialogOpen, setIsTeamInviteDialogOpen] = useState(false)
    const [isClientInviteDialogOpen, setIsClientInviteDialogOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('employee')
    const [inviteClientId, setInviteClientId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('team')
    const [moduleOverrideUser, setModuleOverrideUser] = useState<UserProfile | null>(null)
    const [editFormData, setEditFormData] = useState({
        full_name: '',
        phone: '',
        position: '',
        department: ''
    })
    const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set())

    const teamUsers = useMemo(() => users.filter(u => u.role !== 'viewer'), [users])
    const viewerUsers = useMemo(() => users.filter(u => u.role === 'viewer'), [users])
    const pendingInvitations = useMemo(() => invitations.filter(i => i.status === 'pending'), [invitations])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            await Promise.all([fetchUsers(), fetchInvitations()])
        } catch (error) {
            console.error('Error loading data', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const params = companyId ? `?company_id=${companyId}` : ''
            const response = await fetch(`/api/company/users${params}`)
            if (!response.ok) throw new Error('Error al cargar usuarios')
            const data = await response.json()
            setUsers(data.users || [])
            setClients(data.clients || [])
            setCurrentUserRole(data.currentUserRole || '')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const fetchInvitations = async () => {
        try {
            const response = await fetch('/api/company/invitations')
            if (!response.ok) return
            const data = await response.json()
            setInvitations(data.invitations || [])
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdateUser = async (userId: string, updates: { role?: string; status?: string }) => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/company/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...updates })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al actualizar usuario')
            }

            toast.success('Usuario actualizado correctamente')
            fetchUsers()
            setIsEditDialogOpen(false)
            setSelectedUser(null)
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar usuario')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateUserProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/company/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    full_name: editFormData.full_name,
                    phone: editFormData.phone,
                    position: editFormData.position,
                    department: editFormData.department
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al actualizar perfil')
            }

            toast.success('Perfil actualizado correctamente')
            fetchUsers()
            setIsEditProfileDialogOpen(false)
            setSelectedUser(null)
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar perfil')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInviteTeamUser = async () => {
        if (!inviteEmail) {
            toast.error('Ingresa un email')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/company/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al enviar invitación')
            }

            toast.success('Invitación creada correctamente')
            fetchInvitations()
            setIsTeamInviteDialogOpen(false)
            setInviteEmail('')
            setInviteRole('employee')
            setActiveTab('invitations')
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar invitación')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInviteClientUser = async () => {
        if (!inviteEmail) {
            toast.error('Ingresa un email')
            return
        }
        if (!inviteClientId) {
            toast.error('Selecciona un cliente')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/company/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: 'viewer',
                    client_id: inviteClientId
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al enviar invitación')
            }

            toast.success('Acceso de cliente creado correctamente')
            fetchInvitations()
            setIsClientInviteDialogOpen(false)
            setInviteEmail('')
            setInviteClientId('')
            setActiveTab('invitations')
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar invitación')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelInvitation = async (id: string) => {
        if (!confirm('¿Estás seguro de cancelar esta invitación?')) return

        try {
            const response = await fetch(`/api/company/invitations?id=${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Error al cancelar')

            toast.success('Invitación cancelada')
            fetchInvitations()
        } catch (error) {
            toast.error('No se pudo cancelar la invitación')
        }
    }

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/invite/accept?token=${token}`
        navigator.clipboard.writeText(link)
        toast.success('Enlace copiado al portapapeles', {
            description: 'Compártelo con el usuario para que se registre.'
        })
    }

    const toggleInvitationSelection = (id: string) => {
        setSelectedInvitations(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const toggleSelectAll = () => {
        if (selectedInvitations.size === pendingInvitations.length) {
            setSelectedInvitations(new Set())
        } else {
            setSelectedInvitations(new Set(pendingInvitations.map(i => i.id)))
        }
    }

    const handleBulkDeleteInvitations = async () => {
        if (selectedInvitations.size === 0) {
            toast.error('Selecciona al menos una invitación')
            return
        }

        if (!confirm(`¿Estás seguro de cancelar ${selectedInvitations.size} invitacion(es)?`)) return

        setIsSubmitting(true)
        try {
            const deletePromises = Array.from(selectedInvitations).map(id =>
                fetch(`/api/company/invitations?id=${id}`, { method: 'DELETE' })
            )

            const results = await Promise.allSettled(deletePromises)
            const failed = results.filter(r => r.status === 'rejected').length

            if (failed > 0) {
                toast.error(`${failed} invitacion(es) no pudieron cancelarse`)
            } else {
                toast.success(`${selectedInvitations.size} invitacion(es) canceladas`)
            }

            setSelectedInvitations(new Set())
            fetchInvitations()
        } catch (error) {
            toast.error('Error al cancelar invitaciones')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleClientPortalAccess = async (clientId: string, currentlyEnabled: boolean) => {
        try {
            const response = await fetch('/api/company/clients/portal-toggle', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    portalEnabled: !currentlyEnabled
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al actualizar acceso')
            }

            toast.success(!currentlyEnabled ? 'Portal habilitado para el cliente' : 'Portal deshabilitado para el cliente')
            fetchUsers() // Refresh to get updated client info
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar acceso al portal')
        }
    }

    const getTeamRoles = () => {
        if (currentUserRole === 'super_admin') {
            return ['company_owner', 'company_admin', 'manager', 'employee']
        }
        if (currentUserRole === 'company_owner') {
            return ['company_admin', 'manager', 'employee']
        }
        if (currentUserRole === 'company_admin') {
            return ['manager', 'employee']
        }
        return []
    }

    const getAvailableRoles = () => {
        if (currentUserRole === 'super_admin') {
            return ['company_owner', 'company_admin', 'manager', 'employee', 'viewer']
        }
        if (currentUserRole === 'company_owner') {
            return ['company_admin', 'manager', 'employee', 'viewer']
        }
        if (currentUserRole === 'company_admin') {
            return ['manager', 'employee', 'viewer']
        }
        return []
    }

    const canManageUser = (user: UserProfile): boolean => {
        if (currentUserRole === 'super_admin') return true
        if (currentUserRole === 'company_owner') {
            return ['company_admin', 'manager', 'employee', 'viewer'].includes(user.role)
        }
        if (currentUserRole === 'company_admin') {
            return ['manager', 'employee', 'viewer'].includes(user.role)
        }
        return false
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Nunca'
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading && users.length === 0) {
        return (
            <div className="flex flex-col gap-8 p-6">
                <PageHeader
                    title="Usuarios de la Empresa"
                    description="Gestiona tu equipo y los accesos de clientes"
                />
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    const renderUserRow = (user: UserProfile, showClientInfo: boolean = false) => {
        const RoleIcon = roleIcons[user.role] || User
        return (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0 ${
                        user.role === 'viewer'
                            ? 'bg-gradient-to-br from-orange to-orange/80'
                            : 'bg-gradient-to-br from-primary to-primary/70'
                    }`}>
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-foreground">
                            {user.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                        </div>
                        {showClientInfo && user.client_id && (
                            <div className="text-sm text-orange flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3" />
                                Cliente: {clients.find(c => c.id === user.client_id)?.name || 'Sin asignar'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden xl:inline">Último acceso:</span>
                        {formatDate(user.last_login)}
                    </div>

                    <Badge variant="outline" className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[user.role] || user.role}
                    </Badge>

                    <Badge className={statusColors[user.status] || 'bg-muted'}>
                        {statusLabels[user.status] || user.status}
                    </Badge>

                    {canManageUser(user) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user)
                                    setEditFormData({
                                        full_name: user.full_name || '',
                                        phone: user.phone || '',
                                        position: user.position || '',
                                        department: user.department || ''
                                    })
                                    setIsEditProfileDialogOpen(true)
                                }}>
                                    <User className="mr-2 h-4 w-4" />
                                    Editar Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user)
                                    setIsEditDialogOpen(true)
                                }}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Cambiar Rol
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setModuleOverrideUser(user)}>
                                    <Box className="mr-2 h-4 w-4" />
                                    Configurar Modulos
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === 'active' ? (
                                    <DropdownMenuItem
                                        onClick={() => handleUpdateUser(user.id, { status: 'inactive' })}
                                        className="text-destructive"
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Desactivar
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => handleUpdateUser(user.id, { status: 'active' })}
                                        className="text-state-success"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activar
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        )
    }

    const renderInvitationRow = (invitation: Invitation) => {
        const isPending = invitation.status === 'pending'
        const isViewerInvite = invitation.target_role === 'viewer'

        return (
            <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                <div className="flex items-center gap-4">
                    {isPending && (
                        <Checkbox
                            checked={selectedInvitations.has(invitation.id)}
                            onCheckedChange={() => toggleInvitationSelection(invitation.id)}
                        />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isViewerInvite
                            ? 'bg-state-warning-muted text-state-warning'
                            : 'bg-state-pending-muted text-state-pending'
                    }`}>
                        {isViewerInvite ? <Eye className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="font-medium text-foreground">
                            {invitation.email}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${isViewerInvite ? 'border-orange/30 text-orange' : ''}`}>
                                {isViewerInvite ? 'Portal Cliente' : roleLabels[invitation.target_role] || invitation.target_role}
                            </Badge>
                            {isViewerInvite && (invitation.client || invitation.client_id) && (
                                <span className="flex items-center gap-1 text-orange">
                                    <Building className="h-3 w-3" />
                                    {invitation.client?.name || clients.find(c => c.id === invitation.client_id)?.name || 'Cliente'}
                                </span>
                            )}
                            <span className="text-muted-foreground/50">•</span>
                            <span>{formatDate(invitation.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge className={statusColors[invitation.status] || 'bg-muted'}>
                        {statusLabels[invitation.status] || invitation.status}
                    </Badge>

                    {isPending && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex gap-2"
                                onClick={() => copyInviteLink(invitation.token)}
                            >
                                <LinkIcon className="h-3 w-3" />
                                Copiar Link
                            </Button>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleCancelInvitation(invitation.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            <PageHeader
                title="Usuarios de la Empresa"
                description="Gestiona tu equipo interno y los accesos de clientes al portal"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Equipo ({teamUsers.length})
                    </TabsTrigger>
                    {clientPortalEnabled && (
                        <TabsTrigger value="clients" className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Portal Clientes ({viewerUsers.length})
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="invitations" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Invitaciones ({pendingInvitations.length})
                    </TabsTrigger>
                    <TabsTrigger value="modules" className="flex items-center gap-2">
                        <Box className="h-4 w-4" />
                        Modulos
                    </TabsTrigger>
                </TabsList>

                {/* ==================== TAB: EQUIPO ==================== */}
                <TabsContent value="team">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">
                            Usuarios con acceso a la plataforma de gestión
                        </div>
                        <Button onClick={() => setIsTeamInviteDialogOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invitar al equipo
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipo interno</CardTitle>
                            <CardDescription>
                                Estos usuarios acceden a la plataforma completa del workspace
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {teamUsers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No hay usuarios de equipo registrados</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {teamUsers.map((user) => renderUserRow(user))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== TAB: PORTAL CLIENTES ==================== */}
                {clientPortalEnabled && (
                    <TabsContent value="clients">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">
                            Usuarios con acceso al portal de solo lectura
                        </div>
                        <Button
                            onClick={() => setIsClientInviteDialogOpen(true)}
                            className="bg-orange hover:bg-orange/90 text-primary-foreground"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Dar acceso a cliente
                        </Button>
                    </div>

                    {/* Banner informativo */}
                    <div className="bg-state-warning-muted border border-state-warning/30 rounded-lg p-4 mb-4 flex gap-3">
                        <Info className="h-5 w-5 text-state-warning mt-0.5 shrink-0" />
                        <div className="text-sm text-foreground">
                            <p className="font-medium mb-1">Portal de Clientes</p>
                            <p>
                                Los usuarios de tipo cliente acceden a un portal de solo lectura donde pueden ver
                                la información de sus proyectos, documentos y avance de obra.
                                Acceden desde una URL diferente (<span className="font-mono text-xs bg-state-warning/20 px-1 rounded">/client-login</span>)
                                y no tienen acceso al workspace de gestión.
                            </p>
                        </div>
                    </div>

                    {/* Gestión de acceso al portal por cliente */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Configurar acceso al portal</CardTitle>
                            <CardDescription>
                                Habilita o deshabilita el acceso al portal para cada cliente de tu empresa
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {clients.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Building className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No hay clientes registrados en tu empresa</p>
                                    <p className="text-xs mt-1">Crea clientes desde el módulo de Construcción o CRM</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {clients.map((client) => (
                                        <div
                                            key={client.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Building className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-foreground">{client.name}</p>
                                                    {client.portal_enabled ? (
                                                        <p className="text-xs text-state-success">Portal habilitado</p>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">Portal deshabilitado</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={client.portal_enabled || false}
                                                    onCheckedChange={() => handleToggleClientPortalAccess(client.id, client.portal_enabled || false)}
                                                />
                                                <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                                                    {client.portal_enabled ? 'Habilitado' : 'Deshabilitado'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Clientes con acceso</CardTitle>
                            <CardDescription>
                                Usuarios externos que acceden al portal de solo lectura de sus proyectos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {viewerUsers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="mb-2">No hay clientes con acceso al portal</p>
                                    <p className="text-sm text-muted-foreground/70">
                                        Invita a los clientes de tu empresa para que puedan ver sus proyectos
                                    </p>
                                    <Button
                                        variant="link"
                                        className="mt-2 text-orange"
                                        onClick={() => setIsClientInviteDialogOpen(true)}
                                    >
                                        Dar acceso a un cliente
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {viewerUsers.map((user) => renderUserRow(user, true))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                )}

                {/* ==================== TAB: INVITACIONES ==================== */}
                <TabsContent value="invitations">
                    {pendingInvitations.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={selectedInvitations.size === pendingInvitations.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {selectedInvitations.size > 0 ? `${selectedInvitations.size} seleccionadas` : 'Seleccionar todas'}
                                </span>
                            </div>
                            {selectedInvitations.size > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBulkDeleteInvitations}
                                    disabled={isSubmitting}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar seleccionadas ({selectedInvitations.size})
                                </Button>
                            )}
                        </div>
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle>Invitaciones Pendientes</CardTitle>
                            <CardDescription>
                                Personas invitadas que aún no se han registrado
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingInvitations.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No hay invitaciones pendientes</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {pendingInvitations.map((invitation) => renderInvitationRow(invitation))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== TAB: MODULOS ==================== */}
                <TabsContent value="modules">
                    <RoleModulesMatrix />
                </TabsContent>
            </Tabs>

            {/* ==================== DIALOG: MODULOS POR USUARIO ==================== */}
            {moduleOverrideUser && (
                <UserModuleOverrides
                    user={moduleOverrideUser}
                    isOpen={!!moduleOverrideUser}
                    onClose={() => setModuleOverrideUser(null)}
                />
            )}

            {/* ==================== DIALOG: EDITAR PERFIL ==================== */}
            <Dialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Perfil de Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica la información de {selectedUser?.full_name || selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateUserProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-full-name">Nombre completo</Label>
                            <Input
                                id="edit-full-name"
                                value={editFormData.full_name}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Teléfono</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+54 11 1234-5678"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-position">Puesto / Cargo</Label>
                                <Input
                                    id="edit-position"
                                    value={editFormData.position}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, position: e.target.value }))}
                                    placeholder="Ej: Gerente de Ventas"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-department">Departamento</Label>
                                <Input
                                    id="edit-department"
                                    value={editFormData.department}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                                    placeholder="Ej: Comercial"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditProfileDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ==================== DIALOG: CAMBIAR ROL ==================== */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Rol</DialogTitle>
                        <DialogDescription>
                            Modifica el rol de {selectedUser?.full_name || selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label>Nuevo rol</Label>
                        <Select
                            value={selectedUser?.role || ''}
                            onValueChange={(value) => {
                                if (selectedUser) {
                                    handleUpdateUser(selectedUser.id, { role: value })
                                }
                            }}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {getAvailableRoles().map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {roleLabels[role]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== DIALOG: INVITAR EQUIPO ==================== */}
            <Dialog open={isTeamInviteDialogOpen} onOpenChange={setIsTeamInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invitar al equipo</DialogTitle>
                        <DialogDescription>
                            Genera un enlace de invitación para un nuevo miembro del equipo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-state-info-muted border border-state-info/30 rounded-md p-3 text-sm text-foreground flex gap-2">
                            <LinkIcon className="h-4 w-4 mt-0.5 shrink-0 text-state-info" />
                            <div>
                                <strong>Nota:</strong> Al crear la invitación, se generará un enlace que deberás copiar y enviar manualmente al usuario (por WhatsApp, Slack, etc.).
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="team-invite-email">Email</Label>
                            <Input
                                id="team-invite-email"
                                type="email"
                                placeholder="usuario@email.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label>Rol</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {getTeamRoles().map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabels[role]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsTeamInviteDialogOpen(false)
                            setInviteEmail('')
                            setInviteRole('employee')
                        }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleInviteTeamUser} disabled={isSubmitting || !inviteEmail}>
                            {isSubmitting ? 'Creando...' : 'Crear Invitación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== DIALOG: DAR ACCESO A CLIENTE ==================== */}
            <Dialog open={isClientInviteDialogOpen} onOpenChange={setIsClientInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dar acceso a cliente</DialogTitle>
                        <DialogDescription>
                            Crea un acceso al portal de clientes para que pueda ver sus proyectos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-state-warning-muted border border-state-warning/30 rounded-md p-3 text-sm text-foreground flex gap-2">
                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-state-warning" />
                            <div>
                                Este usuario accederá al <strong>portal de clientes</strong> con vista de solo lectura.
                                Podrá ver los proyectos asociados al cliente seleccionado, descargar documentos y consultar el avance de obra.
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="client-invite-email">Email del cliente</Label>
                            <Input
                                id="client-invite-email"
                                type="email"
                                placeholder="cliente@email.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label>Cliente asociado</Label>
                            {clients.length === 0 ? (
                                <div className="mt-2 bg-muted border border-border rounded-md p-3 text-sm text-muted-foreground">
                                    No hay clientes disponibles. Primero crea un cliente desde el módulo de construcción o CRM.
                                </div>
                            ) : clients.filter(c => c.portal_enabled).length === 0 ? (
                                <div className="mt-2 bg-state-warning-muted border border-state-warning/30 rounded-md p-3 text-sm text-foreground">
                                    <p className="font-medium mb-1">No hay clientes con portal habilitado</p>
                                    <p className="text-xs">Primero habilita el acceso al portal para al menos un cliente en la pestaña "Portal Clientes".</p>
                                </div>
                            ) : (
                                <>
                                    <Select value={inviteClientId} onValueChange={setInviteClientId}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Selecciona un cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.filter(c => c.portal_enabled).map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Solo se muestran clientes con portal habilitado ({clients.filter(c => c.portal_enabled).length} de {clients.length})
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="bg-state-info-muted border border-state-info/30 rounded-md p-3 text-sm text-foreground flex gap-2">
                            <LinkIcon className="h-4 w-4 mt-0.5 shrink-0 text-state-info" />
                            <div>
                                <strong>Nota:</strong> Se generará un enlace de registro que deberás compartir con el cliente.
                                Una vez registrado, podrá acceder al portal desde <span className="font-mono text-xs bg-state-info/20 px-1 rounded">/client-login</span>.
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsClientInviteDialogOpen(false)
                            setInviteEmail('')
                            setInviteClientId('')
                        }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleInviteClientUser}
                            disabled={isSubmitting || !inviteEmail || !inviteClientId}
                            className="bg-orange hover:bg-orange/90 text-primary-foreground"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear acceso de cliente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
