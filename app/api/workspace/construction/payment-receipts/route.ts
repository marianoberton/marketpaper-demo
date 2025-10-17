import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tax_payment_id = searchParams.get('tax_payment_id')
    const project_id = searchParams.get('project_id')
    const receipt_type = searchParams.get('receipt_type')
    const limit = searchParams.get('limit') || '100'
    const offset = searchParams.get('offset') || '0'

    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Construir la query base
    let query = supabase
      .from('payment_receipts')
      .select(`
        *,
        tax_payments (
          id,
          payment_type,
          rubro,
          amount,
          payment_date,
          description
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    // Filtros
    if (tax_payment_id) {
      query = query.eq('tax_payment_id', tax_payment_id)
    }

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    if (receipt_type) {
      query = query.eq('receipt_type', receipt_type)
    }

    const { data: receipts, error } = await query

    if (error) {
      console.error('Error fetching payment receipts:', error)
      return NextResponse.json(
        { error: 'Error al obtener los comprobantes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      receipts: receipts || [],
      total: receipts?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/workspace/construction/payment-receipts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tax_payment_id,
      project_id,
      file_name,
      file_url,
      file_type,
      file_size,
      receipt_type,
      receipt_number,
      receipt_date,
      vendor_name,
      description,
      notes
    } = body

    // Validaciones
    if (!tax_payment_id || !project_id || !file_name || !file_url || !receipt_type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tax_payment_id, project_id, file_name, file_url, receipt_type' },
        { status: 400 }
      )
    }

    if (!['factura', 'recibo', 'comprobante_pago', 'transferencia', 'cheque', 'otro'].includes(receipt_type)) {
      return NextResponse.json(
        { error: 'receipt_type debe ser: factura, recibo, comprobante_pago, transferencia, cheque, o otro' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el tax_payment_id existe y pertenece al proyecto
    const { data: taxPayment, error: taxPaymentError } = await supabase
      .from('tax_payments')
      .select('id, project_id')
      .eq('id', tax_payment_id)
      .eq('project_id', project_id)
      .single()

    if (taxPaymentError || !taxPayment) {
      return NextResponse.json(
        { error: 'El pago especificado no existe o no pertenece al proyecto' },
        { status: 400 }
      )
    }

    // Crear el comprobante
    const { data: receipt, error } = await supabase
      .from('payment_receipts')
      .insert({
        tax_payment_id,
        project_id,
        file_name,
        file_url,
        file_type,
        file_size: file_size ? parseInt(file_size) : null,
        receipt_type,
        receipt_number,
        receipt_date,
        vendor_name,
        description,
        notes,
        uploaded_by: currentUser.id
      })
      .select()
      .single()

    console.log('Payment receipt creation result:', { 
      success: !error,
      receipt: receipt,
      error: error,
      tax_payment_id,
      project_id
    })

    if (error) {
      console.error('Error creating payment receipt:', error)
      return NextResponse.json(
        { error: 'Error al crear el comprobante' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      receipt
    })

  } catch (error) {
    console.error('Error in POST /api/workspace/construction/payment-receipts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      receipt_type,
      receipt_number,
      receipt_date,
      vendor_name,
      description,
      notes
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del comprobante es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (receipt_type !== undefined) updateData.receipt_type = receipt_type
    if (receipt_number !== undefined) updateData.receipt_number = receipt_number
    if (receipt_date !== undefined) updateData.receipt_date = receipt_date
    if (vendor_name !== undefined) updateData.vendor_name = vendor_name
    if (description !== undefined) updateData.description = description
    if (notes !== undefined) updateData.notes = notes

    // Actualizar el comprobante
    const { data: receipt, error } = await supabase
      .from('payment_receipts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment receipt:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el comprobante' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      receipt
    })

  } catch (error) {
    console.error('Error in PUT /api/workspace/construction/payment-receipts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del comprobante es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Obtener el usuario actual
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener información del comprobante antes de eliminarlo (para eliminar archivo de storage)
    const { data: receipt, error: fetchError } = await supabase
      .from('payment_receipts')
      .select('file_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching receipt for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener el comprobante' },
        { status: 500 }
      )
    }

    // Eliminar el comprobante de la base de datos
    const { error } = await supabase
      .from('payment_receipts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment receipt:', error)
      return NextResponse.json(
        { error: 'Error al eliminar el comprobante' },
        { status: 500 }
      )
    }

    // TODO: Opcional - eliminar archivo de Supabase Storage
    // Esto se puede implementar más adelante si es necesario
    // const filePath = receipt.file_url.split('/').pop()
    // await supabase.storage.from('receipts').remove([filePath])

    return NextResponse.json({
      success: true,
      message: 'Comprobante eliminado correctamente'
    })

  } catch (error) {
    console.error('Error in DELETE /api/workspace/construction/payment-receipts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}