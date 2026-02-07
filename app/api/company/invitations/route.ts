import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email'
import { InvitationEmail } from '@/lib/emails/invitation'

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

  // Try query with client join first, fallback to basic query if client_id column doesn't exist yet
  let invitations = null
  let error = null

  // First try with client relation (requires migration 0042)
  let query = supabase
    .from('company_invitations')
    .select(`
      *,
      invited_by_user:user_profiles!invited_by(full_name, email),
      client:clients(id, name)
    `)
    .order('created_at', { ascending: false })

  if (currentUser.role !== 'super_admin') {
    query = query.eq('company_id', currentUser.company_id)
  }

  const result = await query
  invitations = result.data
  error = result.error

  // Fallback: if the join failed (client_id column may not exist), retry without it
  if (error) {
    console.warn('Invitations query with client join failed, retrying without:', error.message)
    let fallbackQuery = supabase
      .from('company_invitations')
      .select(`
        *,
        invited_by_user:user_profiles!invited_by(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (currentUser.role !== 'super_admin') {
      fallbackQuery = fallbackQuery.eq('company_id', currentUser.company_id)
    }

    const fallbackResult = await fallbackQuery
    if (fallbackResult.error) {
      console.error('Error fetching invitations (fallback):', fallbackResult.error)
      return NextResponse.json({ error: 'Error al obtener invitaciones' }, { status: 500 })
    }
    invitations = fallbackResult.data
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
  const { role, client_id } = body
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

  // Validate client_id for viewer invitations
  const targetRole = role || 'employee'
  if (targetRole === 'viewer' && !client_id) {
    return NextResponse.json({ error: 'Debes seleccionar un cliente para invitaciones de tipo viewer' }, { status: 400 })
  }

  if (client_id) {
    // Verify client belongs to the same company
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    if (client.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'El cliente no pertenece a tu empresa' }, { status: 403 })
    }
  }

  // Create invitation
  const { data: invitation, error: insertError } = await supabase
    .from('company_invitations')
    .insert({
      email,
      company_id: currentUser.company_id,
      invited_by: currentUser.id,
      target_role: targetRole,
      status: 'pending',
      requires_approval: true,
      ...(client_id && targetRole === 'viewer' ? { client_id } : {})
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating invitation:', insertError)
    return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 })
  }

  // Send invitation email via Resend
  try {
    // Get company name for the email
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', currentUser.company_id)
      .single()

    // Get inviter name
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', currentUser.id)
      .single()

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''
    const inviteUrl = `${origin}/invite/accept?token=${invitation.token}`

    await sendEmail({
      to: email,
      subject: `Te invitaron a ${company?.name || 'una empresa'} en FOMO Platform`,
      react: InvitationEmail({
        inviteUrl,
        companyName: company?.name || 'una empresa',
        role: targetRole,
        invitedByName: inviterProfile?.full_name || undefined,
      }),
    })
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError)
    // Don't fail the invitation creation if email fails
  }

  return NextResponse.json({
    invitation,
    message: 'Invitacion creada. El usuario recibira un email para unirse.'
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
