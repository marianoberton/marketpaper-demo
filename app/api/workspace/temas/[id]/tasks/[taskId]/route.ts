import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PATCH - Actualizar tarea (marcar completa, cambiar asignado, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: temaId, taskId } = await params
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
      status,
      assigned_to,
      due_date,
      task_type,
      checklist
    } = body

    // Obtener tarea actual para comparar
    const { data: currentTask } = await supabase
      .from('tema_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (!currentTask) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Construir objeto de actualización
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null
    if (due_date !== undefined) updateData.due_date = due_date || null
    if (task_type !== undefined) updateData.task_type = task_type || null
    if (checklist !== undefined) updateData.checklist = checklist

    // Si se marca como completada
    if (status === 'completed' && currentTask.status !== 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = user.id
    }

    // Si se marca como in_progress
    if (status === 'in_progress' && !currentTask.started_at) {
      updateData.started_at = new Date().toISOString()
    }

    const { data: task, error: updateError } = await supabase
      .from('tema_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        *,
        assigned_user:user_profiles!tema_tasks_assigned_to_fkey(id, full_name, email, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la tarea' },
        { status: 500 }
      )
    }

    // Registrar actividad si cambió el estado
    if (status && status !== currentTask.status) {
      await supabase
        .from('tema_activity')
        .insert({
          tema_id: temaId,
          user_id: user.id,
          action: 'task_status_changed',
          old_value: currentTask.status,
          new_value: status,
          comment: `Tarea "${task.title}"`
        })

      // Si se completó, enviar notificación Slack
      if (status === 'completed') {
        await notifySlackTaskCompleted(temaId, task, user.id, supabase)
      }
    }

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

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { taskId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { error: deleteError } = await supabase
      .from('tema_tasks')
      .delete()
      .eq('id', taskId)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la tarea' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada'
    })

  } catch (error) {
    console.error('Delete Task API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para notificar a Slack cuando se completa una tarea
async function notifySlackTaskCompleted(temaId: string, task: any, userId: string, supabase: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    // Obtener datos del tema y usuario
    const { data: tema } = await supabase
      .from('temas')
      .select('title, expediente_number')
      .eq('id', temaId)
      .single()

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    // Buscar siguiente tarea y su asignado
    const { data: nextTask } = await supabase
      .from('tema_tasks')
      .select(`
        title,
        assigned_user:user_profiles!tema_tasks_assigned_to_fkey(full_name)
      `)
      .eq('tema_id', temaId)
      .eq('status', 'pending')
      .contains('depends_on', [task.id])
      .order('sort_order')
      .limit(1)
      .single()

    const mentionUserId = process.env.SLACK_MENTION_USER_ID
    const mentionText = mentionUserId ? `<@${mentionUserId}> ` : ''

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '✅ Tarea Completada',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Tema:*\n${tema?.title || 'Sin título'}`
          },
          {
            type: 'mrkdwn',
            text: `*Expediente:*\n${tema?.expediente_number || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Tarea:*\n${task.title}`
          },
          {
            type: 'mrkdwn',
            text: `*Completada por:*\n${userProfile?.full_name || 'Usuario'}`
          }
        ]
      }
    ]

    // Si hay siguiente tarea, agregar contexto
    if (nextTask) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `➡️ *Siguiente tarea:* ${nextTask.title} - Asignada a: ${nextTask.assigned_user?.full_name || 'No asignada'}`
          }
        ]
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${mentionText}✅ Tarea completada: ${task.title}`,
        blocks,
        ...(appUrl && {
          attachments: [{
            color: '#22c55e',
            blocks: [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `<${appUrl}/workspace/temas/${temaId}|Ver tema en la plataforma>`
              }
            }]
          }]
        })
      })
    })

  } catch (error) {
    console.error('Slack notification error:', error)
  }
}
