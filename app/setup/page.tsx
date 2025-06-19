'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    checkUserStatus()
    
    // Timeout de seguridad para evitar carga infinita
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.error('Setup: Timeout reached, forcing profile setup mode')
        setError('Timeout en carga - configurando modo manual')
        setMode('profile_setup')
        setIsLoading(false)
      }
    }, 15000) // 15 segundos timeout

    return () => clearTimeout(timeout)
  }, [])

  const checkUserStatus = async () => {
    try {
      console.log('Setup: Checking user status...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Setup: Session error:', sessionError)
        setError('Error de sesión')
        setIsLoading(false)
        return
      }
      
      if (!session) {
        console.log('Setup: No session, redirecting to login')
        router.push('/login')
        return
      }

      console.log('Setup: Session found for user:', session.user.email)

      // Verificar si es super admin (con manejo de errores)
      try {
        console.log('Setup: Checking super admin status...')
        const { data: superAdmin, error: superAdminError } = await supabase
          .from('super_admins')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single()

        if (superAdminError && superAdminError.code !== 'PGRST116') {
          console.error('Setup: Super admin check error:', superAdminError)
          // No es un error crítico, continuar
        }

        if (superAdmin) {
          console.log('Setup: User is super admin')
          setIsSuperAdmin(true)
          setMode('super_admin_setup')
          setIsLoading(false)
          return
        }
        
        console.log('Setup: User is not super admin')
      } catch (superAdminErr) {
        console.error('Setup: Super admin check failed:', superAdminErr)
        // Continuar sin ser super admin
      }

      // Verificar perfil de usuario (con manejo de errores)
      try {
        console.log('Setup: Checking user profile...')
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*, companies(*)')
          .eq('id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Setup: Profile check error:', profileError)
          // Si es un error diferente a "no encontrado", es problemático
          if (profileError.code !== 'PGRST116') {
            throw profileError
          }
        }

        console.log('Setup: Profile result:', profile)
        setUserProfile(profile)

        if (!profile) {
          console.log('Setup: No profile found, setting up profile creation')
          setMode('profile_setup')
          setProfileData({
            ...profileData,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
          })
        } else if (!profile.company_id) {
          console.log('Setup: Profile exists but no company, setting up company creation')
          setMode('company_setup')
        } else if (profile.company_id && profile.status === 'active') {
          console.log('Setup: Everything configured, redirecting to workspace')
          router.push('/workspace')
          return
        } else {
          console.log('Setup: Profile exists but needs configuration')
          setMode('profile_setup')
        }
      } catch (profileErr) {
        console.error('Setup: Profile check failed:', profileErr)
        // Si falla completamente, asumir que necesita crear perfil
        console.log('Setup: Assuming profile creation needed due to error')
        setMode('profile_setup')
        setProfileData({
          ...profileData,
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
        })
      }

      console.log('Setup: Finishing user status check')
      setIsLoading(false)
    } catch (error) {
      console.error('Setup: General error checking user status:', error)
      setError(`Error verificando estado del usuario: ${error}`)
      setIsLoading(false)
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
        // Recargar estado después de 2 segundos
        setTimeout(() => {
          checkUserStatus()
        }, 2000)
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    console.log('Setup: Creating profile...')

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Setup: Session error in profile creation:', sessionError)
        throw new Error('Error de sesión')
      }
      
      if (!session) {
        console.error('Setup: No session found')
        throw new Error('No hay sesión activa')
      }

      console.log('Setup: Session OK, creating profile for:', session.user.email)

      // Crear perfil de usuario con timeout
      console.log('Setup: Inserting user profile...')
      const profilePromise = supabase
        .from('user_profiles')
        .insert([{
          id: session.user.id,
          email: session.user.email,
          full_name: profileData.fullName
        }])
        .select()
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout creando perfil')), 10000)
      )

      const { data: profile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (profileError) {
        console.error('Setup: Profile creation error:', profileError)
        throw new Error(`Error creando perfil: ${profileError.message}`)
      }

      console.log('Setup: Profile created successfully:', profile)

      // Si también se especificó una empresa, crearla
      if (profileData.companyName && profileData.companySlug) {
        console.log('Setup: Creating company...')
        
        const companyPromise = fetch('/api/setup-company', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: profileData.companyName,
            companySlug: profileData.companySlug,
            userEmail: session.user.email
          })
        })

        const companyTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout creando empresa')), 10000)
        )

        const response = await Promise.race([companyPromise, companyTimeoutPromise]) as Response

        const companyData = await response.json()
        if (!response.ok) {
          console.error('Setup: Company creation error:', companyData)
          throw new Error(companyData.error || 'Error creando empresa')
        }

        console.log('Setup: Company created successfully:', companyData)
      }

      console.log('Setup: Profile setup completed, redirecting...')
      setResult({ message: 'Perfil creado exitosamente. Redirigiendo...' })
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push('/workspace')
      }, 2000)

    } catch (error: any) {
      console.error('Setup: Error creating profile:', error)
      setError(error.message || 'Error creando perfil')
    } finally {
      setLoading(false)
    }
  }

  const makeSuperAdmin = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        router.push('/admin')
      } else {
        setError(data.error || 'Error creando super admin')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brilliant-blue to-plum flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Verificando configuración...</h2>
          <p className="text-gray-600 text-sm">Esto puede tardar unos segundos</p>
          
          {/* Debug info en desarrollo */}
          <div className="mt-4 text-xs text-gray-500">
            <p>Modo: {mode}</p>
            <p>Super Admin: {isSuperAdmin ? 'Sí' : 'No'}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brilliant-blue to-plum flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur">
        {/* Mostrar errores si existen */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError('')
                checkUserStatus()
              }}
              className="mt-2 text-xs"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Mostrar resultados si existen */}
        {result && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">
              {result.message || 'Operación completada exitosamente'}
            </p>
          </div>
        )}

        {mode === 'super_admin_setup' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🚀 Configuración Super Admin
              </h1>
              <p className="text-gray-600">
                Eres un Super Administrador. Puedes crear empresas y gestionar usuarios.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/admin')}
                className="w-full"
              >
                Ir al Panel de Administración
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">¿Necesitas crear una empresa?</p>
                <Button 
                  variant="outline"
                  onClick={() => setMode('company_setup')}
                  className="w-full"
                >
                  Crear Nueva Empresa
                </Button>
              </div>
            </div>
          </>
        )}

        {mode === 'company_setup' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🏢 Crear Empresa
              </h1>
              <p className="text-gray-600">
                {isSuperAdmin ? 'Crea una nueva empresa como Super Admin' : 'Crea tu empresa y serás el propietario'}
              </p>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                  placeholder="Mi Empresa S.A."
                  required
                />
              </div>

              <div>
                <Label htmlFor="companySlug">Slug de la Empresa</Label>
                <Input
                  id="companySlug"
                  type="text"
                  value={companyData.slug}
                  onChange={(e) => setCompanyData({...companyData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  placeholder="mi-empresa"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>

              <div>
                <Label htmlFor="ownerEmail">Email del Propietario</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={companyData.ownerEmail}
                  onChange={(e) => setCompanyData({...companyData, ownerEmail: e.target.value})}
                  placeholder={userProfile?.email || "propietario@empresa.com"}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este usuario debe estar registrado en la plataforma
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Empresa'}
              </Button>
            </form>

            {isSuperAdmin && (
              <div className="mt-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="w-full"
                >
                  Volver al Panel de Admin
                </Button>
              </div>
            )}
          </>
        )}

        {mode === 'profile_setup' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                👤 Completar Perfil
              </h1>
              <p className="text-gray-600">
                Completa tu perfil para comenzar
              </p>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">¿Quieres crear tu propia empresa? (Opcional)</Label>
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
                      onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                      placeholder="Mi Empresa S.A."
                    />
                  </div>

                  <div>
                    <Label htmlFor="companySlug">Slug de la Empresa</Label>
                    <Input
                      id="companySlug"
                      type="text"
                      value={profileData.companySlug}
                      onChange={(e) => setProfileData({...profileData, companySlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                      placeholder="mi-empresa"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Configurando...' : 'Completar Configuración'}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          <strong>Estado del Sistema:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Base de datos: {isSuperAdmin ? '✅ Super Admin activo' : '⚠️  Verificar setup'}</li>
            <li>Autenticación: ✅ Sesión activa</li>
            <li>Perfil: {userProfile ? '✅ Creado' : '❌ Pendiente'}</li>
            <li>Empresa: {userProfile?.company_id ? '✅ Asignada' : '❌ Pendiente'}</li>
          </ul>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          <p><strong>💡 Información:</strong></p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Si no especificas una empresa, un administrador deberá asignarte a una más tarde</li>
            <li>• El slug solo puede contener letras minúsculas, números y guiones</li>
            <li>• Puedes cambiar esta información después en configuración</li>
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">¿Problemas con la configuración?</p>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Setup: Using simple mode, redirecting to workspace')
              router.push('/workspace')
            }}
            className="w-full text-xs"
          >
            🚀 Ir al Workspace (Modo Simple)
          </Button>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Omite la configuración y ve directo al workspace
          </p>
        </div>
      </Card>
    </div>
  )
} 