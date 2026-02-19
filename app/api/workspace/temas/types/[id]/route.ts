import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Detalle de un tipo/template
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

    const { data: type, error } = await supabase
      .from('tema_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Template no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, type })
  } catch (error) {
    console.error('Template Detail API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar tipo/template
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
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!['company_admin', 'company_owner', 'super_admin', 'manager'].includes(profile?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para editar templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name, description, color, icon,
      tareas_template, campos_custom_schema,
      categoria, gerencia, is_active, sort_order
    } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (tareas_template !== undefined) updateData.tareas_template = tareas_template
    if (campos_custom_schema !== undefined) updateData.campos_custom_schema = campos_custom_schema
    if (categoria !== undefined) updateData.categoria = categoria?.trim() || null
    if (gerencia !== undefined) updateData.gerencia = gerencia || null
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data: type, error: updateError } = await supabase
      .from('tema_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating template:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, type })
  } catch (error) {
    console.error('Template Update API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Soft-delete template (set is_active = false)
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

    if (!['company_admin', 'company_owner', 'super_admin'].includes(profile?.role || '')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para eliminar templates' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('tema_types')
      .update({ is_active: false })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting template:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Template eliminado' })
  } catch (error) {
    console.error('Template Delete API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
