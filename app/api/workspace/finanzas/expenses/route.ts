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
    const category_id = searchParams.get('category_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const payment_method = searchParams.get('payment_method')
    const limit = searchParams.get('limit') || '100'
    const offset = searchParams.get('offset') || '0'

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
      .from('expenses')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('company_id', company_id)
      .order('date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    if (date_from) {
      query = query.gte('date', date_from)
    }

    if (date_to) {
      query = query.lte('date', date_to)
    }

    if (payment_method) {
      query = query.eq('payment_method', payment_method)
    }

    const { data: expenses, error } = await query

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json(
        { error: 'Error al obtener los gastos' },
        { status: 500 }
      )
    }

    // Formatear datos para incluir información de la categoría
    const formattedExpenses = expenses?.map((expense: any) => ({
      ...expense,
      category_name: expense.categories?.name,
      category_color: expense.categories?.color,
      category_icon: expense.categories?.icon,
      categories: undefined // Remover el objeto anidado
    })) || []

    return NextResponse.json({
      success: true,
      expenses: formattedExpenses,
      total: expenses?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/workspace/finanzas/expenses:', error)
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
      amount,
      description,
      category_id,
      date,
      payment_method,
      receipt_url,
      notes,
      tags,
      is_recurring,
      recurring_frequency
    } = body

    // Determinar company_id: super_admin puede especificar otra empresa
    const company_id = currentUser.role === 'super_admin' && requestedCompanyId
      ? requestedCompanyId
      : currentUser.company_id

    // Validaciones
    if (!company_id || !amount || !description || !category_id || !date) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que la categoría existe y pertenece a la empresa
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category_id)
      .eq('company_id', company_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Categoría no válida' },
        { status: 400 }
      )
    }

    // Preparar datos para inserción
    const expenseData = {
      company_id,
      amount: parseFloat(amount),
      description: description.trim(),
      category_id,
      date,
      payment_method: payment_method || 'other',
      receipt_url: receipt_url || null,
      notes: notes?.trim() || null,
      tags: tags || [],
      is_recurring: is_recurring || false,
      recurring_frequency: recurring_frequency || null
    }

    // Insertar el gasto
    const { data: expense, error: insertError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()

    if (insertError) {
      console.error('Error inserting expense:', insertError)
      return NextResponse.json(
        { error: 'Error al crear el gasto' },
        { status: 500 }
      )
    }

    // Formatear respuesta
    const formattedExpense = {
      ...expense,
      category_name: expense.categories?.name,
      category_color: expense.categories?.color,
      category_icon: expense.categories?.icon,
      categories: undefined
    }

    return NextResponse.json({
      success: true,
      expense: formattedExpense
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/workspace/finanzas/expenses:', error)
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
      amount,
      description,
      category_id,
      date,
      payment_method,
      receipt_url,
      notes,
      tags,
      is_recurring,
      recurring_frequency
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del gasto es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el gasto existe y pertenece a la empresa del usuario
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingExpense) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    // Validar permisos: solo super_admin o usuarios de la misma empresa
    if (currentUser.role !== 'super_admin' && existingExpense.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'No tiene permisos para modificar este gasto' },
        { status: 403 }
      )
    }

    // Preparar datos para actualización
    const updateData: any = {}

    if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'El monto debe ser mayor a 0' },
          { status: 400 }
        )
      }
      updateData.amount = parseFloat(amount)
    }

    if (description !== undefined) {
      updateData.description = description.trim()
    }

    if (category_id !== undefined) {
      // Verificar que la categoría existe y pertenece a la empresa
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', category_id)
        .eq('company_id', existingExpense.company_id)
        .single()

      if (categoryError || !category) {
        return NextResponse.json(
          { error: 'Categoría no válida' },
          { status: 400 }
        )
      }
      updateData.category_id = category_id
    }

    if (date !== undefined) {
      updateData.date = date
    }

    if (payment_method !== undefined) {
      updateData.payment_method = payment_method
    }

    if (receipt_url !== undefined) {
      updateData.receipt_url = receipt_url
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null
    }

    if (tags !== undefined) {
      updateData.tags = tags
    }

    if (is_recurring !== undefined) {
      updateData.is_recurring = is_recurring
    }

    if (recurring_frequency !== undefined) {
      updateData.recurring_frequency = recurring_frequency
    }

    // Actualizar el gasto
    const { data: expense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating expense:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el gasto' },
        { status: 500 }
      )
    }

    // Formatear respuesta
    const formattedExpense = {
      ...expense,
      category_name: expense.categories?.name,
      category_color: expense.categories?.color,
      category_icon: expense.categories?.icon,
      categories: undefined
    }

    return NextResponse.json({
      success: true,
      expense: formattedExpense
    })

  } catch (error) {
    console.error('Error in PUT /api/workspace/finanzas/expenses:', error)
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
        { error: 'ID del gasto es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el gasto existe
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingExpense) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    // Validar permisos: solo super_admin o usuarios de la misma empresa
    if (currentUser.role !== 'super_admin' && existingExpense.company_id !== currentUser.company_id) {
      return NextResponse.json(
        { error: 'No tiene permisos para eliminar este gasto' },
        { status: 403 }
      )
    }

    // Eliminar el gasto
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting expense:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el gasto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Gasto eliminado correctamente'
    })

  } catch (error) {
    console.error('Error in DELETE /api/workspace/finanzas/expenses:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 