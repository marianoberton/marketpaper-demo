import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Listar attachments de un ticket
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()

    // Verificar autenticacion
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

    // Obtener attachments
    const { data: attachments, error } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching attachments:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener adjuntos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attachments
    })

  } catch (error) {
    console.error('Attachments API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear registro de attachment despues de upload
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()

    // Verificar autenticacion
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

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el ticket existe y el usuario tiene acceso
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
      profile.role === 'super_admin' ||
      ticket.user_id === user.id ||
      (profile.company_id && ticket.company_id === profile.company_id)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso' },
        { status: 403 }
      )
    }

    // Obtener datos del attachment
    const body = await request.json()
    const { file_name, file_path, file_size, file_type, message_id } = body

    if (!file_name || !file_path) {
      return NextResponse.json(
        { success: false, error: 'file_name y file_path son requeridos' },
        { status: 400 }
      )
    }

    // Crear registro de attachment
    const { data: attachment, error: createError } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        message_id: message_id || null,
        file_name,
        file_path,
        file_size: file_size || null,
        file_type: file_type || null,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating attachment:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear registro de adjunto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Adjunto registrado',
      attachment
    }, { status: 201 })

  } catch (error) {
    console.error('Create Attachment API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
