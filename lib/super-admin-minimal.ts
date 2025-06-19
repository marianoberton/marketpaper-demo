import { createSupabaseAdmin } from './supabase'

// =============================================
// SUPER ADMIN TYPES
// =============================================

export interface SuperAdmin {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'support'
  permissions: string[]
  status: 'active' | 'inactive' | 'suspended'
  last_login?: string
}

// =============================================
// SUPER ADMIN FUNCTIONS (MINIMAL)
// =============================================

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

export async function createSuperAdmin(userData: {
  user_id: string
  email: string
  full_name?: string
  role?: 'super_admin' | 'admin' | 'support'
  permissions?: string[]
}): Promise<SuperAdmin> {
  const supabaseAdmin = createSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('super_admins')
    .insert([{
      ...userData,
      role: userData.role || 'super_admin',
      permissions: userData.permissions || ['manage_clients', 'view_analytics', 'manage_billing', 'manage_users']
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSuperAdmins(): Promise<SuperAdmin[]> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting super admins:', error)
    return []
  }
}

// =============================================
// COMPANY MANAGEMENT (MINIMAL)
// =============================================

export async function createCompanyBasic(companyData: {
  name: string
  slug: string
  contact_email: string
  plan?: string
  created_by?: string
}): Promise<any> {
  const supabaseAdmin = createSupabaseAdmin()
  
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .insert([{
      name: companyData.name,
      slug: companyData.slug,
      contact_email: companyData.contact_email,
      plan: companyData.plan || 'starter',
      status: 'active',
      features: ['crm', 'analytics'],
      max_users: 10,
      max_contacts: 1000,
      max_api_calls: 10000,
      created_by: companyData.created_by
    }])
    .select()
    .single()

  if (companyError) throw companyError
  return company
}

export async function getAllCompanies(): Promise<any[]> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting companies:', error)
    return []
  }
}

export async function getCompanyById(companyId: string): Promise<any> {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting company:', error)
    return null
  }
} 