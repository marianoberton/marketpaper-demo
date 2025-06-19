'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  MoreVertical,
  Users,
  Shield,
  UserPlus,
  Building2,
  Mail,
  Calendar,
  Activity,
  Settings,
  Trash2,
  UserCheck,
  UserX,
  Clock
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
import Link from 'next/link'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_id?: string
  company_name?: string
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filteredSuperAdmins, setFilteredSuperAdmins] = useState<SuperAdmin[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [users, superAdmins, searchTerm, statusFilter, roleFilter, companyFilter, activeTab])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API calls when ready
      // const [usersResponse, superAdminsResponse] = await Promise.all([
      //   fetch('/api/admin/users'),
      //   fetch('/api/admin/super-admins')
      // ])
      // 
      // if (usersResponse.ok) {
      //   const usersData = await usersResponse.json()
      //   setUsers(usersData)
      // }
      // 
      // if (superAdminsResponse.ok) {
      //   const superAdminsData = await superAdminsResponse.json()
      //   setSuperAdmins(superAdminsData)
      // }
      
      setUsers([])
      setSuperAdmins([])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
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
    } else {
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
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'manager':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'member':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'super_admin':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  // Calculate stats
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    withApiAccess: users.filter(u => u.api_access_enabled).length
  }

  const superAdminStats = {
    total: superAdmins.length,
    active: superAdmins.filter(sa => sa.status === 'active').length,
    admins: superAdmins.filter(sa => sa.role === 'admin').length,
    superAdmins: superAdmins.filter(sa => sa.role === 'super_admin').length
  }

  const uniqueCompanies = Array.from(new Set(users.map(u => ({ id: u.company_id, name: u.company_name }))))
  const uniqueStatuses = Array.from(new Set([...users.map(u => u.status), ...superAdmins.map(sa => sa.status)]))
  const uniqueUserRoles = Array.from(new Set(users.map(u => u.role)))
  const uniqueSuperAdminRoles = Array.from(new Set(superAdmins.map(sa => sa.role)))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios y super administradores del sistema</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold">{superAdmins.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="admins">Super Admins ({superAdmins.length})</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay usuarios registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Los usuarios aparecerán aquí cuando se registren en el sistema
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invitar Usuario
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Users list would go here */}
            </div>
          )}
        </TabsContent>

        {/* Super Admins Tab */}
        <TabsContent value="admins">
          {filteredSuperAdmins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay super administradores
              </h3>
              <p className="text-gray-600 mb-4">
                Crea el primer super administrador para gestionar el sistema
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Super Admin
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Super admins list would go here */}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 