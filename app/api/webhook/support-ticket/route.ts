import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Headers para CORS - permite formularios externos
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST - Crear ticket desde formulario externo (sin autenticación)
export async function POST(request: NextRequest) {
  try {
    // Usar service role para bypasear RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener datos del formulario
    const formData = await request.json()

    // Validaciones
    if (!formData.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!formData.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El email es requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { success: false, error: 'Email no válido' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!formData.subject?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El asunto es requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!formData.description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'La descripción es requerida' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Buscar la categoría si se proporcionó nombre de categoría
    let categoryId = null
    if (formData.category) {
      const { data: category } = await supabase
        .from('ticket_categories')
        .select('id')
        .eq('name', formData.category)
        .eq('is_active', true)
        .single()
      
      if (category) {
        categoryId = category.id
      }
    }

    // Crear el ticket
    const { data: ticket, error: createError } = await supabase
      .from('support_tickets')
      .insert({
        external_name: formData.name.trim(),
        external_email: formData.email.toLowerCase().trim(),
        external_company: formData.company?.trim() || null,
        external_phone: formData.phone?.trim() || null,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category_id: categoryId,
        priority: formData.priority || 'medium',
        status: 'open',
        source: 'external_form',
        // Sin company_id ni user_id porque es externo
        company_id: null,
        user_id: null
      })
      .select(`
        *,
        category:ticket_categories(id, name, color, icon)
      `)
      .single()

    if (createError) {
      console.error('Error creating external ticket:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear el ticket' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Notificar via Slack
    await notifySlackExternalTicket(ticket, formData)

    return NextResponse.json({
      success: true,
      message: 'Ticket creado exitosamente. Te contactaremos pronto.',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('External Ticket Webhook Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Función para notificar a Slack sobre ticket externo
async function notifySlackExternalTicket(ticket: any, formData: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.log('⚠️ SLACK_WEBHOOK_URL no configurada - Ticket externo creado:', ticket.id)
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
      text: `${mentionText}📨 Nuevo Ticket Externo`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📨 Nuevo Ticket Externo`,
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
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '⚠️ *Este ticket fue creado desde el formulario público*'
            }
          ]
        },
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
              text: `*Nombre:*\n${formData.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${formData.email}`
            }
          ]
        },
        ...(formData.company ? [{
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Empresa:*\n${formData.company}`
            },
            {
              type: 'mrkdwn',
              text: `*Teléfono:*\n${formData.phone || 'No proporcionado'}`
            }
          ]
        }] : []),
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
      // Marcar como notificado
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      await supabase
        .from('support_tickets')
        .update({ slack_notified: true })
        .eq('id', ticket.id)
      
      console.log('✅ Notificación Slack enviada para ticket externo:', ticket.id)
    } else {
      console.error('❌ Error enviando notificación Slack:', response.status)
    }
  } catch (error) {
    console.error('Error en notificación Slack:', error)
  }
}
