import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const STAGE_PROBABILITIES: Record<string, number> = {
  calificacion: 25,
  propuesta: 50,
  negociacion: 75,
  cierre: 100,
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (!body.stage || !['calificacion', 'propuesta', 'negociacion', 'cierre'].includes(body.stage)) {
      return NextResponse.json({ error: 'stage invalido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify opportunity exists and access
    const { data: existing } = await supabase
      .from('opportunities')
      .select('id, company_id, stage')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existing.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {
      stage: body.stage,
    }

    if (body.stage === 'cierre') {
      if (!body.outcome || !['won', 'lost'].includes(body.outcome)) {
        return NextResponse.json({ error: 'outcome (won/lost) requerido al cerrar' }, { status: 400 })
      }
      updateData.outcome = body.outcome
      updateData.probability = body.outcome === 'won' ? 100 : 0
      updateData.closed_at = new Date().toISOString()
      if (body.outcome === 'lost') {
        updateData.loss_reason = body.loss_reason || null
      }
    } else {
      updateData.outcome = null
      updateData.closed_at = null
      updateData.loss_reason = null
      updateData.probability = STAGE_PROBABILITIES[body.stage] ?? 25
    }

    if (body.position_order !== undefined) {
      updateData.position_order = body.position_order
    }

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select('*, client:clients(id, name), assignee:user_profiles!assigned_to(id, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Error updating opportunity stage:', error)
      return NextResponse.json({ error: 'Error al actualizar etapa' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: opportunity })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
