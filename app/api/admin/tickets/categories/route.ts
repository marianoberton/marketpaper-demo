import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Listar categorías de tickets
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('ticket_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener categorías' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      categories
    })

  } catch (error) {
    console.error('Categories API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría (solo admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que es super admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color, icon } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Obtener el orden máximo actual
    const { data: maxOrder } = await supabase
      .from('ticket_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const { data: category, error } = await supabase
      .from('ticket_categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6B7280',
        icon: icon || 'help-circle',
        sort_order: (maxOrder?.sort_order || 0) + 1
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { success: false, error: 'Ya existe una categoría con ese nombre' },
          { status: 400 }
        )
      }
      console.error('Error creating category:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear categoría' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría creada',
      category
    }, { status: 201 })

  } catch (error) {
    console.error('Create Category API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar categoría (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que es super admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, name, description, color, icon, is_active, sort_order } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data: category, error } = await supabase
      .from('ticket_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar categoría' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría actualizada',
      category
    })

  } catch (error) {
    console.error('Update Category API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
