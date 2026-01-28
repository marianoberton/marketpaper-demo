import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar tickets del workspace del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario con company_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Construir query
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        category:ticket_categories(id, name, color, icon),
        company:companies(id, name),
        messages:ticket_messages(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por empresa si no es super admin
    if (profile.role !== 'super_admin') {
      query = query.or(`user_id.eq.${user.id},company_id.eq.${profile.company_id}`)
    }

    // Aplicar filtros opcionales
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener tickets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Tickets API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo ticket
export async function POST(request: NextRequest) {
  try {
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
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, company_id, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    const { subject, description, category_id, priority } = body

    // Validaciones
    if (!subject?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El asunto es requerido' },
        { status: 400 }
      )
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'La descripción es requerida' },
        { status: 400 }
      )
    }

    // Crear el ticket
    const { data: ticket, error: createError } = await supabase
      .from('support_tickets')
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        subject: subject.trim(),
        description: description.trim(),
        category_id: category_id || null,
        priority: priority || 'medium',
        status: 'open',
        source: 'platform'
      })
      .select(`
        *,
        category:ticket_categories(id, name, color, icon)
      `)
      .single()

    if (createError) {
      console.error('Error creating ticket:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear el ticket' },
        { status: 500 }
      )
    }

    // Notificar via Slack (async, no bloquea la respuesta)
    notifySlackNewTicket(ticket, profile).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Ticket creado exitosamente',
      ticket
    }, { status: 201 })

  } catch (error) {
    console.error('Create Ticket API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para notificar a Slack
async function notifySlackNewTicket(ticket: any, profile: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.log('⚠️ SLACK_WEBHOOK_URL no configurada - Ticket creado:', ticket.id)
    return
  }

  try {
    const priorityEmoji: Record<string, string> = {
      'urgent': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢'
    }

    const mentionUserId = process.env.SLACK_MENTION_USER_ID
    const mentionText = mentionUserId ? `<@${mentionUserId}> ` : ''

    const message = {
      text: `${mentionText}🎫 Nuevo Ticket de Soporte`, // Texto para notificación push
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🎫 Nuevo Ticket de Soporte`,
            emoji: true
          }
        },
        ...(mentionUserId ? [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Atención: <@${mentionUserId}>`
          }
        }] : []),
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Asunto:*\n${ticket.subject}`
            },
            {
              type: 'mrkdwn',
              text: `*Prioridad:*\n${priorityEmoji[ticket.priority] || '⚪'} ${ticket.priority.toUpperCase()}`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Usuario:*\n${profile.full_name || profile.email}`
            },
            {
              type: 'mrkdwn',
              text: `*Categoría:*\n${ticket.category?.name || 'Sin categoría'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Descripción:*\n${ticket.description.substring(0, 500)}${ticket.description.length > 500 ? '...' : ''}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Ver Ticket',
                emoji: true
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tickets/${ticket.id}`,
              style: 'primary'
            }
          ]
        }
      ]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    if (response.ok) {
      // Actualizar ticket para marcar que fue notificado
      const supabase = await createClient()
      await supabase
        .from('support_tickets')
        .update({ slack_notified: true })
        .eq('id', ticket.id)
      
      console.log('✅ Notificación Slack enviada para ticket:', ticket.id)
    } else {
      console.error('❌ Error enviando notificación Slack:', response.status)
    }
  } catch (error) {
    console.error('Error en notificación Slack:', error)
  }
}
