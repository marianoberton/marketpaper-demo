import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Obtener detalle de un tema
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

    const { data: tema, error } = await supabase
      .from('temas')
      .select(`
        *,
        type:tema_types(id, name, color, icon),
        area:tema_areas(id, name, color),
        client:clients(id, name, email, phone, cuit),
        created_by_user:user_profiles!temas_created_by_fkey(id, full_name, email, avatar_url),
        assignees:tema_assignees(
          id,
          role,
          is_lead,
          assigned_at,
          user:user_profiles!tema_assignees_user_id_fkey(id, full_name, email, avatar_url)
        ),
        tasks:tema_tasks(
          id,
          title,
          description,
          status,
          sort_order,
          due_date,
          completed_at,
          assigned_user:user_profiles!tema_tasks_assigned_to_fkey(id, full_name, avatar_url)
        ),
        activity:tema_activity(
          id,
          action,
          old_value,
          new_value,
          comment,
          created_at,
          user:user_profiles!tema_activity_user_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching tema:', error)
      return NextResponse.json(
        { success: false, error: 'Tema no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tema
    })

  } catch (error) {
    console.error('Tema Detail API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar tema
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

    // Permission check
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'company_owner', 'company_admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para editar temas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      reference_code,
      type_id,
      area_id,
      expediente_number,
      organismo,
      status,
      priority,
      due_date,
      notes,
      assignee_ids,
      lead_assignee_id,
      depends_on_tema_id,
      sequential_order,
      observation_notes
    } = body

    // Priority changes restricted to owner/admin only
    if (priority !== undefined && !['super_admin', 'company_owner', 'company_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden cambiar la prioridad' },
        { status: 403 }
      )
    }

    // Fetch current status for activity log
    const { data: currentTema } = await supabase
      .from('temas')
      .select('status')
      .eq('id', id)
      .single()
    const oldStatus = currentTema?.status

    // Construir objeto de actualización
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (reference_code !== undefined) updateData.reference_code = reference_code?.trim() || null
    if (type_id !== undefined) updateData.type_id = type_id || null
    if (area_id !== undefined) updateData.area_id = area_id || null
    if (expediente_number !== undefined) updateData.expediente_number = expediente_number?.trim() || null
    if (organismo !== undefined) updateData.organismo = organismo || null
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (due_date !== undefined) updateData.due_date = due_date || null
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (depends_on_tema_id !== undefined) updateData.depends_on_tema_id = depends_on_tema_id || null
    if (sequential_order !== undefined) updateData.sequential_order = sequential_order

    // Marcar completado si el estado es finalizado
    if (status === 'finalizado' || status === 'completado') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: tema, error: updateError } = await supabase
      .from('temas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tema:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el tema' },
        { status: 500 }
      )
    }

    // Auto-crear tarea de subsanación cuando el estado cambia a "observado"
    if (status === 'observado') {
      const { data: lastTasks } = await supabase
        .from('tema_tasks')
        .select('sort_order')
        .eq('tema_id', id)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextOrder = ((lastTasks && lastTasks[0]?.sort_order) || 0) + 1

      await supabase
        .from('tema_tasks')
        .insert({
          tema_id: id,
          title: 'Subsanar observaciones',
          description: observation_notes?.trim() || null,
          task_type: 'interna',
          sort_order: nextOrder,
          created_by: user.id
        })
    }

    // Registrar cambio de estado en actividad
    if (status !== undefined && status !== oldStatus) {
      await supabase
        .from('tema_activity')
        .insert({
          tema_id: id,
          user_id: user.id,
          action: 'status_changed',
          old_value: oldStatus || null,
          new_value: status,
          comment: status === 'observado' && observation_notes?.trim() ? observation_notes.trim() : null
        })
    }

    // Actualizar asignados si se proporcionaron
    if (assignee_ids !== undefined) {
      // Eliminar asignaciones anteriores
      await supabase
        .from('tema_assignees')
        .delete()
        .eq('tema_id', id)

      // Insertar nuevas asignaciones
      if (assignee_ids.length > 0) {
        const assigneeRecords = assignee_ids.map((userId: string) => ({
          tema_id: id,
          user_id: userId,
          role: 'responsable',
          is_lead: lead_assignee_id ? userId === lead_assignee_id : false,
          assigned_by: user.id
        }))

        await supabase
          .from('tema_assignees')
          .insert(assigneeRecords)
      }
    }

    // Obtener tema actualizado con relaciones
    const { data: fullTema } = await supabase
      .from('temas')
      .select(`
        *,
        type:tema_types(id, name, color, icon),
        assignees:tema_assignees(
          id,
          role,
          user:user_profiles!tema_assignees_user_id_fkey(id, full_name, email)
        )
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Tema actualizado exitosamente',
      tema: fullTema
    })

  } catch (error) {
    console.error('Update Tema API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar tema
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

    // Verificar que el usuario tenga permisos de admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['company_admin', 'company_owner', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para eliminar' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('temas')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting tema:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el tema' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tema eliminado exitosamente'
    })

  } catch (error) {
    console.error('Delete Tema API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
