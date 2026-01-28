'use client'

import { useState, useEffect } from 'react'
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
    Copy,
    Trash2,
    Link as LinkIcon
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

interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: string
    status: string
    last_login: string | null
    created_at: string
    avatar_url: string | null
}

interface Invitation {
    id: string
    email: string
    target_role: string
    status: string
    created_at: string
    expires_at: string
    token: string // UUID used for registration
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
    'viewer': 'Solo lectura'
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
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('employee')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('users')

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
            setCurrentUserRole(data.currentUserRole || '')
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const fetchInvitations = async () => {
        try {
            const response = await fetch('/api/company/invitations')
            if (!response.ok) return // Silently fail if not implemented/error
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

    const handleInviteUser = async () => {
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

            const data = await response.json()
            toast.success('Invitación creada correctamente')

            // If we have manual link capability, show it
            if (data.invitation?.token) {
                // Optional: Show modal with link right away
            }

            fetchInvitations()
            setIsInviteDialogOpen(false)
            setInviteEmail('')
            setInviteRole('employee')
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
        // Create link to the acceptance page
        const link = `${window.location.origin}/invite/accept?token=${token}`

        navigator.clipboard.writeText(link)
        toast.success('Enlace copiado al portapapeles', {
            description: 'Compártelo con el usuario para que se registre.'
        })
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
                    description="Gestiona los usuarios de tu organización"
                    accentColor="blue"
                />
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            <PageHeader
                title="Usuarios de la Empresa"
                description="Gestiona los usuarios de tu organización"
                accentColor="blue"
            />

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Gestión de equipo y accesos
                </div>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Usuario
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Usuarios Activos ({users.length})
                    </TabsTrigger>
                    <TabsTrigger value="invitations" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Invitaciones ({invitations.filter(i => i.status === 'pending').length})
                    </TabsTrigger>
                </TabsList>

                {/* Users List */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipo</CardTitle>
                            <CardDescription>
                                Usuarios registrados en tu empresa
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {users.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No hay usuarios registrados</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {users.map((user) => {
                                        const RoleIcon = roleIcons[user.role] || User
                                        return (
                                            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium shrink-0">
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
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Invitations List */}
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
                                    <Button variant="link" onClick={() => setIsInviteDialogOpen(true)}>
                                        Crear nueva invitación
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {invitations.map((invitation) => {
                                        const isPending = invitation.status === 'pending'
                                        return (
                                            <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 shrink-0">
                                                        <Mail className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {invitation.email}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                                            <span>Rol: {roleLabels[invitation.target_role] || invitation.target_role}</span>
                                                            <span>•</span>
                                                            <span>Invitado el {formatDate(invitation.created_at)}</span>
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
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Role Dialog */}
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

            {/* Invite User Dialog */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invitar Usuario</DialogTitle>
                        <DialogDescription>
                            Genera un enlace de invitación para un nuevo miembro.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Notice about manual process */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 flex gap-2">
                            <LinkIcon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <strong>Nota:</strong> Al crear la invitación, se generará un enlace que deberás copiar y enviar manualmente al usuario (por WhatsApp, Slack, etc.).
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
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
                                    {getAvailableRoles().map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabels[role]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleInviteUser} disabled={isSubmitting || !inviteEmail}>
                            {isSubmitting ? 'Creando...' : 'Crear Invitación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
