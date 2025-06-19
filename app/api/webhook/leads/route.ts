import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { calculateLeadScore, getLeadTemperature, getLeadPriority, sendSlackNotification, sendEmailNotification } from '@/lib/crm-multitenant'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdmin()
  try {
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      company,
      message,
      utm_source,
      utm_campaign,
      utm_medium,
      utm_content,
      page_url,
      form_id,
      company_slug // Nuevo: identificador de la empresa desde el formulario
    } = body

    // Validar datos requeridos
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Obtener company_id desde el slug o usar empresa por defecto
    let company_id: string
    
    if (company_slug) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('slug', company_slug)
        .single()
      
      if (!company) {
        return NextResponse.json(
          { error: 'Invalid company identifier' },
          { status: 400 }
        )
      }
      
      company_id = company.id
    } else {
      // Usar empresa por defecto (primera empresa activa)
      const { data: defaultCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single()
      
      if (!defaultCompany) {
        return NextResponse.json(
          { error: 'No active company found' },
          { status: 500 }
        )
      }
      
      company_id = defaultCompany.id
    }

    // Crear objeto lead
    const leadData = {
      name,
      email,
      phone: phone || null,
      company: company || null,
      message: message || null,
      source: 'web-form' as const,
      utm_source: utm_source || 'direct',
      utm_campaign: utm_campaign || null,
      utm_medium: utm_medium || 'organic',
      utm_content: utm_content || null,
      page_url: page_url || null,
      status: 'new' as const,
      form_id: form_id || null
    }

    // Calcular scoring
    const score = calculateLeadScore(leadData)
    const temperature = getLeadTemperature(score)
    const priority = getLeadPriority({ ...leadData, score })

    // Guardar en Supabase usando supabaseAdmin para bypasear RLS
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert([{
        ...leadData,
        company_id,
        score,
        temperature,
        priority
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Enviar notificaciones si es lead caliente
    if (temperature === 'hot') {
      await sendSlackNotification(`🔥 Nuevo lead caliente desde web: ${name} - ${company || email}`)
      await sendEmailNotification(lead)
    } else if (temperature === 'warm') {
      await sendSlackNotification(`🟡 Nuevo lead warm desde web: ${name} - ${company || email}`)
    }

    return NextResponse.json({ 
      success: true, 
      leadId: lead.id,
      score: lead.score,
      temperature: lead.temperature,
      priority: lead.priority
    })

  } catch (error) {
    console.error('Error processing web lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificación
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    endpoint: 'web-leads-webhook',
    timestamp: new Date().toISOString()
  })
}