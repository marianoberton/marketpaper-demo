import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Parámetros de filtro
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigned_to = searchParams.get('assigned_to')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const search = searchParams.get('search')
    const country = searchParams.get('country')
    const monthly_revenue = searchParams.get('monthly_revenue')
    const how_found_us = searchParams.get('how_found_us')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin') {
      // Super admin puede ver cualquier empresa especificada
      const companyId = searchParams.get('company_id')
      if (companyId) {
        targetCompanyId = companyId
      } else {
        // Si no se especifica, obtener la primera empresa disponible
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
        
        if (companies && companies.length > 0) {
          targetCompanyId = companies[0].id
        } else {
          return NextResponse.json({ error: 'No se encontró una compañía' }, { status: 400 })
        }
      }
    } else {
      // Usuarios regulares solo pueden ver su propia empresa
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    // Construir la query base
    let query = supabase
      .from('pyme_leads')
      .select(`
        *,
        assigned_user:user_profiles!assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('company_id', targetCompanyId)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }

    if (country) {
      query = query.eq('country', country)
    }

    if (monthly_revenue) {
      query = query.eq('monthly_revenue', monthly_revenue)
    }

    if (how_found_us) {
      query = query.ilike('how_found_us', `%${how_found_us}%`)
    }

    if (date_from) {
      query = query.gte('submitted_at', date_from)
    }

    if (date_to) {
      query = query.lte('submitted_at', date_to)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,position.ilike.%${search}%`)
    }

    const { data: pymeLeads, error } = await query

    if (error) {
      console.error('Error fetching pyme leads:', error)
      return NextResponse.json({ error: 'Error al obtener los leads' }, { status: 500 })
    }

    // Obtener estadísticas
    const { data: stats } = await supabase
      .from('pyme_leads')
      .select('status, priority, lead_score')
      .eq('company_id', targetCompanyId)

    const statistics = {
      total: stats?.length || 0,
      by_status: {
        new: stats?.filter(l => l.status === 'new').length || 0,
        contacted: stats?.filter(l => l.status === 'contacted').length || 0,
        qualified: stats?.filter(l => l.status === 'qualified').length || 0,
        converted: stats?.filter(l => l.status === 'converted').length || 0,
        lost: stats?.filter(l => l.status === 'lost').length || 0,
      },
      by_priority: {
        urgent: stats?.filter(l => l.priority === 'urgent').length || 0,
        high: stats?.filter(l => l.priority === 'high').length || 0,
        medium: stats?.filter(l => l.priority === 'medium').length || 0,
        low: stats?.filter(l => l.priority === 'low').length || 0,
      },
      avg_score: Math.round(stats?.reduce((acc, l) => acc + l.lead_score, 0) / (stats?.length || 1) || 0)
    }

    return NextResponse.json({ 
      success: true, 
      pyme_leads: pymeLeads,
      statistics
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual y su company_id
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del pyme lead del cuerpo de la petición
    const leadData = await request.json()

    // Validar datos requeridos
    if (!leadData.full_name?.trim()) {
      return NextResponse.json({ error: 'El nombre completo es requerido' }, { status: 400 })
    }

    if (!leadData.email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }

    if (!leadData.company?.trim()) {
      return NextResponse.json({ error: 'La empresa es requerida' }, { status: 400 })
    }

    if (!leadData.position?.trim()) {
      return NextResponse.json({ error: 'El puesto es requerido' }, { status: 400 })
    }

    if (!leadData.phone?.trim()) {
      return NextResponse.json({ error: 'El teléfono es requerido' }, { status: 400 })
    }

    if (!leadData.country?.trim()) {
      return NextResponse.json({ error: 'El país es requerido' }, { status: 400 })
    }

    if (!leadData.how_found_us?.trim()) {
      return NextResponse.json({ error: 'Cómo nos encontró es requerido' }, { status: 400 })
    }

    if (!leadData.monthly_revenue?.trim()) {
      return NextResponse.json({ error: 'La facturación mensual es requerida' }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(leadData.email)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
    }

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin' && leadData.company_id) {
      targetCompanyId = leadData.company_id
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    // Preparar datos para inserción
    const insertData = {
      company_id: targetCompanyId,
      full_name: leadData.full_name.trim(),
      company: leadData.company.trim(),
      position: leadData.position.trim(),
      email: leadData.email.toLowerCase().trim(),
      phone: leadData.phone.trim(),
      website: leadData.website?.trim() || null,
      country: leadData.country.trim(),
      how_found_us: leadData.how_found_us.trim(),
      monthly_revenue: leadData.monthly_revenue.trim(),
      additional_info: leadData.additional_info?.trim() || null,
      source: leadData.source || 'manual_entry',
      status: leadData.status || 'new',
      assigned_to: leadData.assigned_to || null,
      notes: leadData.notes?.trim() || null,
      user_agent: leadData.user_agent || null,
      referrer: leadData.referrer || null,
      page_url: leadData.page_url || null,
      utm_source: leadData.utm_source || null,
      utm_medium: leadData.utm_medium || null,
      utm_campaign: leadData.utm_campaign || null,
      utm_content: leadData.utm_content || null,
      utm_term: leadData.utm_term || null,
    }

    // Crear el pyme lead (el trigger calculará automáticamente lead_score y priority)
    const { data: pymeLead, error } = await supabase
      .from('pyme_leads')
      .insert(insertData)
      .select(`
        *,
        assigned_user:user_profiles!assigned_to (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error creating pyme lead:', error)
      return NextResponse.json({ error: 'Error al crear el pyme lead' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pyme_lead: pymeLead 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')
    
    if (!leadId) {
      return NextResponse.json({ error: 'ID del lead es requerido' }, { status: 400 })
    }

    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const updateData = await request.json()

    // Preparar datos para actualización (solo campos permitidos)
    const allowedFields = [
      'status', 'priority', 'assigned_to', 'notes', 
      'last_contacted_at', 'next_follow_up_at'
    ]
    
    const filteredData: any = {}
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field]
      }
    })

    // Actualizar el lead
    const { data: updatedLead, error } = await supabase
      .from('pyme_leads')
      .update(filteredData)
      .eq('id', leadId)
      .select(`
        *,
        assigned_user:user_profiles!assigned_to (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error updating pyme lead:', error)
      return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pyme_lead: updatedLead 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')
    
    if (!leadId) {
      return NextResponse.json({ error: 'ID del lead es requerido' }, { status: 400 })
    }

    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Eliminar el lead (RLS se encarga de la seguridad)
    const { error } = await supabase
      .from('pyme_leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error('Error deleting pyme lead:', error)
      return NextResponse.json({ error: 'Error al eliminar el lead' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead eliminado exitosamente' 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 