import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Listar mensajes de un ticket
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario tiene acceso al ticket
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, company_id')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    const hasAccess = 
      profile?.role === 'super_admin' ||
      ticket.user_id === user.id ||
      (profile?.company_id && ticket.company_id === profile.company_id)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso' },
        { status: 403 }
      )
    }

    // Obtener mensajes
    let query = supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    // Excluir notas internas si no es admin
    if (profile?.role !== 'super_admin') {
      query = query.eq('is_internal', false)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener mensajes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messages
    })

  } catch (error) {
    console.error('Messages API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Agregar mensaje a un ticket
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, company_id, role, full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el ticket existe y el usuario tiene acceso
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, company_id, status, external_email')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    const hasAccess = 
      profile.role === 'super_admin' ||
      ticket.user_id === user.id ||
      (profile.company_id && ticket.company_id === profile.company_id)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso' },
        { status: 403 }
      )
    }

    // Obtener datos del mensaje
    const body = await request.json()
    const { message, is_internal } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El mensaje es requerido' },
        { status: 400 }
      )
    }

    // Solo admin puede crear notas internas
    const isInternal = profile.role === 'super_admin' ? (is_internal || false) : false
    const senderType = profile.role === 'super_admin' ? 'admin' : 'user'

    // Crear mensaje
    const { data: newMessage, error: createError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: senderType,
        sender_id: user.id,
        sender_name: profile.full_name || profile.email,
        sender_email: profile.email,
        message: message.trim(),
        is_internal: isInternal
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating message:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear mensaje' },
        { status: 500 }
      )
    }

    // Si es admin respondiendo, cambiar estado a "in_progress" si estaba "open"
    if (profile.role === 'super_admin' && ticket.status === 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticketId)
    }

    // Si es usuario respondiendo y estaba en "waiting_user", cambiar a "open"
    if (profile.role !== 'super_admin' && ticket.status === 'waiting_user') {
      await supabase
        .from('support_tickets')
        .update({ status: 'open' })
        .eq('id', ticketId)
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje agregado',
      data: newMessage
    }, { status: 201 })

  } catch (error) {
    console.error('Create Message API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
