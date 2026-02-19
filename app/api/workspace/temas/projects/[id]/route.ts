import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Detalle de proyecto con temas anidados
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: project, error } = await supabase
      .from('tema_projects')
      .select(`
        *,
        client:clients(id, name, email, phone, cuit),
        responsible:user_profiles!tema_projects_responsible_id_fkey(id, full_name, email, avatar_url),
        created_by_user:user_profiles!tema_projects_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Fetch temas for this project
    const { data: temas } = await supabase
      .from('temas')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        expediente_number,
        organismo,
        updated_at,
        type:tema_types(id, name, color),
        assignees:tema_assignees(
          id,
          is_lead,
          user:user_profiles!tema_assignees_user_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    // Get task stats per tema
    const temaIds = temas?.map(t => t.id) || []
    let taskStats: Record<string, { total: number; completed: number }> = {}

    if (temaIds.length > 0) {
      const { data: tasks } = await supabase
        .from('tema_tasks')
        .select('id, tema_id, status')
        .in('tema_id', temaIds)

      for (const tid of temaIds) {
        const temaTasks = tasks?.filter(t => t.tema_id === tid) || []
        taskStats[tid] = {
          total: temaTasks.length,
          completed: temaTasks.filter(t => t.status === 'completed').length
        }
      }
    }

    const enrichedTemas = temas?.map(t => ({
      ...t,
      task_stats: taskStats[t.id] || { total: 0, completed: 0 }
    }))

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        temas: enrichedTemas || []
      }
    })

  } catch (error) {
    console.error('Project Detail API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar proyecto
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!profile || !['super_admin', 'company_owner', 'company_admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para editar proyectos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name, client_id, address, gerencia, status,
      responsible_id, start_date, estimated_end_date,
      priority, notes
    } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (client_id !== undefined) updateData.client_id = client_id || null
    if (address !== undefined) updateData.address = address?.trim() || null
    if (gerencia !== undefined) updateData.gerencia = gerencia || null
    if (status !== undefined) updateData.status = status
    if (responsible_id !== undefined) updateData.responsible_id = responsible_id || null
    if (start_date !== undefined) updateData.start_date = start_date || null
    if (estimated_end_date !== undefined) updateData.estimated_end_date = estimated_end_date || null
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes?.trim() || null

    const { data: project, error: updateError } = await supabase
      .from('tema_projects')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, cuit),
        responsible:user_profiles!tema_projects_responsible_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating project:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el proyecto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Proyecto actualizado',
      project
    })

  } catch (error) {
    console.error('Update Project API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar proyecto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!profile || !['super_admin', 'company_owner', 'company_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para eliminar proyectos' },
        { status: 403 }
      )
    }

    // Unlink temas first (set project_id to null instead of deleting)
    await supabase
      .from('temas')
      .update({ project_id: null })
      .eq('project_id', id)

    const { error: deleteError } = await supabase
      .from('tema_projects')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el proyecto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado'
    })

  } catch (error) {
    console.error('Delete Project API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
