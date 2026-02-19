import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST - Reorder temas within a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['super_admin', 'company_owner', 'company_admin', 'manager'].includes(profile?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para reordenar' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { order } = body // Array of { tema_id, sequential_order, depends_on_tema_id? }

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de orden' },
        { status: 400 }
      )
    }

    // Update each tema's sequential_order and optional dependency
    for (const item of order) {
      const updateData: Record<string, any> = {
        sequential_order: item.sequential_order,
      }
      if (item.depends_on_tema_id !== undefined) {
        updateData.depends_on_tema_id = item.depends_on_tema_id || null
      }

      await supabase
        .from('temas')
        .update(updateData)
        .eq('id', item.tema_id)
        .eq('project_id', projectId)
    }

    return NextResponse.json({ success: true, message: 'Orden actualizado' })
  } catch (error) {
    console.error('Reorder API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
