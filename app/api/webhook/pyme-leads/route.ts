import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener datos del formulario
    const body = await request.json()
    
    const {
      full_name,
      company,
      position,
      email,
      phone,
      website,
      country,
      how_found_us,
      monthly_revenue,
      additional_info,
      company_id, // ID de la empresa que recibe el lead
      // Información técnica para tracking
      user_agent,
      referrer,
      page_url,
      ip_address,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term
    } = body

    // Validar campos requeridos
    if (!full_name?.trim()) {
      return NextResponse.json(
        { error: 'full_name es requerido' },
        { status: 400 }
      )
    }

    if (!company?.trim()) {
      return NextResponse.json(
        { error: 'company es requerido' },
        { status: 400 }
      )
    }

    if (!position?.trim()) {
      return NextResponse.json(
        { error: 'position es requerido' },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'email es requerido' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'phone es requerido' },
        { status: 400 }
      )
    }

    if (!country?.trim()) {
      return NextResponse.json(
        { error: 'country es requerido' },
        { status: 400 }
      )
    }

    if (!how_found_us?.trim()) {
      return NextResponse.json(
        { error: 'how_found_us es requerido' },
        { status: 400 }
      )
    }

    if (!monthly_revenue?.trim()) {
      return NextResponse.json(
        { error: 'monthly_revenue es requerido' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email no válido' },
        { status: 400 }
      )
    }

    // Determinar company_id si no se proporciona
    let targetCompanyId = company_id
    
    if (!targetCompanyId) {
      // Usar empresa por defecto (primera empresa activa)
      const { data: defaultCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .single()
      
      if (!defaultCompany) {
        return NextResponse.json(
          { error: 'No se encontró una empresa activa' },
          { status: 500 }
        )
      }
      
      targetCompanyId = defaultCompany.id
    }

    // Preparar datos para inserción
    const leadData = {
      company_id: targetCompanyId,
      full_name: full_name.trim(),
      company: company.trim(),
      position: position.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      website: website?.trim() || null,
      country: country.trim(),
      how_found_us: how_found_us.trim(),
      monthly_revenue: monthly_revenue.trim(),
      additional_info: additional_info?.trim() || null,
      source: 'pyme_form',
      status: 'new',
      // Información técnica
      user_agent: user_agent || null,
      referrer: referrer || null,
      page_url: page_url || null,
      ip_address: ip_address || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null
    }

    // Insertar el lead (el trigger calculará automáticamente lead_score y priority)
    const { data: pymeLead, error } = await supabase
      .from('pyme_leads')
      .insert(leadData)
      .select(`
        id,
        full_name,
        company,
        email,
        lead_score,
        priority,
        status,
        submitted_at
      `)
      .single()

    if (error) {
      console.error('Error creating pyme lead:', error)
      return NextResponse.json(
        { error: 'Error al crear el lead' },
        { status: 500 }
      )
    }

    // Log para debugging
    console.log('Pyme lead created:', {
      id: pymeLead.id,
      full_name: pymeLead.full_name,
      company: pymeLead.company,
      lead_score: pymeLead.lead_score,
      priority: pymeLead.priority
    })

    return NextResponse.json({ 
      success: true, 
      leadId: pymeLead.id,
      lead_score: pymeLead.lead_score,
      priority: pymeLead.priority,
      message: 'Lead capturado exitosamente'
    })

  } catch (error) {
    console.error('Error processing pyme lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Opcional: Endpoint GET para verificar que el webhook esté funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    endpoint: 'pyme-leads webhook',
    timestamp: new Date().toISOString()
  })
} 