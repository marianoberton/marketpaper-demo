import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// GET - List users from my company
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Get current user's profile to check role and company
  const { data: currentUser, error: userError } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (userError || !currentUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Only company_owner and company_admin can list users
  if (!['super_admin', 'company_owner', 'company_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'No tienes permisos para ver usuarios' }, { status: 403 })
  }

  // Build query - always exclude super_admins from company user lists
  let query = supabase
    .from('user_profiles')
    .select('id, email, full_name, role, status, last_login, created_at, company_id, avatar_url, client_id')
    .neq('role', 'super_admin') // IMPORTANTE: Los super_admin no pertenecen a empresas
    .order('created_at', { ascending: false })

  const targetCompanyId = currentUser.role === 'super_admin'
    ? new URL(request.url).searchParams.get('company_id')
    : currentUser.company_id

  if (!targetCompanyId) {
    return NextResponse.json({ error: 'company_id es requerido' }, { status: 400 })
  }

  query = query.eq('company_id', targetCompanyId)

  const { data: users, error: usersError } = await query

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }

  // Fetch company clients for viewer invitation flow
  // Using admin client to bypass RLS for reliable client listing
  let clients: { id: string; name: string }[] = []
  if (targetCompanyId) {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: clientsData, error: clientsError } = await supabaseAdmin
        .from('clients')
        .select('id, name')
        .eq('company_id', targetCompanyId)
        .order('name')

      if (clientsError) {
        console.error('Error fetching clients with admin client:', clientsError)
      } else {
        clients = clientsData || []
      }
    } catch (adminError) {
      console.error('Error creating admin client (check SUPABASE_SERVICE_ROLE_KEY):', adminError)
    }
  }

  return NextResponse.json({
    users: users || [],
    clients,
    currentUserRole: currentUser.role
  })
}

// PUT - Update user (role, status)
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { userId, role, status } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
  }

  // Get current user's profile
  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!currentUser) {
    return NextResponse.json({ error: 'Usuario actual no encontrado' }, { status: 404 })
  }

  // Get target user
  const { data: targetUser } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 })
  }

  // Permission checks
  const canManage = checkCanManageUser(currentUser, targetUser, role)
  if (!canManage.allowed) {
    return NextResponse.json({ error: canManage.reason }, { status: 403 })
  }

  // Prepare update data
  const updateData: Record<string, any> = {}
  if (role) updateData.role = role
  if (status) updateData.status = status

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating user:', updateError)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }

  return NextResponse.json({ user: updatedUser })
}

// Helper function to check permissions
function checkCanManageUser(
  currentUser: { role: string; company_id: string },
  targetUser: { role: string; company_id: string },
  newRole?: string
): { allowed: boolean; reason?: string } {
  // Super admin can manage anyone
  if (currentUser.role === 'super_admin') {
    return { allowed: true }
  }

  // Must be in same company
  if (currentUser.company_id !== targetUser.company_id) {
    return { allowed: false, reason: 'No puedes gestionar usuarios de otra empresa' }
  }

  // Cannot modify your own role
  if (currentUser.role === targetUser.role) {
    return { allowed: false, reason: 'No puedes modificar tu propio rol' }
  }

  // Role hierarchy
  const roleHierarchy: Record<string, string[]> = {
    'company_owner': ['company_admin', 'manager', 'employee', 'viewer'],
    'company_admin': ['manager', 'employee', 'viewer'],
  }

  const allowedTargetRoles = roleHierarchy[currentUser.role] || []
  
  // Check if can manage target's current role
  if (!allowedTargetRoles.includes(targetUser.role)) {
    return { allowed: false, reason: 'No tienes permisos para gestionar este usuario' }
  }

  // Check if new role is allowed
  if (newRole && !allowedTargetRoles.includes(newRole)) {
    return { allowed: false, reason: `No puedes asignar el rol ${newRole}` }
  }

  return { allowed: true }
}
