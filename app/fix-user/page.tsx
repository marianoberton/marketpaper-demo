'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'

export default function FixUserPage() {
  const [session, setSession] = useState<any>(null)
  const [userStatus, setUserStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      setLoading(true)
      
      // Obtener sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      setSession(session)
      
      if (!session) {
        setMessage('❌ No hay sesión activa - por favor inicia sesión')
        setLoading(false)
        return
      }

      console.log('✅ Sesión encontrada:', session.user.email)

      const status: any = {
        session: '✅ Activa',
        email: session.user.email,
        userId: session.user.id
      }

      // Verificar super admin
      try {
        const { data: superAdmin, error: superAdminError } = await supabase
          .from('super_admins')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (superAdmin) {
          status.superAdmin = `✅ Es Super Admin (${superAdmin.status})`
          status.isSuperAdmin = true
        } else {
          status.superAdmin = '❌ No es Super Admin'
          status.isSuperAdmin = false
        }
      } catch (err) {
        status.superAdmin = '❌ Error verificando Super Admin'
        status.isSuperAdmin = false
      }

      // Verificar perfil de usuario
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*, companies(*)')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          status.profile = `✅ Perfil existe`
          status.role = profile.role
          status.companyId = profile.company_id
          status.status = profile.status
          status.fullName = profile.full_name
          
          if (profile.companies) {
            status.company = `✅ Empresa: ${profile.companies.name}`
          } else if (profile.company_id) {
            status.company = `⚠️ Empresa ID: ${profile.company_id} (no encontrada)`
          } else {
            status.company = '❌ Sin empresa asignada'
          }
        } else {
          status.profile = '❌ Sin perfil'
          status.needsProfile = true
        }
      } catch (err) {
        status.profile = '❌ Error verificando perfil'
        status.needsProfile = true
      }

      setUserStatus(status)
      
      // Determinar mensaje
      if (status.isSuperAdmin) {
        setMessage('✅ Eres Super Admin - deberías ir a /admin')
      } else if (status.needsProfile) {
        setMessage('⚠️ Necesitas crear un perfil de usuario')
      } else if (!status.companyId) {
        setMessage('⚠️ Tienes perfil pero sin empresa asignada')
      } else {
        setMessage('✅ Todo parece estar bien - deberías ir a /workspace')
      }

    } catch (error) {
      console.error('Error:', error)
      setMessage(`❌ Error verificando estado: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const fixSuperAdmin = async () => {
    if (!session) return
    
    setFixing(true)
    try {
      const response = await fetch('/api/create-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          full_name: 'Super Administrator'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage('✅ Super Admin creado correctamente')
        await checkUserStatus()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setFixing(false)
    }
  }

  const createProfile = async () => {
    if (!session) return
    
    setFixing(true)
    try {
      // First check if user is already a super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single()

      const profileData = {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
        preferences: {},
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es-ES',
        status: 'active'
      }

      // If user is super admin, create profile as super admin without company
      if (superAdmin) {
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            ...profileData,
            role: 'super_admin',
            company_id: null  // Super admins don't need company
          })
          .select()
          .single()

        if (error) {
          setMessage(`❌ Error creando perfil de super admin: ${error.message}`)
        } else {
          setMessage('✅ Perfil de Super Admin creado correctamente')
          await checkUserStatus()
        }
      } else {
        // Regular user needs company - this should redirect to setup
        setMessage('⚠️ Usuario regular detectado - ve a /setup para crear empresa')
        router.push('/setup')
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setFixing(false)
    }
  }

  const goToCorrectPlace = () => {
    if (userStatus?.isSuperAdmin) {
      router.push('/admin')
    } else if (userStatus?.companyId) {
      router.push(`/workspace?company_id=${userStatus.companyId}`)
    } else {
      router.push('/setup')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Verificando estado del usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Diagnóstico y Reparación de Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {message && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium">{message}</p>
              </div>
            )}

            {userStatus && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Estado Actual:</h3>
                
                <div className="grid grid-cols-1 gap-3 font-mono text-sm">
                  <div>📧 Email: {userStatus.email}</div>
                  <div>🔑 Sesión: {userStatus.session}</div>
                  <div>👑 Super Admin: {userStatus.superAdmin}</div>
                  <div>👤 Perfil: {userStatus.profile}</div>
                  {userStatus.role && <div>🎭 Rol: {userStatus.role}</div>}
                  {userStatus.company && <div>🏢 Empresa: {userStatus.company}</div>}
                  {userStatus.status && <div>📊 Estado: {userStatus.status}</div>}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold">Acciones de Reparación:</h3>
              
              <div className="flex flex-wrap gap-3">
                <Button onClick={checkUserStatus} variant="outline">
                  🔄 Verificar Estado
                </Button>
                
                {session && !userStatus?.isSuperAdmin && (
                  <Button onClick={fixSuperAdmin} disabled={fixing}>
                    👑 Hacer Super Admin
                  </Button>
                )}
                
                {session && userStatus?.needsProfile && (
                  <Button onClick={createProfile} disabled={fixing}>
                    👤 Crear Perfil
                  </Button>
                )}
                
                {userStatus && (userStatus.isSuperAdmin || userStatus.companyId) && (
                  <Button onClick={goToCorrectPlace} className="bg-green-600 hover:bg-green-700">
                    ✅ Ir al lugar correcto
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Navegación:</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => router.push('/login')}>
                  🔑 Login
                </Button>
                <Button variant="outline" onClick={() => router.push('/debug-supabase')}>
                  🐛 Debug
                </Button>
                <Button variant="outline" onClick={() => router.push('/setup')}>
                  ⚙️ Setup
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
} 