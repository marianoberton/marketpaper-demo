import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar tareas de un tema
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: temaId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: tasks, error } = await supabase
      .from('tema_tasks')
      .select(`
        *,
        assigned_user:user_profiles!tema_tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        completed_by_user:user_profiles!tema_tasks_completed_by_fkey(id, full_name)
      `)
      .eq('tema_id', temaId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener tareas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tasks
    })

  } catch (error) {
    console.error('Tasks API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear tarea
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: temaId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      assigned_to,
      due_date,
      depends_on,
      is_sequential,
      sort_order,
      task_type,
      checklist
    } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El título es requerido' },
        { status: 400 }
      )
    }

    // Obtener el siguiente sort_order si no se especificó
    let finalSortOrder = sort_order
    if (finalSortOrder === undefined) {
      const { data: lastTask } = await supabase
        .from('tema_tasks')
        .select('sort_order')
        .eq('tema_id', temaId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      
      finalSortOrder = (lastTask?.sort_order || 0) + 1
    }

    const insertData: Record<string, any> = {
      tema_id: temaId,
      title: title.trim(),
      description: description?.trim() || null,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      depends_on: depends_on || [],
      is_sequential: is_sequential !== false,
      sort_order: finalSortOrder,
      created_by: user.id
    }
    if (task_type) insertData.task_type = task_type
    if (checklist) insertData.checklist = checklist

    const { data: task, error: createError } = await supabase
      .from('tema_tasks')
      .insert(insertData)
      .select(`
        *,
        assigned_user:user_profiles!tema_tasks_assigned_to_fkey(id, full_name, email, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating task:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear la tarea' },
        { status: 500 }
      )
    }

    // Registrar actividad
    await supabase
      .from('tema_activity')
      .insert({
        tema_id: temaId,
        user_id: user.id,
        action: 'task_added',
        new_value: title
      })

    // Notificar al asignado si hay uno
    if (assigned_to) {
      await supabase
        .from('notifications')
        .insert({
          user_id: assigned_to,
          type: 'task_assigned',
          title: 'Nueva tarea asignada',
          message: `Se te asignó la tarea "${title}"`,
          link: `/workspace/temas/${temaId}`,
          tema_id: temaId,
          task_id: task.id
        })
    }

    return NextResponse.json({
      success: true,
      task
    }, { status: 201 })

  } catch (error) {
    console.error('Create Task API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
