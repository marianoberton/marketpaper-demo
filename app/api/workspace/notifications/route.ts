import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar notificaciones del usuario
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
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    // Obtener contador de no leídas
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      notifications,
      unread_count: count || 0
    })

  } catch (error) {
    console.error('Notifications API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Marcar notificaciones como leídas
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
    const { notification_ids, mark_all } = body

    let query = supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (mark_all) {
      query = query.eq('is_read', false)
    } else if (notification_ids?.length > 0) {
      query = query.in('id', notification_ids)
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere notification_ids o mark_all' },
        { status: 400 }
      )
    }

    const { error: updateError } = await query

    if (updateError) {
      console.error('Error marking notifications:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al marcar notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notificaciones marcadas como leídas'
    })

  } catch (error) {
    console.error('Update Notifications API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar notificaciones
export async function DELETE(request: NextRequest) {
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
    const { notification_ids, delete_read } = body

    if (delete_read) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true)

      if (error) {
        console.error('Error deleting read notifications:', error)
        return NextResponse.json(
          { success: false, error: 'Error al eliminar notificaciones' },
          { status: 500 }
        )
      }
    } else if (notification_ids?.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .in('id', notification_ids)

      if (error) {
        console.error('Error deleting notifications:', error)
        return NextResponse.json(
          { success: false, error: 'Error al eliminar notificaciones' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere notification_ids o delete_read' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notificaciones eliminadas'
    })

  } catch (error) {
    console.error('Delete Notifications API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
