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
    const source = searchParams.get('source')
    const priority = searchParams.get('priority')
    const assigned_to = searchParams.get('assigned_to')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const search = searchParams.get('search')
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
      .from('contact_leads')
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

    if (source) {
      query = query.eq('source', source)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }

    if (date_from) {
      query = query.gte('submitted_at', date_from)
    }

    if (date_to) {
      query = query.lte('submitted_at', date_to)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    const { data: contactLeads, error } = await query

    if (error) {
      console.error('Error fetching contact leads:', error)
      return NextResponse.json({ error: 'Error al cargar contact leads' }, { status: 500 })
    }

    // Obtener estadísticas adicionales
    const { data: stats } = await supabase
      .from('contact_leads')
      .select('status, priority, source')
      .eq('company_id', targetCompanyId)

    const statistics = {
      total: stats?.length || 0,
      by_status: stats?.reduce((acc: any, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {}) || {},
      by_priority: stats?.reduce((acc: any, lead) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1
        return acc
      }, {}) || {},
      by_source: stats?.reduce((acc: any, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      }, {}) || {}
    }

    return NextResponse.json({
      success: true,
      contact_leads: contactLeads || [],
      statistics,
      pagination: {
        limit,
        offset,
        total: stats?.length || 0
      }
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

    // Obtener datos del contact lead del cuerpo de la petición
    const leadData = await request.json()

    // Validar datos requeridos
    if (!leadData.name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!leadData.email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }

    if (!leadData.company?.trim()) {
      return NextResponse.json({ error: 'La empresa es requerida' }, { status: 400 })
    }

    if (!leadData.pain_point?.trim()) {
      return NextResponse.json({ error: 'El pain point es requerido' }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(leadData.email)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
    }

    // Determinar el company_id a usar
    let targetCompanyId: string

    if (currentUser.role === 'super_admin') {
      // Super admin puede crear en cualquier empresa especificada
      targetCompanyId = leadData.company_id || currentUser.company_id
      
      if (!targetCompanyId) {
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
      // Usuarios regulares solo pueden crear en su propia empresa
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    // Verificar si ya existe un lead con el mismo email en la empresa
    const { data: existingLead } = await supabase
      .from('contact_leads')
      .select('id, email')
      .eq('company_id', targetCompanyId)
      .eq('email', leadData.email.toLowerCase().trim())
      .single()

    if (existingLead) {
      return NextResponse.json({ 
        error: 'Ya existe un contact lead con este email en tu empresa' 
      }, { status: 400 })
    }

    // Preparar datos para inserción
    const insertData = {
      company_id: targetCompanyId,
      name: leadData.name.trim(),
      email: leadData.email.toLowerCase().trim(),
      company: leadData.company.trim(),
      website: leadData.website?.trim() || null,
      pain_point: leadData.pain_point.trim(),
      phone: leadData.phone?.trim() || null,
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

    // Crear el contact lead (el trigger calculará automáticamente lead_score y priority)
    const { data: contactLead, error } = await supabase
      .from('contact_leads')
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
      console.error('Error creating contact lead:', error)
      return NextResponse.json({ error: 'Error al crear el contact lead' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      contact_lead: contactLead 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del contact lead del cuerpo de la petición
    const { id, ...leadData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID del contact lead es requerido' }, { status: 400 })
    }

    // Verificar que el contact lead existe y pertenece a la empresa del usuario (excepto super admin)
    const { data: existingLead, error: fetchError } = await supabase
      .from('contact_leads')
      .select('company_id, email')
      .eq('id', id)
      .single()

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: 'Contact lead no encontrado' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existingLead.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para actualizar este contact lead' }, { status: 403 })
    }

    // Si se está actualizando el email, verificar que no exista otro lead con el mismo email
    if (leadData.email && leadData.email.toLowerCase().trim() !== existingLead.email) {
      const { data: duplicateCheck } = await supabase
        .from('contact_leads')
        .select('id')
        .eq('company_id', existingLead.company_id)
        .eq('email', leadData.email.toLowerCase().trim())
        .neq('id', id)
        .single()

      if (duplicateCheck) {
        return NextResponse.json({ 
          error: 'Ya existe otro contact lead con este email' 
        }, { status: 400 })
      }
    }

    // Preparar datos para actualización
    const updateData: any = {}
    
    const allowedFields = [
      'name', 'email', 'company', 'website', 'pain_point', 'phone',
      'source', 'status', 'assigned_to', 'notes', 'last_contacted_at',
      'next_follow_up_at'
    ]

         Object.keys(leadData).forEach(key => {
       if (allowedFields.includes(key) && leadData[key] !== undefined) {
         if (key === 'email' && leadData[key]) {
           updateData[key] = leadData[key].toLowerCase().trim()
         } else if (typeof leadData[key] === 'string') {
           updateData[key] = leadData[key].trim() || null
         } else {
           updateData[key] = leadData[key]
         }
       }
     })

    // Actualizar el contact lead (el trigger actualizará automáticamente lead_score si es necesario)
    const { data: contactLead, error } = await supabase
      .from('contact_leads')
      .update(updateData)
      .eq('id', id)
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
      console.error('Error updating contact lead:', error)
      return NextResponse.json({ error: 'Error al actualizar el contact lead' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      contact_lead: contactLead 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener ID del contact lead de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json({ error: 'ID del contact lead es requerido' }, { status: 400 })
    }

    // Verificar que el contact lead existe y pertenece a la empresa del usuario (excepto super admin)
    const { data: existingLead, error: fetchError } = await supabase
      .from('contact_leads')
      .select('company_id, name, email')
      .eq('id', leadId)
      .single()

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: 'Contact lead no encontrado' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existingLead.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este contact lead' }, { status: 403 })
    }

    // Eliminar el contact lead
    const { error } = await supabase
      .from('contact_leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error('Error deleting contact lead:', error)
      return NextResponse.json({ error: 'Error al eliminar el contact lead' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Contact lead de ${existingLead.name} eliminado exitosamente` 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 