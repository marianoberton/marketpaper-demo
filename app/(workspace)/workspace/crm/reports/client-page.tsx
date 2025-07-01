'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Users, Building, Shield, Settings, UserPlus, Crown } from 'lucide-react'

import UserManagement from '@/components/auth/UserManagement'
import { UserProfile, Company, getCurrentUserClient, getUserCompanyClient } from '@/lib/auth-client'

export default function TeamClientPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener usuario actual
      const user = await getCurrentUserClient()
      if (!user) {
        setError('No se pudo obtener la información del usuario')
        return
      }
      
      setCurrentUser(user)

      // Obtener información de la compañía
      if (user.company_id) {
        const response = await fetch(`/api/auth/company?id=${user.company_id}`)
        if (response.ok) {
          const data = await response.json()
          setCompany(data.company)
        }
      }

    } catch (error: any) {
      console.error('Error loading user data:', error)
      setError(error.message || 'Error al cargar los datos del usuario')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return Crown
      case 'company_owner': return Shield
      case 'company_admin': return Settings
      case 'manager': return Users
      default: return Users
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500'
      case 'company_owner': return 'bg-red-500'
      case 'company_admin': return 'bg-blue-500'
      case 'manager': return 'bg-green-500'
      case 'employee': return 'bg-gray-500'
      case 'viewer': return 'bg-slate-400'
      default: return 'bg-gray-500'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'company_owner': return 'Propietario'
      case 'company_admin': return 'Administrador'
      case 'manager': return 'Gerente'
      case 'employee': return 'Empleado'
      case 'viewer': return 'Solo Lectura'
      default: return 'Usuario'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del equipo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6">
        <Card className="border-red-200 bg-red-50 max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto px-6 py-6 space-y-6">
        {/* Header principal */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Equipo</h1>
              <p className="text-gray-600 mt-1">
                Administra los usuarios y permisos de {company?.name || 'tu compañía'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {company && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Compañía</p>
                  <p className="font-semibold">{company.name}</p>
                  <Badge variant="outline" className="mt-1">
                    Plan {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Compañía
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permisos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {currentUser && currentUser.company_id && (
              <UserManagement 
                companyId={currentUser.company_id}
                currentUser={currentUser}
              />
            )}
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            {/* Información de la compañía */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Información de la Compañía
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company ? (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                        <p className="text-lg font-semibold">{company.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Slug</p>
                        <p className="text-sm">{company.slug}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Plan</p>
                        <Badge variant="outline">
                          {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado</p>
                        <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                          {company.status === 'active' ? 'Activa' : company.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Límites</p>
                        <p className="text-sm">
                          Máx. {company.max_users} usuarios • Máx. {company.max_contacts} contactos
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No se pudo cargar la información de la compañía</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    Tu Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentUser && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                        <p className="text-lg font-semibold">{currentUser.full_name || 'Sin nombre'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{currentUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Rol</p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const RoleIcon = getRoleIcon(currentUser.role)
                            return <RoleIcon className="h-4 w-4" />
                          })()}
                          <Badge className={`${getRoleColor(currentUser.role)} text-white`}>
                            {getRoleLabel(currentUser.role)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado</p>
                        <Badge variant={currentUser.status === 'active' ? 'default' : 'secondary'}>
                          {currentUser.status === 'active' ? 'Activo' : currentUser.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Miembro desde</p>
                        <p className="text-sm">{new Date(currentUser.created_at).toLocaleDateString()}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {/* Información de permisos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Tus Permisos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentUser.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explicación de roles */}
            <Card>
              <CardHeader>
                <CardTitle>Roles y Permisos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Super Admin</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Acceso completo a toda la plataforma y todas las compañías.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Propietario</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Control total sobre la compañía, usuarios y facturación.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Administrador</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gestión de usuarios, proyectos y configuración general.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Gerente</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gestión de proyectos, clientes y reportes.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Empleado</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Acceso a proyectos y clientes asignados.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Solo Lectura</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Acceso de solo lectura a información y reportes.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 