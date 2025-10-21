import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID requerido' },
        { status: 400 }
      )
    }

    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar acceso al proyecto (excepto super admin)
    if (currentUser.role !== 'super_admin') {
      const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()
      
      if (!project || project.company_id !== currentUser.company_id) {
        return NextResponse.json({ error: 'Sin permisos para ver este proyecto' }, { status: 403 })
      }
    }

    const { data: payments, error } = await supabase
      .from('tax_payments')
      .select(`
        *,
        payment_receipts (
          id,
          file_url,
          file_name,
          receipt_type
        )
      `)
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false })

    console.log('Tax payments query result:', { 
      paymentsCount: payments?.length || 0,
      firstPayment: payments?.[0],
      receiptsInFirstPayment: payments?.[0]?.payment_receipts?.length || 0
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Error al cargar pagos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const paymentData = await request.json()
    
    const { projectId, category, subcategory, amount, description, paymentDate, receiptNumber, notes } = paymentData

    if (!projectId || !category || !amount || !description || !paymentDate) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar acceso al proyecto (excepto super admin)
    if (currentUser.role !== 'super_admin') {
      const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()
      
      if (!project || project.company_id !== currentUser.company_id) {
        return NextResponse.json({ error: 'Sin permisos para modificar este proyecto' }, { status: 403 })
      }
    }

    // Mapear categorías a payment_type y rubro
    const categoryMapping: Record<string, { payment_type: string, rubro: string }> = {
      'professional_fees': { payment_type: 'professional_commission', rubro: 'A' },
      'construction_rights': { payment_type: 'construction_rights', rubro: 'B' },
      'surplus_value': { payment_type: 'surplus_value', rubro: 'C' }
    }

    const mapping = categoryMapping[category]
    if (!mapping) {
      return NextResponse.json(
        { error: 'Categoría de pago no válida' },
        { status: 400 }
      )
    }

    // Crear el pago
    const { data: payment, error } = await supabase
      .from('tax_payments')
      .insert({
        project_id: projectId,
        payment_type: mapping.payment_type,
        rubro: mapping.rubro,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        receipt_number: receiptNumber || null,
        description: description,
        notes: notes || null,
        created_by: currentUser.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Error al guardar el pago' },
        { status: 500 }
      )
    }

    // Los triggers de la base de datos se encargan de actualizar automáticamente
    // los costos totales del proyecto (paid_cost_rubro_a, paid_cost_rubro_b, etc.)

    return NextResponse.json({ 
      payment: {
        id: payment.id,
        category: category,
        subcategory: subcategory,
        amount: payment.amount,
        description: payment.description,
        payment_date: payment.payment_date,
        receipt_number: payment.receipt_number,
        notes: payment.notes
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID requerido' },
        { status: 400 }
      )
    }

    // Verificar que el pago existe y obtener project_id
    const { data: payment } = await supabase
      .from('tax_payments')
      .select('project_id')
      .eq('id', paymentId)
      .single()

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Obtener información del proyecto
    const { data: project } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', payment.project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar permisos de eliminación
      const canDelete = 
        // Super admin puede eliminar cualquier pago
        currentUser.role === 'super_admin' ||
        // Usuarios de la misma empresa pueden eliminar (excepto viewers)
        (project.company_id === currentUser.company_id && 
         ['company_owner', 'company_admin', 'manager', 'employee'].includes(currentUser.role))

    if (!canDelete) {
      console.log('Permission denied:', {
        projectCompanyId: project?.company_id,
        userCompanyId: currentUser.company_id,
        userRole: currentUser.role,
        reason: currentUser.role === 'super_admin' ? 'none' : 
                !project || project.company_id !== currentUser.company_id ? 'different_company' : 'insufficient_role'
      })
      return NextResponse.json({ error: 'Sin permisos para eliminar este pago' }, { status: 403 })
    }

    // Eliminar el pago
    const { error } = await supabase
      .from('tax_payments')
      .delete()
      .eq('id', paymentId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Error al eliminar el pago' },
        { status: 500 }
      )
    }

    // Los triggers de la base de datos se encargan de actualizar automáticamente
    // los costos totales del proyecto

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}