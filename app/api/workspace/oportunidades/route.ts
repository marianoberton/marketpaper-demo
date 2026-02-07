import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const STAGE_PROBABILITIES: Record<string, number> = {
  calificacion: 25,
  propuesta: 50,
  negociacion: 75,
  cierre: 100,
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      const companyId = searchParams.get('company_id')
      if (companyId) {
        targetCompanyId = companyId
      } else if (currentUser.company_id) {
        targetCompanyId = currentUser.company_id
      } else {
        return NextResponse.json({ error: 'company_id requerido para super_admin' }, { status: 400 })
      }
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    const supabase = await createClient()

    let query = supabase
      .from('opportunities')
      .select('*, client:clients(id, name), assignee:user_profiles!assigned_to(id, full_name, avatar_url)')
      .eq('company_id', targetCompanyId)
      .order('position_order', { ascending: true })
      .order('created_at', { ascending: false })

    // Filters
    const stage = searchParams.get('stage')
    if (stage) {
      query = query.eq('stage', stage)
    }

    const assignedTo = searchParams.get('assigned_to')
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    const clientId = searchParams.get('client_id')
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: opportunities, error } = await query

    if (error) {
      console.error('Error fetching opportunities:', error)
      return NextResponse.json({ error: 'Error al cargar oportunidades' }, { status: 500 })
    }

    // Stats
    const all = opportunities || []
    const active = all.filter(o => o.stage !== 'cierre')
    const won = all.filter(o => o.stage === 'cierre' && o.outcome === 'won')

    const stats = {
      pipelineValue: active.reduce((sum, o) => sum + Number(o.estimated_value || 0), 0),
      weightedValue: active.reduce((sum, o) => sum + Number(o.weighted_value || 0), 0),
      wonValue: won.reduce((sum, o) => sum + Number(o.estimated_value || 0), 0),
      totalCount: all.length,
      byStage: {
        calificacion: all.filter(o => o.stage === 'calificacion').length,
        propuesta: all.filter(o => o.stage === 'propuesta').length,
        negociacion: all.filter(o => o.stage === 'negociacion').length,
        cierre: all.filter(o => o.stage === 'cierre').length,
      }
    }

    return NextResponse.json({ success: true, data: opportunities, stats })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'El titulo es requerido' }, { status: 400 })
    }

    let targetCompanyId: string
    if (currentUser.role === 'super_admin') {
      targetCompanyId = body.company_id || currentUser.company_id
      if (!targetCompanyId) {
        return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })
      }
    } else {
      if (!currentUser.company_id) {
        return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
      }
      targetCompanyId = currentUser.company_id
    }

    const supabase = await createClient()

    // Validate client belongs to same company if provided
    if (body.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', body.client_id)
        .eq('company_id', targetCompanyId)
        .single()

      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 400 })
      }
    }

    const stage = body.stage || 'calificacion'
    const probability = body.probability ?? STAGE_PROBABILITIES[stage] ?? 25

    const insertData: Record<string, unknown> = {
      company_id: targetCompanyId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      client_id: body.client_id || null,
      assigned_to: body.assigned_to || null,
      quote_id: body.quote_id || null,
      stage,
      probability,
      estimated_value: body.estimated_value || 0,
      currency: body.currency || 'USD',
      expected_close_date: body.expected_close_date || null,
    }

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .insert(insertData)
      .select('*, client:clients(id, name), assignee:user_profiles!assigned_to(id, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Error creating opportunity:', error)
      return NextResponse.json({ error: 'Error al crear la oportunidad' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: opportunity }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
