'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'

export default function SetupPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mode, setMode] = useState<'loading' | 'super_admin_setup' | 'company_setup' | 'profile_setup'>('loading')
  
  // Estados para formularios
  const [companyData, setCompanyData] = useState({
    name: '',
    slug: '',
    ownerEmail: ''
  })
  const [profileData, setProfileData] = useState({
    fullName: '',
    companyName: '',
    companySlug: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      console.log('Setup: Starting user status check...')
      setIsLoading(true)
      setError('')
      
      // Get session with shorter timeout
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Setup: Session error:', sessionError)
        setError(`Error de sesión: ${sessionError.message}`)
        setIsLoading(false)
        return
      }
      
      if (!session) {
        console.log('Setup: No session found')
        setError('No hay sesión activa')
        setMode('profile_setup') // Allow manual setup
        setIsLoading(false)
        return
      }

      console.log('Setup: Session found for user:', session.user.email)

      // Check if super admin (with error handling)
      try {
        const { data: superAdmin, error: superAdminError } = await supabase
          .from('super_admins')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single()

        if (superAdmin) {
          console.log('Setup: User is super admin')
          setIsSuperAdmin(true)
          
          // Check if super admin has profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            console.log('Setup: Super admin has profile, redirecting to admin')
            router.push('/admin')
            return
          } else {
            console.log('Setup: Super admin needs profile creation')
            setMode('super_admin_setup')
          }
        } else {
          console.log('Setup: User is not super admin')
          setIsSuperAdmin(false)
        }
      } catch (superAdminErr: any) {
        console.log('Setup: Not super admin or error checking:', superAdminErr.message)
        setIsSuperAdmin(false)
      }

      // Check user profile for regular users
      if (!isSuperAdmin) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*, companies(*)')
            .eq('id', session.user.id)
            .single()

          setUserProfile(profile)

          if (!profile) {
            console.log('Setup: No profile found, setting up profile creation')
            setMode('profile_setup')
            setProfileData({
              ...profileData,
              fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
            })
          } else if (!profile.company_id) {
            console.log('Setup: Profile exists but no company')
            setMode('company_setup')
          } else if (profile.company_id && profile.status === 'active') {
            console.log('Setup: Everything configured, redirecting to workspace')
            router.push(`/workspace?company_id=${profile.company_id}`)
            return
          } else {
            console.log('Setup: Profile exists but needs configuration')
            setMode('profile_setup')
          }
        } catch (profileErr: any) {
          console.log('Setup: Profile check error:', profileErr.message)
          setMode('profile_setup')
          setProfileData({
            ...profileData,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
          })
        }
      }

      setIsLoading(false)
    } catch (error: any) {
      console.error('Setup: General error:', error)
      setError(`Error verificando estado: ${error.message}`)
      setMode('profile_setup') // Fallback to manual setup
      setIsLoading(false)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('No hay sesión activa')
        return
      }

      console.log('Setup: Creating profile for:', session.user.email)

      // Check if creating company
      let companyId = null
      if (profileData.companyName && profileData.companySlug) {
        const response = await fetch('/api/setup-company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: profileData.companyName,
            companySlug: profileData.companySlug,
            userEmail: session.user.email
          })
        })

        const companyResult = await response.json()
        
        if (response.ok) {
          companyId = companyResult.company?.id
          console.log('Setup: Company created:', companyId)
        } else {
          throw new Error(companyResult.error || 'Error creating company')
        }
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          full_name: profileData.fullName,
          company_id: companyId,
          role: companyId ? 'company_owner' : 'employee',
          status: 'active',
          preferences: {},
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-ES'
        })
        .select()
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      setResult({ message: '✅ Perfil creado correctamente' })
      
             // Redirect after success
       setTimeout(() => {
         if (companyId) {
           router.push(`/workspace?company_id=${companyId}`)
         } else {
           router.push('/setup') // Stay in setup for admin assignment
         }
       }, 2000)

    } catch (error: any) {
      console.error('Setup: Profile creation error:', error)
      setError(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/setup-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyData.name,
          companySlug: companyData.slug,
          userEmail: companyData.ownerEmail
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setTimeout(() => {
          checkUserStatus()
        }, 2000)
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (err: any) {
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createSuperAdminProfile = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('No hay sesión activa')
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.email?.split('@')[0] || 'Super Admin',
          role: 'super_admin',
          company_id: null, // Super admins don't need company
          status: 'active',
          preferences: {},
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-ES'
        })
        .select()
        .single()

      if (error) {
        setError(`Error creando perfil de super admin: ${error.message}`)
      } else {
        setResult({ message: '✅ Perfil de Super Admin creado' })
        setTimeout(() => {
          router.push('/admin')
        }, 2000)
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Verificando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'super_admin_setup' ? '👑 Configuración Super Admin' : '👤 Completar Perfil'}
            </h1>
            <p className="text-gray-600">
              {mode === 'super_admin_setup' 
                ? 'Completa tu perfil de Super Administrador'
                : 'Completa tu perfil para comenzar'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded text-red-700">
              <p><strong>Error:</strong> {error}</p>
              <div className="mt-2 space-x-2">
                <Button variant="outline" onClick={() => router.push('/fix-user')}>
                  🔧 Ir a Reparación
                </Button>
                <Button variant="outline" onClick={() => setError('')}>
                  🔄 Reintentar
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded text-green-700">
              <p><strong>¡Éxito!</strong> {result.message}</p>
            </div>
          )}

          {mode === 'super_admin_setup' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Eres un Super Administrador. Crea tu perfil para acceder al panel de administración.
                </p>
                <Button 
                  onClick={createSuperAdminProfile}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Creando...' : '👑 Crear Perfil de Super Admin'}
                </Button>
              </div>
            </div>
          )}

          {mode === 'profile_setup' && (
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-700">
                  ¿Quieres crear tu propia empresa? (Opcional)
                </Label>
                <p className="text-xs text-gray-500 mb-3">
                  Si dejas esto vacío, un administrador deberá asignarte a una empresa
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companySlug">Slug de la Empresa</Label>
                    <Input
                      id="companySlug"
                      type="text"
                      value={profileData.companySlug}
                      onChange={(e) => setProfileData({ ...profileData, companySlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="ej: mi-empresa"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Configurando...' : 'Completar Configuración'}
              </Button>
            </form>
          )}

          {mode === 'company_setup' && (
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="companySlug">Slug de la Empresa</Label>
                <Input
                  id="companySlug"
                  type="text"
                  value={companyData.slug}
                  onChange={(e) => setCompanyData({ ...companyData, slug: e.target.value.toLowerCase() })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ownerEmail">Email del Propietario</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={companyData.ownerEmail}
                  onChange={(e) => setCompanyData({ ...companyData, ownerEmail: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creando...' : 'Crear Empresa'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center space-y-3">
            <div className="text-sm text-gray-600">
              <p><strong>Estado del Sistema:</strong></p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>Base de datos: ⚠️ Verificar setup</div>
                <div>Autenticación: {error ? '❌ Error' : '✅ Sesión activa'}</div>
                <div>Perfil: {userProfile ? '✅ Configurado' : '❌ Pendiente'}</div>
                <div>Empresa: {userProfile?.company_id ? '✅ Asignada' : '❌ Pendiente'}</div>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">💡 Información:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Si no especificas una empresa, un administrador deberá asignarte a una más tarde</li>
                <li>• El slug solo puede contener letras minúsculas, números y guiones</li>
                <li>• Puedes cambiar esta información después en configuración</li>
              </ul>
            </div>

            <div className="text-xs text-gray-400">
              ¿Problemas con la configuración?
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/workspace')}
              className="text-xs"
            >
              🚀 Ir al Workspace (Modo Simple)
            </Button>
            <p className="text-xs text-gray-400">Omite la configuración y ve directo al workspace</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 