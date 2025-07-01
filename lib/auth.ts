import { createClient } from '@/utils/supabase/client'
import type { UserRole, UserProfile, Company, Permission } from './auth-types'
import { ROLE_PERMISSIONS } from './auth-types'

// Re-export types and constants
export type { UserRole, Permission, UserProfile, Company } from './auth-types'
export { ROLE_PERMISSIONS } from './auth-types'

// Función para obtener el perfil del usuario (cliente) - CLIENT ONLY
export function getCurrentUserClient(): Promise<import('./auth-types').UserProfile | null> {
  const supabase = createClient()
  
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
      permissions: ROLE_PERMISSIONS[profile.role as UserRole] || []
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

// Función para obtener la compañía del usuario
export async function getUserCompany(userId: string): Promise<Company | null> {
  const supabase = await createClient()
  
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

// Función para crear un nuevo usuario
export async function createUser(userData: {
  email: string
  password: string
  full_name: string
  role: UserRole
  company_id: string
}): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = await createClient()

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { user: null, error: authError?.message || 'Error creating user' }
  }

  // Crear perfil de usuario
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: userData.email,
      full_name: userData.full_name,
      company_id: userData.company_id,
      role: userData.role,
      status: 'active'
    })
    .select()
    .single()

  if (profileError) {
    // Si falla la creación del perfil, eliminar el usuario de auth
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { user: null, error: profileError.message }
  }

  return {
    user: {
      ...profile,
      permissions: ROLE_PERMISSIONS[userData.role] || []
    },
    error: null
  }
}

// Función para actualizar usuario
export async function updateUser(
  userId: string, 
  updates: Partial<UserProfile>
): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { user: null, error: error.message }
  }

  return {
    user: {
      ...profile,
      permissions: ROLE_PERMISSIONS[profile.role as UserRole] || []
    },
    error: null
  }
}

// Función para eliminar usuario
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Eliminar perfil
  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    return { error: profileError.message }
  }

  // Eliminar de auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    return { error: authError.message }
  }

  return { error: null }
}

// Función para obtener usuarios de una compañía
export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error || !users) {
    return []
  }

  return users.map(user => ({
    ...user,
    permissions: ROLE_PERMISSIONS[user.role as UserRole] || []
  }))
}

// Función para invitar usuario por email
export async function inviteUser(inviteData: {
  email: string
  full_name: string
  role: UserRole
  company_id: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Generar contraseña temporal
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

  const result = await createUser({
    ...inviteData,
    password: tempPassword
  })

  if (result.error) {
    return { error: result.error }
  }

  // Aquí podrías enviar un email de invitación con un link para resetear la contraseña
  // Por ahora solo retornamos éxito
  return { error: null }
}

// Función para cambiar rol de usuario
export async function changeUserRole(
  userId: string, 
  newRole: UserRole
): Promise<{ error: string | null }> {
  return updateUser(userId, { role: newRole }).then(result => ({ error: result.error }))
}

// Función para suspender/activar usuario
export async function toggleUserStatus(
  userId: string, 
  status: 'active' | 'inactive'
): Promise<{ error: string | null }> {
  return updateUser(userId, { status }).then(result => ({ error: result.error }))
} 