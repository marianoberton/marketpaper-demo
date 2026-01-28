import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - List invitations for my company
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || !['super_admin', 'company_owner', 'company_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
  }

  let query = supabase
    .from('company_invitations')
    .select(`
      *,
      invited_by_user:user_profiles!invited_by(full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (currentUser.role !== 'super_admin') {
    query = query.eq('company_id', currentUser.company_id)
  }

  const { data: invitations, error } = await query

  if (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Error al obtener invitaciones' }, { status: 500 })
  }

  return NextResponse.json({ invitations: invitations || [] })
}

// POST - Create new invitation
export async function POST(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { role } = body
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
  }
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
  }

  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || !['super_admin', 'company_owner', 'company_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'No tienes permisos para invitar usuarios' }, { status: 403 })
  }

  // Check role hierarchy
  const allowedRoles: Record<string, string[]> = {
    'super_admin': ['company_owner', 'company_admin', 'manager', 'employee', 'viewer'],
    'company_owner': ['company_admin', 'manager', 'employee', 'viewer'],
    'company_admin': ['manager', 'employee', 'viewer'],
  }

  if (role && !allowedRoles[currentUser.role]?.includes(role)) {
    return NextResponse.json({ error: `No puedes asignar el rol ${role}` }, { status: 403 })
  }

  // Check if user already exists in company
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .eq('company_id', currentUser.company_id)
    .single()

  if (existingUser) {
    return NextResponse.json({ error: 'Este usuario ya pertenece a tu empresa' }, { status: 400 })
  }

  // Check if there's already a pending invitation
  const { data: existingInvitation } = await supabase
    .from('company_invitations')
    .select('id')
    .eq('email', email)
    .eq('company_id', currentUser.company_id)
    .eq('status', 'pending')
    .single()

  if (existingInvitation) {
    return NextResponse.json({ error: 'Ya existe una invitación pendiente para este email' }, { status: 400 })
  }

  // Create invitation
  const { data: invitation, error: insertError } = await supabase
    .from('company_invitations')
    .insert({
      email,
      company_id: currentUser.company_id,
      invited_by: currentUser.id,
      target_role: role || 'employee',
      status: 'pending',
      requires_approval: true
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating invitation:', insertError)
    return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 })
  }

  // TODO: Send invitation email using Supabase or external service
  // For now, just log the invitation token
  console.log(`Invitation created for ${email} with token: ${invitation.token}`)

  return NextResponse.json({ 
    invitation,
    message: 'Invitación creada. El usuario recibirá un email para unirse.' 
  })
}

// DELETE - Cancel invitation
export async function DELETE(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const invitationId = searchParams.get('id')

  if (!invitationId) {
    return NextResponse.json({ error: 'ID de invitación requerido' }, { status: 400 })
  }

  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || !['super_admin', 'company_owner', 'company_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
  }

  const { error } = await supabase
    .from('company_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('company_id', currentUser.company_id)

  if (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json({ error: 'Error al cancelar invitación' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
