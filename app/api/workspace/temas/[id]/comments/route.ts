import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar comentarios de un tema
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

    const { data: comments, error } = await supabase
      .from('tema_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        created_by:user_profiles(id, full_name, email, avatar_url)
      `)
      .eq('tema_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener comentarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comments
    })

  } catch (error) {
    console.error('Comments API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear comentario
export async function POST(
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

    const body = await request.json()
    const { content, mentioned_users } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El contenido es requerido' },
        { status: 400 }
      )
    }

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('tema_comments')
      .insert({
        tema_id: id,
        content: content.trim(),
        mentioned_users: mentioned_users || [],
        created_by: user.id
      })
      .select(`
        id,
        content,
        created_at,
        created_by:user_profiles(id, full_name, email, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating comment:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear comentario', debug: createError.message },
        { status: 500 }
      )
    }

    // Register activity
    await supabase
      .from('tema_activity')
      .insert({
        tema_id: id,
        user_id: user.id,
        action: 'comment',
        comment: content.trim().substring(0, 100) + (content.length > 100 ? '...' : '')
      })

    return NextResponse.json({
      success: true,
      comment
    })

  } catch (error) {
    console.error('Create Comment API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
