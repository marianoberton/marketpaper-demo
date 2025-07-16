import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Headers para CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener datos del formulario
    const formData = await request.json()
    
    // Validar datos requeridos
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

    if (!formData.company?.trim()) {
      return NextResponse.json(
        { success: false, error: 'La empresa es requerida' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!formData.pain_point?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El problema o necesidad es requerida' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!formData.company_id?.trim()) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { success: false, error: 'Email no válido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar que la empresa existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', formData.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Obtener información técnica del request
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const realIp = request.headers.get('x-real-ip') || ''
    
    // Extraer IP
    let ipAddress = null
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim()
    } else if (realIp) {
      ipAddress = realIp
    }

    // Verificar si ya existe un lead con el mismo email para esta empresa
    const { data: existingLead } = await supabase
      .from('contact_leads')
      .select('id, status')
      .eq('company_id', formData.company_id)
      .eq('email', formData.email.toLowerCase().trim())
      .single()

    if (existingLead) {
      // Si ya existe, actualizar algunos campos en lugar de crear duplicado
      const updateData = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        website: formData.website?.trim() || null,
        pain_point: formData.pain_point.trim(),
        phone: formData.phone?.trim() || null,
        user_agent: userAgent,
        referrer: referrer,
        page_url: formData.page_url || referrer,
        utm_source: formData.utm_source || null,
        utm_medium: formData.utm_medium || null,
        utm_campaign: formData.utm_campaign || null,
        utm_content: formData.utm_content || null,
        utm_term: formData.utm_term || null,
        submitted_at: new Date().toISOString(),
        ip_address: ipAddress
      }

      const { data: updatedLead, error: updateError } = await supabase
        .from('contact_leads')
        .update(updateData)
        .eq('id', existingLead.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error updating existing contact lead:', updateError)
        return NextResponse.json(
          { success: false, error: 'Error al actualizar contact lead' },
          { status: 500, headers: corsHeaders }
        )
      }

      return NextResponse.json(
        { 
          success: true, 
          message: 'Contact lead actualizado exitosamente',
          contact_lead: updatedLead,
          action: 'updated'
        },
        { headers: corsHeaders }
      )
    }

    // Preparar datos para inserción de nuevo lead
    const insertData = {
      company_id: formData.company_id,
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      company: formData.company.trim(),
      website: formData.website?.trim() || null,
      pain_point: formData.pain_point.trim(),
      phone: formData.phone?.trim() || null,
      source: formData.source || 'website_form',
      user_agent: userAgent,
      referrer: referrer,
      page_url: formData.page_url || referrer,
      ip_address: ipAddress,
      utm_source: formData.utm_source || null,
      utm_medium: formData.utm_medium || null,
      utm_campaign: formData.utm_campaign || null,
      utm_content: formData.utm_content || null,
      utm_term: formData.utm_term || null,
    }

    // Crear el contact lead (el trigger calculará automáticamente lead_score y priority)
    const { data: contactLead, error } = await supabase
      .from('contact_leads')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating contact lead:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear el contact lead' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Opcional: Enviar notificación interna al equipo de ventas
    await notifyNewLead(contactLead, company)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Contact lead creado exitosamente',
        contact_lead: {
          id: contactLead.id,
          name: contactLead.name,
          email: contactLead.email,
          company: contactLead.company,
          lead_score: contactLead.lead_score,
          priority: contactLead.priority,
          status: contactLead.status
        },
        action: 'created'
      },
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Webhook API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Función para notificar al equipo de ventas sobre nuevo lead
async function notifyNewLead(lead: any, company: any) {
  try {
    // Aquí puedes implementar notificaciones:
    // - Email al equipo de ventas
    // - Notificación push
    // - Webhook a sistemas externos
    // - Slack notification
    
    console.log(`📧 Nuevo contact lead para ${company.name}:`, {
      name: lead.name,
      email: lead.email,
      company: lead.company,
      score: lead.lead_score,
      priority: lead.priority,
      source: lead.source
    })

    // Ejemplo de implementación futura:
    // await sendSlackNotification({
    //   text: `🎯 Nuevo lead de alta prioridad: ${lead.name} de ${lead.company}`,
    //   company: company.name,
    //   score: lead.lead_score
    // })

  } catch (error) {
    console.error('Error sending notification:', error)
    // No fallar el webhook por errores de notificación
  }
}

// Función de ejemplo para captura masiva (batch processing)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { leads, company_id } = await request.json()

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array de leads es requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!company_id) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 400, headers: corsHeaders }
      )
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[]
    }

    // Procesar cada lead
    for (const leadData of leads) {
      try {
        // Validaciones básicas
        if (!leadData.name || !leadData.email || !leadData.company || !leadData.pain_point) {
          results.errors.push({
            lead: leadData,
            error: 'Faltan campos requeridos'
          })
          continue
        }

        // Verificar si existe
        const { data: existingLead } = await supabase
          .from('contact_leads')
          .select('id')
          .eq('company_id', company_id)
          .eq('email', leadData.email.toLowerCase().trim())
          .single()

        const insertData = {
          company_id,
          name: leadData.name.trim(),
          email: leadData.email.toLowerCase().trim(),
          company: leadData.company.trim(),
          website: leadData.website?.trim() || null,
          pain_point: leadData.pain_point.trim(),
          phone: leadData.phone?.trim() || null,
          source: leadData.source || 'batch_import',
          utm_source: leadData.utm_source || null,
          utm_medium: leadData.utm_medium || null,
          utm_campaign: leadData.utm_campaign || null,
        }

        if (existingLead) {
          // Actualizar existente
          const { error } = await supabase
            .from('contact_leads')
            .update(insertData)
            .eq('id', existingLead.id)

          if (error) {
            results.errors.push({ lead: leadData, error: error.message })
          } else {
            results.updated++
          }
        } else {
          // Crear nuevo
          const { error } = await supabase
            .from('contact_leads')
            .insert(insertData)

          if (error) {
            results.errors.push({ lead: leadData, error: error.message })
          } else {
            results.created++
          }
        }

      } catch (error: any) {
        results.errors.push({ 
          lead: leadData, 
          error: error.message || 'Error desconocido' 
        })
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: `Procesados ${leads.length} leads`,
        results 
      },
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Error en procesamiento masivo' },
      { status: 500, headers: corsHeaders }
    )
  }
} 