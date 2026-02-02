'use client'

import { useState, useEffect, useMemo } from 'react'
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
    Info
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

interface ClientInfo {
    id: string
    name: string
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
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'expired': 'bg-red-100 text-red-800',
    'cancelled': 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
    'active': 'Activo',
    'inactive': 'Inactivo',
    'pending': 'Pendiente',
    'expired': 'Expirado',
    'cancelled': 'Cancelado'
}

export default function CompanyUsersClientPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [clients, setClients] = useState<ClientInfo[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isTeamInviteDialogOpen, setIsTeamInviteDialogOpen] = useState(false)
    const [isClientInviteDialogOpen, setIsClientInviteDialogOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('employee')
    const [inviteClientId, setInviteClientId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('team')

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
            const response = await fetch('/api/company/users')
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
                    accentColor="blue"
                />
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {user.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                        </div>
                        {showClientInfo && user.client_id && (
                            <div className="text-sm text-amber-700 flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3" />
                                Cliente: {clients.find(c => c.id === user.client_id)?.name || 'Sin asignar'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden xl:inline">Último acceso:</span>
                        {formatDate(user.last_login)}
                    </div>

                    <Badge variant="outline" className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[user.role] || user.role}
                    </Badge>

                    <Badge className={statusColors[user.status] || 'bg-gray-100'}>
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
                                    setIsEditDialogOpen(true)
                                }}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Cambiar Rol
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === 'active' ? (
                                    <DropdownMenuItem
                                        onClick={() => handleUpdateUser(user.id, { status: 'inactive' })}
                                        className="text-red-600"
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Desactivar
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => handleUpdateUser(user.id, { status: 'active' })}
                                        className="text-green-600"
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isViewerInvite
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {isViewerInvite ? <Eye className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {invitation.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${isViewerInvite ? 'border-amber-300 text-amber-700' : ''}`}>
                                {isViewerInvite ? 'Portal Cliente' : roleLabels[invitation.target_role] || invitation.target_role}
                            </Badge>
                            {isViewerInvite && (invitation.client || invitation.client_id) && (
                                <span className="flex items-center gap-1 text-amber-700">
                                    <Building className="h-3 w-3" />
                                    {invitation.client?.name || clients.find(c => c.id === invitation.client_id)?.name || 'Cliente'}
                                </span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span>{formatDate(invitation.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge className={statusColors[invitation.status] || 'bg-gray-100'}>
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
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                accentColor="blue"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Equipo ({teamUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Portal Clientes ({viewerUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="invitations" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Invitaciones ({pendingInvitations.length})
                    </TabsTrigger>
                </TabsList>

                {/* ==================== TAB: EQUIPO ==================== */}
                <TabsContent value="team">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500">
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
                                <div className="text-center py-12 text-gray-500">
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
                <TabsContent value="clients">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500">
                            Usuarios con acceso al portal de solo lectura
                        </div>
                        <Button
                            onClick={() => setIsClientInviteDialogOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Dar acceso a cliente
                        </Button>
                    </div>

                    {/* Banner informativo */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex gap-3">
                        <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">Portal de Clientes</p>
                            <p>
                                Los usuarios de tipo cliente acceden a un portal de solo lectura donde pueden ver
                                la información de sus proyectos, documentos y avance de obra.
                                Acceden desde una URL diferente (<span className="font-mono text-xs bg-amber-100 px-1 rounded">/client-login</span>)
                                y no tienen acceso al workspace de gestión.
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Clientes con acceso</CardTitle>
                            <CardDescription>
                                Usuarios externos que acceden al portal de solo lectura de sus proyectos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {viewerUsers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="mb-2">No hay clientes con acceso al portal</p>
                                    <p className="text-sm text-gray-400">
                                        Invita a los clientes de tu empresa para que puedan ver sus proyectos
                                    </p>
                                    <Button
                                        variant="link"
                                        className="mt-2 text-amber-600"
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

                {/* ==================== TAB: INVITACIONES ==================== */}
                <TabsContent value="invitations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invitaciones Pendientes</CardTitle>
                            <CardDescription>
                                Personas invitadas que aún no se han registrado
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invitations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No hay invitaciones pendientes</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {invitations.map((invitation) => renderInvitationRow(invitation))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 flex gap-2">
                            <LinkIcon className="h-4 w-4 mt-0.5 shrink-0" />
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
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 flex gap-2">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
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
                                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-600">
                                    No hay clientes disponibles. Primero crea un cliente desde el módulo de construcción o CRM.
                                </div>
                            ) : (
                                <Select value={inviteClientId} onValueChange={setInviteClientId}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Selecciona un cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 flex gap-2">
                            <LinkIcon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <strong>Nota:</strong> Se generará un enlace de registro que deberás compartir con el cliente.
                                Una vez registrado, podrá acceder al portal desde <span className="font-mono text-xs bg-blue-100 px-1 rounded">/client-login</span>.
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
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear acceso de cliente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
