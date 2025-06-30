'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Shield, 
  UserCheck, 
  UserX, 
  Search,
  Crown,
  Settings,
  Eye,
  AlertTriangle
} from 'lucide-react'

import { UserProfile, UserRole, getCurrentUserClient, hasPermission } from '@/lib/auth-client'

interface UserManagementProps {
  companyId: string
  currentUser: UserProfile | null
}

interface CreateUserData {
  email: string
  full_name: string
  role: UserRole
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  company_owner: 'Propietario',
  company_admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
  viewer: 'Solo Lectura'
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-500',
  company_owner: 'bg-red-500',
  company_admin: 'bg-blue-500',
  manager: 'bg-green-500',
  employee: 'bg-gray-500',
  viewer: 'bg-slate-400'
}

const ROLE_ICONS: Record<UserRole, any> = {
  super_admin: Crown,
  company_owner: Shield,
  company_admin: Settings,
  manager: UserCheck,
  employee: Users,
  viewer: Eye
}

export default function UserManagement({ companyId, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    full_name: '',
    role: 'employee'
  })

  // Verificar permisos
  const canManageUsers = hasPermission(currentUser, 'manage_users')
  const canDeleteUsers = hasPermission(currentUser, 'delete') && hasPermission(currentUser, 'manage_users')

  useEffect(() => {
    if (canManageUsers) {
      loadUsers()
    }
  }, [companyId, canManageUsers])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/auth/users?company_id=${companyId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      console.error('Error loading users:', error)
      setError(error.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.trim() || !formData.full_name.trim()) {
      setError('Email y nombre completo son requeridos')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          company_id: companyId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear usuario')
      }

      const data = await response.json()
      setUsers(prev => [data.user, ...prev])
      resetForm()
    } catch (error: any) {
      setError(error.message || 'Error al crear usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          full_name: formData.full_name,
          role: formData.role
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar usuario')
      }

      const data = await response.json()
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? data.user : user
      ))
      resetForm()
    } catch (error: any) {
      setError(error.message || 'Error al actualizar usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/auth/users?id=${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      setUsers(prev => prev.filter(user => user.id !== userToDelete.id))
      setUserToDelete(null)
    } catch (error: any) {
      setError(error.message || 'Error al eliminar usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          status: newStatus
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar estado del usuario')
      }

      const data = await response.json()
      setUsers(prev => prev.map(u => 
        u.id === user.id ? data.user : u
      ))
    } catch (error: any) {
      setError(error.message || 'Error al cambiar estado del usuario')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'employee'
    })
    setShowCreateModal(false)
    setEditingUser(null)
    setError(null)
  }

  const startEdit = (user: UserProfile) => {
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role
    })
    setEditingUser(user)
    setShowCreateModal(true)
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ROLE_LABELS[user.role].toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            No tienes permisos para gestionar usuarios
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los usuarios y permisos de tu compañía
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={showCreateModal} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios por nombre, email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando usuarios...</p>
          </CardContent>
        </Card>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const RoleIcon = ROLE_ICONS[user.role]
            return (
              <Card key={user.id} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(user.full_name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {user.full_name || 'Sin nombre'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    {canManageUsers && user.id !== currentUser?.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(user)}
                          title="Editar usuario"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDeleteUsers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge className={`${ROLE_COLORS[user.role]} text-white`}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </div>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Creado: {new Date(user.created_at).toLocaleDateString()}</p>
                    {user.last_login && (
                      <p>Último acceso: {new Date(user.last_login).toLocaleDateString()}</p>
                    )}
                  </div>

                  {canManageUsers && user.id !== currentUser?.id && (
                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user)}
                        className="w-full"
                      >
                        {user.status === 'active' ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Intenta ajustar los términos de búsqueda' 
                : 'Comienza agregando usuarios a tu compañía'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Usuario
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Actualiza la información del usuario' 
                : 'Agrega un nuevo usuario a tu compañía'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@email.com"
                disabled={!!editingUser}
                required
              />
            </div>

            <div>
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nombre y apellido"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => {
                    // Solo permitir roles que el usuario actual puede asignar
                    if (role === 'super_admin' && currentUser?.role !== 'super_admin') return null
                    if (role === 'company_owner' && !['super_admin', 'company_owner'].includes(currentUser?.role || '')) return null
                    
                    return (
                      <SelectItem key={role} value={role}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (editingUser ? 'Actualizando...' : 'Creando...') 
                  : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <span className="font-semibold">{userToDelete?.full_name || userToDelete?.email}</span>?
              <br />
              <br />
              Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 