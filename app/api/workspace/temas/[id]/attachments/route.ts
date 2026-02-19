import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar documentos/links de un tema
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

    const { data: attachments, error } = await supabase
      .from('tema_attachments')
      .select(`
        *,
        uploader:user_profiles!tema_attachments_uploaded_by_fkey(id, full_name, avatar_url)
      `)
      .eq('tema_id', temaId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attachments:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener documentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attachments
    })

  } catch (error) {
    console.error('Attachments API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Agregar link externo
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
    const { url, description, original_filename } = body

    if (!url?.trim()) {
      return NextResponse.json(
        { success: false, error: 'La URL es requerida' },
        { status: 400 }
      )
    }

    const { data: attachment, error: createError } = await supabase
      .from('tema_attachments')
      .insert({
        tema_id: temaId,
        url: url.trim(),
        description: description?.trim() || null,
        original_filename: original_filename?.trim() || url.trim(),
        link_type: 'external_link',
        uploaded_by: user.id
      })
      .select(`
        *,
        uploader:user_profiles!tema_attachments_uploaded_by_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating attachment:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al agregar documento' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('tema_activity')
      .insert({
        tema_id: temaId,
        user_id: user.id,
        action: 'document_linked',
        new_value: original_filename || url
      })

    return NextResponse.json({
      success: true,
      attachment
    }, { status: 201 })

  } catch (error) {
    console.error('Create Attachment API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar documento/link
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

    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachment_id')

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, error: 'attachment_id es requerido' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('tema_attachments')
      .delete()
      .eq('id', attachmentId)

    if (deleteError) {
      console.error('Error deleting attachment:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado'
    })

  } catch (error) {
    console.error('Delete Attachment API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
