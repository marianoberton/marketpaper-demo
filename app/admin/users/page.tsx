'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit,
  MoreVertical,
  Users,
  Shield,
  UserPlus,
  Building2,
  Mail,
  Calendar,
  Trash2,
  Clock,
  RefreshCw,
  CheckCircle,
  Phone,
  User,
  XCircle
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_id?: string
  company_name?: string
  client_id?: string
  role: string
  status: string
  created_at: string
  last_login?: string
  api_access_enabled: boolean
  monthly_llm_limit_cost: number
  onboarding_completed: boolean
}

interface SuperAdmin {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: string
  status: string
  created_at: string
  last_login?: string
  permissions: string[]
}

interface RegistrationRequest {
  id: string
  full_name: string
  email: string
  company_name: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requested_at: string
  metadata?: any
}

interface Company {
  id: string
  name: string
  status: string
}

interface Client {
  id: string
  name: string
  email?: string
  contact_person?: string
  company_id: string
}

interface ProcessRequestData {
  action: 'create_super_admin' | 'assign_to_company' | 'create_new_company' | 'reject'
  company_id?: string
  new_company_name?: string
  role?: string
  notes?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([])
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filteredSuperAdmins, setFilteredSuperAdmins] = useState<SuperAdmin[]>([])
  const [filteredRequests, setFilteredRequests] = useState<RegistrationRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [error, setError] = useState('')
  
  // Registration request processing
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [processModalOpen, setProcessModalOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processData, setProcessData] = useState<ProcessRequestData>({
    action: 'assign_to_company',
    role: 'employee'
  })

  // User management modals
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState<SuperAdmin | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form data for create/edit
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    company_id: '',
    client_id: '',
    status: 'active',
    password: ''
  })
  
  // Success state for showing temp password
  const [createdUserInfo, setCreatedUserInfo] = useState<{email: string, tempPassword: string} | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [users, superAdmins, registrationRequests, searchTerm, statusFilter, roleFilter, companyFilter, activeTab])

  // Cargar clientes cuando cambia la empresa en el formulario
  useEffect(() => {
    if (formData.company_id && formData.company_id !== 'none') {
      loadClients(formData.company_id)
    } else {
      setClients([])
      setFormData(prev => ({ ...prev, client_id: '' }))
    }
  }, [formData.company_id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Load all data in parallel for better performance
      await Promise.all([
        loadUsers(),
        loadSuperAdmins(),
        loadRegistrationRequests(),
        loadCompanies()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Error cargando datos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async (companyId: string) => {
    try {
      const response = await fetch(`/api/admin/clients?company_id=${companyId}`)
      const data = await response.json()
      
      if (response.ok) {
        setClients(Array.isArray(data) ? data : [])
      } else {
        console.error('Error cargando clientes:', data)
        setClients([])
      }
    } catch (err) {
      console.error('Error de conexión cargando clientes:', err)
      setClients([])
    }
  }

  const loadRegistrationRequests = async () => {
    try {
      const response = await fetch('/api/registration-requests')
      const data = await response.json()
      
      if (response.ok) {
        setRegistrationRequests(data.requests || [])
      } else {
        setError(data.error || 'Error cargando solicitudes')
      }
    } catch (err) {
      setError('Error de conexión')
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      
      if (response.ok) {
        setCompanies(Array.isArray(data) ? data : [])
      } else {
        console.error('Error en respuesta del API:', data)
      }
    } catch (err) {
      console.error('Error cargando compañías:', err)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(Array.isArray(data) ? data : [])
        console.log('📊 Usuarios cargados:', data.length || 0)
      } else {
        console.error('Error cargando usuarios:', data)
        setError(data.error || 'Error cargando usuarios')
      }
    } catch (err) {
      console.error('Error de conexión cargando usuarios:', err)
      setError('Error de conexión al cargar usuarios')
    }
  }

  const loadSuperAdmins = async () => {
    try {
      const response = await fetch('/api/admin/super-admins')
      const data = await response.json()
      
      if (response.ok) {
        setSuperAdmins(Array.isArray(data) ? data : [])
        console.log('🛡️ Súper admins cargados:', data.length || 0)
      } else {
        console.error('Error cargando súper admins:', data)
        setError(data.error || 'Error cargando súper admins')
      }
    } catch (err) {
      console.error('Error de conexión cargando súper admins:', err)
      setError('Error de conexión al cargar súper admins')
    }
  }

  // User management functions
  const handleCreateUser = async () => {
    setIsCreating(true)
    try {
      // Prepare data for API, converting "none" to null for company_id and client_id
      const apiData = {
        ...formData,
        company_id: formData.company_id === 'none' ? null : formData.company_id,
        client_id: formData.client_id === 'none' || formData.client_id === '' ? null : formData.client_id
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const result = await response.json()

      if (response.ok) {
        await loadUsers() // Reload users
        setCreateModalOpen(false)
        resetForm()
        setError('')
        
        // Show success modal with password info
        setCreatedUserInfo({
          email: result.user?.email || formData.email,
          tempPassword: result.tempPassword || 'Contraseña personalizada asignada'
        })
        setShowSuccessModal(true)
      } else {
        setError(result.error || 'Error creando usuario')
      }
    } catch (err) {
      setError('Error de conexión al crear usuario')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    
    setIsUpdating(true)
    try {
      // Prepare data for API, converting "none" to null for company_id and client_id
      const apiData = {
        ...formData,
        company_id: formData.company_id === 'none' ? null : formData.company_id,
        client_id: formData.client_id === 'none' || formData.client_id === '' ? null : formData.client_id
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedUser.id,
          ...apiData
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await loadUsers() // Reload users
        setEditModalOpen(false)
        setSelectedUser(null)
        resetForm()
        setError('')
      } else {
        setError(result.error || 'Error actualizando usuario')
      }
    } catch (err) {
      setError('Error de conexión al actualizar usuario')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        await loadUsers() // Reload users
        setDeleteModalOpen(false)
        setSelectedUser(null)
        setError('')
      } else {
        setError(result.error || 'Error eliminando usuario')
      }
    } catch (err) {
      setError('Error de conexión al eliminar usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role,
      company_id: user.company_id || 'none',
      client_id: user.client_id || 'none',
      status: user.status,
      password: '' // No mostramos la contraseña existente por seguridad
    })
    
    // Cargar clientes si el usuario tiene una empresa asignada
    if (user.company_id) {
      loadClients(user.company_id)
    }
    
    setEditModalOpen(true)
  }

  const openCreateModal = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: '',
      company_id: 'none',
      client_id: 'none',
      status: 'active',
      password: ''
    })
  }

  const filterData = () => {
    if (activeTab === 'users') {
      let filtered = users

      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === statusFilter)
      }

      if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.role === roleFilter)
      }

      if (companyFilter !== 'all') {
        filtered = filtered.filter(user => user.company_id === companyFilter)
      }

      setFilteredUsers(filtered)
    } else if (activeTab === 'super-admins') {
      let filtered = superAdmins

      if (searchTerm) {
        filtered = filtered.filter(admin =>
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(admin => admin.status === statusFilter)
      }

      if (roleFilter !== 'all') {
        filtered = filtered.filter(admin => admin.role === roleFilter)
      }

      setFilteredSuperAdmins(filtered)
    } else if (activeTab === 'requests') {
      let filtered = registrationRequests

      if (searchTerm) {
        filtered = filtered.filter(request =>
          request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.company_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(request => request.status === statusFilter)
      }

      setFilteredRequests(filtered)
    }
  }

  const handleProcessRequest = (request: RegistrationRequest) => {
    setSelectedRequest(request)
    setProcessData({
      action: 'assign_to_company',
      role: 'employee',
      new_company_name: request.company_name
    })
    setProcessModalOpen(true)
  }

  const processRequest = async () => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/process-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          ...processData
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await loadRegistrationRequests()
        setProcessModalOpen(false)
        setSelectedRequest(null)
      } else {
        setError(result.error || 'Error procesando solicitud')
      }
    } catch (err) {
      setError('Error de conexión al procesar solicitud')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'pending':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'suspended':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'approved':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'processed':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
      case 'company_owner':
        return 'bg-orange/10 text-orange border-orange/20'
      case 'admin':
      case 'company_admin':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'manager':
        return 'bg-orange/10 text-orange border-orange/20'
      case 'member':
      case 'employee':
        return 'bg-muted text-muted-foreground border-border'
      case 'super_admin':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusBadge = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      processed: 'Procesada',
      active: 'Activo',
      inactive: 'Inactivo',
      suspended: 'Suspendido'
    }
    
    return (
      <Badge className={`${getStatusColor(status)} border`}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(word => word[0]).join('').toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      company_owner: 'Dueño de Compañía',
      company_admin: 'Admin de Compañía',
      manager: 'Gerente',
      employee: 'Empleado',
      viewer: 'Visualizador',
      owner: 'Dueño',
      admin: 'Administrador',
      member: 'Miembro',
      super_admin: 'Súper Admin'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  const getRequestsCount = () => {
    return registrationRequests.filter(req => req.status === 'pending').length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra usuarios, súper admins y solicitudes de registro</p>
            <div className="h-1 w-24 bg-primary rounded-full mt-2" />
          </div>
        </div>

        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra usuarios, súper admins y solicitudes de registro</p>
          <div className="h-1 w-24 gradient-cta rounded-full mt-2" />
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Usuarios activos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Súper Admins</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superAdmins.length}</div>
            <p className="text-xs text-muted-foreground">Administradores</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRequestsCount()}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrationRequests.length}</div>
            <p className="text-xs text-muted-foreground">Todas las solicitudes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="owner">Dueño</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="member">Miembro</SelectItem>
                </SelectContent>
              </Select>
              
              {activeTab === 'users' && (
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="super-admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Súper Admins
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Solicitudes
            {getRequestsCount() > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {getRequestsCount()}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                Gestiona todos los usuarios registrados en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay usuarios</h3>
                  <p className="text-muted-foreground mb-4">No se encontraron usuarios que coincidan con los filtros.</p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Usuario
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {getInitials(user.email, user.full_name)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.company_name || 'Sin empresa'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_login ? formatDate(user.last_login) : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openDeleteModal(user)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Super Admins Tab */}
        <TabsContent value="super-admins">
          <Card>
            <CardHeader>
              <CardTitle>Súper Administradores</CardTitle>
              <CardDescription>
                Gestiona los súper administradores con acceso completo al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSuperAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay súper admins</h3>
                  <p className="text-muted-foreground mb-4">No se encontraron súper administradores.</p>
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Súper Admin
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrador</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuperAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-foreground">
                                {getInitials(admin.email, admin.full_name)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{admin.full_name || 'Sin nombre'}</div>
                              <div className="text-sm text-muted-foreground">{admin.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(admin.role)}>
                            {getRoleDisplayName(admin.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(admin.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {admin.last_login ? formatDate(admin.last_login) : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {admin.permissions?.slice(0, 2).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {admin.permissions?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{admin.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Permisos
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revocar Acceso
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Registro</CardTitle>
              <CardDescription>
                Gestiona las solicitudes de acceso a la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay solicitudes</h3>
                  <p className="text-muted-foreground">No se encontraron solicitudes que coincidan con los filtros.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{request.full_name}</div>
                              <div className="text-sm text-muted-foreground">{request.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{request.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{request.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.requested_at)}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleProcessRequest(request)}
                                className="h-8"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Procesar
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Contactar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario en el sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="usuario@empresa.com"
              />
            </div>
            
            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Juan Pérez"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Súper Admin</SelectItem>
                  <SelectItem value="company_owner">Dueño de Compañía</SelectItem>
                  <SelectItem value="company_admin">Admin de Compañía</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Select 
                value={formData.company_id || "none"} 
                onValueChange={(value) => setFormData({...formData, company_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin empresa</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="password">Contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Dejar vacío para generar automáticamente"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Si no especificas una contraseña, se generará una temporal automáticamente
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={isCreating || !formData.email || !formData.full_name || !formData.role}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Usuario'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled // No permitir cambiar email
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground mt-1">El email no se puede modificar</p>
            </div>
            
            <div>
              <Label htmlFor="edit_full_name">Nombre Completo</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Juan Pérez"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_role">Rol</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Súper Admin</SelectItem>
                  <SelectItem value="company_owner">Dueño de Compañía</SelectItem>
                  <SelectItem value="company_admin">Admin de Compañía</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit_status">Estado</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de Cliente - Solo para usuarios viewer */}
            {formData.role === 'viewer' && formData.company_id && formData.company_id !== 'none' && (
              <div>
                <Label htmlFor="edit_client">Cliente Asignado</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData({...formData, client_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cliente asignado</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Los usuarios visualizadores pueden ser asignados a un cliente específico
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEditModalOpen(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={isUpdating || !formData.full_name || !formData.role}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Usuario'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a {selectedUser?.full_name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-destructive mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-destructive mb-1">
                    Esta acción no se puede deshacer
                  </h3>
                  <p className="text-sm text-destructive/80">
                    Se eliminará permanentemente el usuario {selectedUser?.email} y
                    todos sus datos asociados.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar Usuario'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Process Registration Request Modal */}
      <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Solicitud</DialogTitle>
            <DialogDescription>
              Procesa la solicitud de registro de {selectedRequest?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Request Info */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm">
                <div><strong>Nombre:</strong> {selectedRequest?.full_name}</div>
                <div><strong>Email:</strong> {selectedRequest?.email}</div>
                <div><strong>Empresa:</strong> {selectedRequest?.company_name}</div>
                <div><strong>Teléfono:</strong> {selectedRequest?.phone}</div>
              </div>
            </div>

            {/* Action Selection */}
            <div>
              <Label htmlFor="action">Acción</Label>
              <Select 
                value={processData.action} 
                onValueChange={(value) => setProcessData({...processData, action: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign_to_company">Asignar a empresa existente</SelectItem>
                  <SelectItem value="create_new_company">Crear nueva empresa</SelectItem>
                  <SelectItem value="create_super_admin">Crear súper admin</SelectItem>
                  <SelectItem value="reject">Rechazar solicitud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields */}
            {processData.action === 'assign_to_company' && (
              <>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Select 
                    value={processData.company_id} 
                    onValueChange={(value) => setProcessData({...processData, company_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Rol en la empresa</Label>
                  <Select 
                    value={processData.role} 
                    onValueChange={(value) => setProcessData({...processData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_owner">Dueño de Compañía</SelectItem>
                      <SelectItem value="company_admin">Admin de Compañía</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="employee">Empleado</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {processData.action === 'create_new_company' && (
              <>
                <div>
                  <Label htmlFor="company_name">Nombre de la nueva empresa</Label>
                  <Input 
                    value={processData.new_company_name || ''} 
                    onChange={(e) => setProcessData({...processData, new_company_name: e.target.value})}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rol del usuario</Label>
                  <Select 
                    value={processData.role} 
                    onValueChange={(value) => setProcessData({...processData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_owner">Dueño de Compañía</SelectItem>
                      <SelectItem value="company_admin">Admin de Compañía</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {processData.action === 'reject' && (
              <div>
                <Label htmlFor="notes">Motivo del rechazo (opcional)</Label>
                <Textarea 
                  value={processData.notes || ''} 
                  onChange={(e) => setProcessData({...processData, notes: e.target.value})}
                  placeholder="Explicar por qué se rechaza la solicitud..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setProcessModalOpen(false)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={processRequest}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Procesar Solicitud'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal - Show Password Info */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Usuario Creado Exitosamente
            </DialogTitle>
            <DialogDescription>
              El usuario ha sido creado y está listo para usar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-foreground mb-2">Información del usuario:</div>
                <div><strong>Email:</strong> {createdUserInfo?.email}</div>
                <div><strong>Estado:</strong> Activo</div>
              </div>
            </div>

            <div className="bg-muted border border-border rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-foreground mb-2">Información de acceso:</div>
                {createdUserInfo?.tempPassword && createdUserInfo.tempPassword !== 'Contraseña personalizada asignada' ? (
                  <>
                    <div className="mb-2">
                      <strong>Contraseña temporal:</strong>
                    </div>
                    <div className="bg-card p-3 rounded border border-border font-mono text-sm break-all">
                      {createdUserInfo.tempPassword}
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Guarda esta contraseña temporal. El usuario debe cambiarla en su primer acceso.
                    </p>
                  </>
                ) : (
                  <div className="text-primary">
                    Se asignó la contraseña personalizada especificada.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                onClick={() => {
                  setShowSuccessModal(false)
                  setCreatedUserInfo(null)
                }}
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}