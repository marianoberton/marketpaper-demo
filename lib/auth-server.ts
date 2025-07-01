import { createClient } from '@/utils/supabase/server'
import type { UserProfile, UserRole, Company, Permission } from './auth-types'

// Re-export types from the main auth file
export type { UserRole, Permission, UserProfile, Company } from './auth-types'
export { ROLE_PERMISSIONS } from './auth-types'

// Función para obtener el usuario actual con permisos (SERVER ONLY)
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  const { ROLE_PERMISSIONS } = await import('./auth-types')
  return {
    ...profile,
    permissions: ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS] || []
  }
}

// Función para obtener la compañía del usuario (SERVER ONLY)
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

// Función para crear un nuevo usuario (SERVER ONLY)
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

  const { ROLE_PERMISSIONS } = await import('./auth-types')
  return {
    user: {
      ...profile,
      permissions: ROLE_PERMISSIONS[userData.role] || []
    },
    error: null
  }
}

// Función para actualizar usuario (SERVER ONLY)
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

  const { ROLE_PERMISSIONS } = await import('./auth-types')
  return {
    user: {
      ...profile,
      permissions: ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS] || []
    },
    error: null
  }
}

// Función para eliminar usuario (SERVER ONLY)
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

  // Eliminar de Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    return { error: authError.message }
  }

  return { error: null }
}

// Función para obtener usuarios de una compañía (SERVER ONLY)
export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')

  if (error || !profiles) {
    return []
  }

  const { ROLE_PERMISSIONS } = await import('./auth-types')
  return profiles.map(profile => ({
    ...profile,
    permissions: ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS] || []
  }))
}

// Función para invitar usuario (SERVER ONLY)
export async function inviteUser(inviteData: {
  email: string
  full_name: string
  role: UserRole
  company_id: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.admin.inviteUserByEmail(inviteData.email, {
    data: {
      full_name: inviteData.full_name,
      role: inviteData.role,
      company_id: inviteData.company_id
    }
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// Función para cambiar rol de usuario (SERVER ONLY)
export async function changeUserRole(
  userId: string, 
  newRole: UserRole
): Promise<{ error: string | null }> {
  return updateUser(userId, { role: newRole })
    .then(result => ({ error: result.error }))
}

// Función para cambiar estado de usuario (SERVER ONLY)
export async function toggleUserStatus(
  userId: string, 
  status: 'active' | 'inactive'
): Promise<{ error: string | null }> {
  return updateUser(userId, { status })
    .then(result => ({ error: result.error }))
}

// Función para verificar permisos de usuario (SERVER ONLY)
export async function userHasPermission(
  userId: string, 
  permission: Permission
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  return user.permissions.includes(permission)
}

// Función para verificar si el usuario es super admin (SERVER ONLY)
export async function isSuperAdmin(userId?: string): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser()
    return user?.role === 'super_admin'
  }
  
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
    
  return profile?.role === 'super_admin'
}

// Función para obtener perfil público de usuario (SERVER ONLY)
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  const { ROLE_PERMISSIONS } = await import('./auth-types')
  return {
    ...profile,
    permissions: ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS] || []
  }
} 