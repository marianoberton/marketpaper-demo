import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestedCompanyId = searchParams.get('company_id')
    const is_active = searchParams.get('is_active')
    const parent_id = searchParams.get('parent_id')

    // Determinar company_id: super_admin puede acceder a cualquier empresa
    const company_id = currentUser.role === 'super_admin' && requestedCompanyId
      ? requestedCompanyId
      : currentUser.company_id

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Construir la query base - SIEMPRE filtrar por company_id
    let query = supabase
      .from('categories')
      .select('*')
      .eq('company_id', company_id)
      .order('name', { ascending: true })

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    if (parent_id === 'null') {
      query = query.is('parent_id', null)
    } else if (parent_id) {
      query = query.eq('parent_id', parent_id)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Error al obtener las categorías' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      categories: categories || []
    })

  } catch (error) {
    console.error('Error in GET /api/workspace/finanzas/categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Autenticación
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      company_id: requestedCompanyId,
      name,
      description,
      color,
      icon,
      parent_id,
      is_active,
      budget_limit
    } = body

    // Determinar company_id: super_admin puede especificar otra empresa
    const company_id = currentUser.role === 'super_admin' && requestedCompanyId
      ? requestedCompanyId
      : currentUser.company_id

    // Validaciones
    if (!company_id || !name || !color) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (company_id, name, color)' },
        { status: 400 }
      )
    }

    // Validar que el usuario pertenece a la empresa (excepto super_admin)
    if (currentUser.role !== 'super_admin' && requestedCompanyId && requestedCompanyId !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'No tiene permisos para esta empresa' },
        { status: 403 }
      )
    }

    if (budget_limit && budget_limit < 0) {
      return NextResponse.json(
        { error: 'El presupuesto no puede ser negativo' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que la categoría padre existe si se especifica
    if (parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', parent_id)
        .eq('company_id', company_id)
        .single()

      if (parentError || !parentCategory) {
        return NextResponse.json(
          { error: 'Categoría padre no válida' },
          { status: 400 }
        )
      }
    }

    // Verificar que no existe una categoría con el mismo nombre en la empresa
    const { data: existingCategory, error: existingError } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', company_id)
      .eq('name', name.trim())
      .single()

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con este nombre' },
        { status: 400 }
      )
    }

    // Preparar datos para inserción
    const categoryData = {
      company_id,
      name: name.trim(),
      description: description?.trim() || null,
      color,
      icon: icon || null,
      parent_id: parent_id || null,
      is_active: is_active !== false,
      budget_limit: budget_limit ? parseFloat(budget_limit) : null
    }

    // Insertar la categoría
    const { data: category, error: insertError } = await supabase
      .from('categories')
      .insert(categoryData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Error inserting category:', insertError)
      return NextResponse.json(
        { error: 'Error al crear la categoría' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/workspace/finanzas/categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Autenticación
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      color,
      icon,
      parent_id,
      is_active,
      budget_limit
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la categoría es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que la categoría existe
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Validar permisos: solo super_admin o usuarios de la misma empresa
    if (currentUser.role !== 'super_admin' && existingCategory.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'No tiene permisos para modificar esta categoría' },
        { status: 403 }
      )
    }

    // Preparar datos para actualización
    const updateData: any = {}

    if (name !== undefined) {
      // Verificar que no existe otra categoría con el mismo nombre en la empresa
      const { data: duplicateCategory, error: duplicateError } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', existingCategory.company_id)
        .eq('name', name.trim())
        .neq('id', id)
        .single()

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con este nombre' },
          { status: 400 }
        )
      }

      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (color !== undefined) {
      updateData.color = color
    }

    if (icon !== undefined) {
      updateData.icon = icon
    }

    if (parent_id !== undefined) {
      if (parent_id === id) {
        return NextResponse.json(
          { error: 'Una categoría no puede ser su propia categoría padre' },
          { status: 400 }
        )
      }

      if (parent_id) {
        // Verificar que la categoría padre existe
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', parent_id)
          .eq('company_id', existingCategory.company_id)
          .single()

        if (parentError || !parentCategory) {
          return NextResponse.json(
            { error: 'Categoría padre no válida' },
            { status: 400 }
          )
        }
      }

      updateData.parent_id = parent_id
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active
    }

    if (budget_limit !== undefined) {
      if (budget_limit < 0) {
        return NextResponse.json(
          { error: 'El presupuesto no puede ser negativo' },
          { status: 400 }
        )
      }
      updateData.budget_limit = budget_limit ? parseFloat(budget_limit) : null
    }

    // Actualizar la categoría
    const { data: category, error: updateError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating category:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la categoría' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      category
    })

  } catch (error) {
    console.error('Error in PUT /api/workspace/finanzas/categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Autenticación
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la categoría es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que la categoría existe
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Validar permisos: solo super_admin o usuarios de la misma empresa
    if (currentUser.role !== 'super_admin' && existingCategory.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'No tiene permisos para eliminar esta categoría' },
        { status: 403 }
      )
    }

    // Verificar que no hay gastos asociados a esta categoría
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (expensesError) {
      console.error('Error checking expenses:', expensesError)
      return NextResponse.json(
        { error: 'Error al verificar gastos asociados' },
        { status: 500 }
      )
    }

    if (expenses && expenses.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la categoría porque tiene gastos asociados' },
        { status: 400 }
      )
    }

    // Verificar que no hay subcategorías
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    if (subcategoriesError) {
      console.error('Error checking subcategories:', subcategoriesError)
      return NextResponse.json(
        { error: 'Error al verificar subcategorías' },
        { status: 500 }
      )
    }

    if (subcategories && subcategories.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la categoría porque tiene subcategorías' },
        { status: 400 }
      )
    }

    // Eliminar la categoría
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar la categoría' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    })

  } catch (error) {
    console.error('Error in DELETE /api/workspace/finanzas/categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 