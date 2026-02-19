import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Obtener tareas asignadas al usuario actual
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, in_progress, completed
    const showCompleted = searchParams.get('show_completed') === 'true'

    // Obtener tareas asignadas al usuario actual
    let query = supabase
      .from('tema_tasks')
      .select(`
        id,
        title,
        description,
        status,
        task_type,
        due_date,
        sort_order,
        created_at,
        completed_at,
        tema:temas(
          id,
          title,
          reference_code,
          status,
          priority,
          type:tema_types(id, name, color),
          project:tema_projects(id, name)
        )
      `)
      .eq('assigned_to', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })

    // Filtrar por estado
    if (status) {
      query = query.eq('status', status)
    } else if (!showCompleted) {
      // Por defecto, no mostrar completadas
      query = query.neq('status', 'completed')
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching user tasks:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener tareas' },
        { status: 500 }
      )
    }

    // Calcular estadísticas
    const { data: allTasks } = await supabase
      .from('tema_tasks')
      .select('status')
      .eq('assigned_to', user.id)

    const stats = {
      total: allTasks?.length || 0,
      pendientes: allTasks?.filter(t => t.status === 'pending').length || 0,
      enProgreso: allTasks?.filter(t => t.status === 'in_progress').length || 0,
      completadas: allTasks?.filter(t => t.status === 'completed').length || 0,
    }

    return NextResponse.json({
      success: true,
      tasks,
      stats
    })

  } catch (error) {
    console.error('User Tasks API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado de una tarea
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskId, status } = body

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, error: 'taskId y status son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la tarea está asignada al usuario
    const { data: existingTask } = await supabase
      .from('tema_tasks')
      .select('id, assigned_to, tema_id')
      .eq('id', taskId)
      .single()

    if (!existingTask || existingTask.assigned_to !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada o no autorizado' },
        { status: 404 }
      )
    }

    // Actualizar la tarea
    const updateData: any = { status }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = user.id
    } else {
      updateData.completed_at = null
      updateData.completed_by = null
    }

    const { data: task, error: updateError } = await supabase
      .from('tema_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar tarea' },
        { status: 500 }
      )
    }

    // Registrar actividad en el tema
    await supabase
      .from('tema_activity')
      .insert({
        tema_id: existingTask.tema_id,
        user_id: user.id,
        action: status === 'completed' ? 'task_completed' : 'task_status_changed',
        new_value: status
      })

    return NextResponse.json({
      success: true,
      task
    })

  } catch (error) {
    console.error('Update Task API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
