import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener detalle de un ticket con sus mensajes
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    // Obtener ticket con mensajes
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        category:ticket_categories(id, name, color, icon),
        company:companies(id, name),
        user:user_profiles!support_tickets_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos (solo el creador, usuarios de la empresa, o super admin)
    const hasAccess = 
      profile?.role === 'super_admin' ||
      ticket.user_id === user.id ||
      (profile?.company_id && ticket.company_id === profile.company_id)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver este ticket' },
        { status: 403 }
      )
    }

    // Obtener mensajes (excluir internos si no es admin)
    let messagesQuery = supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (profile?.role !== 'super_admin') {
      messagesQuery = messagesQuery.eq('is_internal', false)
    }

    const { data: messages, error: messagesError } = await messagesQuery

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        messages: messages || []
      }
    })

  } catch (error) {
    console.error('Get Ticket API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado del ticket
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que es super admin (solo admin puede cambiar estado)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden actualizar tickets' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, priority, category_id } = body

    // Preparar datos a actualizar
    const updateData: Record<string, any> = {}
    
    if (status) {
      const validStatuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Estado inválido' },
          { status: 400 }
        )
      }
      updateData.status = status
      
      // Actualizar timestamps según estado
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      } else if (status === 'closed') {
        updateData.closed_at = new Date().toISOString()
      }
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { success: false, error: 'Prioridad inválida' },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }

    if (category_id !== undefined) {
      updateData.category_id = category_id
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para actualizar' },
        { status: 400 }
      )
    }

    const { data: ticket, error: updateError } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:ticket_categories(id, name, color, icon)
      `)
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket actualizado',
      ticket
    })

  } catch (error) {
    console.error('Update Ticket API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
