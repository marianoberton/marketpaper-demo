import { createClient as createBrowserClient } from '@/utils/supabase/client'

// Re-export types and constants
export type { UserRole, Permission, UserProfile, Company } from './auth-types'
export { ROLE_PERMISSIONS } from './auth-types'

// Función para obtener el perfil del usuario (cliente) - CLIENT ONLY
export function getCurrentUserClient(): Promise<import('./auth-types').UserProfile | null> {
  const supabase = createBrowserClient()
  
  return new Promise(async (resolve) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      resolve(null)
      return
    }

    // Primero verificar si es super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (superAdmin) {
      // Es super admin, crear perfil virtual
      const { ROLE_PERMISSIONS } = await import('./auth-types')
      resolve({
        id: user.id,
        email: user.email || '',
        full_name: superAdmin.full_name || user.email || 'Super Admin',
        avatar_url: user.user_metadata?.avatar_url,
        company_id: undefined, // Super admin no tiene company específica
        role: 'super_admin',
        permissions: ROLE_PERMISSIONS['super_admin'],
        status: 'active',
        last_login: new Date().toISOString(),
        preferences: {},
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es',
        created_at: superAdmin.created_at,
        updated_at: superAdmin.updated_at
      })
      return
    }

    // Si no es super admin, buscar en user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      resolve(null)
      return
    }

    const { ROLE_PERMISSIONS } = await import('./auth-types')
    resolve({
      ...profile,
      permissions: ROLE_PERMISSIONS[profile.role as import('./auth-types').UserRole] || []
    })
  })
}

// Función para verificar permisos - CLIENT/SERVER
export function hasPermission(user: import('./auth-types').UserProfile | null, permission: import('./auth-types').Permission): boolean {
  if (!user) return false
  return user.permissions.includes(permission)
}

// Función para verificar si es super admin - CLIENT/SERVER
export function isSuperAdmin(user: import('./auth-types').UserProfile | null): boolean {
  return user?.role === 'super_admin'
}

// Función para verificar si es admin de compañía - CLIENT/SERVER
export function isCompanyAdmin(user: import('./auth-types').UserProfile | null): boolean {
  return user?.role === 'company_owner' || user?.role === 'company_admin'
}

// Función para obtener la compañía del usuario (cliente)
export async function getUserCompanyClient(userId: string): Promise<import('./auth-types').Company | null> {
  const supabase = createBrowserClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userId)
    .single()

  if (!profile?.company_id) {
    return null
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (error || !company) {
    return null
  }

  return company
}

// Función helper para redireccionar al workspace con company_id
export async function redirectToWorkspace(router: any, userId?: string) {
  const supabase = createBrowserClient()
  
  try {
    // Obtener el usuario actual si no se proporciona userId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      userId = user.id
    }

    // Obtener el company_id del usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (profile?.company_id) {
      router.push(`/workspace?company_id=${profile.company_id}`)
    } else {
      router.push('/setup')
    }
  } catch (error) {
    console.error('Error redirecting to workspace:', error)
    router.push('/setup')
  }
}

// Función para verificar si el usuario actual es super admin
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const supabase = createBrowserClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    return !!superAdmin
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

// Función para cerrar sesión
export async function logout(router: any) {
  const supabase = createBrowserClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error al cerrar sesión:', error)
      throw error
    }
    
    // Redirigir al login
    router.push('/login')
  } catch (error) {
    console.error('Error durante logout:', error)
    // Incluso si hay error, intentar redirigir al login
    router.push('/login')
  }
} 