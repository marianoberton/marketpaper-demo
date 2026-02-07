import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'

const STAGE_PROBABILITIES: Record<string, number> = {
  calificacion: 25,
  propuesta: 50,
  negociacion: 75,
  cierre: 100,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const supabase = await createClient()

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*, client:clients(id, name), assignee:user_profiles!assigned_to(id, full_name, avatar_url)')
      .eq('id', id)
      .single()

    if (error || !opportunity) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 })
    }

    // Verify access: same company or super_admin
    if (currentUser.role !== 'super_admin' && opportunity.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: opportunity })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
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

    const supabase = await createClient()

    // Verify opportunity exists and belongs to the user's company
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

    // Validate client belongs to same company if changed
    if (body.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', body.client_id)
        .eq('company_id', existing.company_id)
        .single()

      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}

    // Core fields
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.client_id !== undefined) updateData.client_id = body.client_id || null
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to || null
    if (body.quote_id !== undefined) updateData.quote_id = body.quote_id || null
    if (body.estimated_value !== undefined) updateData.estimated_value = body.estimated_value
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.expected_close_date !== undefined) updateData.expected_close_date = body.expected_close_date || null
    if (body.position_order !== undefined) updateData.position_order = body.position_order

    // Stage changes with probability auto-adjustment
    if (body.stage !== undefined) {
      updateData.stage = body.stage

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
        // Moving back from cierre or between active stages
        updateData.outcome = null
        updateData.closed_at = null
        updateData.loss_reason = null
        updateData.probability = body.probability ?? STAGE_PROBABILITIES[body.stage] ?? 25
      }
    } else if (body.probability !== undefined) {
      updateData.probability = body.probability
    }

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select('*, client:clients(id, name), assignee:user_profiles!assigned_to(id, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Error updating opportunity:', error)
      return NextResponse.json({ error: 'Error al actualizar la oportunidad' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: opportunity })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('opportunities')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && existing.company_id !== currentUser.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Only admins can delete (RLS also enforces this)
    if (!['super_admin', 'company_owner', 'company_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar oportunidades' }, { status: 403 })
    }

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting opportunity:', error)
      return NextResponse.json({ error: 'Error al eliminar la oportunidad' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
